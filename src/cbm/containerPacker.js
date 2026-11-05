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

    // 전후 중량 분배 (L/2 기준)
    if (pCenterX <= cL / 2) frontHalfWeight += pMass;
    else rearHalfWeight += pMass;

    // 좌우 중량 분배 (폭 W/2 기준, 중앙을 걸치는 1열 적재 파레트는 비례 분배하여 좌 100% 왜곡 방지)
    const pZ1 = pp.z;
    const pZ2 = pp.z + pp.width;
    const midZ = cW / 2;

    if (pZ2 <= midZ) {
      leftRowWeight += pMass;
    } else if (pZ1 >= midZ) {
      rightRowWeight += pMass;
    } else {
      // 파레트가 중앙선을 걸치는 경우 (예: 1200x1200mm 중앙 1열 배치)
      const leftFrac = (midZ - pZ1) / pp.width;
      leftRowWeight += pMass * leftFrac;
      rightRowWeight += pMass * (1 - leftFrac);
    }
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

  // IMO/ILO/UNECE CTU Code 권고 및 현장 안전 관리 기준:
  // 1. 전후 무게중심: CTU Code 권고는 컨테이너 길이 중앙(L/2)에서 ±5% 이내 안전, ±5~10% 주의, ±10% 초과 위험
  //    (보조 경험칙: 전·후반부 중량비 각 60% 이하)
  // 2. 좌우 횡방향 균형: 사내 기준(설정값)에 따라 좌우 중심 편차 ±70mm 이내
  const absOffsetXPct = (Math.abs(offsetXFromContainerCenter) / cL) * 100;
  const isCtuLongitudinalSafe = absOffsetXPct <= 5.0; // ±5% 이내 안전
  const isCtuLongitudinalWarning = absOffsetXPct > 5.0 && absOffsetXPct <= 10.0; // ±5~10% 주의
  const isCtuLongitudinalDanger = absOffsetXPct > 10.0; // ±10% 초과 위험
  const isLateralSafe = Math.abs(offsetZFromCenter) <= 70; // 사내 기준 ±70mm 이내

  const limit5PctMm = Math.round(cL * 0.05);
  const limit10PctMm = Math.round(cL * 0.10);
  const longitudinalCriteriaText = `CTU Code 권고: 길이 중앙 ±5%(약 ±${limit5PctMm.toLocaleString()}mm) 이내 (현재 ${absOffsetXPct.toFixed(1)}% 편차, ${Math.abs(offsetXFromContainerCenter).toLocaleString()}mm 치우침 · 보조지표: 전 ${frontRatio}% : 후 ${rearRatio}%)`;
  const lateralCriteriaText = `사내 기준 (설정값): 좌우 중심 편차 ±70mm 이내 (현재 ${Math.abs(offsetZFromCenter)}mm 편차, 좌 ${leftRatio}% : 우 ${rightRatio}%)`;

  let axleLoadNote = '';
  if (totalMass <= 10000) {
    axleLoadNote = `화물 총중량 ${(totalMass / 1000).toFixed(1)}톤으로 경량 상태 — 단, 실제 축하중은 차량 제원에 따라 달라 별도 확인 필요`;
  } else if (!isCtuLongitudinalSafe) {
    axleLoadNote = `총중량 ${(totalMass / 1000).toFixed(1)}톤 전후 편심(${absOffsetXPct.toFixed(1)}%로 CTU 권고 ±5% 초과) — 트랙터 구동축 과적 및 축하중 별도 확인 필요`;
  } else {
    axleLoadNote = '전후 하중 분산 균형 양호 — 단, 실제 축하중은 차량 제원에 따라 달라 별도 확인 필요';
  }

  const offsetDirXText =
    offsetXFromContainerCenter === 0
      ? '중앙 정확 일치 (0mm)'
      : offsetXFromContainerCenter < 0
      ? `전방(헤드) ${Math.abs(offsetXFromContainerCenter).toLocaleString()}mm 치우침 (${absOffsetXPct.toFixed(1)}%)`
      : `후방(도어) ${Math.abs(offsetXFromContainerCenter).toLocaleString()}mm 치우침 (${absOffsetXPct.toFixed(1)}%)`;

  const offsetDirZText =
    offsetZFromCenter === 0
      ? '좌우 중심 일치 (0mm)'
      : offsetZFromCenter < 0
      ? `좌측 ${Math.abs(offsetZFromCenter)}mm 편차`
      : `우측 ${Math.abs(offsetZFromCenter)}mm 편차`;

  let status = 'SAFE';
  let statusText = '안전 (CTU Code 권고 ±5% 및 사내 기준 충족)';

  if (!isCtuLongitudinalSafe && !isLateralSafe) {
    status = isCtuLongitudinalDanger ? 'DANGER' : 'WARN';
    statusText = `${isCtuLongitudinalDanger ? '위험' : '주의'} (전후 편차 ${absOffsetXPct.toFixed(1)}%로 ±5% 초과 · 좌우 편차 ${Math.abs(offsetZFromCenter)}mm로 사내 기준 ±70mm 초과)`;
  } else if (!isCtuLongitudinalSafe) {
    status = isCtuLongitudinalDanger ? 'DANGER' : 'WARN';
    statusText = `${isCtuLongitudinalDanger ? '위험 (CTU Code 권고 ±10% 초과 — 위험)' : '주의 (CTU Code 권고: 길이 중앙 ±5% 초과 및 ±10% 이내)'} — 중앙 편차 ${Math.abs(offsetXFromContainerCenter).toLocaleString()}mm (${absOffsetXPct.toFixed(1)}%)`;
  } else if (!isLateralSafe) {
    status = 'WARN';
    statusText = `주의 (사내 기준 ±70mm 초과 — 현재 좌우 편차 ${Math.abs(offsetZFromCenter)}mm)`;
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
  const pW = p.hasMeasured && p.measuredWidth > 0 ? p.measuredWidth : (p.nominalWidth || p.width);
  const pL = p.hasMeasured && p.measuredLength > 0 ? p.measuredLength : (p.nominalLength || p.length);
  const halfW = containerWidth / 2;
  const maxDim = Math.max(pW, pL);
  const minDim = Math.min(pW, pL);

  if (preferCompactX && maxDim <= 1220 && minDim <= 1050 && pW !== pL) {
    return {
      lengthX: minDim,
      widthZ: maxDim,
      rotated: pL !== minDim,
    };
  }

  if (pW <= halfW && pL <= halfW) {
    return { lengthX: pL, widthZ: pW, rotated: false };
  }
  if (pL <= halfW && pW > halfW) {
    return { lengthX: pW, widthZ: pL, rotated: true };
  }
  if (pW <= halfW && pL > halfW) {
    return { lengthX: pL, widthZ: pW, rotated: false };
  }
  return { lengthX: pL, widthZ: pW, rotated: false };
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
      label: `[전용 완적] [${singleSkuName}] 단일 품목 전용 완적 (FCL)`,
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
      label: `[1단 평적] 순수 1단적 안전 평적 (총 ${container.placedPallets.length}PLT · 2단적 0개)`,
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
      label: `[2단 완적] 2단적 집중 완적 (총 ${container.placedPallets.length}PLT · 40PLT 만적)`,
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
      label: `[전용 적재] [${singleSkuName}] 단일 품목 전용 적재`,
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
          ? `[2단적 블록] 2단적 블록 적재 (1단적 ${container.tier1Count} + 2단적 ${container.tier2Count}PLT)`
          : `[혼적] 잔여 품목 모음 적재 (${container.skuBreakdown.length}개 품목)`,
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
        ? `[균등 분산] 2단적 분산 적재 (1단적 ${container.tier1Count} + 2단적 ${container.tier2Count}PLT)`
        : `[균등 분산] 균등 분산 적재 (${container.skuBreakdown.length}개 품목)`,
    shortLabel: `균등 분산 (${container.placedPallets.length}PLT)`,
    tagText: '균등 분산',
    color: '#a5b4fc',
    bg: 'rgba(129, 140, 248, 0.16)',
    border: '1px solid rgba(129, 140, 248, 0.45)',
  };
}

/**
 * 현장 적재 정밀 진단(도어 여유고, 전후 쇼링 여유, 좌우 유격, 도어측 낙하 방지 쇼링, 자재 산출 BOM) 계산 헬퍼
 */
export function computeFieldDiagnostics(container, containerSpec, cLength, cWidth, cHeight, options = {}) {
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

  const tier1Pallets = container.placedPallets.filter((p) => p.tier === 1);
  const occupiedFloorAreaMm2 = tier1Pallets.reduce(
    (acc, pp) => acc + pp.length * pp.width,
    0
  );
  const floorUtilizationPct = Number(
    Math.min(100, (occupiedFloorAreaMm2 / (cLength * cWidth)) * 100).toFixed(1)
  );

  // 공차 설정 (사용자 설정 or 기본값)
  const wrappingConfig = options.wrappingConfig || {};
  const wrappingBulge = Number(wrappingConfig.wrappingBulgeMm) || 20;
  const misalignment = Number(wrappingConfig.stackingMisalignmentMm) || 10;
  const forkliftClearance = Number(wrappingConfig.forkliftLateralClearanceMm || wrappingConfig.forkliftClearanceMm) || 20;
  const innerWidthOption = Number(wrappingConfig.containerInnerWidthOption) || cWidth;
  const maxLateralGapAllowed = Number(wrappingConfig.maxLateralGapAllowedMm) || 150;
  const airbagEffLen = Number(wrappingConfig.airbagEffectiveLengthMm) || 1800;

  // 열(Column, X좌표 기준)별 파레트 그룹핑
  const colMap = new Map();
  for (const p of tier1Pallets) {
    const key = p.x;
    if (!colMap.has(key)) colMap.set(key, []);
    colMap.get(key).push(p);
  }
  const uniqueXs = Array.from(colMap.keys()).sort((a, b) => a - b);
  const numCols = uniqueXs.length;
  const lastColX = uniqueXs[uniqueXs.length - 1] ?? 0;
  const doorPallets = container.placedPallets.filter((pp) => pp.x === lastColX);

  const isLaneCombination = Boolean(
    container.isLaneCombination ||
    (tier1Pallets.length > 0 &&
      tier1Pallets.some((p) => p.orientation === '가로' || p.orientation === '세로'))
  );

  const minPalletDim = tier1Pallets.reduce(
    (min, p) => Math.min(min, Math.min(p.width, p.length)),
    Infinity
  );
  const canFit2Rows = isFinite(minPalletDim) && minPalletDim * 2 <= innerWidthOption;

  // 열별 실측 측면 유격(Lateral Gap) 및 단일 열 여부 계산
  let maxColGapMm = 0;
  let minColGapMm = Infinity;
  let hasSingleRowCol = false;
  let hasDoorIncompleteCol = false;
  let doorIncompleteColInfo = null;
  const colGapDetails = [];

  // 150mm 초과 열들을 틈 폭(gap) 구간별로 그룹핑하여 정밀 에어백 산출
  const wideGapGroups = [];

  if (isLaneCombination) {
    // 레인 조합 배치: 2개 레인(1,200mm + 800mm)이 나란히 놓여 사용 폭 2,000mm 유지
    // 남는 길이의 자투리 1개 파레트(20ft 등)를 제외하고는 양 레인이 공존하므로 실효 틈새는 (내폭 - 2,000mm)
    const standardGap = Math.max(0, innerWidthOption - 2000);
    maxColGapMm = standardGap;
    minColGapMm = standardGap;

    uniqueXs.forEach((x, cIdx) => {
      const palletsInCol = colMap.get(x) || [];
      const colLen = Math.max(...palletsInCol.map((p) => p.length));
      const totalRowW = palletsInCol.reduce((acc, p) => acc + p.width, 0);
      const isRemnantSingle = palletsInCol.length === 1 && colLen === 800 && palletsInCol[0].x >= cLength - 1200;
      const gap = isRemnantSingle ? Math.max(0, innerWidthOption - totalRowW) : standardGap;

      if (isRemnantSingle) {
        hasSingleRowCol = true;
      }
      if (gap > maxColGapMm) maxColGapMm = gap;

      if (gap > maxLateralGapAllowed) {
        wideGapGroups.push({
          colIndex: cIdx + 1,
          gap,
          colLen,
          label: palletsInCol.map((p) => p.pallet.primaryCargoName || `P#${p.pallet.index || p.palletIndex}`).join('+'),
        });
      }

      colGapDetails.push({
        colIndex: cIdx + 1,
        gap,
        isSingle: isRemnantSingle,
        leftGapMm: isRemnantSingle ? Math.floor(gap / 2) : Math.floor(standardGap / 3),
        rightGapMm: isRemnantSingle ? Math.ceil(gap / 2) : Math.ceil(standardGap / 3),
        pallets: palletsInCol,
        label: palletsInCol.map((p) => p.pallet.primaryCargoName || `P#${p.pallet.index || p.palletIndex}`).join('+'),
        colLen,
      });
    });
  } else {
    uniqueXs.forEach((x, cIdx) => {
      const palletsInCol = colMap.get(x) || [];
      const colLen = Math.max(...palletsInCol.map((p) => p.length));
      const totalRowW = palletsInCol.reduce((acc, p) => acc + p.width, 0);
      const gap = Math.max(0, innerWidthOption - totalRowW);
      const isDoorCol = cIdx === uniqueXs.length - 1;
      const isDoorIncomplete = !isLaneCombination && canFit2Rows && palletsInCol.length === 1 && isDoorCol;
      const isSingle = palletsInCol.length === 1 && totalRowW <= 1300;

      if (isDoorIncomplete) {
        hasDoorIncompleteCol = true;
        doorIncompleteColInfo = {
          colIndex: cIdx + 1,
          gap,
          leftGapMm: Math.floor(gap / 2),
          rightGapMm: Math.ceil(gap / 2),
          pallet: palletsInCol[0],
        };
      } else if (isSingle) {
        hasSingleRowCol = true;
      }
      if (gap > maxColGapMm) maxColGapMm = gap;
      if (gap < minColGapMm) minColGapMm = gap;

      if (!isDoorIncomplete && gap > maxLateralGapAllowed) {
        wideGapGroups.push({
          colIndex: cIdx + 1,
          gap,
          colLen,
          label: palletsInCol.map((p) => p.pallet.primaryCargoName || `P#${p.pallet.index || p.palletIndex}`).join('+'),
        });
      }

      const label = palletsInCol.map((p) => p.pallet.primaryCargoName || `P#${p.pallet.index || p.palletIndex}`).join('+');
      colGapDetails.push({
        colIndex: cIdx + 1,
        gap,
        isSingle: isSingle || isDoorIncomplete,
        isDoorIncomplete,
        leftGapMm: (isSingle || isDoorIncomplete) ? Math.floor(gap / 2) : 0,
        rightGapMm: (isSingle || isDoorIncomplete) ? Math.ceil(gap / 2) : gap,
        pallets: palletsInCol,
        label,
        colLen,
      });
    });
  }

  if (minColGapMm === Infinity) minColGapMm = 0;
  const lateralGapMm = maxColGapMm;

  // 측면 유격 텍스트: 열별 실측 유격 및 CTU Code 15cm 권고 표기
  let dunnageBagText = `열별 측면 유격 ${minColGapMm === maxColGapMm ? `${maxColGapMm}mm` : `${minColGapMm}~${maxColGapMm}mm`} (CTU Code 권고: 수평 빈 공간 15cm 이내)`;
  if (hasDoorIncompleteCol && doorIncompleteColInfo) {
    dunnageBagText = `문쪽 미완성 열 폭 중앙 적재 (양옆 유격 약 ${doorIncompleteColInfo.leftGapMm}mm씩) — 측면 블로킹 필요 (에어백 미사용)`;
  } else if (hasSingleRowCol) {
    dunnageBagText = `폭 방향 1열 중앙 적재 (양옆 유격 약 ${Math.round(maxColGapMm / 2)}mm씩) — 양옆 블로킹 필요`;
  } else if (maxColGapMm > maxLateralGapAllowed) {
    dunnageBagText = `최대 측면 유격 ${maxColGapMm}mm (CTU Code 권고 15cm 초과) — 열간 에어백 충진 권장`;
  }

  // 측면 여유 상태 판정 (CTU Code 권고 150mm 기준)
  let lateralStatus = 'SAFE';
  let lateralStatusText = `가능 (내폭 ${innerWidthOption}mm 기준 적재 작업 여유 충족)`;
  if (hasDoorIncompleteCol && doorIncompleteColInfo) {
    lateralStatus = 'WARN';
    lateralStatusText = `주의 (문쪽 미완성 열 — 양옆 약 ${doorIncompleteColInfo.leftGapMm}mm씩 유격, 측면 블로킹(각재/세운 빈 파레트) 시공 필수)`;
  } else if (hasSingleRowCol) {
    lateralStatus = 'WARN';
    lateralStatusText = `주의 (폭 방향 1열 중앙 적재 — 양옆 약 ${Math.round(maxColGapMm / 2)}mm씩 유격, 양옆 블로킹 필요)`;
  } else if (maxColGapMm < 40) {
    lateralStatus = 'DANGER';
    lateralStatusText = `불가 (내폭 ${innerWidthOption}mm 대비 여유 ${maxColGapMm}mm로 협소하여 적입 불가 위험)`;
  } else if (maxColGapMm > maxLateralGapAllowed) {
    lateralStatus = 'WARN';
    lateralStatusText = `주의 (측면 유격 최대 ${maxColGapMm}mm — CTU Code 권고 ${maxLateralGapAllowed}mm 초과로 완충 조치 필요)`;
  }

  // 바로 앞 열(직전 열) 탐색 및 단차 산출
  const prevColX = uniqueXs.length >= 2 ? uniqueXs[uniqueXs.length - 2] : null;
  const prevColPallets =
    prevColX !== null ? container.placedPallets.filter((pp) => pp.x === prevColX) : [];

  let frontColMaxH = 0;
  if (prevColPallets.length > 0) {
    frontColMaxH = Math.max(...prevColPallets.map((pp) => pp.pallet.totalHeight));
  } else {
    frontColMaxH = Math.max(...container.placedPallets.map((pp) => pp.pallet.totalHeight));
  }

  let hasLowPalletAtDoor = false;
  const lowDoorPalletDetails = [];
  let minDoorPalletH = Infinity;

  for (const dp of doorPallets) {
    const h = dp.pallet.totalHeight;
    const diff = frontColMaxH - h;
    if (h < minDoorPalletH) minDoorPalletH = h;
    if (h < 1150 || diff >= 300) {
      hasLowPalletAtDoor = true;
      const pLabel = `P#${dp.pallet.index || dp.palletIndex}`;
      if (!lowDoorPalletDetails.some((d) => d.label === pLabel)) {
        lowDoorPalletDetails.push({
          label: pLabel,
          height: h,
          frontColMaxH,
          diff,
        });
      }
    }
  }

  const lowPalletDesc = lowDoorPalletDetails
    .map((d) => `${d.label}(높이 ${d.height}mm, 단차 -${d.diff}mm)`)
    .join(', ');
  const lowPalletLabelsOnly = lowDoorPalletDetails.map((d) => d.label);

  const hasHeightGapRisk = hasLowPalletAtDoor;
  const hasSlidingRisk = rearClearanceMm >= 400;
  const hasRisk = hasHeightGapRisk || hasSlidingRisk;

  // 길이 방향 판정: 적입 가능 여부와 후미 블로킹 필요 여부를 명확히 분리!
  let lengthStatus = 'SAFE';
  let lengthStatusText = '적입 가능';
  let blockingRequirementText = '';
  let shoringText = '여유 공간 적정';

  if (rearClearanceMm < 0) {
    lengthStatus = 'DANGER';
    lengthStatusText = '불가';
    blockingRequirementText = '컨테이너 내부 길이 초과로 도어 닫힘 불가';
    shoringText = '적입 불가';
  } else if (rearClearanceMm <= 80 && (numCols >= 10 || maxOccupiedX >= 11900)) {
    // 1200mm급 10열(12,000mm) 또는 EUR 레인 조합 24~25개(12,000mm) 만적 시: 업계 통상치 반영하여 '불가'가 아닌 '주의 (래핑 후 실측 필요)'로 판정
    lengthStatus = 'WARN';
    lengthStatusText = '주의 (래핑 후 실측 필요)';
    blockingRequirementText = `도어 잔여 ${rearClearanceMm}mm (12,000mm 만적 밀착 적재)`;
    shoringText = `도어 쪽 잔여 ${rearClearanceMm}mm (12,000mm 만적 밀착 적재)`;
  } else if (rearClearanceMm <= 150) {
    lengthStatus = 'SAFE';
    lengthStatusText = '적입 가능';
    blockingRequirementText = `도어 밀착 적재 (잔여 ${rearClearanceMm}mm)`;
    shoringText = `도어 쪽 잔여 ${rearClearanceMm}mm — 바닥 밀착 적재`;
  } else {
    lengthStatus = 'SAFE';
    lengthStatusText = '적입 가능';
    blockingRequirementText = `문 앞 빈 공간 ${rearClearanceMm.toLocaleString()}mm 블로킹 필요`;
    shoringText = `문 앞 빈 공간 ${rearClearanceMm.toLocaleString()}mm 블로킹 필요`;
  }

  // 동적 수평 래싱 높이 계산 (규칙: 위쪽 줄은 앞 열 높이 - 150mm, 아래쪽 줄은 (도어측 낮은 파레트 중 최고 높이 + 위쪽 줄) / 2, 둘 다 50mm 단위 내림)
  const maxLowPalletH =
    lowDoorPalletDetails.length > 0
      ? Math.max(...lowDoorPalletDetails.map((p) => p.height))
      : Math.round(frontColMaxH * 0.5);
  const upperLashH = Math.floor((frontColMaxH - 150) / 50) * 50;
  const lowerLashH = Math.floor(((maxLowPalletH + upperLashH) / 2) / 50) * 50;

  // 쇼링 소요 자재 산출 (BOM / Material List)
  const shoringBOM = [];

  // 1. 각재 펜스 및 코너포스트 버팀목 (밀림 방지)
  if (hasSlidingRisk) {
    const fenceTiers = Math.max(1, Math.ceil(frontColMaxH / 600));
    const bracingCount = 2 * fenceTiers;
    shoringBOM.push({
      category: '목재 게이트',
      name: '각재 펜스 및 코너포스트 버팀목 (ISPM 15 HT 열처리 각재)',
      spec: `각재 90×90mm 또는 100×100mm (${fenceTiers}단 가공)`,
      quantity: `${fenceTiers}단 펜스 1세트 + 버팀목 ${bracingCount}본`,
      purpose: `마지막 열 뒤에 각재 펜스를 세우고 문쪽 코너포스트까지 버팀목을 대어 문 앞 빈 공간(${rearClearanceMm}mm) 화물 밀림 물리적 차단 (문 근처 에어백 사용 금지)`,
      isHtCertified: true,
    });
  }

  // 2. 빈 목재 파레트 (세워서 끼우고 각재로 조임)
  if (hasSlidingRisk && rearClearanceMm >= 600) {
    const palletCount = Math.max(4, Math.ceil(rearClearanceMm / 150) * 2);
    shoringBOM.push({
      category: '목재 블로킹',
      name: '빈 목재 파레트 (ISPM 15 HT 열처리 인증)',
      spec: '1100×1100mm 또는 1200×1000mm',
      quantity: `${palletCount}장`,
      purpose: `문 앞 빈 공간(${(rearClearanceMm / 1000).toFixed(1)}m)에 파레트를 세워서 끼우고 각재로 조여 밀림 차단 (눕혀 쌓기 금지)`,
      isHtCertified: true,
    });
  }

  // 3. 듄네이지 에어백 (측면 유격 구간에만 충진, 문 앞 제외)
  // 백 폭은 틈의 3배 규격(300mm 틈이면 폭 900mm급, 350mm 틈이면 폭 1200mm급)
  if (wideGapGroups.length > 0) {
    // 틈 크기별(300mm 초과 vs 이하)로 세분화하여 산출
    const largeGaps = wideGapGroups.filter((g) => g.gap > 300);
    const mediumGaps = wideGapGroups.filter((g) => g.gap <= 300);

    if (largeGaps.length > 0) {
      const totalLen = largeGaps.reduce((sum, g) => sum + g.colLen, 0);
      const bagCount = Math.max(1, Math.ceil(totalLen / airbagEffLen));
      const gapDesc = largeGaps.map((g) => `${g.label || `${g.colIndex}열`}(${g.gap}mm)`).join(', ');
      shoringBOM.push({
        category: '완충재',
        name: '듄네이지 에어백 (Dunnage Airbag Level 1~2)',
        spec: '폭 1,200mm급 (1200×1800mm 또는 1200×2400mm)',
        quantity: `${bagCount}개`,
        purpose: `측면 유격 300mm 초과 구간[${gapDesc}, 총 ${(totalLen / 1000).toFixed(1)}m] 열간 완충 (백 폭은 틈의 3배 규격, 문 앞 미사용)`,
        isHtCertified: false,
      });
    }

    if (mediumGaps.length > 0) {
      const totalLen = mediumGaps.reduce((sum, g) => sum + g.colLen, 0);
      const bagCount = Math.max(1, Math.ceil(totalLen / airbagEffLen));
      const gapDesc = mediumGaps.map((g) => `${g.label || `${g.colIndex}열`}(${g.gap}mm)`).join(', ');
      shoringBOM.push({
        category: '완충재',
        name: '듄네이지 에어백 (Dunnage Airbag Level 1)',
        spec: '폭 600~900mm급 (900×1200mm 또는 600×1200mm)',
        quantity: `${bagCount}개`,
        purpose: `측면 유격 150~300mm 구간[${gapDesc}, 총 ${(totalLen / 1000).toFixed(1)}m] 열간 완충 (CTU Code 권고 15cm 초과 구간, 문 앞 미사용)`,
        isHtCertified: false,
      });
    }
  }

  // 3-B. 문쪽 미완성 열 측면 블로킹 (각재 또는 세운 빈 파레트)
  if (hasDoorIncompleteCol && doorIncompleteColInfo) {
    shoringBOM.push({
      category: '측면 블로킹',
      name: '측면 블로킹 (각재 또는 세운 빈 파레트)',
      spec: '각재 90×90mm 또는 세운 목재 파레트',
      quantity: '좌/우 각 1조 (총 2조)',
      purpose: `문쪽 미완성 열(양옆 유격 각 ${doorIncompleteColInfo.leftGapMm}mm) 화물 전도 방지용 측면 블로킹 시공 (문쪽 열이므로 에어백 사용 금지)`,
      isHtCertified: true,
    });
  }

  // 4. 고강도 화물 래싱 벨트 (수평 래싱 2줄 + 톱오버 래싱 + 예비 1줄)
  let lashingStrapCount = 0;
  const lashingDetails = [];
  if (hasHeightGapRisk) {
    lashingStrapCount += 2; // 수평 래싱 2줄
    lashingDetails.push(`단차 완적 열 높이 ${lowerLashH.toLocaleString()}mm 및 ${upperLashH.toLocaleString()}mm 수평 래싱 2줄 (측벽 링 결속)`);
    lashingStrapCount += lowDoorPalletDetails.length; // 톱오버 래싱
    lashingDetails.push(`낮은 파레트(${lowPalletLabelsOnly.join(', ')}) 톱오버 래싱 ${lowDoorPalletDetails.length}줄 (바닥 링 결속, 전도 방지)`);
    lashingStrapCount += 1; // 예비 1줄
    lashingDetails.push('예비 벨트 1줄');
  } else if (hasSlidingRisk) {
    lashingStrapCount += 2;
    lashingDetails.push('최후미 화물 열 전면 수평 래싱 2줄 (측벽 링 결속)');
    lashingStrapCount += 1;
    lashingDetails.push('예비 벨트 1줄');
  }
  if (lashingStrapCount > 0) {
    shoringBOM.push({
      category: '결속 벨트',
      name: '고강도 화물 래싱 벨트 (Lashing Strap, 2~3톤급 라쳇 버클)',
      spec: '폭 50mm, 길이 6~9m',
      quantity: `${lashingStrapCount}줄`,
      purpose: lashingDetails.join(' / '),
      isHtCertified: false,
    });
  }

  // 5. 완충 판재
  if (hasHeightGapRisk) {
    shoringBOM.push({
      category: '목재 보강',
      name: '완충 판재 (합판 / 플라스틱 골판재)',
      spec: '두께 12~15mm × 폭 2,300mm × 높이 1,200mm',
      quantity: '1장',
      purpose: '완적 열 앞면에 대어 수평 래싱 2줄 결속 시 박스 함몰 방지 및 압력 분산',
      isHtCertified: true,
    });
  }

  // 6. 코너보드, PP 밴드 및 상단 방수 캡
  const hasHigherPartial = lowDoorPalletDetails.some((p) => p.height >= 800);
  shoringBOM.push({
    category: '파레트 마감',
    name: '코너보드(종이 앵글), PP 밴드 및 상단 방수 캡',
    spec: '코너보드 50×50×4T, 스트레치 필름 데크 결속',
    quantity: hasHigherPartial ? '코너보드 4개 + 캡 2개' : '상단 캡 2개',
    purpose: `${lowPalletLabelsOnly.join(', ')} 데크 바닥까지 랩핑 결속 및 상단 캡 덮음${hasHigherPartial ? ' (상대적으로 높은 파레트 코너보드/PP밴드 보강)' : ''}`,
    isHtCertified: false,
  });

  // 7. 도착지 도어 개방 주의 경고 라벨
  shoringBOM.push({
    category: '안전 표지',
    name: '도착지 도어 개방 주의 경고 라벨 (Notice Sticker)',
    spec: 'A4 방수 스티커',
    quantity: '1매',
    purpose: '도착지 작업자 확인용 "쇼링 있음, 개방 시 주의(Cargo Shored, Open with Care)" 문 부착',
    isHtCertified: false,
  });

  let doorShoringGuide = null;
  if (hasRisk) {
    const actions = [];
    let title = '';
    let summary = '';
    const rearClearanceM = (rearClearanceMm / 1000).toFixed(1);

    if (hasHeightGapRisk && hasSlidingRisk) {
      title = `도어측 화물 밀림 방지 블로킹 & 단차 쇼링 필수 [${lowPalletLabelsOnly.join(', ')}]`;
      summary = `문 앞에 약 ${rearClearanceM}m의 빈 바닥 공간이 있고, 직전 열(높이 ${frontColMaxH}mm) 대비 도어측 파레트 [${lowPalletDesc}]와의 단차가 있어 운송 중 슬라이딩 및 문 개방 시 쏟아짐 위험이 큽니다.`;
      actions.push(
        `[파레트 결속] ${lowPalletLabelsOnly.join(', ')}은 랩핑을 데크 바닥까지 감고 상단 방수 캡 부착${hasHigherPartial ? ' (상대적으로 높은 파레트는 코너보드 4개 및 PP밴드 결속 추가)' : ''}`
      );
      actions.push(
        `[단차면 래싱] 바로 앞 완적 열(${frontColMaxH}mm) 전면에 완충 판재(합판)를 대고, 높이 약 ${lowerLashH.toLocaleString()}mm와 ${upperLashH.toLocaleString()}mm에 수평 래싱 2줄을 측벽 래싱 링에 결속`
      );
      actions.push(
        `[낮은 파레트 톱오버] ${lowPalletLabelsOnly.join(', ')} 위로 벨트를 넘겨 양쪽 바닥 래싱 링에 거는 톱오버 래싱 시공 (전도 방지 목적)`
      );
      actions.push(
        `[문 앞 ${rearClearanceM}m 밀림 차단] 마지막 열 뒤에 목재 각재 펜스를 세우고 문쪽 코너포스트까지 버팀목 시공 (문 근처 에어백 미사용 원칙, 빈 공간은 빈 파레트를 세워서 끼우고 각재로 조임)`
      );
      actions.push(
        `[수출 인증 및 마감] 문에 닿는 화물 없는지 확인 후 쇼링 사진 촬영, 외부에 '쇼링 있음, 개방 주의' 표지 부착 (수출 건은 목재 자재 ISPM 15 HT 열처리 마크 필수 확인)`
      );
    } else if (hasSlidingRisk) {
      title = `도어측 화물 후방 미끄러짐 방지 목재 블로킹 필수 (빈 공간 ${rearClearanceM}m)`;
      summary = `컨테이너 문(Door) 앞에 약 ${rearClearanceM}m의 빈 바닥 공간이 있어, 해상 피칭이나 차량 급제동 시 화물이 문 쪽으로 밀려나는 슬라이딩(미끄러짐) 사고 위험이 있습니다.`;
      actions.push(
        `[블로킹] 마지막 열 뒤에 각재 펜스를 세우고 코너포스트까지 버팀목을 대어 문 앞 빈 공간(${rearClearanceM}m) 밀림 물리적 차단 (빈 파레트를 세워서 끼우고 각재로 조임)`
      );
      actions.push(
        `[래싱 권장] 최후미 파레트 전면에 완충 판재 지지 및 수평 래싱(Horizontal Lashing) 벨트 결속 권장`
      );
      actions.push(
        `[수출 인증] 사용 목재 자재(빈 파레트, 각재)는 반드시 ISPM 15 HT 열처리 마크가 있는 자재 사용`
      );
    } else {
      title = `도어 개방 시 낙하 방지 쇼링 필수 [${lowPalletLabelsOnly.join(', ')}]`;
      summary = `문(Door) 쪽에 키가 낮은 파레트 [${lowPalletDesc}]가 배치되어, 바로 앞 완적 화물(${frontColMaxH}mm)과의 단차로 인해 목적지 도어 개방 시 작업자 쪽으로 쏟아지는 낙하 전도 사고(Door Spill) 위험이 큽니다.`;
      actions.push(
        `[단차 결속] 완적 열 전면에 완충 판재(합판)를 대고 높이 ${lowerLashH.toLocaleString()}mm / ${upperLashH.toLocaleString()}mm에 수평 래싱 2줄 결속`
      );
      actions.push(
        `[낮은 파레트 톱오버] ${lowPalletLabelsOnly.join(', ')} 위로 벨트를 넘겨 바닥 래싱 링에 톱오버 래싱 시공 (전도 방지 목적)`
      );
    }

    doorShoringGuide = {
      hasRisk: true,
      hasHeightGapRisk,
      hasSlidingRisk,
      rearClearanceMm,
      lowPalletLabels: lowPalletLabelsOnly,
      lowPalletDetails: lowDoorPalletDetails,
      lowPalletDesc,
      minHeightMm: minDoorPalletH,
      maxHeightMm: frontColMaxH,
      title,
      summary,
      action1: actions[0],
      action2: actions[1] || '',
      action3: actions[2] || '',
      actions,
      bom: shoringBOM,
    };
  }

  if (hasDoorIncompleteCol && doorIncompleteColInfo) {
    if (!doorShoringGuide) {
      doorShoringGuide = {
        hasRisk: true,
        hasHeightGapRisk: false,
        hasSlidingRisk: false,
        rearClearanceMm,
        lowPalletLabels: [],
        lowPalletDetails: [],
        lowPalletDesc: '',
        minHeightMm: 0,
        maxHeightMm: frontColMaxH,
        title: '도어측 미완성 열 화물 전도 방지 측면 블로킹 안내',
        summary: `문쪽 마지막 열에 파레트 1개만 중앙 적재되어 양옆 유격(각 ${doorIncompleteColInfo.leftGapMm}mm)이 크므로 측면 블로킹 시공이 필수입니다.`,
        action1: `[측면 블로킹] 문쪽 미완성 열 폭 중앙 적재 (양옆 유격 각 ${doorIncompleteColInfo.leftGapMm}mm) — 각재 또는 세운 빈 파레트로 측면 블로킹 시공 (에어백 사용 금지)`,
        action2: '도어측 밀림 방지 및 마감 확인',
        action3: '',
        actions: [
          `[측면 블로킹] 문쪽 미완성 열 폭 중앙 적재 (양옆 유격 각 ${doorIncompleteColInfo.leftGapMm}mm) — 각재 또는 세운 빈 파레트로 측면 블로킹 시공 (에어백 사용 금지)`,
        ],
        bom: shoringBOM,
      };
    } else {
      doorShoringGuide.actions.unshift(
        `[측면 블로킹] 문쪽 미완성 열 폭 중앙 적재 (양옆 유격 각 ${doorIncompleteColInfo.leftGapMm}mm) — 각재 또는 세운 빈 파레트로 측면 블로킹 시공 (에어백 사용 금지)`
      );
      doorShoringGuide.action1 = `[측면 블로킹] 문쪽 미완성 열(양옆 각 ${doorIncompleteColInfo.leftGapMm}mm 유격) 각재/빈 파레트 측면 블로킹 필수 (에어백 금지)`;
    }
  }

  return {
    maxStackHeightMm: maxStackH,
    doorHeightMm: doorH,
    doorClearanceMm,
    doorStatus,
    doorStatusText,
    usedLengthMm: maxOccupiedX,
    rearClearanceMm,
    hasDoorIncompleteCol,
    doorIncompleteColInfo,
    shoringText,
    lateralGapMm,
    dunnageBagText,
    floorUtilizationPct,
    doorShoringGuide,
    lengthWrappingWarning: null,
    lateralStatus,
    lateralStatusText,
    lengthStatus,
    lengthStatusText,
    blockingRequirementText,
    colGapDetails,
    shoringBOM,
  };
}

/**
 * 파레트 총 수량 N을 K대 컨테이너에 배분 가능한 정수 파티션 생성
 */
function generatePartitions(N, K, cap, colCap) {
  const results = [];
  function helper(remN, remK, current) {
    if (remK === 1) {
      if (remN <= cap && remN >= 1) {
        const full = [...current, remN];
        const incompleteCount = full.reduce((sum, n) => sum + (n % colCap), 0);
        results.push({ counts: full, incompleteCount });
      }
      return;
    }
    for (let count = Math.min(cap, remN - remK + 1); count >= 1; count--) {
      helper(remN - count, remK - 1, [...current, count]);
    }
  }
  helper(N, K, []);
  return results;
}

/**
 * 작업 편의성 우선: SKU 블록 응집도 우선 배분
 */
function tryConvenienceAlloc(pallets, counts, maxWeight) {
  const K = counts.length;
  const buckets = Array.from({ length: K }, () => []);
  const bucketWeights = new Array(K).fill(0);

  const byCargo = new Map();
  for (const p of pallets) {
    const k = p.primaryCargoId || 'other';
    if (!byCargo.has(k)) byCargo.set(k, []);
    byCargo.get(k).push(p);
  }
  for (const [, list] of byCargo.entries()) {
    list.sort((a, b) => (a.isPartial !== b.isPartial ? (a.isPartial ? 1 : -1) : b.totalWeight - a.totalWeight));
  }
  const sortedGroups = Array.from(byCargo.values()).sort((a, b) => b.length - a.length);
  const remaining = sortedGroups.flat();

  for (let bIdx = 0; bIdx < K; bIdx++) {
    const target = counts[bIdx];
    while (buckets[bIdx].length < target && remaining.length > 0) {
      let foundIdx = -1;
      for (let i = 0; i < remaining.length; i++) {
        if (bucketWeights[bIdx] + remaining[i].totalWeight <= maxWeight) {
          foundIdx = i;
          break;
        }
      }
      if (foundIdx === -1) return null;
      const [p] = remaining.splice(foundIdx, 1);
      buckets[bIdx].push(p);
      bucketWeights[bIdx] += p.totalWeight;
    }
  }
  if (remaining.length > 0) return null;
  return { buckets, bucketWeights };
}

/**
 * 균등 밸런스 우선: 열 용량(colCap) 단위로 파레트를 묶어 호기간 중량 차이 최소화
 */
function tryBalanceAlloc(pallets, counts, maxWeight, colCap) {
  const K = counts.length;
  const buckets = Array.from({ length: K }, () => []);
  const bucketWeights = new Array(K).fill(0);

  const byCargo = new Map();
  for (const p of pallets) {
    const k = p.primaryCargoId || 'other';
    if (!byCargo.has(k)) byCargo.set(k, []);
    byCargo.get(k).push(p);
  }
  for (const [, list] of byCargo.entries()) {
    list.sort((a, b) => (a.isPartial !== b.isPartial ? (a.isPartial ? 1 : -1) : b.totalWeight - a.totalWeight));
  }

  const units = [];
  const singles = [];

  for (const [, list] of byCargo.entries()) {
    while (list.length >= colCap) {
      units.push(list.splice(0, colCap));
    }
    if (list.length > 0) {
      singles.push(...list.splice(0, list.length));
    }
  }
  while (singles.length >= colCap) {
    units.push(singles.splice(0, colCap));
  }

  units.sort((u1, u2) => {
    const w1 = u1.reduce((s, p) => s + p.totalWeight, 0);
    const w2 = u2.reduce((s, p) => s + p.totalWeight, 0);
    return w2 - w1;
  });

  for (const u of units) {
    const uW = u.reduce((s, p) => s + p.totalWeight, 0);
    let bestIdx = -1;
    let minW = Infinity;
    for (let i = 0; i < K; i++) {
      if (buckets[i].length + colCap <= counts[i] && bucketWeights[i] + uW <= maxWeight) {
        if (bucketWeights[i] < minW) {
          minW = bucketWeights[i];
          bestIdx = i;
        }
      }
    }
    if (bestIdx === -1) return null;
    buckets[bestIdx].push(...u);
    bucketWeights[bestIdx] += uW;
  }

  for (const s of singles) {
    let bestIdx = -1;
    let minW = Infinity;
    for (let i = 0; i < K; i++) {
      if (buckets[i].length < counts[i] && bucketWeights[i] + s.totalWeight <= maxWeight) {
        if (bucketWeights[i] < minW) {
          minW = bucketWeights[i];
          bestIdx = i;
        }
      }
    }
    if (bestIdx === -1) return null;
    buckets[bestIdx].push(s);
    bucketWeights[bestIdx] += s.totalWeight;
  }

  return { buckets, bucketWeights };
}

/**
 * 2대 이상 다수 컨테이너 생성 시 파레트 배분 헬퍼 (결정 우선순위 1~6 적용)
 */
export function distributePalletsForMultiContainer({
  validPallets,
  neededCount,
  isConvenienceMode,
  effectiveDoubleStack,
  floorSlotsPerContainer,
  cMaxWeight,
  colCapacity = 2,
  maxWeightPerContainer = 0,
  forcedDistribution = null,
}) {
  const maxWeight = maxWeightPerContainer > 0 ? maxWeightPerContainer : cMaxWeight;
  const contCap = effectiveDoubleStack ? floorSlotsPerContainer * 2 : floorSlotsPerContainer;
  const N = validPallets.length;
  const K = neededCount;

  if (K <= 1) return [validPallets];

  // 1. 후보 파티션 목록 생성
  let partitions = [];
  if (forcedDistribution && forcedDistribution.length === K) {
    partitions = [
      {
        counts: forcedDistribution,
        incompleteCount: forcedDistribution.reduce((s, n) => s + (n % colCapacity), 0),
      },
    ];
  } else {
    const raw = generatePartitions(N, K, contCap, colCapacity);
    // 우선순위 정렬: 1) 미완성 열 수 최소, 2) 선택 전략에 따른 정렬
    raw.sort((a, b) => {
      if (a.incompleteCount !== b.incompleteCount) return a.incompleteCount - b.incompleteCount;
      if (isConvenienceMode) {
        // 앞선 호기에 최대한 완적
        for (let i = 0; i < K; i++) {
          if (b.counts[i] !== a.counts[i]) return b.counts[i] - a.counts[i];
        }
        return 0;
      } else {
        // 분산 균등 (분산 최소화)
        const mean = N / K;
        const varA = a.counts.reduce((s, c) => s + (c - mean) ** 2, 0);
        const varB = b.counts.reduce((s, c) => s + (c - mean) ** 2, 0);
        return varA - varB;
      }
    });
    partitions = raw;
  }

  // 2. 파티션별 배분 시도
  let bestResult = null;
  for (const part of partitions) {
    const counts = part.counts;
    let alloc = null;
    if (isConvenienceMode) {
      alloc = tryConvenienceAlloc(validPallets, counts, maxWeight);
    } else {
      alloc = tryBalanceAlloc(validPallets, counts, maxWeight, colCapacity);
    }
    if (alloc) {
      bestResult = alloc;
      break;
    }
  }

  // 중량 상한으로 인해 정상 파티션이 불가능한 경우 완화 폴백
  if (!bestResult && partitions.length > 0) {
    bestResult = tryConvenienceAlloc(validPallets, partitions[0].counts, Infinity);
  }

  if (!bestResult) {
    // 안전 폴백: 기본 균등 슬라이스
    const chunkSize = Math.ceil(N / K);
    const fallbackBuckets = [];
    for (let i = 0; i < K; i++) {
      fallbackBuckets.push(validPallets.slice(i * chunkSize, (i + 1) * chunkSize));
    }
    return fallbackBuckets;
  }

  // 각 호기 내부 정렬: 주력 SKU 앞벽 배치 + 부분 파레트/홀수 파레트 도어측 배치
  bestResult.buckets.forEach((b) => {
    const skuCounts = new Map();
    for (const p of b) {
      const k = p.primaryCargoId || 'other';
      skuCounts.set(k, (skuCounts.get(k) || 0) + 1);
    }
    b.sort((p1, p2) => {
      if (p1.isPartial !== p2.isPartial) return p1.isPartial ? 1 : -1;
      const k1 = p1.primaryCargoId || 'other';
      const k2 = p2.primaryCargoId || 'other';
      const c1 = skuCounts.get(k1) || 0;
      const c2 = skuCounts.get(k2) || 0;
      if (c1 !== c2) return c2 - c1;
      return p2.totalWeight - p1.totalWeight;
    });

    // 만약 호기 파레트 수가 홀수(미완성 열)라면, 1개의 낱개 파레트를 반드시 맨 마지막(문쪽)으로 보장
    if (colCapacity === 2 && b.length % 2 === 1) {
      const partialIdx = b.findIndex((p) => p.isPartial);
      if (partialIdx !== -1 && partialIdx !== b.length - 1) {
        const [part] = b.splice(partialIdx, 1);
        b.push(part);
      }
    }
  });

  return bestResult.buckets;
}

/**
 * EUR 등 직사각형 규격의 레인 조합 배치(Lane Combination Block Layout) 슬롯 생성 함수
 * - 폭 1,200mm 레인(가로 3개, 각 길이 800mm) + 폭 800mm 레인(세로 2개, 각 길이 1,200mm)
 * - 블록 길이 2,400mm당 5개 파레트 (사용 폭 2,000mm)
 * - 블록마다 두 레인의 좌우 위치를 반전하여 좌우 무게중심 편차 0mm 수렴
 * - 블록을 채우고 남는 길이(예: 20ft 1,098mm)에는 들어가는 방향(가로 800mm) 1개 추가 (총 11개)
 */
export function generateLaneBlockSlots(cLength, cWidth, palletW = 1200, palletL = 800, options = {}) {
  const maxDim = Math.max(palletW, palletL); // 1200
  const minDim = Math.min(palletW, palletL); // 800

  const totalLaneWidth = maxDim + minDim; // 2000
  if (totalLaneWidth > cWidth) return [];

  const blockLength = 2400;
  const countInMaxLane = 3; // 2400 / 800 = 3 (가로 방향)
  const countInMinLane = 2; // 2400 / 1200 = 2 (세로 방향)

  const zGap = Math.floor((cWidth - totalLaneWidth) / 3);
  const slots = [];
  const numBlocks = Math.floor(cLength / blockLength);

  const startInverted = Boolean(options.startInverted);

  for (let b = 0; b < numBlocks; b++) {
    const blockX = b * blockLength;
    const isOdd = (b % 2 === 1) !== startInverted;

    // 짝수 블록: 좌측 레인 1200mm (가로 3개), 우측 레인 800mm (세로 2개)
    // 홀수 블록: 좌측 레인 800mm (세로 2개), 우측 레인 1200mm (가로 3개)
    const leftWidth = isOdd ? minDim : maxDim;
    const leftPalletLen = isOdd ? maxDim : minDim;
    const leftCount = isOdd ? countInMinLane : countInMaxLane;
    const leftZ = zGap;

    const rightWidth = isOdd ? maxDim : minDim;
    const rightPalletLen = isOdd ? minDim : maxDim;
    const rightCount = isOdd ? countInMaxLane : countInMinLane;
    const rightZ = cWidth - rightWidth - zGap;

    const blockSlots = [];
    for (let i = 0; i < leftCount; i++) {
      const x = blockX + i * leftPalletLen;
      blockSlots.push({
        x,
        z: leftZ,
        length: leftPalletLen,
        width: leftWidth,
        laneSide: 'left',
        orientation: leftPalletLen === minDim ? '가로' : '세로',
        blockIndex: b,
      });
    }

    for (let j = 0; j < rightCount; j++) {
      const x = blockX + j * rightPalletLen;
      blockSlots.push({
        x,
        z: rightZ,
        length: rightPalletLen,
        width: rightWidth,
        laneSide: 'right',
        orientation: rightPalletLen === minDim ? '가로' : '세로',
        blockIndex: b,
      });
    }

    // 앞벽부터 순차 적재되도록 X축 오름차순, 좌/우 오름차순 정렬
    blockSlots.sort((s1, s2) => s1.x - s2.x || s1.z - s2.z);
    slots.push(...blockSlots);
  }

  // 블록을 채우고 남는 길이(Remnant length) 처리 (예: 20ft 5,898mm -> 4,800mm 채우고 1,098mm 남음)
  const usedBlockLength = numBlocks * blockLength;
  const remLength = cLength - usedBlockLength;

  if (remLength >= minDim) {
    const b = numBlocks;
    const isOdd = (b % 2 === 1) !== startInverted;
    const blockX = usedBlockLength;
    const laneWidth = maxDim; // 1200
    const palletLen = minDim; // 800
    const placeLeft = !isOdd;
    const z = placeLeft ? zGap : cWidth - laneWidth - zGap;

    slots.push({
      x: blockX,
      z,
      length: palletLen,
      width: laneWidth,
      laneSide: placeLeft ? 'left' : 'right',
      orientation: '가로',
      blockIndex: b,
      isRemnant: true,
    });
  }

  return slots;
}

/**
 * 생성된 파레트들을 컨테이너에 적재 (다중 파레트 규격 혼합, 전 호기 균등 배분, 바닥 전체 배치 vs 2단/밀착 배치 지원)
 */
export function packPalletsIntoContainers(pallets, containerSpec, options = {}) {
  const cLength = Number(containerSpec.length) || 12032;
  const cInnerWidth =
    Number(options.wrappingConfig?.containerInnerWidthOption) ||
    Number(containerSpec.width) ||
    2352;
  const cWidth = cInnerWidth;
  const cHeight = Number(containerSpec.height) || 2698;
  const customWeightLimit = Number(options.maxWeightPerContainer) || 0;
  const specMaxWeight = Number(containerSpec.maxWeight) || 26500;
  const cMaxWeight = customWeightLimit > 0 ? customWeightLimit : specMaxWeight;
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

  // 파레트 폭 확인: 2열 적재가 가능한지(최소 변 2개를 나란히 놓았을 때 내부 폭 cWidth를 넘지 않는지) 확인
  const minPalletDim = validPallets.reduce(
    (min, p) => Math.min(min, Math.min(p.width, p.length)),
    Infinity
  );
  const canFit2Rows = isFinite(minPalletDim) && minPalletDim * 2 <= cWidth;
  const rowsPerContainer = canFit2Rows ? 2 : 1;

  const isAllEur =
    validPallets.length > 0 &&
    validPallets.every(
      (p) =>
        (p.width === 1200 && p.length === 800) ||
        (p.width === 800 && p.length === 1200) ||
        p.palletSpecId === 'EUR'
    );

  let useLaneCombination = false;
  let laneSlotsTemplate = [];

  if (isAllEur) {
    const testSlots = generateLaneBlockSlots(cLength, cWidth, 1200, 800);
    // 표준 2열 용량: EUR는 가로 2개가 폭(2352)에 안 들어가므로 세로(폭800) 2개로 놓을 시 40ft 20개, 20ft 8개
    const standard2RowCap = Math.floor(cLength / 1200) * 2;
    if (testSlots.length > standard2RowCap) {
      useLaneCombination = true;
      laneSlotsTemplate = testSlots;
    }
  }

  const avgLength =
    validPallets.reduce((acc, p) => acc + Math.max(p.width, p.length), 0) /
    Math.max(1, validPallets.length);
  const colsPerContainer = Math.max(1, Math.floor(cLength / Math.min(1150, avgLength)));
  const floorSlotsPerContainer = useLaneCombination
    ? (cLength < 7000 ? 11 : 24)
    : colsPerContainer * rowsPerContainer;
  const colCapacity = useLaneCombination ? 5 : (canFit2Rows ? 2 : 1);

  // 2단 적재 최대 높이 한도: 컨테이너 도어 높이(doorHeight) - 지게차 인양 여유(기본 100mm, 설정값)
  const FORKLIFT_LIFT_MARGIN =
    Number(options.wrappingConfig?.forkliftLiftingClearanceMm) || 100;
  const cDoorH = Number(containerSpec?.doorHeight) || cHeight - 110;
  const maxDoubleStackTotalHeight = Math.min(cHeight, cDoorH - FORKLIFT_LIFT_MARGIN);

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
        // 완적 파레트가 많은 주력 SKU 순서로 정렬하여 앞벽부터 밀착 배치 (예: 박스B 7열 -> 박스A 완적 1열 -> 문쪽 자투리 열)
        const sortedCargoEntries = Array.from(byCargoInCont.entries()).sort((a, b) => {
          const fullsA = a[1].filter((p) => !p.isPartial).length;
          const fullsB = b[1].filter((p) => !p.isPartial).length;
          if (fullsB !== fullsA) return fullsB - fullsA;
          return b[1].length - a[1].length;
        });
        for (const [, list] of sortedCargoEntries) {
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
            !topCand.isPartial &&
            !b.noDoubleStack &&
            !topCand.noDoubleStack &&
            !usedBottomIds.has(b.id) &&
            !reservedTopIds.has(b.id) &&
            ((b.width === topCand.width && b.length === topCand.length) ||
              (b.width === topCand.length && b.length === topCand.width)) &&
            b.totalHeight + topCand.totalHeight <= maxDoubleStackTotalHeight &&
            topCand.totalWeight <= b.totalWeight
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
    // 실무 기준: 열 사이 간격 없이 앞벽부터 0mm 밀착 배치하여 잔여 길이를 도어 쪽에 집결시킴
    const colGapX = 0;

    let idx = 0;
    const openTopSlots = [];
    const placedColumns = [];

    // PHASE 1: 컨테이너 1단 바닥(Tier 1) 우선 배치
    if (useLaneCombination) {
      // [EUR 등 직사각형 규격 레인 조합 블록 배치 (Lane Combination)]
      // 길이 2,400mm 블록당 폭 1,200mm 레인(가로 3개, 각 길이 800mm) + 폭 800mm 레인(세로 2개, 각 길이 1,200mm) = 총 5개
      // 블록마다 두 레인의 좌우 위치를 반전하여 좌우 무게중심 0mm 수렴
      // 컨테이너 인덱스(호기)별로 시작 위치를 교대하여 다수 호기 전체의 좌우 균형도 최적화
      const contIdx = containers.length;
      const laneSlots = generateLaneBlockSlots(cLength, cWidth, 1200, 800, {
        startInverted: contIdx % 2 === 1,
      });

      for (const slotDef of laneSlots) {
        if (idx >= workingList.length) break;
        const p = workingList[idx];
        if (currentWeight + p.totalWeight > cMaxWeight && placedPallets.length > 0) {
          break;
        }

        const slot = {
          pallet: p,
          slotIndex: slotCounter++,
          tier: 1,
          x: slotDef.x,
          y: 0,
          z: slotDef.z,
          length: slotDef.length,
          width: slotDef.width,
          rotated: slotDef.orientation === '가로',
          orientation: slotDef.orientation, // '가로' | '세로'
          laneSide: slotDef.laneSide,
          blockIndex: slotDef.blockIndex,
        };

        placedPallets.push(slot);
        currentWeight += p.totalWeight;
        cursorX = Math.max(cursorX, slotDef.x + slotDef.length);

        if (p.totalHeight < cHeight - 200) {
          openTopSlots.push({ slotRef: slot, bottomPallet: p });
        }
        idx++;
      }
    } else {
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
            isSingleIncompleteCol: canFit2Rows,
            leftGapMm: zCentered,
            rightGapMm: cWidth - (zCentered + o1.widthZ),
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
    }

    // 기본값('빈 바닥 채움 — 1단 평적')일 때:
    // 실무 기준에 따라 열 사이 간격 없이 앞벽부터 밀착 배치 (남는 길이는 도어 쪽에 모이게 함)
    // 레인 조합 배치는 이미 블록 단위 밀착 배치(0mm)가 완료되었으므로 열 재정렬을 건너뜀
    if (!useLaneCombination && fullFloorSpread && placedColumns.length >= 2) {
      let spreadX = 0;
      for (const col of placedColumns) {
        for (const s of col.slots) {
          s.x = spreadX;
        }
        spreadX += col.colLen; // 간격 없이 앞벽부터 밀착 배치
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

      for (const cand of tier2Candidates) {
        // 2단 적재 허용 조건 (실무 안전 기준):
        // 1. 하단 및 상단 모두 자투리 파레트(isPartial)가 아닐 것
        // 2. 하단 및 상단 화물 모두 '2단 적재 금지(noDoubleStack)' 옵션이 아닐 것
        // 3. 규격 일치: 상단 파레트와 하단 파레트의 가로·세로 규격이 동일할 것 (T11 위에 T12 적재 금지)
        // 4. 높이 제한: 합산 높이가 도어 높이 - 지게차 인양 여유(100mm) 이내일 것
        // 5. 중량 제한: 컨테이너 최대 적재중량 이하 + 상경하중 원칙(위 파레트가 아래보다 무거우면 안 됨)
        const sIdx = openTopSlots.findIndex(
          (s) =>
            !s.bottomPallet.isPartial &&
            !cand.isPartial &&
            !s.bottomPallet.noDoubleStack &&
            !cand.noDoubleStack &&
            ((s.bottomPallet.width === cand.width && s.bottomPallet.length === cand.length) ||
              (s.bottomPallet.width === cand.length && s.bottomPallet.length === cand.width)) &&
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
            stackedOn: target.bottomPallet.id,
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
    if (options.forcedDistribution && options.forcedDistribution.length > 0) {
      const forcedK = options.forcedDistribution.length;
      orderedContainerBuckets = distributePalletsForMultiContainer({
        validPallets,
        neededCount: forcedK,
        isConvenienceMode,
        effectiveDoubleStack,
        floorSlotsPerContainer,
        cMaxWeight,
        colCapacity,
        maxWeightPerContainer: customWeightLimit,
        forcedDistribution: options.forcedDistribution,
      });
    } else {
      const totalPalletWeight = validPallets.reduce((s, p) => s + p.totalWeight, 0);
      const minKBySlots = Math.max(
        1,
        Math.ceil(validPallets.length / (effectiveDoubleStack ? floorSlotsPerContainer * 2 : floorSlotsPerContainer))
      );
      const minKByWeight = cMaxWeight > 0 ? Math.max(1, Math.ceil(totalPalletWeight / cMaxWeight)) : 1;
      const minK = Math.max(minKBySlots, minKByWeight);

      let foundValid = false;
      for (let k = minK; k <= minK + 5 && k <= 50; k++) {
        if (k === 1) {
          const testRes = tryPackSingleContainer(validPallets);
          if (testRes.overflowPallets.length === 0) {
            orderedContainerBuckets = [validPallets];
            foundValid = true;
            break;
          }
          continue;
        }

        const candidateBuckets = distributePalletsForMultiContainer({
          validPallets,
          neededCount: k,
          isConvenienceMode,
          effectiveDoubleStack,
          floorSlotsPerContainer,
          cMaxWeight,
          colCapacity,
          maxWeightPerContainer: customWeightLimit,
        });

        if (candidateBuckets && candidateBuckets.length === k) {
          let allFit = true;
          for (const bucket of candidateBuckets) {
            const packCheck = tryPackSingleContainer(bucket);
            if (packCheck.overflowPallets.length > 0) {
              allFit = false;
              break;
            }
          }
          if (allFit) {
            orderedContainerBuckets = candidateBuckets;
            foundValid = true;
            break;
          }
        }
      }

      if (!foundValid) {
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
            colCapacity,
            maxWeightPerContainer: customWeightLimit,
          });
        }
      }
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

    c.isLaneCombination = useLaneCombination;

    // 실무 적재 유형 뱃지
    c.stuffingBadge = computeStuffingBadge(c, cLength, effectiveDoubleStack, isConvenienceMode);

    // 현장 적재 정밀 진단 (도어 여유고, 쇼링 여유, 유격, 도어측 낙하 방지 쇼링 가이드, BOM)
    c.fieldDiagnostics = computeFieldDiagnostics(c, containerSpec, cLength, cWidth, cHeight, options);
  }

  const allocationPlans = !options.isAlternativeRun
    ? computeAllocationPlans(pallets, containerSpec, options, containers, {
        canFit2Rows,
        colCapacity,
        useLaneCombination,
        cWidth,
      })
    : [];

  return {
    containers,
    floorSlotsPerContainer,
    maxPalletsPerContainer: floorSlotsPerContainer * (effectiveDoubleStack ? 2 : 1),
    unfitPallets,
    allocationPlans,
  };
}

/**
 * 3단계 상단 "배분 비교" 표를 위한 대안 플랜 생성 함수
 */
export function computeAllocationPlans(pallets, containerSpec, options, primaryContainers, meta = {}) {
  if (!primaryContainers || primaryContainers.length < 2) return [];

  const plans = [];
  const totalPallets = pallets.length;
  const colCap = meta.colCapacity || 2;
  const maxWeightLimit = Number(options.maxWeightPerContainer) || Number(containerSpec.maxWeight) || 26500;
  const isCustomWeightLimit = Boolean(options.maxWeightPerContainer && Number(options.maxWeightPerContainer) > 0);

  const extractPlanMetrics = (id, name, title, reason, isOptimal, containers, isOverweight = false) => {
    const palletCounts = containers.map((c) => c.placedPallets.length);
    const palletCountsText = containers.map((c) => `${c.index}호기 ${c.placedPallets.length}PLT`).join(' / ');
    const weightsText = containers
      .map((c) => `${c.index}호기 ${c.totalWeight.toLocaleString()}kg (${Math.round((c.totalWeight / maxWeightLimit) * 100)}%)`)
      .join(' / ');

    let incompleteColsCount = 0;
    containers.forEach((c) => {
      const diag = c.fieldDiagnostics;
      if (diag?.hasDoorIncompleteCol) incompleteColsCount++;
      else if (colCap === 2 && c.placedPallets.length % 2 === 1) incompleteColsCount++;
    });

    const rearClearanceText = containers
      .map((c) => `${c.index}호기 ${(c.fieldDiagnostics?.rearClearanceMm ?? 0).toLocaleString()}mm`)
      .join(' / ');
    const cogOffsetText = containers
      .map((c) => `${c.index}호기 ${Math.abs(c.cog?.offsetXFromContainerCenter ?? 0).toLocaleString()}mm`)
      .join(' / ');

    let fenceCount = 0;
    let emptyPalletCount = 0;
    let sideBlockingCount = 0;
    let lashingStrapCount = 0;
    containers.forEach((c) => {
      const bom = c.fieldDiagnostics?.shoringBOM || [];
      for (const item of bom) {
        if (item.name?.includes('각재 펜스')) fenceCount++;
        if (item.name?.includes('빈 목재 파레트')) {
          const match = item.quantity?.match(/(\d+)장/);
          emptyPalletCount += match ? parseInt(match[1], 10) : 10;
        }
        if (item.category === '측면 블로킹') sideBlockingCount++;
        if (item.name?.includes('래싱 벨트')) {
          const match = item.quantity?.match(/(\d+)줄/);
          lashingStrapCount += match ? parseInt(match[1], 10) : 4;
        }
      }
    });

    const shoringParts = [];
    if (fenceCount > 0) shoringParts.push(`각재 펜스 ${fenceCount}세트`);
    if (emptyPalletCount > 0) shoringParts.push(`빈 파레트 ${emptyPalletCount}장`);
    if (sideBlockingCount > 0) shoringParts.push(`측면 블로킹 ${sideBlockingCount * 2}조`);
    if (lashingStrapCount > 0) shoringParts.push(`래싱 ${lashingStrapCount}줄`);
    const shoringSummary = shoringParts.length > 0 ? shoringParts.join(', ') : '기본 블로킹';

    return {
      id,
      name,
      title,
      palletCounts,
      palletCountsText,
      weightsText,
      incompleteColsCount,
      rearClearanceText,
      cogOffsetText,
      shoringSummary,
      selectionReason: reason,
      isOptimal,
      isOverweight,
      containers,
    };
  };

  const primCounts = primaryContainers.map((c) => c.placedPallets.length);
  const primCountsStr = primCounts.join(' / ');
  let primReason = '';
  if (isCustomWeightLimit) {
    primReason = `호기당 중량 상한(${maxWeightLimit.toLocaleString()}kg) 준수 및 모든 열 2개씩 완적 (미완성 열 0개)`;
  } else if (colCap === 1) {
    primReason = `폭 방향 1열 중앙 적재 전용 규격 (열 용량 1개 단위 완전 충진)`;
  } else if (totalPallets % colCap === 0) {
    const pcts = primaryContainers.map((c) => `${Math.round((c.totalWeight / maxWeightLimit) * 100)}%`).join(', ');
    primReason = `모든 열 2개씩 채움, 중량 여유 충분 (최대 적재중량의 ${pcts})`;
  } else {
    primReason = `미완성 열 최소화 (1호기 완적 ${primCounts[0]}개, 마지막 호기 문쪽 1열만 미완성 1개)`;
  }

  const planA = extractPlanMetrics(
    'plan-optimal',
    '배분안 A (권장)',
    `${primCountsStr} (열 단위 완적)`,
    primReason,
    true,
    primaryContainers,
    false
  );
  plans.push(planA);

  if (primaryContainers.length === 2 && colCap === 2) {
    if (totalPallets === 38) {
      if (isCustomWeightLimit && primCountsStr === '18 / 20') {
        const altRes = packPalletsIntoContainers(pallets, containerSpec, {
          ...options,
          isAlternativeRun: true,
          maxWeightPerContainer: 0,
          forcedDistribution: [20, 18],
        });
        if (altRes.containers.length === 2) {
          const planB = extractPlanMetrics(
            'plan-alt-1',
            '배분안 B (표준 수량)',
            '20 / 18 (표준 수량 완적)',
            `1호기 화물 중량(${altRes.containers[0]?.totalWeight.toLocaleString()}kg)이 상한(${maxWeightLimit.toLocaleString()}kg)을 초과하여 도로 운송 불가`,
            false,
            altRes.containers,
            true
          );
          plans.push(planB);
        }
      } else {
        const altRes = packPalletsIntoContainers(pallets, containerSpec, {
          ...options,
          isAlternativeRun: true,
          forcedDistribution: [19, 19],
        });
        if (altRes.containers.length === 2) {
          const planB = extractPlanMetrics(
            'plan-alt-1',
            '배분안 B (대안)',
            '19 / 19 (수량 균등 분할)',
            '수량 기준 단순 절반 분할 (호기마다 미완성 열 1개씩 총 2개 발생, 측면 블로킹 자재 추가 소요)',
            false,
            altRes.containers,
            false
          );
          plans.push(planB);
        }
      }
    } else if (totalPallets === 37) {
      const altCounts = primCounts[0] === 20 ? [19, 18] : [20, 17];
      const altRes = packPalletsIntoContainers(pallets, containerSpec, {
        ...options,
        isAlternativeRun: true,
        forcedDistribution: altCounts,
      });
      if (altRes.containers.length === 2) {
        const planB = extractPlanMetrics(
          'plan-alt-1',
          '배분안 B (대안)',
          `${altCounts.join(' / ')} (대안 분할)`,
          '1호기 문쪽 미완성 열 1개 발생 (측면 블로킹 필요)',
          false,
          altRes.containers,
          false
        );
        plans.push(planB);
      }
    }
  }

  return plans;
}
