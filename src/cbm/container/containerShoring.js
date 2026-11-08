// Step 3: 컨테이너 현장 적재 정밀 진단, 측면 유격 분석 및 쇼링(Shoring) BOM 산출

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
  const innerWidthOption = Number(wrappingConfig.containerInnerWidthOption) || cWidth;
  const maxLateralGapAllowed = Number(wrappingConfig.maxLateralGapAllowedMm) || 150;
  const airbagEffLen = Number(wrappingConfig.airbagEffectiveLengthMm) || 1800;
  const wrappingBulgeMm = Math.max(0, Number(wrappingConfig.wrappingBulgeMm ?? 20));
  const stackingMisalignmentMm = Math.max(0, Number(wrappingConfig.stackingMisalignmentMm ?? 10));
  const forkliftLateralClearanceMm = Math.max(
    0,
    Number(wrappingConfig.forkliftLateralClearanceMm ?? wrappingConfig.forkliftClearanceMm ?? 20)
  );

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

      const isDoorCol = cIdx === uniqueXs.length - 1;
      if (gap > maxLateralGapAllowed && !isDoorCol) {
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
        isDoorCol,
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

      // 문쪽 열(isDoorCol)은 문 개방 시 쏟아짐 위험으로 에어백 사용 금지! 단일열(isSingle)은 측면 블로킹 적용
      if (!isDoorIncomplete && !isDoorCol && !isSingle && gap > maxLateralGapAllowed) {
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
        isDoorCol,
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

  // 래핑 배부름 및 적재 어긋남 공차를 차감한 열별 실효 여유폭(Effective Clearance) 산출
  let minEffectiveClearanceMm = Infinity;
  let maxRowBulgeAllowanceMm = 0;
  for (const cg of colGapDetails) {
    const unmeasuredCount = (cg.pallets || []).filter((p) => !p.pallet?.hasMeasured).length;
    const rowBulge = unmeasuredCount * (wrappingBulgeMm + stackingMisalignmentMm);
    const effClearance = cg.gap - rowBulge;
    cg.rowBulgeAllowanceMm = rowBulge;
    cg.effectiveClearanceMm = effClearance;
    if (effClearance < minEffectiveClearanceMm) minEffectiveClearanceMm = effClearance;
    if (rowBulge > maxRowBulgeAllowanceMm) maxRowBulgeAllowanceMm = rowBulge;
  }
  if (minEffectiveClearanceMm === Infinity) minEffectiveClearanceMm = 0;

  // 측면 유격 텍스트: 열별 실측 유격 및 래핑 공차 차감 실효 여유 표기
  const effClearanceNote =
    maxRowBulgeAllowanceMm > 0
      ? `, 래핑·어긋남 공차(-${maxRowBulgeAllowanceMm}mm) 감안 실효 여유 ${minEffectiveClearanceMm}mm`
      : '';
  let dunnageBagText = `열별 측면 유격 ${minColGapMm === maxColGapMm ? `${maxColGapMm}mm` : `${minColGapMm}~${maxColGapMm}mm`}${effClearanceNote} (CTU Code 권고: 수평 빈 공간 15cm 이내)`;
  if (hasDoorIncompleteCol && doorIncompleteColInfo) {
    dunnageBagText = `문쪽 미완성 열 폭 중앙 적재 (양옆 유격 약 ${doorIncompleteColInfo.leftGapMm}mm씩) — 측면 블로킹 필요 (에어백 미사용)`;
  } else if (hasSingleRowCol) {
    dunnageBagText = `폭 방향 1열 중앙 적재 (양옆 유격 약 ${Math.round(maxColGapMm / 2)}mm씩) — 양옆 블로킹 필요`;
  } else if (maxColGapMm > maxLateralGapAllowed) {
    dunnageBagText = `최대 측면 유격 ${maxColGapMm}mm${effClearanceNote} (CTU Code 권고 15cm 초과) — 열간 에어백 충진 권장`;
  }

  // 측면 여유 상태 판정 (래핑 공차 차감 실효 여유 + 지게차 진입 여유 + CTU Code 150mm 기준)
  let lateralStatus = 'SAFE';
  let lateralStatusText = `가능 (내폭 ${innerWidthOption}mm 기준 · 공차 차감 후 실효 여유 최소 ${minEffectiveClearanceMm}mm 확보)`;
  if (minEffectiveClearanceMm < 0) {
    lateralStatus = 'DANGER';
    lateralStatusText = `불가 (래핑 배부름·적재 공차(${maxRowBulgeAllowanceMm}mm) 감안 시 내폭을 ${Math.abs(minEffectiveClearanceMm)}mm 초과하여 적입 불가 위험)`;
  } else if (maxColGapMm < 40 || minEffectiveClearanceMm < forkliftLateralClearanceMm) {
    lateralStatus = maxColGapMm < 40 ? 'DANGER' : 'WARN';
    lateralStatusText =
      maxColGapMm < 40
        ? `불가 (내폭 ${innerWidthOption}mm 대비 여유 ${maxColGapMm}mm로 협소하여 적입 불가 위험)`
        : `주의 (래핑·어긋남 공차 차감 후 실효 여유 ${minEffectiveClearanceMm}mm — 지게차 진입 여유(${forkliftLateralClearanceMm}mm) 미달 주의)`;
  } else if (hasDoorIncompleteCol && doorIncompleteColInfo) {
    lateralStatus = 'WARN';
    lateralStatusText = `주의 (문쪽 미완성 열 — 양옆 약 ${doorIncompleteColInfo.leftGapMm}mm씩 유격, 측면 블로킹(각재/세운 빈 파레트) 시공 필수)`;
  } else if (hasSingleRowCol) {
    lateralStatus = 'WARN';
    lateralStatusText = `주의 (폭 방향 1열 중앙 적재 — 양옆 약 ${Math.round(maxColGapMm / 2)}mm씩 유격, 양옆 블로킹 필요)`;
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

  // 도어 최후미 열 파레트 목록 (Z좌표 기준 우측 -> 좌측 정렬, 단면도 동적 렌더링용)
  const sortedDoorRowPallets = [...doorPallets]
    .filter((dp) => dp.tier === 1)
    .sort((a, b) => a.z - b.z)
    .map((dp) => {
      const h = dp.pallet.totalHeight;
      const diff = Math.max(0, frontColMaxH - h);
      const pLabel = `P#${dp.pallet.index || dp.palletIndex}`;
      const isLow = h < 1150 || frontColMaxH - h >= 300;
      return {
        label: pLabel,
        cargoName: dp.pallet.primaryCargoName?.split(' ')[0] || '화물',
        height: h,
        frontColMaxH,
        diff,
        isLow,
        z: dp.z,
        width: dp.width,
      };
    });

  // 도어 최후미 열 및 직전 열(미완성 단열 시 노출되거나 저상 자투리 파레트가 배치된 경우) 단차 검사
  const rearCheckPallets = [...doorPallets, ...prevColPallets.filter((pp) => pp.pallet.totalHeight < 1150)];
  for (const dp of rearCheckPallets) {
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
  const hasLateralRisk = lateralStatus !== 'SAFE' || wideGapGroups.length > 0 || hasSingleRowCol || hasDoorIncompleteCol;
  const hasRisk = hasHeightGapRisk || hasSlidingRisk || hasLateralRisk;

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
  // 도어에 직접 면하는 마지막 열의 최고 높이 (문 앞 펜스 단수 산출 기준)
  const lastColMaxH = doorPallets.length > 0
    ? Math.max(...doorPallets.map((pp) => pp.pallet.totalHeight))
    : frontColMaxH;

  const upperLashH = Math.floor((frontColMaxH - 150) / 50) * 50;
  const lowerLashH = Math.floor(((maxLowPalletH + upperLashH) / 2) / 50) * 50;

  // 쇼링 소요 자재 산출 (BOM / Material List)
  const shoringBOM = [];

  // 1. 문 앞 빈 공간 밀림 차단 자재 (길이에 따라 펜스 또는 세운 빈 파레트 중 택일)
  // - 600mm 이상: 각재 펜스 1세트 + 코너포스트 버팀목 (빈 파레트 중복 투입 배제)
  // - 150mm ~ 600mm 미만: 세운 빈 목재 파레트 2~4장 (단거리 틈새 메움)
  // - 150mm 미만: 도어 밀착 상태로 마감 블로킹 불필요
  if (rearClearanceMm >= 600) {
    // 펜스 단수는 앞 열이 아니라 막아야 할 '마지막 열 높이(lastColMaxH)' 기준으로 계산!
    const fenceTiers = Math.max(1, Math.ceil(lastColMaxH / 600));
    const bracingCount = 2 * fenceTiers;
    shoringBOM.push({
      category: '목재 게이트',
      name: '각재 펜스 및 코너포스트 버팀목 (ISPM 15 HT 열처리 각재)',
      spec: `각재 90×90mm 또는 100×100mm (${fenceTiers}단 가공)`,
      quantity: `${fenceTiers}단 펜스 1세트 + 버팀목 ${bracingCount}본`,
      purpose: `마지막 열(높이 ${lastColMaxH}mm) 뒤에 각재 펜스를 세우고 문쪽 코너포스트까지 버팀목을 대어 문 앞 빈 공간(${rearClearanceMm}mm) 화물 밀림 물리적 차단`,
      isHtCertified: true,
    });
  } else if (rearClearanceMm >= 150) {
    shoringBOM.push({
      category: '목재 블로킹',
      name: '세운 빈 목재 파레트 (ISPM 15 HT 열처리 인증)',
      spec: '1100×1100mm 또는 1200×1000mm',
      quantity: '2~4장',
      purpose: `문 앞 빈 공간(${rearClearanceMm}mm)에 파레트를 세워서 끼우고 각재로 조여 밀림 차단`,
      isHtCertified: true,
    });
  }

  // 2. 듄네이지 에어백 (측면 유격 구간에만 충진, 문 앞 제외)
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
      const isBorderlineOnly = mediumGaps.every((g) => g.gap <= 165);
      const bagCount = isBorderlineOnly ? 2 : Math.max(1, Math.ceil(totalLen / airbagEffLen));
      const gapDesc = mediumGaps.map((g) => `${g.label || `${g.colIndex}열`}(${g.gap}mm)`).join(', ');
      shoringBOM.push({
        category: '완충재',
        name: '듄네이지 에어백 (Dunnage Airbag Level 1)',
        spec: '폭 600~900mm급 (900×1200mm 또는 600×1200mm)',
        quantity: isBorderlineOnly ? '첫 열 실측 후 결정 (예비 1~2개)' : `${bagCount}개`,
        purpose: isBorderlineOnly
          ? `측면 유격 150~165mm 구간[${gapDesc}] — 래핑 후 첫 열 실측에 따라 충진 여부 결정 (실측 150mm 초과 시만 충진, 문 앞 미사용)`
          : `측면 유격 150~300mm 구간[${gapDesc}, 총 ${(totalLen / 1000).toFixed(1)}m] 열간 완충 (문 앞 미사용)`,
        isHtCertified: false,
      });
    }
  }

  // 3-A. 폭 방향 1열 중앙 적재 전용 측면 블로킹 (각재 또는 세운 빈 파레트)
  if (hasSingleRowCol) {
    const singleColsCount = colGapDetails.filter((c) => c.isSingle).length;
    shoringBOM.push({
      category: '측면 블로킹',
      name: '중앙 단일열 측면 블로킹 (각재 또는 세운 빈 파레트)',
      spec: '각재 90×90mm 또는 세운 목재 파레트',
      quantity: `좌/우 각 ${singleColsCount}조 (총 ${singleColsCount * 2}조)`,
      purpose: `폭 방향 1열 중앙 적재 구간(양옆 유격 각 약 ${Math.round(lateralGapMm / 2)}mm) 좌우 롤링 전도 방지용 측면 블로킹 시공 (단일열이므로 에어백 대신 각재/파레트 블로킹 적용)`,
      isHtCertified: true,
    });
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
      category: '완충 판재',
      name: '완충 판재 (합판 / 플라스틱 골판재)',
      spec: '두께 12~15mm × 폭 2,300mm × 높이 1,200mm',
      quantity: '1장',
      purpose: '완적 열 앞면에 대어 수평 래싱 2줄 결속 시 박스 함몰 방지 및 압력 분산 (가공목재로 ISPM 15 검역 면제)',
      isHtCertified: false,
      isPlywoodExempt: true,
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
      if (rearClearanceMm >= 600) {
        actions.push(
          `[문 앞 ${rearClearanceM}m 밀림 차단] 마지막 열 뒤에 목재 각재 펜스를 세우고 문쪽 코너포스트까지 대각 버팀목 시공 (문 근처 에어백 사용 금지, 펜스와 버팀목으로 물리적 차단)`
        );
      } else if (rearClearanceMm >= 150) {
        actions.push(
          `[문 앞 단거리 틈새 차단] 문 앞 빈 틈(${rearClearanceMm}mm)에 세운 빈 파레트 2~4장을 끼우고 각재로 조여 밀림 차단 (문 근처 에어백 사용 금지)`
        );
      }
      actions.push(
        `[수출 인증 및 마감] 문에 닿는 화물 없는지 확인 후 쇼링 사진 촬영, 외부에 '쇼링 있음, 개방 주의' 표지 부착 (수출 건은 천연 목재 자재 ISPM 15 HT 열처리 마크 필수 확인, 가공목재인 합판은 검역 면제)`
      );
    } else if (hasSlidingRisk) {
      title = `도어측 화물 후방 미끄러짐 방지 목재 블로킹 필수 (빈 공간 ${rearClearanceM}m)`;
      summary = `컨테이너 문(Door) 앞에 약 ${rearClearanceM}m의 빈 바닥 공간이 있어, 해상 피칭이나 차량 급제동 시 화물이 문 쪽으로 밀려나는 슬라이딩(미끄러짐) 사고 위험이 있습니다.`;
      if (rearClearanceMm >= 600) {
        actions.push(
          `[블로킹] 마지막 열 뒤에 각재 펜스를 세우고 코너포스트까지 대각 버팀목을 대어 문 앞 빈 공간(${rearClearanceM}m) 밀림 물리적 차단 (에어백 사용 금지, 버팀목 지지)`
        );
      } else if (rearClearanceMm >= 150) {
        actions.push(
          `[블로킹] 문 앞 빈 틈(${rearClearanceMm}mm)에 세운 빈 파레트 2~4장을 끼우고 각재로 조여 밀림 차단 (에어백 사용 금지)`
        );
      }
      actions.push(
        `[래싱 권장] 최후미 파레트 전면에 완충 판재 지지 및 수평 래싱(Horizontal Lashing) 벨트 결속 권장`
      );
      actions.push(
        `[수출 인증] 사용 천연 목재 자재(각재, 목재 파레트)는 반드시 ISPM 15 HT 열처리 마크가 있는 자재 사용 (합판 등 가공목재는 검역 면제)`
      );
    } else if (hasHeightGapRisk) {
      title = `도어 개방 시 낙하 방지 쇼링 필수 [${lowPalletLabelsOnly.join(', ')}]`;
      summary = `문(Door) 쪽에 키가 낮은 파레트 [${lowPalletDesc}]가 배치되어, 바로 앞 완적 화물(${frontColMaxH}mm)과의 단차로 인해 목적지 도어 개방 시 작업자 쪽으로 쏟아지는 낙하 전도 사고(Door Spill) 위험이 큽니다.`;
      actions.push(
        `[단차 결속] 완적 열 전면에 완충 판재(합판)를 대고 높이 ${lowerLashH.toLocaleString()}mm / ${upperLashH.toLocaleString()}mm에 수평 래싱 2줄 결속`
      );
      actions.push(
        `[낮은 파레트 톱오버] ${lowPalletLabelsOnly.join(', ')} 위로 벨트를 넘겨 바닥 래싱 링에 톱오버 래싱 시공 (전도 방지 목적)`
      );
    } else if (hasSingleRowCol) {
      title = `중앙 단일열 적재 화물 좌우 전도 방지 측면 블로킹 안내`;
      summary = `컨테이너 내폭(${cWidth}mm) 대비 화물이 1열 중앙 적재되어 양옆 유격(각 약 ${Math.round(lateralGapMm / 2)}mm)이 큽니다. 해상 롤링 시 전도를 방지하기 위해 양옆 각재 블로킹 또는 세운 빈 파레트 지지가 필수입니다.`;
      actions.push(
        `[측면 블로킹] 중앙 1열 배치 양옆 공간에 각재 블로킹 또는 세운 빈 파레트를 덧대어 좌우 롤링 물리적 차단 (에어백 미사용)`
      );
      actions.push(
        `[밀착 적재] 길이 방향 12,000mm 만적 밀착 상태 유지 확인`
      );
      actions.push(
        `[수출 인증] 사용 천연 목재 자재는 ISPM 15 HT 열처리 마크 확인 (합판 등 가공목재는 검역 면제)`
      );
    } else if (wideGapGroups.length > 0) {
      title = `측면 유격(${lateralGapMm}mm) 화물 롤링 방지 듄네이지 에어백 충진 안내`;
      summary = `컨테이너 폭 방향 측면 유격(${lateralGapMm}mm)이 기준(${maxLateralGapAllowed}mm)을 초과하여 운송 중 롤링(좌우 흔들림)으로 인한 화물 쏠림 및 손상 위험이 있습니다. 듄네이지 에어백을 열간 충진하여 간극을 지지합니다.`;
      actions.push(
        `[에어백 충진] 측면 유격 구간에 규격 듄네이지 에어백 충진 (백 폭은 틈의 3배 이상 규격 사용, 문 앞 마지막 열은 에어백 사용 금지)`
      );
      actions.push(
        `[공기압 관리] 적정 게이지 압력(약 0.2~0.3 bar / 2.9~4.4 psi) 준수하여 과충진으로 인한 화물 파손 방지`
      );
      actions.push(
        `[도어측 확인] 도어측 잔여 공간(${rearClearanceMm}mm) 밀착 상태 점검 및 마감`
      );
    } else if (hasDoorIncompleteCol && doorIncompleteColInfo) {
      title = '도어측 미완성 열 화물 전도 방지 측면 블로킹 안내';
      summary = `문쪽 마지막 열에 파레트 1개만 중앙 적재되어 양옆 유격(각 ${doorIncompleteColInfo.leftGapMm}mm)이 크므로 측면 블로킹 시공이 필수입니다.`;
      actions.push(
        `[측면 블로킹] 문쪽 미완성 열 폭 중앙 적재 (양옆 유격 각 ${doorIncompleteColInfo.leftGapMm}mm) — 각재 또는 세운 빈 파레트로 측면 블로킹 시공 (에어백 사용 금지)`
      );
    }

    doorShoringGuide = {
      hasRisk: true,
      hasHeightGapRisk,
      hasSlidingRisk,
      rearClearanceMm,
      lowPalletLabels: lowPalletLabelsOnly,
      lowPalletDetails: lowDoorPalletDetails,
      doorRowPallets: sortedDoorRowPallets,
      lowPalletDesc,
      minHeightMm: minDoorPalletH,
      maxHeightMm: frontColMaxH,
      lowerLashH,
      upperLashH,
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
        doorRowPallets: sortedDoorRowPallets,
        lowPalletDesc: '',
        minHeightMm: 0,
        maxHeightMm: frontColMaxH,
        lowerLashH,
        upperLashH,
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
    } else if (!doorShoringGuide.actions.some((a) => a.includes('문쪽 미완성 열'))) {
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
    minEffectiveClearanceMm,
    maxRowBulgeAllowanceMm,
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
