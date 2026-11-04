// Step 3: 컨테이너 내부 파레트 적재(바닥 전체 균등 배치 vs 2단/고단 밀착 배치) 및 3D 무게중심(CoG) 분석

/**
 * 컨테이너 내부의 3D 무게중심(Center of Gravity) 및 전후/좌우 밸런스 분석
 */
export function analyzeContainerCoG(container) {
  const cL = container.spec.length;
  const cW = container.spec.width;
  const cH = container.spec.height;

  let momentX = 0; // Length direction (0 = Front/Inner wall, cL = Door)
  let momentY = 0; // Height direction (0 = Floor, cH = Ceiling)
  let momentZ = 0; // Width direction (0 = Left wall, cW = Right wall)
  let totalMass = 0;

  let frontHalfWeight = 0;
  let rearHalfWeight = 0;
  let leftRowWeight = 0;
  let rightRowWeight = 0;

  for (const pp of container.placedPallets) {
    const pMass = pp.pallet.totalWeight;
    const pCenterX = pp.x + pp.length / 2;
    const pCenterY = pp.y + (pp.pallet.localCoG?.y || pp.pallet.totalHeight / 2);
    const pCenterZ = pp.z + pp.width / 2;

    momentX += pMass * pCenterX;
    momentY += pMass * pCenterY;
    momentZ += pMass * pCenterZ;
    totalMass += pMass;

    if (pCenterX <= cL / 2) frontHalfWeight += pMass;
    else rearHalfWeight += pMass;

    if (pCenterZ <= cW / 2) leftRowWeight += pMass;
    else rightRowWeight += pMass;
  }

  if (totalMass <= 0) {
    return {
      cogX: cL / 2,
      cogY: 0,
      cogZ: cW / 2,
      offsetX: 0,
      offsetZ: 0,
      lengthRatioPct: 50,
      widthRatioPct: 50,
      heightRatioPct: 0,
      frontRatio: 50,
      rearRatio: 50,
      leftRatio: 50,
      rightRatio: 50,
      status: 'SAFE',
      statusText: '정상 (균형)',
    };
  }

  const maxOccupiedX = container.placedPallets.reduce(
    (max, pp) => Math.max(max, pp.x + pp.length),
    cL
  );
  const cogX = Number((momentX / totalMass).toFixed(0));
  const cogY = Number((momentY / totalMass).toFixed(0));
  const cogZ = Number((momentZ / totalMass).toFixed(0));

  const offsetXFromContainerCenter = Math.round(cogX - cL / 2);
  const offsetXFromLoadCenter = Math.round(cogX - maxOccupiedX / 2);
  const offsetZFromCenter = Math.round(cogZ - cW / 2);

  const lengthRatioPct = Number(((cogX / cL) * 100).toFixed(1));
  const widthRatioPct = Number(((cogZ / cW) * 100).toFixed(1));
  const heightRatioPct = Number(((cogY / cH) * 100).toFixed(1));

  const leftRatio = Number(((leftRowWeight / totalMass) * 100).toFixed(1));
  const rightRatio = Number((100 - leftRatio).toFixed(1));
  const frontRatio = Number(((frontHalfWeight / totalMass) * 100).toFixed(1));
  const rearRatio = Number((100 - frontRatio).toFixed(1));

  // IMO/ILO/UNECE CTU Code 실무 기준:
  // 1. 전후 하중 분배: 한쪽 절반(전반부 또는 후반부)의 화물 중량이 전체 중량의 60% 이하 (40%:60% ~ 60%:40% 범위)
  // 2. 좌우 횡방향 균형: 좌·우측 각 55% 이하 (45%:55% ~ 55%:45% 범위)
  const isCtuLongitudinalSafe = frontRatio <= 60 && rearRatio <= 60;
  const isLateralSafe = leftRatio <= 55 && rightRatio <= 55;

  const longitudinalCriteriaText = `IMO CTU 규정: 전·후반부 각 60% 이하 (현재 ${frontRatio}% : ${rearRatio}%, 중앙 편차 ${Math.abs(offsetXFromContainerCenter).toLocaleString()}mm)`;
  const lateralCriteriaText = `횡방향 안전 규정: 좌·우측 각 55% 이하 (현재 ${leftRatio}% : ${rightRatio}%, 중심 편차 ${Math.abs(offsetZFromCenter)}mm)`;

  let axleLoadNote = '';
  if (totalMass <= 10000) {
    axleLoadNote = `화물 총중량 ${(totalMass / 1000).toFixed(1)}톤으로 경량 상태 — 전후 편차가 있어도 트랙터 축하중(Axle Load) 안전 허용치 충족`;
  } else if (!isCtuLongitudinalSafe) {
    axleLoadNote = `총중량 ${(totalMass / 1000).toFixed(1)}톤 전후 편심(${frontRatio > 60 ? `전방 ${frontRatio}%` : `후방 ${rearRatio}%`}) — 트랙터 구동축(Drive Axle) 과적 및 축중계 통과 확인 권장`;
  } else {
    axleLoadNote = '전후 하중 분산 균형 양호 — 도로교통법 축하중 10톤 제한 및 IMO CTU 규정 충족';
  }

  const offsetDirXText =
    offsetXFromContainerCenter === 0
      ? '중앙 정확 일치 (0mm)'
      : offsetXFromContainerCenter < 0
      ? `전방(헤드) ${Math.abs(offsetXFromContainerCenter).toLocaleString()}mm 치우침`
      : `후방(도어) ${Math.abs(offsetXFromContainerCenter).toLocaleString()}mm 치우침`;

  const offsetDirZText =
    offsetZFromCenter === 0
      ? '좌우 중심 일치 (0mm)'
      : offsetZFromCenter < 0
      ? `좌측 ${Math.abs(offsetZFromCenter)}mm 편차`
      : `우측 ${Math.abs(offsetZFromCenter)}mm 편차`;

  let status = 'SAFE';
  let statusText = '안전 (IMO CTU 전후 밸런스 규정 충족)';
  if (!isLateralSafe && !isCtuLongitudinalSafe) {
    status = 'WARN';
    statusText = `주의 (전후 편심 ${Math.max(frontRatio, rearRatio)}% · 좌우 편심 ${Math.max(leftRatio, rightRatio)}%)`;
  } else if (!isCtuLongitudinalSafe) {
    status = 'WARN';
    statusText = `주의 (IMO CTU 60% 초과 — ${frontRatio > 60 ? `전방 ${frontRatio}%` : `후방 ${rearRatio}%`})`;
  } else if (!isLateralSafe) {
    status = 'WARN';
    statusText = `주의 (좌우 편차 확인 — ${leftRatio > 55 ? `좌측 ${leftRatio}%` : `우측 ${rightRatio}%`})`;
  } else if (totalMass <= 10000) {
    status = 'SAFE';
    statusText = `안전 (경량 ${(totalMass / 1000).toFixed(1)}톤 · IMO 기준 충족)`;
  }

  return {
    cogX,
    cogY,
    cogZ,
    maxOccupiedX,
    offsetXFromContainerCenter,
    offsetXFromLoadCenter,
    offsetZFromCenter,
    offsetDirXText,
    offsetDirZText,
    longitudinalCriteriaText,
    lateralCriteriaText,
    axleLoadNote,
    lengthRatioPct,
    widthRatioPct,
    heightRatioPct,
    frontRatio,
    rearRatio,
    leftRatio,
    rightRatio,
    status,
    statusText,
  };
}

/**
 * 2열 적재 시 파레트 회전 자세 계산 헬퍼
 */
export function orientPalletFor2Rows(p, containerWidth, preferCompactX = false) {
  const halfW = containerWidth / 2;
  const maxDim = Math.max(p.width, p.length);
  const minDim = Math.min(p.width, p.length);

  if (preferCompactX && maxDim <= 1220 && minDim <= 1050 && p.width !== p.length) {
    return {
      lengthX: minDim,
      widthZ: maxDim,
      rotated: p.length !== minDim,
    };
  }

  if (p.width <= halfW && p.length <= halfW) {
    return { lengthX: p.length, widthZ: p.width, rotated: false };
  }
  if (p.length <= halfW && p.width > halfW) {
    return { lengthX: p.width, widthZ: p.length, rotated: true };
  }
  if (p.width <= halfW && p.length > halfW) {
    return { lengthX: p.length, widthZ: p.width, rotated: false };
  }
  return { lengthX: p.length, widthZ: p.width, rotated: false };
}

/**
 * 실무 적재 유형 뱃지 생성 헬퍼
 */
export function computeStuffingBadge(container, cLength, effectiveDoubleStack, isConvenienceMode) {
  const floorSlots = cLength < 7000 ? 10 : 20;
  const isSingleSku = container.skuBreakdown.length === 1;
  const singleSkuName = isSingleSku ? container.skuBreakdown[0].name.split(' (')[0] : '';

  if (isSingleSku && container.placedPallets.length >= floorSlots) {
    return {
      type: 'dedicated_full',
      label: `📦 [${singleSkuName}] 단일 품목 전용 완적 (FCL)`,
      shortLabel: `${singleSkuName} 전용 완적 (${container.placedPallets.length}PLT)`,
      tagText: '단일 품목 전용 완적',
      color: '#34d399',
      bg: 'rgba(16, 185, 129, 0.16)',
      border: '1px solid rgba(16, 185, 129, 0.45)',
    };
  }
  if (effectiveDoubleStack && container.tier2Count === 0) {
    return {
      type: 'tier1_pure',
      label: `🛡️ 순수 1단적 안전 평적 (총 ${container.placedPallets.length}PLT · 2단적 0개)`,
      shortLabel: `1단적 안전 평적 (${container.placedPallets.length}PLT)`,
      tagText: '1단적 안전 평적 (전도 위험 0%)',
      color: '#34d399',
      bg: 'rgba(16, 185, 129, 0.16)',
      border: '1px solid rgba(16, 185, 129, 0.45)',
    };
  }
  if (effectiveDoubleStack && container.tier2Count >= floorSlots) {
    return {
      type: 'tier2_full',
      label: `📦 2단적 집중 완적 (총 ${container.placedPallets.length}PLT · 40PLT 만적)`,
      shortLabel: `2단적 집중 완적 (${container.placedPallets.length}PLT)`,
      tagText: '2단적 집중 완적 (만적)',
      color: '#38bdf8',
      bg: 'rgba(56, 189, 248, 0.16)',
      border: '1px solid rgba(56, 189, 248, 0.45)',
    };
  }
  if (isSingleSku) {
    return {
      type: 'dedicated_partial',
      label: `📦 [${singleSkuName}] 단일 품목 전용 적재`,
      shortLabel: `${singleSkuName} 전용 (${container.placedPallets.length}PLT)`,
      tagText: '단일 품목 전용',
      color: '#38bdf8',
      bg: 'rgba(56, 189, 248, 0.16)',
      border: '1px solid rgba(56, 189, 248, 0.45)',
    };
  }
  if (isConvenienceMode) {
    return {
      type: 'convenience_mixed',
      label:
        container.tier2Count > 0
          ? `📦 2단적 블록 적재 (1단적 ${container.tier1Count} + 2단적 ${container.tier2Count}PLT)`
          : `🔀 잔여 품목 모음 적재 (${container.skuBreakdown.length}개 품목)`,
      shortLabel: `잔여 품목 모음 (${container.placedPallets.length}PLT)`,
      tagText: container.tier2Count > 0 ? `2단적 블록 (${container.tier2Count}PLT)` : '잔여 품목 모음',
      color: '#fbbf24',
      bg: 'rgba(245, 158, 11, 0.16)',
      border: '1px solid rgba(245, 158, 11, 0.45)',
    };
  }
  return {
    type: 'balanced',
    label:
      container.tier2Count > 0
        ? `⚖️ 2단적 분산 적재 (1단적 ${container.tier1Count} + 2단적 ${container.tier2Count}PLT)`
        : `⚖️ 균등 분산 적재 (${container.skuBreakdown.length}개 품목)`,
    shortLabel: `균등 분산 (${container.placedPallets.length}PLT)`,
    tagText: '균등 분산',
    color: '#a5b4fc',
    bg: 'rgba(129, 140, 248, 0.16)',
    border: '1px solid rgba(129, 140, 248, 0.45)',
  };
}

/**
 * 현장 적재 정밀 진단(도어 여유고, 전후 쇼링 여유, 좌우 유격, 도어측 낙하 방지 쇼링) 계산 헬퍼
 */
export function computeFieldDiagnostics(container, containerSpec, cLength, cWidth, cHeight) {
  const maxStackH = container.placedPallets.reduce(
    (max, pp) => Math.max(max, pp.y + pp.pallet.totalHeight),
    0
  );
  const doorH = Number(container.spec?.doorHeight) || cHeight - 110;
  const doorClearanceMm = doorH - maxStackH;
  let doorStatus = 'safe';
  let doorStatusText = `도어 통과 여유 +${doorClearanceMm}mm (지게차 진입 원활)`;
  if (doorClearanceMm < 0) {
    doorStatus = 'danger';
    doorStatusText = `도어 입구 높이(${doorH}mm) ${Math.abs(doorClearanceMm)}mm 초과 — 문턱 걸림 주의!`;
  } else if (doorClearanceMm < 80) {
    doorStatus = 'warning';
    doorStatusText = `도어 상부 여유 ${doorClearanceMm}mm (밀착 진입·마스트 틸팅 주의)`;
  }

  const maxOccupiedX = container.placedPallets.reduce(
    (max, pp) => Math.max(max, pp.x + pp.length),
    0
  );
  const rearClearanceMm = Math.max(0, cLength - maxOccupiedX);
  let shoringText = '여유 공간 적정';
  if (rearClearanceMm <= 220) {
    shoringText = `도어 쪽 잔여 ${rearClearanceMm}mm — 바닥 전체 균등·밀착 배치로 전후 쏠림 및 쇼링 비용 최소화`;
  } else if (rearClearanceMm <= 900) {
    shoringText = `도어 쪽 잔여 ${rearClearanceMm}mm — 운송 중 밀림 방지를 위해 후미 쇼링목/라싱 벨트 권장`;
  } else {
    shoringText = `도어 쪽 여유 ${(rearClearanceMm / 1000).toFixed(2)}m 확보 — 전방 밀착·고단 적재로 후미 바닥 여유 공간 확보됨`;
  }

  const tier1Pallets = container.placedPallets.filter((p) => p.tier === 1);
  const occupiedFloorAreaMm2 = tier1Pallets.reduce(
    (acc, pp) => acc + pp.length * pp.width,
    0
  );
  const floorUtilizationPct = Number(
    Math.min(100, (occupiedFloorAreaMm2 / (cLength * cWidth)) * 100).toFixed(1)
  );

  const avgRowWidthZ =
    tier1Pallets.length > 0
      ? tier1Pallets.reduce((acc, pp) => acc + pp.width, 0) / tier1Pallets.length
      : 1100;
  const lateralGapMm = Math.max(0, Math.round(cWidth - avgRowWidthZ * 2));
  let dunnageBagText = `좌우 여유 합계 약 ${lateralGapMm}mm (표준 유격)`;
  if (lateralGapMm >= 250) {
    dunnageBagText = `좌우 유격 약 ${lateralGapMm}mm — 열(Row) 사이 에어백(Dunnage Bag) 충진 권장`;
  } else if (lateralGapMm < 60) {
    dunnageBagText = `좌우 여유 ${lateralGapMm}mm — 타이트핏 (지게차 사이드쉬프트 정밀 진입 필요)`;
  }

  // 도어(문) 쪽 최후미 파레트 높이 및 낙하(전도) 쇼링 필요성 진단
  const doorThresholdX = Math.max(0, maxOccupiedX - 1300);
  const doorPallets = container.placedPallets.filter((pp) => pp.x + pp.length >= doorThresholdX);
  let maxContainerPalletH = 0;
  for (const pp of container.placedPallets) {
    if (pp.pallet.totalHeight > maxContainerPalletH) {
      maxContainerPalletH = pp.pallet.totalHeight;
    }
  }

  let hasLowPalletAtDoor = false;
  const lowDoorPalletLabels = [];
  let minDoorPalletH = Infinity;

  for (const dp of doorPallets) {
    const h = dp.pallet.totalHeight;
    if (h < minDoorPalletH) minDoorPalletH = h;
    if (h < 1150 || (maxContainerPalletH - h >= 350)) {
      hasLowPalletAtDoor = true;
      const pLabel = `P#${dp.pallet.index || dp.palletIndex}`;
      if (!lowDoorPalletLabels.includes(pLabel)) {
        lowDoorPalletLabels.push(pLabel);
      }
    }
  }

  // Claude 피드백 반영:
  // 1) 단차(-840mm 등)로 인한 도어 개방 시 낙하(Door Spill) 위험
  // 2) 문 앞에 빈 공간(2호기 16PLT -> 잔여 2.4m)으로 인한 운송 중 화물 후방 슬라이딩(미끄러짐) 위험
  // 3) 'X자 결속' 대신 실무 정석인 '완충 판재(합판/목재) 수평 래싱(Horizontal Lashing) 또는 카고 안전망' 및 '바닥 목재 블로킹(Chocking & Blocking)' 안내
  const hasHeightGapRisk = hasLowPalletAtDoor;
  const hasSlidingRisk = rearClearanceMm >= 400;
  const hasRisk = hasHeightGapRisk || hasSlidingRisk;

  let doorShoringGuide = null;
  if (hasRisk) {
    const actions = [];
    let title = '';
    let summary = '';
    const heightDiffMm = isFinite(minDoorPalletH) ? maxContainerPalletH - minDoorPalletH : 0;
    const rearClearanceM = (rearClearanceMm / 1000).toFixed(1);

    if (hasHeightGapRisk && hasSlidingRisk) {
      title = `도어측 화물 밀림 방지 블로킹 & 단차(-${heightDiffMm}mm) 쇼링 필수 (${lowDoorPalletLabels.join(', ')})`;
      summary = `문 앞에 약 ${rearClearanceM}m의 빈 바닥 공간이 있고, 도어측 파레트(${lowDoorPalletLabels.join(', ')})와의 단차(-${heightDiffMm}mm)가 있어 해상 운송 중 화물 후방 슬라이딩(미끄러짐) 및 문 개방 시 쏟아짐 위험이 큽니다.`;
      actions.push(`🪵 문 앞 빈 공간(${rearClearanceM}m) 밀림 방지: 바닥 목재 블로킹(Chocking & Blocking) 및 각재 고정 필수`);
      actions.push(`🛡️ 단차 화물 전면에 완충 판재(합판/목재)를 대고 수평 래싱(Horizontal Lashing) 벨트 결속 또는 카고 안전망(Cargo Net) 시공`);
    } else if (hasSlidingRisk) {
      title = `도어측 화물 후방 미끄러짐 방지 목재 블로킹 필수 (빈 공간 ${rearClearanceM}m)`;
      summary = `컨테이너 문(Door) 앞에 약 ${rearClearanceM}m의 빈 바닥 공간이 있어, 해상 피칭이나 차량 급제동 시 화물이 문 쪽으로 밀려나는 슬라이딩(미끄러짐) 사고 위험이 있습니다.`;
      actions.push(`🪵 문 앞 빈 공간(${rearClearanceM}m) 밀림 방지: 바닥 목재 블로킹(Chocking & Blocking) 및 각재 버팀목 고정 필수`);
      actions.push(`⚓ 컨테이너 최후미 파레트 전면에 완충 판재 지지 및 수평 래싱(Horizontal Lashing) 벨트 결속 권장`);
    } else {
      title = `도어(Door) 개방 시 낙하 방지 쇼링 필수 (${lowDoorPalletLabels.join(', ')})`;
      summary = `문(Door) 쪽에 키가 낮은 자투리 파레트(${lowDoorPalletLabels.join(', ')} · 높이 ${minDoorPalletH}mm)가 배치되어, 앞쪽 높은 화물(${maxContainerPalletH}mm)과의 단차(-${heightDiffMm}mm)로 인해 목적지 도어 개방 시 작업자 쪽으로 쏟아지는 낙하 전도 사고(Door Spill) 위험이 큽니다.`;
      actions.push(`🛡️ 단차 화물 전면에 완충 판재(합판/목재)를 대고 수평 래싱(Horizontal Lashing) 벨트 결속 또는 카고 안전망(Cargo Net) 시공 필수`);
      actions.push(`🪵 앞쪽 높은 파레트와의 단차 공간에 듄네이지 에어백(Dunnage Bag) 또는 목재 각재 버팀목 시공`);
    }

    doorShoringGuide = {
      hasRisk: true,
      hasHeightGapRisk,
      hasSlidingRisk,
      rearClearanceMm,
      lowPalletLabels: lowDoorPalletLabels,
      minHeightMm: minDoorPalletH,
      maxHeightMm: maxContainerPalletH,
      heightDiffMm,
      title,
      summary,
      action1: actions[0],
      action2: actions[1] || '',
    };
  }

  return {
    maxStackHeightMm: maxStackH,
    doorHeightMm: doorH,
    doorClearanceMm,
    doorStatus,
    doorStatusText,
    usedLengthMm: maxOccupiedX,
    rearClearanceMm,
    shoringText,
    lateralGapMm,
    dunnageBagText,
    floorUtilizationPct,
    doorShoringGuide,
  };
}

/**
 * 2대 이상 다수 컨테이너 생성 시 파레트 배분 헬퍼
 */
export function distributePalletsForMultiContainer({
  validPallets,
  neededCount,
  isConvenienceMode,
  effectiveDoubleStack,
  floorSlotsPerContainer,
  cMaxWeight,
}) {
  if (isConvenienceMode) {
    // [작업 편의성 우선]:
    // 단일 품목(SKU)으로 1대 이상 채울 수 있으면 타 품목을 섞지 않고 100% 전용 컨테이너로 완적!
    const byCargo = new Map();
    for (const p of validPallets) {
      const key = p.primaryCargoId || 'other';
      if (!byCargo.has(key)) byCargo.set(key, []);
      byCargo.get(key).push(p);
    }

    // 완적 파레트 먼저, 부분 파레트(자투리)는 뒤쪽
    for (const [, list] of byCargo.entries()) {
      list.sort((a, b) => {
        if (a.isPartial !== b.isPartial) return a.isPartial ? 1 : -1;
        return b.totalWeight - a.totalWeight;
      });
    }

    // 파레트 수량이 많은 주력 SKU부터 정렬 (예: 박스A 23PLT -> 박스B 14PLT -> 박스C 1PLT)
    const sortedGroups = Array.from(byCargo.values()).sort(
      (a, b) => b.length - a.length
    );

    const buckets = Array.from({ length: neededCount }, () => []);
    const bucketWeights = new Array(neededCount).fill(0);
    const contCap = effectiveDoubleStack ? floorSlotsPerContainer * 2 : floorSlotsPerContainer;

    let curBIdx = 0;
    for (const grp of sortedGroups) {
      let remInGrp = [...grp];
      while (remInGrp.length > 0 && curBIdx < neededCount) {
        const curBucket = buckets[curBIdx];
        const curWeight = bucketWeights[curBIdx];
        const spaceLeft = contCap - curBucket.length;

        if (spaceLeft <= 0 || curWeight >= cMaxWeight - 300) {
          curBIdx++;
          continue;
        }

        let take = 0;
        let weightToAdd = 0;
        while (take < remInGrp.length && take < spaceLeft) {
          const nextP = remInGrp[take];
          if (curWeight + weightToAdd + nextP.totalWeight > cMaxWeight) {
            break;
          }
          weightToAdd += nextP.totalWeight;
          take++;
        }

        if (take === 0) {
          curBIdx++;
          continue;
        }

        const picked = remInGrp.splice(0, take);
        curBucket.push(...picked);
        bucketWeights[curBIdx] += weightToAdd;

        if (curBucket.length >= contCap) {
          curBIdx++;
        }
      }

      if (remInGrp.length > 0) {
        buckets[neededCount - 1].push(...remInGrp);
      }
    }

    // 각 호기 내부 SKU 블록 정렬:
    // 해당 호기에 가장 많이 실린 SKU 블록을 앞쪽(안쪽 벽)에 두고, 자투리/소량 품목은 도어 쪽에 배치
    buckets.forEach((b) => {
      const skuCountsInBucket = new Map();
      for (const p of b) {
        const k = p.primaryCargoId || 'other';
        skuCountsInBucket.set(k, (skuCountsInBucket.get(k) || 0) + 1);
      }
      b.sort((p1, p2) => {
        if (p1.isPartial !== p2.isPartial) return p1.isPartial ? 1 : -1;
        const k1 = p1.primaryCargoId || 'other';
        const k2 = p2.primaryCargoId || 'other';
        const c1 = skuCountsInBucket.get(k1) || 0;
        const c2 = skuCountsInBucket.get(k2) || 0;
        if (c1 !== c2) return c2 - c1;
        return 0;
      });
    });

    return buckets;
  }

  // [균등 밸런스 우선]: 전 호기에 품목·중량을 고르게 쪼개어 분산
  const buckets = Array.from({ length: neededCount }, () => []);
  const bucketWeights = new Array(neededCount).fill(0);

  const byCargo = new Map();
  for (const p of validPallets) {
    const key = p.primaryCargoId || 'other';
    if (!byCargo.has(key)) byCargo.set(key, []);
    byCargo.get(key).push(p);
  }

  const allFulls = [];
  const allPartials = [];
  for (const [, group] of byCargo.entries()) {
    for (const p of group) {
      if (p.isPartial) allPartials.push(p);
      else allFulls.push(p);
    }
  }

  const assignToLightestBucket = (p) => {
    let bestIdx = 0;
    for (let bIdx = 1; bIdx < neededCount; bIdx++) {
      if (buckets[bIdx].length < buckets[bestIdx].length) {
        bestIdx = bIdx;
      } else if (
        buckets[bIdx].length === buckets[bestIdx].length &&
        bucketWeights[bIdx] < bucketWeights[bestIdx]
      ) {
        bestIdx = bIdx;
      }
    }
    buckets[bestIdx].push(p);
    bucketWeights[bestIdx] += p.totalWeight;
  };

  allFulls.forEach(assignToLightestBucket);
  allPartials.forEach(assignToLightestBucket);

  return buckets;
}

/**
 * 생성된 파레트들을 컨테이너에 적재 (다중 파레트 규격 혼합, 전 호기 균등 배분, 바닥 전체 배치 vs 2단/밀착 배치 지원)
 */
export function packPalletsIntoContainers(pallets, containerSpec, options = {}) {
  const cLength = Number(containerSpec.length) || 12032;
  const cWidth = Number(containerSpec.width) || 2352;
  const cHeight = Number(containerSpec.height) || 2698;
  const cMaxWeight = Number(containerSpec.maxWeight) || 26500;
  const allowDoubleStack = Boolean(options.doubleStack);
  const fullFloorSpread = options.fullFloorSpread !== false; // 기본값(true): 빈 바닥 채움(1단 바닥 전체 균등 배치) / false: 최대한 높게 쌓아 바닥 공간 만들기
  const effectiveDoubleStack = allowDoubleStack || !fullFloorSpread;
  const optimizeCoG = options.optimizeCoG !== false;

  // stuffingStrategy: 'convenience' (작업 편의성 우선 - 품목별 몰아넣기 · 단일 품목 전용 완적)
  //                   'balance' (균등 밸런스 우선 - 전 호기 품목·무게 균등 배분)
  const stuffingStrategy =
    options.stuffingStrategy ||
    (options.balanceContainers === true && options.stuffingStrategy === undefined
      ? 'balance'
      : 'convenience');
  const isConvenienceMode = stuffingStrategy === 'convenience';

  if (!pallets || pallets.length === 0) {
    return {
      containers: [],
      floorSlotsPerContainer: 0,
      maxPalletsPerContainer: 0,
      unfitPallets: [],
    };
  }

  const unfitPallets = [];
  const validPallets = [];

  for (const p of pallets) {
    const minSide = Math.min(p.width, p.length);
    if (p.totalHeight > cHeight || minSide > cWidth) {
      unfitPallets.push({
        palletId: p.id,
        index: p.index,
        reason:
          p.totalHeight > cHeight
            ? `파레트 총 높이(${p.totalHeight}mm)가 컨테이너 내부 높이(${cHeight}mm)를 초과합니다.`
            : `파레트 규격(${p.width}×${p.length}mm)이 컨테이너 내부 폭(${cWidth}mm)을 초과합니다.`,
      });
    } else {
      validPallets.push(p);
    }
  }

  const avgLength =
    validPallets.reduce((acc, p) => acc + Math.max(p.width, p.length), 0) /
    Math.max(1, validPallets.length);
  const colsPerContainer = Math.max(1, Math.floor(cLength / Math.min(1150, avgLength)));
  const floorSlotsPerContainer = colsPerContainer * 2;

  let orderedContainerBuckets = [];

  const tryPackSingleContainer = (palletList) => {
    let workingList = [...palletList];

    if (optimizeCoG && workingList.length > 2) {
      if (isConvenienceMode) {
        // 작업 편의성 모드: SKU별 블록을 해체하지 않고, 각 SKU 블록 내부에서만 안정 정렬 + 자투리(부분 파레트)는 도어 쪽(끝)으로 유지
        const byCargoInCont = new Map();
        for (const p of workingList) {
          const k = p.primaryCargoId || 'other';
          if (!byCargoInCont.has(k)) byCargoInCont.set(k, []);
          byCargoInCont.get(k).push(p);
        }
        const rebuilt = [];
        const trailingPartials = [];
        for (const [, list] of byCargoInCont.entries()) {
          const fulls = list.filter((p) => !p.isPartial);
          const parts = list.filter((p) => p.isPartial);
          fulls.sort((a, b) => b.totalWeight - a.totalWeight);
          rebuilt.push(...fulls);
          trailingPartials.push(...parts);
        }
        workingList = [...rebuilt, ...trailingPartials];
      } else {
        // 균등 밸런스 모드: 전 파레트 중량 기반 전후/좌우 밸런싱 재배치
        workingList.sort((a, b) => {
          if (a.isPartial !== b.isPartial) return a.isPartial ? 1 : -1;
          return b.totalWeight - a.totalWeight;
        });

        const fullHeavy = workingList.filter((p) => !p.isPartial);
        const partials = workingList.filter((p) => p.isPartial);
        if (fullHeavy.length >= 6) {
          const reordered = new Array(fullHeavy.length);
          let leftPtr = 0;
          let rightPtr = fullHeavy.length - 1;
          const asc = [...fullHeavy].sort((a, b) => a.totalWeight - b.totalWeight);
          asc.forEach((item, idx) => {
            if (idx % 2 === 0) {
              reordered[leftPtr++] = item;
            } else {
              reordered[rightPtr--] = item;
            }
          });
          workingList = [...reordered, ...partials];
        }
      }
    }

    // 선택사항('최대한 높게 쌓아 바닥 공간 만들기', fullFloorSpread === false)일 때:
    // 상단 적재 가능한 파레트를 2단(Tier 2)으로 예약하여 1단 바닥 사용 열 수를 줄이고 바닥 여유 공간을 확보
    const reservedForTier2 = [];
    if (!fullFloorSpread && workingList.length > 2) {
      const ascendingByHeight = [...workingList].sort(
        (a, b) => a.totalHeight - b.totalHeight || a.totalWeight - b.totalWeight
      );
      const usedBottomIds = new Set();
      const reservedTopIds = new Set();
      const maxTier2Allowed = Math.min(
        floorSlotsPerContainer,
        Math.floor(workingList.length / 2)
      );

      for (const topCand of ascendingByHeight) {
        if (reservedTopIds.has(topCand.id)) continue;
        if (reservedTopIds.size >= maxTier2Allowed) break;

        const bottomMatch = workingList.find(
          (b) =>
            b.id !== topCand.id &&
            !b.isPartial &&
            !usedBottomIds.has(b.id) &&
            !reservedTopIds.has(b.id) &&
            b.totalHeight + topCand.totalHeight <= cHeight - 15 &&
            topCand.totalWeight <= b.totalWeight * 1.15
        );
        if (bottomMatch) {
          usedBottomIds.add(bottomMatch.id);
          reservedTopIds.add(topCand.id);
          reservedForTier2.push(topCand);
        }
      }

      if (reservedTopIds.size > 0) {
        workingList = workingList.filter((p) => !reservedTopIds.has(p.id));
      }
    }

    const placedPallets = [];
    const overflowPallets = [];
    let currentWeight = 0;
    let cursorX = 0;
    let slotCounter = 0;

    const targetFloorPallets = Math.min(workingList.length, floorSlotsPerContainer);
    const estCols = Math.ceil(targetFloorPallets / 2);
    const rawLengthSum = workingList
      .slice(0, targetFloorPallets)
      .reduce((acc, p, i) => (i % 2 === 0 ? acc + Math.max(p.width, p.length) : acc), 0);
    const needsTightFit =
      !fullFloorSpread || rawLengthSum + Math.max(0, estCols - 1) * 12 > cLength;
    const colGapX = !fullFloorSpread ? 4 : needsTightFit ? 4 : 14;

    let idx = 0;
    const openTopSlots = [];
    const placedColumns = [];

    // PHASE 1: 컨테이너 1단 바닥(Tier 1) 우선 배치
    while (idx < workingList.length) {
      const p1 = workingList[idx];

      if (currentWeight + p1.totalWeight > cMaxWeight && placedPallets.length > 0) {
        break;
      }

      const p2Candidate = idx + 1 < workingList.length ? workingList[idx + 1] : null;

      let o1 = orientPalletFor2Rows(p1, cWidth, false);
      let o2 = p2Candidate ? orientPalletFor2Rows(p2Candidate, cWidth, false) : null;

      if (needsTightFit && p2Candidate) {
        const tryO1 = orientPalletFor2Rows(p1, cWidth, true);
        const tryO2 = orientPalletFor2Rows(p2Candidate, cWidth, true);
        if (tryO1.widthZ + tryO2.widthZ <= cWidth) {
          o1 = tryO1;
          o2 = tryO2;
        } else if (tryO1.widthZ + o2.widthZ <= cWidth) {
          o1 = tryO1;
        } else if (o1.widthZ + tryO2.widthZ <= cWidth) {
          o2 = tryO2;
        }
      } else if (!fullFloorSpread && !p2Candidate) {
        const tryO1 = orientPalletFor2Rows(p1, cWidth, true);
        if (tryO1.widthZ <= cWidth) o1 = tryO1;
      }

      if (cursorX + o1.lengthX > cLength) {
        break;
      }

      const canPlaceP2 =
        Boolean(p2Candidate) &&
        o1.widthZ + o2.widthZ <= cWidth &&
        cursorX + o2.lengthX <= cLength &&
        currentWeight + p1.totalWeight + p2Candidate.totalWeight <= cMaxWeight;

      if (canPlaceP2) {
        const totalZ = o1.widthZ + o2.widthZ;
        const zGap = Math.max(8, Math.floor((cWidth - totalZ) / 3));
        const zLeft = Math.max(0, zGap);
        const zRight = Math.max(zLeft + o1.widthZ + 4, cWidth - o2.widthZ - Math.max(0, zGap));

        const slot1 = {
          pallet: p1,
          slotIndex: slotCounter++,
          tier: 1,
          x: cursorX,
          y: 0,
          z: zLeft,
          length: o1.lengthX,
          width: o1.widthZ,
          rotated: o1.rotated,
        };
        const slot2 = {
          pallet: p2Candidate,
          slotIndex: slotCounter++,
          tier: 1,
          x: cursorX,
          y: 0,
          z: zRight,
          length: o2.lengthX,
          width: o2.widthZ,
          rotated: o2.rotated,
        };

        placedPallets.push(slot1, slot2);
        const colLen = Math.max(o1.lengthX, o2.lengthX);
        placedColumns.push({ slots: [slot1, slot2], colLen });

        currentWeight += p1.totalWeight + p2Candidate.totalWeight;
        cursorX += colLen + colGapX;

        if (p1.totalHeight < cHeight - 200) {
          openTopSlots.push({ slotRef: slot1, bottomPallet: p1 });
        }
        if (p2Candidate.totalHeight < cHeight - 200) {
          openTopSlots.push({ slotRef: slot2, bottomPallet: p2Candidate });
        }

        idx += 2;
      } else {
        const zCentered = Math.max(0, Math.floor((cWidth - o1.widthZ) / 2));
        const slot1 = {
          pallet: p1,
          slotIndex: slotCounter++,
          tier: 1,
          x: cursorX,
          y: 0,
          z: zCentered,
          length: o1.lengthX,
          width: o1.widthZ,
          rotated: o1.rotated,
        };

        placedPallets.push(slot1);
        placedColumns.push({ slots: [slot1], colLen: o1.lengthX });

        currentWeight += p1.totalWeight;
        cursorX += o1.lengthX + colGapX;

        if (p1.totalHeight < cHeight - 200) {
          openTopSlots.push({ slotRef: slot1, bottomPallet: p1 });
        }

        idx += 1;
      }
    }

    // 기본값('빈 바닥 채움 — 1단 바닥 전체 균등 배치')일 때 열 간격 균등 배분
    if (fullFloorSpread && placedColumns.length >= 2) {
      const totalColLen = placedColumns.reduce((acc, col) => acc + col.colLen, 0);
      const targetSpan = Math.max(totalColLen, cLength - 110);
      const evenGap = Math.min(
        130,
        Math.max(10, Math.floor((targetSpan - totalColLen) / (placedColumns.length - 1)))
      );
      let spreadX = 0;
      for (const col of placedColumns) {
        for (const s of col.slots) {
          s.x = spreadX;
        }
        spreadX += col.colLen + evenGap;
      }
      cursorX = spreadX;
    }

    // PHASE 2: 2단(Tier 2) 적재 배치
    const tier2Candidates = [...reservedForTier2, ...workingList.slice(idx)];
    if (effectiveDoubleStack && tier2Candidates.length > 0 && openTopSlots.length > 0) {
      const midX = cursorX / 2;
      openTopSlots.sort(
        (a, b) =>
          Math.abs(a.slotRef.x + a.slotRef.length / 2 - midX) -
          Math.abs(b.slotRef.x + b.slotRef.length / 2 - midX)
      );

      // 도어 높이 및 지게차 인양 여유(Lift margin 80mm)를 고려한 2단 적재 최대 높이 한도
      const doorH = cSpec.doorHeight || cHeight;
      const forkliftLiftMargin = 80;
      const maxDoubleStackTotalHeight = Math.min(cHeight, doorH - forkliftLiftMargin);

      for (const cand of tier2Candidates) {
        // 2단 적재 허용 조건 (실무 안전 기준):
        // 1. 하단 및 상단 모두 자투리 파레트(isPartial)가 아닐 것
        // 2. 하단 및 상단 화물 모두 '2단 적재 금지(noDoubleStack)' 옵션이 아닐 것
        // 3. 규격 일치: 상단 파레트와 하단 파레트의 가로·세로 규격이 동일할 것 (T11 위에 T12 적재 금지)
        // 4. 높이 제한: 합산 높이가 도어 개구부 및 지게차 인양 여유(Lift margin) 이내일 것
        // 5. 중량 제한: 컨테이너 최대 적재중량 이하 + 상경하중 원칙(상단은 하단보다 무겁지 않아야 함)
        const sIdx = openTopSlots.findIndex(
          (s) =>
            !s.bottomPallet.isPartial &&
            !cand.isPartial &&
            !s.bottomPallet.noDoubleStack &&
            !cand.noDoubleStack &&
            s.bottomPallet.width === cand.width &&
            s.bottomPallet.length === cand.length &&
            s.bottomPallet.totalHeight + cand.totalHeight <= maxDoubleStackTotalHeight &&
            currentWeight + cand.totalWeight <= cMaxWeight &&
            cand.totalWeight <= s.bottomPallet.totalWeight
        );
        if (sIdx !== -1) {
          const target = openTopSlots.splice(sIdx, 1)[0];
          const targetSlot = target.slotRef;
          placedPallets.push({
            pallet: cand,
            slotIndex: targetSlot.slotIndex,
            tier: 2,
            x: targetSlot.x,
            y: target.bottomPallet.totalHeight,
            z: targetSlot.z,
            length: targetSlot.length,
            width: targetSlot.width,
            rotated: targetSlot.rotated,
          });
          currentWeight += cand.totalWeight;
        } else {
          overflowPallets.push(cand);
        }
      }
    } else if (tier2Candidates.length > 0) {
      overflowPallets.push(...tier2Candidates);
    }

    return { placedPallets, overflowPallets };
  };

  // 다수 컨테이너(2대 이상) 생성 시 적재 전략 분기:
  // 1) 'convenience' (작업 편의성 우선): 단일 품목 완적 호기 우선 생성 & 호기별 품목 블록화
  // 2) 'balance' (균등 밸런스 우선): 전 호기에 품목·중량 균등 분산
  const containers = [];

  if (validPallets.length > 0) {
    let testRem = [...validPallets];
    let neededCount = 0;
    while (testRem.length > 0 && neededCount < 50) {
      const res = tryPackSingleContainer(testRem);
      if (res.placedPallets.length === 0) break;
      neededCount++;
      testRem = res.overflowPallets;
    }

    if (neededCount >= 2) {
      orderedContainerBuckets = distributePalletsForMultiContainer({
        validPallets,
        neededCount,
        isConvenienceMode,
        effectiveDoubleStack,
        floorSlotsPerContainer,
        cMaxWeight,
      });
    }
  }

  if (orderedContainerBuckets.length > 0) {
    let leftover = [];
    orderedContainerBuckets.forEach((bucket) => {
      const combined = [...leftover, ...bucket];
      const res = tryPackSingleContainer(combined);
      if (res.placedPallets.length > 0) {
        containers.push({
          id: `container-${containers.length + 1}`,
          index: containers.length + 1,
          spec: containerSpec,
          placedPallets: res.placedPallets,
        });
      }
      leftover = res.overflowPallets;
    });
    while (leftover.length > 0) {
      const res = tryPackSingleContainer(leftover);
      if (res.placedPallets.length === 0) break;
      containers.push({
        id: `container-${containers.length + 1}`,
        index: containers.length + 1,
        spec: containerSpec,
        placedPallets: res.placedPallets,
      });
      leftover = res.overflowPallets;
    }
  } else {
    let rem = [...validPallets];
    while (rem.length > 0) {
      const res = tryPackSingleContainer(rem);
      if (res.placedPallets.length === 0) break;
      containers.push({
        id: `container-${containers.length + 1}`,
        index: containers.length + 1,
        spec: containerSpec,
        placedPallets: res.placedPallets,
      });
      rem = res.overflowPallets;
    }
  }

  const containerInternalCbm = (cLength * cWidth * cHeight) / 1e9;
  for (const c of containers) {
    let totalW = 0;
    let cargoCbm = 0;
    let envCbm = 0;
    let boxesCnt = 0;
    const skuBreakdown = {};

    for (const pp of c.placedPallets) {
      const p = pp.pallet;
      totalW += p.totalWeight;
      cargoCbm += p.cargoCbm;
      envCbm += p.totalCbm;
      boxesCnt += p.boxes.length;

      const label = `${p.primaryCargoName || '혼적'} (${p.width}×${p.length})`;
      if (!skuBreakdown[label]) {
        skuBreakdown[label] = { pallets: 0, boxes: 0, weight: 0 };
      }
      skuBreakdown[label].pallets += 1;
      skuBreakdown[label].boxes += p.boxes.length;
      skuBreakdown[label].weight = Number(
        (skuBreakdown[label].weight + p.totalWeight).toFixed(1)
      );
    }

    c.totalWeight = Number(totalW.toFixed(1));
    c.cargoCbm = Number(cargoCbm.toFixed(3));
    c.palletEnvelopeCbm = Number(envCbm.toFixed(3));
    c.boxCount = boxesCnt;
    c.skuBreakdown = Object.entries(skuBreakdown).map(([name, info]) => ({
      name,
      palletCount: info.pallets,
      boxes: info.boxes,
      weightKg: Number(info.weight.toFixed(1)),
    }));
    c.internalCbm = Number(containerInternalCbm.toFixed(2));
    c.volumeUtilization = Number(
      Math.min(100, (c.palletEnvelopeCbm / containerInternalCbm) * 100).toFixed(1)
    );
    c.cargoVolumeUtilization = Number(
      Math.min(100, (c.cargoCbm / containerInternalCbm) * 100).toFixed(1)
    );
    c.weightUtilization = Number(
      Math.min(100, (c.totalWeight / cMaxWeight) * 100).toFixed(1)
    );
    c.tier1Count = c.placedPallets.filter((p) => p.tier === 1).length;
    c.tier2Count = c.placedPallets.filter((p) => p.tier === 2).length;
    c.cog = analyzeContainerCoG(c);
    c.stuffingStrategy = stuffingStrategy;

    // 실무 적재 유형 뱃지
    c.stuffingBadge = computeStuffingBadge(c, cLength, effectiveDoubleStack, isConvenienceMode);

    // 현장 적재 정밀 진단 (도어 여유고, 쇼링 여유, 유격, 도어측 낙하 방지 쇼링 가이드)
    c.fieldDiagnostics = computeFieldDiagnostics(c, containerSpec, cLength, cWidth, cHeight);
  }

  return {
    containers,
    floorSlotsPerContainer: cLength < 7000 ? 10 : 20,
    maxPalletsPerContainer: (cLength < 7000 ? 10 : 20) * (effectiveDoubleStack ? 2 : 1),
    unfitPallets,
  };
}
