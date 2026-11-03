/**
 * WAC 3D CBM & Pallet/Container Loading Simulation Engine
 * ---------------------------------------------------------
 * 모듈화된 패킹 엔진 엔트리 포인트 (하위 호환성 재수출 + 통합 시뮬레이션 오케스트레이터)
 * - constants.js: 컨테이너·파레트 프리셋 및 기본 상수
 * - layerLayout.js: 2D 레이어 배치 솔버 (동일 방향·핀휠·스플릿·교차 인터로킹)
 * - palletPacker.js: Stage 1 화물 -> 파레트 패킹, 돌출(Overhang)·스태킹 옵션 진단
 * - containerPacker.js: Stage 2 파레트 -> 컨테이너 적재, 무게중심(CoG) 및 현장 적재 안정성 진단
 */

import {
  CONTAINER_SPECS,
  PALLET_PRESETS,
  CARGO_COLORS,
  DEFAULT_CARGOS,
  PATTERN_DEFS,
  STACK_STYLE_DEFS,
  POSTURE_DEFS,
} from './constants.js';

import {
  resolveCargoBoxDimsByPosture,
  resolvePalletDimsForCargo,
  computeBest2DLayer,
  measureLayerBounds,
  describeLayerOrientation,
} from './layerLayout.js';

import {
  computePalletLocalCoG,
  packCargosIntoPallets,
  autoRecommendPalletSpecs,
  analyzeOverhangDiagnostics,
  analyzeCargoStackingOptions,
} from './palletPacker.js';

import {
  analyzeContainerCoG,
  packPalletsIntoContainers,
} from './containerPacker.js';

export {
  CONTAINER_SPECS,
  PALLET_PRESETS,
  CARGO_COLORS,
  DEFAULT_CARGOS,
  PATTERN_DEFS,
  STACK_STYLE_DEFS,
  POSTURE_DEFS,
  resolveCargoBoxDimsByPosture,
  resolvePalletDimsForCargo,
  computeBest2DLayer,
  measureLayerBounds,
  describeLayerOrientation,
  computePalletLocalCoG,
  packCargosIntoPallets,
  autoRecommendPalletSpecs,
  analyzeOverhangDiagnostics,
  analyzeCargoStackingOptions,
  analyzeContainerCoG,
  packPalletsIntoContainers,
};

/**
 * 40ft High Cube 컨테이너 바닥 완적(Floor 1단 가득 채움) 기준 소요 대수 및 배분 예측
 * - T11 (1100×1100), T12 (1200×1000), EXPORT_1200 (1200×1200), CUSTOM_MIX: 20 PLT / 대
 * - EUR (1200×800): 24 PLT / 대
 */
export function estimate40HcContainerNeeds(palletCount, palletSpecId = 'T11') {
  const floorCapacity = palletSpecId === 'EUR' ? 24 : 20;
  if (!palletCount || palletCount <= 0) {
    return {
      containerCount: 0,
      floorCapacity,
      totalSlots: 0,
      emptySlots: 0,
      utilizationPct: 0,
      splitText: '0대',
      summaryText: '0대',
      badgeText: '40HC 0대',
      detailText: '화물이 없습니다.',
      floorNote: '적재 화물 없음',
    };
  }
  const containerCount = Math.max(1, Math.ceil(palletCount / floorCapacity));
  const totalSlots = containerCount * floorCapacity;
  const emptySlots = Math.max(0, totalSlots - palletCount);
  const utilizationPct = Math.round((palletCount / totalSlots) * 100);

  // 컨테이너별 균등 배분 (예: 38개 ➔ 19개 + 19개)
  const perContainerPlts = [];
  const basePerCont = Math.floor(palletCount / containerCount);
  let remainder = palletCount % containerCount;
  for (let i = 0; i < containerCount; i++) {
    perContainerPlts.push(basePerCont + (remainder > 0 ? 1 : 0));
    if (remainder > 0) remainder--;
  }
  const splitText = perContainerPlts.map((cnt, i) => `${i + 1}호기 ${cnt}PLT`).join(' / ');

  const floorNote =
    emptySlots === 0
      ? '바닥 100% 완적 (빈 공간 없음 · 쇼링 불필요)'
      : emptySlots <= containerCount * 2
      ? `바닥 ${totalSlots}슬롯 중 ${palletCount}PLT 채움 (바닥 충진률 ${utilizationPct}% · 전도 방지)`
      : `바닥 ${totalSlots}슬롯 중 ${palletCount}PLT 채움 (잔여 바닥 슬롯 ${emptySlots}개)`;

  return {
    containerCount,
    floorCapacity,
    totalSlots,
    emptySlots,
    utilizationPct,
    splitText,
    summaryText: `40HC 약 ${containerCount}대`,
    badgeText: `40HC 약 ${containerCount}대`,
    detailText: `바닥 완적(${floorCapacity}PLT/대) 기준 ${containerCount}대 (${splitText})`,
    floorNote,
  };
}

/**
 * 전체 시뮬레이션 통합 실행 (파레트 규격별 비교 + 컨테이너 규격별 비교 포함)
 */
export function runFullSimulation(cargos, palletConfig, selectedContainerId, options = {}) {
  const palletResult = packCargosIntoPallets(cargos, palletConfig, options);
  const { pallets, palletWeightGroups, unpackedErrors } = palletResult;
  const basePalletCount = pallets.length;
  const overhangDiagnostics = analyzeOverhangDiagnostics(cargos, palletConfig, options);
  const stackingDiagnostics = analyzeCargoStackingOptions(cargos, palletConfig, options);

  const selectedSpec =
    CONTAINER_SPECS[selectedContainerId] || CONTAINER_SPECS['40FT_HC'];

  // 산출된 파레트 수(예: 38 PLT)를 그대로 유지하여 컨테이너 적재 시뮬레이션 실행
  const containerResult = packPalletsIntoContainers(pallets, selectedSpec, options);

  // '작업 편의성 우선' vs '균등 밸런스 우선' 비교 데이터 산출
  const convenienceCompare = packPalletsIntoContainers(pallets, selectedSpec, {
    ...options,
    stuffingStrategy: 'convenience',
  });
  const balanceCompare = packPalletsIntoContainers(pallets, selectedSpec, {
    ...options,
    stuffingStrategy: 'balance',
  });

  // '빈 바닥 채움(기본값)' vs '최대한 높게 쌓아 바닥 공간 만들기(선택사항)' 비교 지표 산출
  const spreadCompare = packPalletsIntoContainers(pallets, selectedSpec, {
    ...options,
    fullFloorSpread: true,
  });
  const compactCompare = packPalletsIntoContainers(pallets, selectedSpec, {
    ...options,
    fullFloorSpread: false,
  });

  const floorSlotsPerUnit = selectedSpec.id === '20FT_DRY' ? 10 : 20;
  const totalAvailableFloorSlots = containerResult.containers.length * floorSlotsPerUnit;
  const emptyFloorSlotsBeforeSpread = Math.max(0, totalAvailableFloorSlots - basePalletCount);

  const avgSpreadUsedLenMm =
    spreadCompare.containers.length > 0
      ? Math.round(
          spreadCompare.containers.reduce(
            (acc, c) => acc + (c.fieldDiagnostics?.usedLengthMm || 0),
            0
          ) / spreadCompare.containers.length
        )
      : 0;
  const avgCompactUsedLenMm =
    compactCompare.containers.length > 0
      ? Math.round(
          compactCompare.containers.reduce(
            (acc, c) => acc + (c.fieldDiagnostics?.usedLengthMm || 0),
            0
          ) / compactCompare.containers.length
        )
      : 0;
  const avgCompactRearClearanceMm =
    compactCompare.containers.length > 0
      ? Math.round(
          compactCompare.containers.reduce(
            (acc, c) => acc + (c.fieldDiagnostics?.rearClearanceMm || 0),
            0
          ) / compactCompare.containers.length
        )
      : 0;
  const compactTier2Count = compactCompare.containers.reduce(
    (acc, c) => acc + (c.tier2Count || 0),
    0
  );

  // 파레트 사이즈(종류)별 비교 시뮬레이션 (단일 규격 4종 + 품목별 최적 혼합 1종)
  const palletSpecComparison = Object.values(PALLET_PRESETS).map((preset) => {
    const uniformCargos = cargos.map((c) => ({ ...c, palletSpecId: preset.id }));
    const res = packCargosIntoPallets(
      uniformCargos,
      { ...palletConfig, width: preset.width, length: preset.length },
      options
    );
    const avgUtil =
      res.pallets.length > 0
        ? Number(
            (
              res.pallets.reduce((acc, p) => acc + p.volumeUtilization, 0) /
              res.pallets.length
            ).toFixed(1)
          )
        : 0;
    return {
      id: preset.id,
      name: preset.name,
      shortLabel: preset.shortLabel,
      width: preset.width,
      length: preset.length,
      totalPallets: res.pallets.length,
      avgUtilization: avgUtil,
      unpackedCount: res.unpackedErrors.length,
      hcEstimate: estimate40HcContainerNeeds(res.pallets.length, preset.id),
    };
  });

  // 모든 컨테이너 종류별 비교 시뮬레이션
  const containerComparison = Object.values(CONTAINER_SPECS).map((spec) => {
    let palletsForSpec = palletResult.pallets;
    if (options.doubleStackAuto) {
      const autoMaxH = Math.floor((spec.height - 60) / 2);
      const specPalletRes = packCargosIntoPallets(
        cargos,
        { ...palletConfig, maxTotalHeight: autoMaxH },
        options
      );
      palletsForSpec = specPalletRes.pallets;
    }
    const res = packPalletsIntoContainers(palletsForSpec, spec, options);
    return {
      spec,
      palletCount: palletsForSpec.length,
      containerCount: res.containers.length,
      containers: res.containers,
      floorSlots: spec.id === '20FT_DRY' ? 10 : 20,
      maxCapacity:
        (spec.id === '20FT_DRY' ? 10 : 20) *
        (options.doubleStack || options.fullFloorSpread === false ? 2 : 1),
      unfitCount: res.unfitPallets.length,
      avgUtilization:
        res.containers.length > 0
          ? Number(
              (
                res.containers.reduce((acc, c) => acc + c.volumeUtilization, 0) /
                res.containers.length
              ).toFixed(1)
            )
          : 0,
    };
  });

  const totalBoxesPacked = pallets.reduce((acc, p) => acc + p.boxes.length, 0);
  const totalCargoCbm = Number(
    pallets.reduce((acc, p) => acc + p.cargoCbm, 0).toFixed(3)
  );
  const totalPalletCbm = Number(
    pallets.reduce((acc, p) => acc + p.totalCbm, 0).toFixed(3)
  );
  const totalWeight = Number(
    pallets.reduce((acc, p) => acc + p.totalWeight, 0).toFixed(1)
  );

  // 실무 복합 컨테이너 배차 추천 (예: 40HC 단독 vs 40HC + 20ft 혼합 조합 비교)
  const hcComp = containerComparison.find((c) => c.spec.id === '40FT_HC');
  const ft20Comp = containerComparison.find((c) => c.spec.id === '20FT_DRY');
  const cap40 = hcComp ? hcComp.floorSlots : 20;
  const cap20 = ft20Comp ? ft20Comp.floorSlots : 10;
  const totalPlt = pallets.length;

  const fleetRecommendations = [];
  if (totalPlt > 0) {
    const hcOnlyCnt = Math.ceil(totalPlt / cap40);
    const hcOnlySlots = hcOnlyCnt * cap40;
    const hcOnlyEmpty = Math.max(0, hcOnlySlots - totalPlt);

    const full40Cnt = Math.floor(totalPlt / cap40);
    const remPlt = totalPlt - full40Cnt * cap40;

    if (remPlt > 0 && remPlt <= cap20 && full40Cnt >= 1) {
      const comboSlots = full40Cnt * cap40 + cap20;
      const comboEmpty = Math.max(0, comboSlots - totalPlt);
      fleetRecommendations.push({
        id: 'COMBO_40HC_20FT',
        badge: '💰 운임·공간 최적 혼합 배차 추천',
        title: `40ft HC × ${full40Cnt}대 + 20ft Dry × 1대 (총 ${full40Cnt + 1}대)`,
        detail: `40HC에 ${full40Cnt * cap40}PLT + 20ft에 ${remPlt}PLT 적재 (빈 바닥 슬롯 ${hcOnlyEmpty}칸 → ${comboEmpty}칸으로 축소)`,
        note: '두 컨테이너 모두 바닥을 꽉 채워 쇼링(고정장치) 비용 절감',
        desc: `잔여 ${remPlt}파레트를 40HC 대신 20ft 1대에 적재하여 빈 바닥 슬롯을 ${hcOnlyEmpty}개 → ${comboEmpty}개로 줄이는 실무 추천 조합입니다.`,
        totalSlots: comboSlots,
        emptySlots: comboEmpty,
        isRecommended: true,
      });
    }

    const perHcSplit = hcComp
      ? hcComp.containers.map((c) => `${c.index}호기 ${c.placedPallets.length}PLT`).join(' / ')
      : `${totalPlt}PLT`;

    fleetRecommendations.push({
      id: 'SINGLE_40HC',
      badge: hcOnlyEmpty <= 2 ? '⭐ 바닥 공간 최적 매칭 추천' : '⚖️ 전 호기 균등 배분 배차',
      title: `40ft High Cube × ${hcOnlyCnt}대 (${perHcSplit})`,
      detail: `총 ${totalPlt}파레트를 호기별로 균등 배분 (바닥 ${hcOnlySlots}슬롯 기준)`,
      note:
        options.fullFloorSpread !== false
          ? '전 컨테이너 1단 바닥 전체 균등 배치 완료 (쏠림·전도 및 추가 고정장치 불필요)'
          : `고단(2단) 스태킹 & 앞벽 밀착 배치로 호기당 약 ${(avgCompactRearClearanceMm / 1000).toFixed(2)}m 바닥 여유 공간 확보`,
      desc:
        hcOnlyEmpty <= 2
          ? `총 ${hcOnlySlots}슬롯 중 ${totalPlt}파레트를 채워 바닥 공간 활용도가 매우 높습니다.`
          : `총 ${hcOnlySlots}슬롯 중 ${totalPlt}파레트 적재 (호차별 균등 배분 적용).`,
      totalSlots: hcOnlySlots,
      emptySlots: hcOnlyEmpty,
      isRecommended: fleetRecommendations.length === 0,
    });
  }

  return {
    pallets,
    palletWeightGroups,
    palletSpecComparison,
    overhangDiagnostics,
    stackingDiagnostics,
    unpackedErrors,
    selectedSpec,
    containerResult,
    containerComparison,
    fleetRecommendations,
    floorSpreadInfo: {
      basePalletCount,
      spreadPalletCount: pallets.length,
      totalAvailableFloorSlots,
      emptyFloorSlotsBeforeSpread,
      isSpreadActive: options.fullFloorSpread !== false,
      avgSpreadUsedLenMm,
      avgCompactUsedLenMm,
      avgCompactRearClearanceMm,
      compactTier2Count,
    },
    stuffingStrategyInfo: {
      strategy: options.stuffingStrategy || 'convenience',
      isConvenience: (options.stuffingStrategy || 'convenience') === 'convenience',
      convenienceContainers: convenienceCompare.containers,
      balanceContainers: balanceCompare.containers,
      convenienceSplitText: convenienceCompare.containers
        .map(
          (c) =>
            `${c.index}호기 ${c.placedPallets.length}PLT${
              c.stuffingBadge?.type === 'dedicated_full' ? ' (단일 완적)' : ''
            }`
        )
        .join(' / '),
      balanceSplitText: balanceCompare.containers
        .map((c) => `${c.index}호기 ${c.placedPallets.length}PLT`)
        .join(' / '),
    },
    summary: {
      totalBoxesPacked,
      totalPallets: pallets.length,
      totalContainers: containerResult.containers.length,
      totalCargoCbm,
      totalPalletCbm,
      totalWeight,
    },
  };
}
