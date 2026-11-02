// 2-Stage 3D Bin Packing Engine (Cargo -> Pallet -> Container) with Multi-Pallet & Center of Gravity (CoG) Analysis

export const CONTAINER_SPECS = {
  '20FT_DRY': {
    id: '20FT_DRY',
    name: '20ft Dry',
    subName: '표준 20피트 드라이 컨테이너',
    length: 5898,
    width: 2352,
    height: 2393,
    doorHeight: 2280,
    maxWeight: 21700,
    nominalCbm: 33.2,
  },
  '40FT_DRY': {
    id: '40FT_DRY',
    name: '40ft Dry',
    subName: '표준 40피트 드라이 컨테이너',
    length: 12032,
    width: 2352,
    height: 2393,
    doorHeight: 2280,
    maxWeight: 26700,
    nominalCbm: 67.7,
  },
  '40FT_HC': {
    id: '40FT_HC',
    name: '40ft High Cube',
    subName: '40피트 하이큐브(HC) 컨테이너',
    length: 12032,
    width: 2352,
    height: 2698,
    doorHeight: 2585,
    maxWeight: 26500,
    nominalCbm: 76.4,
  },
};

export const PALLET_PRESETS = {
  T11: {
    id: 'T11',
    name: 'T11 표준 (1100 × 1100)',
    shortLabel: '1100×1100 (T11)',
    width: 1100,
    length: 1100,
    baseHeight: 150,
    maxTotalHeight: 1700,
    maxWeight: 1000,
    tareWeight: 17,
  },
  T12: {
    id: 'T12',
    name: 'T12 국제규격 (1200 × 1000)',
    shortLabel: '1200×1000 (T12)',
    width: 1200,
    length: 1000,
    baseHeight: 150,
    maxTotalHeight: 1700,
    maxWeight: 1000,
    tareWeight: 17,
  },
  EUR: {
    id: 'EUR',
    name: 'EUR 유럽규격 (1200 × 800)',
    shortLabel: '1200×800 (EUR)',
    width: 1200,
    length: 800,
    baseHeight: 150,
    maxTotalHeight: 1700,
    maxWeight: 1000,
    tareWeight: 17,
  },
  EXPORT_1200: {
    id: 'EXPORT_1200',
    name: '수출 대형 (1200 × 1200)',
    shortLabel: '1200×1200 (대형)',
    width: 1200,
    length: 1200,
    baseHeight: 150,
    maxTotalHeight: 1700,
    maxWeight: 1200,
    tareWeight: 20,
  },
};

export const CARGO_COLORS = [
  '#3b82f6', // Blue
  '#f59e0b', // Amber
  '#10b981', // Emerald
  '#ec4899', // Pink
  '#8b5cf6', // Violet
  '#06b6d4', // Cyan
  '#f97316', // Orange
  '#84cc16', // Lime
];

/**
 * 기본 데모 데이터:
 * - 박스A (Item 1): 510×240×210, 1246박스, 개당 4.26kg, 1100×1100 파레트
 *   -> 56박스 완적 22PLT (파레트당 255.6kg, 합 5,623.2kg) + 14박스 부분 1PLT (76.6kg)
 * - 박스B (Item 2, 돌출건): 750×410×220, 294박스, 개당 9.60kg, 1200×1000 파레트 적용 (돌출 해결!)
 *   -> 21박스 완적 14PLT (파레트당 218.6kg, 합 3,060.4kg)
 * - 박스C (Item 3): 500×400×350, 8박스, 개당 11.00kg, 1100×1100 파레트
 *   -> 8박스 1PLT (파레트당 105.0kg, 합 105.0kg)
 * - 파레트 자중(tareWeight): 17.0kg 기준 총합 38개 파레트, 8,865.2kg
 */
export const DEFAULT_CARGOS = [
  {
    id: 'cargo-1',
    name: '박스A (Item1)',
    width: 510,
    length: 240,
    height: 210,
    quantity: 1246,
    weight: 4.26,
    color: CARGO_COLORS[0],
    allowRotate: true,
    palletSpecId: 'T11', // 1100 x 1100
  },
  {
    id: 'cargo-2',
    name: '박스B (Item2)',
    width: 750,
    length: 410,
    height: 220,
    quantity: 294,
    weight: 9.6,
    color: CARGO_COLORS[1],
    allowRotate: true,
    palletSpecId: 'T12', // 돌출 방지를 위해 1200 x 1000 파레트 지정
  },
  {
    id: 'cargo-3',
    name: '박스C (Item3)',
    width: 500,
    length: 400,
    height: 350,
    quantity: 8,
    weight: 11.0,
    color: CARGO_COLORS[2],
    allowRotate: true,
    palletSpecId: 'T11', // 1100 x 1100
  },
];

/**
 * 상자 놓는 자세(Posture: 세워 쌓기 vs 앞으로 눕혀 쌓기 vs 옆으로 눕혀 쌓기)에 따른 유효 바닥(W×L) 및 높이(H) 계산
 */
export function resolveCargoBoxDimsByPosture(cargo, postureOverride) {
  const rawW = Math.max(1, Number(cargo.width) || 1);
  const rawL = Math.max(1, Number(cargo.length) || 1);
  const rawH = Math.max(1, Number(cargo.height) || 1);
  const posture = postureOverride || cargo.boxPosture || 'UPRIGHT';

  if (posture === 'FLAT_W_H') {
    return {
      posture: 'FLAT_W_H',
      postureLabel: '📐 앞으로 눕혀 쌓기 (가로×높이 바닥)',
      width: rawW,
      length: rawH,
      height: rawL,
    };
  }
  if (posture === 'FLAT_H_L') {
    return {
      posture: 'FLAT_H_L',
      postureLabel: '📐 옆으로 눕혀 쌓기 (높이×세로 바닥)',
      width: rawH,
      length: rawL,
      height: rawW,
    };
  }
  return {
    posture: 'UPRIGHT',
    postureLabel: '⬆️ 기본 세워 쌓기 (가로×세로 바닥)',
    width: rawW,
    length: rawL,
    height: rawH,
  };
}

/**
 * 2D 평면(W x L) 위에 단일 규격 박스(bw x bl)를 지정된 패턴 모드(patternMode)에 따라 배치하는 레이아웃 계산
 */
export function computeBest2DLayer(
  surfaceW,
  surfaceL,
  boxW,
  boxL,
  allowRotate = true,
  patternMode = 'AUTO_MAX'
) {
  const bw = Math.max(1, Number(boxW) || 1);
  const bl = Math.max(1, Number(boxL) || 1);
  if (bw > surfaceW && bw > surfaceL) return [];
  if (bl > surfaceW && bl > surfaceL) return [];

  const fillGrid = (ox, oz, rw, rl, uw, ul, rotated) => {
    const nx = Math.floor(rw / uw);
    const nz = Math.floor(rl / ul);
    const placements = [];
    for (let iz = 0; iz < nz; iz++) {
      for (let ix = 0; ix < nx; ix++) {
        placements.push({
          x: ox + ix * uw,
          z: oz + iz * ul,
          w: uw,
          l: ul,
          rotated,
        });
      }
    }
    return placements;
  };

  const gridNormal =
    bw <= surfaceW && bl <= surfaceL
      ? fillGrid(0, 0, surfaceW, surfaceL, bw, bl, false)
      : [];
  const gridRotated =
    allowRotate && bl <= surfaceW && bw <= surfaceL
      ? fillGrid(0, 0, surfaceW, surfaceL, bl, bw, true)
      : [];

  if (patternMode === 'GRID_NORMAL') {
    return gridNormal.length > 0 ? gridNormal : gridRotated;
  }
  if (patternMode === 'GRID_ROTATED') {
    return gridRotated.length > 0 ? gridRotated : gridNormal;
  }

  // Generate 4-Quadrant Pinwheel (풍차형 맞물림) candidates
  const pinwheelCandidates = [];
  if (allowRotate && bw !== bl) {
    const maxNx1 = Math.floor(surfaceW / bw);
    const maxNz1 = Math.floor(surfaceL / bl);
    const maxNx2 = Math.floor(surfaceW / bl);
    const maxNz2 = Math.floor(surfaceL / bw);

    for (let nx1 = 1; nx1 <= maxNx1; nx1++) {
      for (let nz1 = 1; nz1 <= maxNz1; nz1++) {
        const W1 = nx1 * bw;
        const L1 = nz1 * bl;
        for (let nx2 = 1; nx2 <= maxNx2; nx2++) {
          const W2 = nx2 * bl;
          if (W1 + W2 > surfaceW) break;
          for (let nz2 = 1; nz2 <= maxNz2; nz2++) {
            const L2 = nz2 * bw;
            if (L1 + L2 > surfaceL) break;

            if ((W1 >= W2 && L2 >= L1) || (W1 <= W2 && L2 <= L1)) {
              const q1 = fillGrid(0, 0, W1, L1, bw, bl, false);
              const q2 = fillGrid(W1, 0, W2, L2, bl, bw, true);
              const q3 = fillGrid(W2, L2, W1, L1, bw, bl, false);
              const q4 = fillGrid(0, L1, W2, L2, bl, bw, true);
              pinwheelCandidates.push([...q1, ...q2, ...q3, ...q4]);
            }
          }
        }
      }
    }
  }

  // Generate Split-Block Mixed candidates (정방향 + 90°회전 블록 조합)
  const splitMixCandidates = [];
  if (allowRotate && bw !== bl) {
    const maxKx = Math.floor(surfaceW / bw);
    for (let k = 1; k <= maxKx; k++) {
      const usedW = k * bw;
      const remW = surfaceW - usedW;
      const part1 = fillGrid(0, 0, usedW, surfaceL, bw, bl, false);
      const part2 = fillGrid(usedW, 0, remW, surfaceL, bl, bw, true);
      if (part1.length > 0 && part2.length > 0) {
        splitMixCandidates.push([...part1, ...part2]);
      }
    }

    const maxKxRot = Math.floor(surfaceW / bl);
    for (let k = 1; k <= maxKxRot; k++) {
      const usedW = k * bl;
      const remW = surfaceW - usedW;
      const part1 = fillGrid(0, 0, usedW, surfaceL, bl, bw, true);
      const part2 = fillGrid(usedW, 0, remW, surfaceL, bw, bl, false);
      if (part1.length > 0 && part2.length > 0) {
        splitMixCandidates.push([...part1, ...part2]);
      }
    }

    const maxMz = Math.floor(surfaceL / bl);
    for (let m = 1; m <= maxMz; m++) {
      const usedL = m * bl;
      const remL = surfaceL - usedL;
      const part1 = fillGrid(0, 0, surfaceW, usedL, bw, bl, false);
      const part2 = fillGrid(0, usedL, surfaceW, remL, bl, bw, true);
      if (part1.length > 0 && part2.length > 0) {
        splitMixCandidates.push([...part1, ...part2]);
      }
    }

    const maxMzRot = Math.floor(surfaceL / bw);
    for (let m = 1; m <= maxMzRot; m++) {
      const usedL = m * bw;
      const remL = surfaceL - usedL;
      const part1 = fillGrid(0, 0, surfaceW, usedL, bl, bw, true);
      const part2 = fillGrid(0, usedL, surfaceW, remL, bw, bl, false);
      if (part1.length > 0 && part2.length > 0) {
        splitMixCandidates.push([...part1, ...part2]);
      }
    }
  }

  if (patternMode === 'PINWHEEL') {
    let bestPin = [];
    for (const cand of pinwheelCandidates) {
      if (cand.length > bestPin.length) bestPin = cand;
    }
    if (bestPin.length > 0) return bestPin;
    for (const cand of splitMixCandidates) {
      if (cand.length > bestPin.length) bestPin = cand;
    }
    if (bestPin.length > 0) return bestPin;
  }

  if (patternMode === 'SPLIT_MIX') {
    let bestMix = [];
    for (const cand of splitMixCandidates) {
      if (cand.length > bestMix.length) bestMix = cand;
    }
    if (bestMix.length > 0) return bestMix;
  }

  const allCandidates = [
    gridNormal,
    gridRotated,
    ...splitMixCandidates,
    ...pinwheelCandidates,
  ];

  let best = [];
  for (const cand of allCandidates) {
    if (cand.length > best.length) {
      best = cand;
    }
  }

  return best;
}

/**
 * 화물의 파레트 설정 결정 헬퍼 (개별 지정 규격 우선, 없으면 기본 파레트 규격)
 */
export function resolvePalletDimsForCargo(cargo, defaultPalletConfig) {
  const specId = cargo?.palletSpecId;
  if (specId && specId !== 'DEFAULT' && PALLET_PRESETS[specId]) {
    const preset = PALLET_PRESETS[specId];
    return {
      specId: preset.id,
      specName: preset.shortLabel || preset.name,
      width: preset.width,
      length: preset.length,
    };
  }
  return {
    specId: 'DEFAULT',
    specName: `${defaultPalletConfig.width}×${defaultPalletConfig.length}`,
    width: Math.max(100, Number(defaultPalletConfig.width) || 1100),
    length: Math.max(100, Number(defaultPalletConfig.length) || 1100),
  };
}

/**
 * 파레트 내부 3D 무게중심(Local CoG) 계산
 */
function computePalletLocalCoG(pallet) {
  let momentX = 0;
  let momentY = 0;
  let momentZ = 0;
  let totalMass = 0;

  // Pallet wooden base CoG
  const baseMass = pallet.tareWeight || 0;
  if (baseMass > 0) {
    momentX += baseMass * (pallet.width / 2);
    momentY += baseMass * (pallet.baseHeight / 2);
    momentZ += baseMass * (pallet.length / 2);
    totalMass += baseMass;
  }

  for (const b of pallet.boxes) {
    const m = b.weight || 0;
    const cx = b.x + b.w / 2;
    const cy = b.y + b.h / 2;
    const cz = b.z + b.l / 2;
    momentX += m * cx;
    momentY += m * cy;
    momentZ += m * cz;
    totalMass += m;
  }

  if (totalMass <= 0) {
    return {
      x: pallet.width / 2,
      y: pallet.totalHeight / 2,
      z: pallet.length / 2,
    };
  }

  return {
    x: Number((momentX / totalMass).toFixed(1)),
    y: Number((momentY / totalMass).toFixed(1)),
    z: Number((momentZ / totalMass).toFixed(1)),
  };
}

/**
 * Step 1: 화물(Cargos)을 파레트(Pallets)에 적재하는 시뮬레이션
 * - 품목별 개별 파레트 규격(예: 박스B는 1200x1000, 나머지는 1100x1100) 지원
 * - 돌출(overhang)이 발생할 경우 자동으로 1200x1000 파레트로 전환하는 옵션도 지원
 */
export function packCargosIntoPallets(cargos, palletConfig, options = {}) {
  const overhang = Math.max(0, Number(options.overhang) || 0);
  const baseH = Math.max(0, Number(palletConfig.baseHeight) ?? 150);
  const maxTotalH = Math.max(baseH + 50, Number(palletConfig.maxTotalHeight) || 1700);
  const maxLoadH = maxTotalH - baseH;
  const maxCargoWeight = Math.max(1, Number(palletConfig.maxWeight) || 1000);
  const tareWeight = Math.max(0, Number(palletConfig.tareWeight) ?? 17);
  const mixCargos = Boolean(options.mixCargos);
  const interlockLayers = options.interlockLayers !== false; // 기본 홀·짝수단 교차 적재(인터로킹) 활성화

  // Prepare working queue of cargos
  const queue = cargos
    .map((c, idx) => {
      const resolvedPallet = resolvePalletDimsForCargo(c, palletConfig);
      const resolvedPosture = resolveCargoBoxDimsByPosture(c);
      return {
        id: c.id || `cargo-${idx + 1}`,
        name: (c.name || `화물 ${idx + 1}`).trim(),
        width: resolvedPosture.width,
        length: resolvedPosture.length,
        height: resolvedPosture.height,
        rawWidth: Math.max(1, Number(c.width) || 0),
        rawLength: Math.max(1, Number(c.length) || 0),
        rawHeight: Math.max(1, Number(c.height) || 0),
        boxPosture: resolvedPosture.posture,
        boxPostureLabel: resolvedPosture.postureLabel,
        layerPattern: c.layerPattern || options.layerPattern || 'AUTO_MAX',
        stackingStyle:
          c.stackingStyle ||
          options.stackingStyle ||
          (interlockLayers ? 'INTERLOCK' : 'COLUMN'),
        quantity: Math.max(0, Math.floor(Number(c.quantity) || 0)),
        remaining: Math.max(0, Math.floor(Number(c.quantity) || 0)),
        weight: Math.max(0, Number(c.weight) || 0),
        maxLayers: Math.max(0, Math.floor(Number(c.maxLayers) || 0)), // 품목별 최대 적재 단수 제한 (0 = 자동)
        allowedOverhang:
          c.allowedOverhang !== undefined && c.allowedOverhang !== null
            ? Math.max(0, Number(c.allowedOverhang) || 0)
            : overhang,
        color: c.color || CARGO_COLORS[idx % CARGO_COLORS.length],
        allowRotate: c.allowRotate !== false,
        palletSpecId: resolvedPallet.specId,
        palletSpecName: resolvedPallet.specName,
        palletW: resolvedPallet.width,
        palletL: resolvedPallet.length,
      };
    })
    .filter((c) => c.quantity > 0 && c.width > 0 && c.length > 0 && c.height > 0);

  const layerTemplates = new Map();
  const templateMeta = new Map();
  const unpackedErrors = [];

  for (const item of queue) {
    const itemOv = item.allowedOverhang;
    const effW = item.palletW + itemOv;
    const effL = item.palletL + itemOv;
    const template = computeBest2DLayer(
      effW,
      effL,
      item.width,
      item.length,
      item.allowRotate,
      item.layerPattern
    );
    if (template.length === 0 || item.height > maxLoadH) {
      unpackedErrors.push({
        cargoId: item.id,
        name: item.name,
        reason:
          item.height > maxLoadH
            ? `화물 높이(${item.height}mm)가 파레트 최대 적재 가능 높이(${maxLoadH}mm)를 초과합니다.`
            : `화물 바닥 크기(${item.width}×${item.length}mm)가 파레트 규격(${effW}×${effL}mm)을 초과합니다.`,
        count: item.remaining,
      });
      item.remaining = 0;
    } else {
      layerTemplates.set(item.id, template);
      let minX = Infinity,
        maxX = 0,
        minZ = Infinity,
        maxZ = 0;
      for (const p of template) {
        if (p.x < minX) minX = p.x;
        if (p.x + p.w > maxX) maxX = p.x + p.w;
        if (p.z < minZ) minZ = p.z;
        if (p.z + p.l > maxZ) maxZ = p.z + p.l;
      }
      const spanW = maxX - minX;
      const spanL = maxZ - minZ;
      const fullOffsetX = Math.floor((item.palletW - spanW) / 2) - minX;
      const fullOffsetZ = Math.floor((item.palletL - spanL) / 2) - minZ;

      const maxLayersByH = Math.max(1, Math.floor(maxLoadH / item.height));
      const fullLayerWeight = template.length * item.weight;
      const maxLayersByW =
        fullLayerWeight > 0
          ? Math.max(1, Math.floor(maxCargoWeight / fullLayerWeight))
          : maxLayersByH;
      const customMaxL = item.maxLayers > 0 ? item.maxLayers : 999;
      const maxFullLayersPerPallet = Math.max(
        1,
        Math.min(maxLayersByH, maxLayersByW, customMaxL)
      );

      templateMeta.set(item.id, {
        fullCount: template.length,
        spanW,
        spanL,
        fullOffsetX,
        fullOffsetZ,
        actualMinX: minX + fullOffsetX,
        actualMaxX: maxX + fullOffsetX,
        actualMinZ: minZ + fullOffsetZ,
        actualMaxZ: maxZ + fullOffsetZ,
        maxFullLayersPerPallet,
        boxesPerFullPallet: template.length * maxFullLayersPerPallet,
      });
    }
  }

  const pallets = [];

  const createEmptyPallet = (index, pW, pL, specId, specName) => ({
    id: `pallet-${index}`,
    index,
    palletSpecId: specId,
    palletSpecName: specName,
    width: pW,
    length: pL,
    baseHeight: baseH,
    maxTotalHeight: maxTotalH,
    tareWeight,
    cargoWeight: 0,
    totalWeight: tareWeight,
    cargoHeight: 0,
    totalHeight: baseH,
    boxes: [],
    layers: [],
    cargoCounts: {},
    primaryCargoId: null,
    primaryCargoName: '',
  });

  // Helper: Compute placed box positions for a full or partial layer of `cargoItem`
  const buildLayerPlacement = (pallet, cargoItem, takeCount) => {
    const template = layerTemplates.get(cargoItem.id) || [];
    const meta = templateMeta.get(cargoItem.id);
    const isFull = takeCount >= template.length;
    const prevLayer =
      pallet.layers.length > 0 ? pallet.layers[pallet.layers.length - 1] : null;
    const isEvenLayer = pallet.layers.length % 2 === 1;

    // If partial layer sits directly on a full layer of the SAME cargo,
    // keep the exact column coordinates of the full layer so every box rests squarely on a box below it.
    if (!isFull && prevLayer && prevLayer.cargoId === cargoItem.id) {
      const chosen = template.slice(0, takeCount);
      let lMinX = Infinity,
        lMaxX = 0,
        lMinZ = Infinity,
        lMaxZ = 0;
      const coords = chosen.map((p) => {
        const bx = p.x + meta.fullOffsetX;
        const bz = p.z + meta.fullOffsetZ;
        if (bx < lMinX) lMinX = bx;
        if (bx + p.w > lMaxX) lMaxX = bx + p.w;
        if (bz < lMinZ) lMinZ = bz;
        if (bz + p.l > lMaxZ) lMaxZ = bz + p.l;
        return { ...p, x: bx, z: bz };
      });
      return {
        coords,
        minX: lMinX,
        maxX: lMaxX,
        minZ: lMinZ,
        maxZ: lMaxZ,
        spanW: lMaxX - lMinX,
        spanL: lMaxZ - lMinZ,
        isPartialLayer: true,
      };
    }

    // Otherwise (Full layer OR partial layer on floor / different SKU): center compactly on pallet
    const placedTemplate = template.slice(0, takeCount);
    let minX = Infinity,
      maxX = 0,
      minZ = Infinity,
      maxZ = 0;
    for (const p of placedTemplate) {
      if (p.x < minX) minX = p.x;
      if (p.x + p.w > maxX) maxX = p.x + p.w;
      if (p.z < minZ) minZ = p.z;
      if (p.z + p.l > maxZ) maxZ = p.z + p.l;
    }
    const offsetX = Math.floor((pallet.width - (maxX - minX)) / 2) - minX;
    const offsetZ = Math.floor((pallet.length - (maxZ - minZ)) / 2) - minZ;
    const bMinX = minX + offsetX;
    const bMaxX = maxX + offsetX;
    const bMinZ = minZ + offsetZ;
    const bMaxZ = maxZ + offsetZ;

    const itemStackStyle = cargoItem.stackingStyle || (interlockLayers ? 'INTERLOCK' : 'COLUMN');

    // CROSS_TIER (홀·짝수단 90° 직교 교차): 짝수 단이고 완적 단일 때 가로↔세로 결을 90° 직교 전환 (정사각형 파레트 또는 폭·길이 수용 가능 시)
    if (
      itemStackStyle === 'CROSS_TIER' &&
      isFull &&
      isEvenLayer &&
      maxZ - minZ <= pallet.width + (cargoItem.allowedOverhang || 0) &&
      maxX - minX <= pallet.length + (cargoItem.allowedOverhang || 0)
    ) {
      const rotSpanW = maxZ - minZ;
      const rotSpanL = maxX - minX;
      const rotOffX = Math.floor((pallet.width - rotSpanW) / 2) - minZ;
      const rotOffZ = Math.floor((pallet.length - rotSpanL) / 2) - minX;
      const coords = placedTemplate.map((p) => ({
        ...p,
        x: p.z + rotOffX,
        z: p.x + rotOffZ,
        w: p.l,
        l: p.w,
        rotated: !p.rotated,
      }));
      return {
        coords,
        minX: minZ + rotOffX,
        maxX: maxZ + rotOffX,
        minZ: minX + rotOffZ,
        maxZ: maxX + rotOffZ,
        spanW: rotSpanW,
        spanL: rotSpanL,
        isPartialLayer: false,
      };
    }

    // INTERLOCK (벽돌식 홀·짝수단 180° 대칭 교차)
    const shouldMirror = itemStackStyle === 'INTERLOCK' && isFull && isEvenLayer;

    const coords = placedTemplate.map((p) => {
      const rawX = p.x + offsetX;
      const rawZ = p.z + offsetZ;
      return {
        ...p,
        x: shouldMirror ? bMinX + bMaxX - (rawX + p.w) : rawX,
        z: shouldMirror ? bMinZ + bMaxZ - (rawZ + p.l) : rawZ,
      };
    });
    return {
      coords,
      minX: bMinX,
      maxX: bMaxX,
      minZ: bMinZ,
      maxZ: bMaxZ,
      spanW: maxX - minX,
      spanL: maxZ - minZ,
      isPartialLayer: !isFull,
    };
  };

  const addLayerToPallet = (pallet, cargoItem, takeCount) => {
    const placement = buildLayerPlacement(pallet, cargoItem, takeCount);
    const layerY = baseH + pallet.cargoHeight;
    const layerBoxes = placement.coords.map((p, bIdx) => ({
      id: `${pallet.id}-box-${pallet.boxes.length + bIdx + 1}`,
      cargoId: cargoItem.id,
      name: cargoItem.name,
      color: cargoItem.color,
      weight: cargoItem.weight,
      x: p.x,
      y: layerY,
      z: p.z,
      w: p.w,
      h: cargoItem.height,
      l: p.l,
      rotated: p.rotated,
      layerIndex: pallet.layers.length,
    }));

    pallet.boxes.push(...layerBoxes);
    pallet.layers.push({
      index: pallet.layers.length,
      y: layerY,
      height: cargoItem.height,
      boxCount: layerBoxes.length,
      cargoId: cargoItem.id,
      cargoName: cargoItem.name,
      unitWeight: cargoItem.weight,
      isPartialLayer: placement.isPartialLayer,
      minX: placement.minX,
      maxX: placement.maxX,
      minZ: placement.minZ,
      maxZ: placement.maxZ,
      spanW: placement.spanW,
      spanL: placement.spanL,
    });
    pallet.cargoHeight += cargoItem.height;
    pallet.totalHeight = baseH + pallet.cargoHeight;

    const addedWeight = layerBoxes.length * cargoItem.weight;
    pallet.cargoWeight = Number((pallet.cargoWeight + addedWeight).toFixed(2));
    pallet.totalWeight = Number((tareWeight + pallet.cargoWeight).toFixed(1));
    pallet.cargoCounts[cargoItem.id] =
      (pallet.cargoCounts[cargoItem.id] || 0) + layerBoxes.length;

    cargoItem.remaining -= layerBoxes.length;
  };

  // =========================================================================
  // PHASE 1: 품목별 완적 파레트(Full Single-SKU Pallets) 우선 확정
  // (자체 수량만으로 완적 파레트가 나오는 물량은 다른 품목 잔량 파레트에 쪼개 넣지 않음)
  // =========================================================================
  for (const item of queue) {
    const meta = templateMeta.get(item.id);
    if (!meta || item.remaining <= 0) continue;

    while (item.remaining >= meta.boxesPerFullPallet) {
      const fullPallet = createEmptyPallet(
        pallets.length + 1,
        item.palletW,
        item.palletL,
        item.palletSpecId,
        item.palletSpecName
      );
      fullPallet.primaryCargoId = item.id;
      fullPallet.primaryCargoName = item.name;

      for (let l = 0; l < meta.maxFullLayersPerPallet; l++) {
        addLayerToPallet(fullPallet, item, meta.fullCount);
      }
      pallets.push(fullPallet);
    }

    // 단독 적재 모드(mixCargos === false)이면 남은 잔량도 즉시 전용 파레트로 적재
    if (!mixCargos && item.remaining > 0) {
      let remPallet = null;
      while (item.remaining > 0) {
        if (!remPallet) {
          remPallet = createEmptyPallet(
            pallets.length + 1,
            item.palletW,
            item.palletL,
            item.palletSpecId,
            item.palletSpecName
          );
          remPallet.primaryCargoId = item.id;
          remPallet.primaryCargoName = item.name;
        }
        const remH = maxLoadH - remPallet.cargoHeight;
        const maxByW =
          item.weight > 0
            ? Math.max(
                remPallet.boxes.length === 0 ? 1 : 0,
                Math.floor((maxCargoWeight - remPallet.cargoWeight) / item.weight)
              )
            : item.remaining;
        const takeCount = Math.min(meta.fullCount, item.remaining, maxByW);
        const reachedCustomMaxL =
          item.maxLayers > 0 && remPallet.layers.length >= item.maxLayers;
        if (item.height > remH || takeCount <= 0 || reachedCustomMaxL) {
          pallets.push(remPallet);
          remPallet = null;
          continue;
        }
        addLayerToPallet(remPallet, item, takeCount);
      }
      if (remPallet && remPallet.boxes.length > 0) {
        pallets.push(remPallet);
      }
    }
  }

  // =========================================================================
  // PHASE 2: 다품종 혼적 허용 시 잔량(Remainder) 합포장 — 물리적 안정성 검증
  // 1) 불완전 부분 단(Partial Layer) 위에는 절대 다른 층을 올리지 않음 (부분 단은 무조건 최상단)
  // 2) 위층의 바닥 외곽이 아래층 지지 면적 밖으로 돌출(공중부양/버섯형)되면 적재 금지
  // 3) 아래층보다 단중이 과도하게 무거운 품목을 위에 올리는 하중 역전 금지
  // =========================================================================
  if (mixCargos) {
    // 잔량 품목 정렬: 완적 단만 있는 품목 우선 -> 바닥 지지 면적이 넓은 순 -> 단중이 무거운 순
    const remainderQueue = queue
      .filter((c) => c.remaining > 0 && templateMeta.has(c.id))
      .sort((a, b) => {
        const metaA = templateMeta.get(a.id);
        const metaB = templateMeta.get(b.id);
        const aHasPartial = a.remaining % metaA.fullCount !== 0 ? 1 : 0;
        const bHasPartial = b.remaining % metaB.fullCount !== 0 ? 1 : 0;
        if (aHasPartial !== bHasPartial) return aHasPartial - bHasPartial;
        const areaA = metaA.spanW * metaA.spanL;
        const areaB = metaB.spanW * metaB.spanL;
        if (Math.abs(areaB - areaA) > 10000) return areaB - areaA;
        return (b.weight || 0) - (a.weight || 0);
      });

    const canStackLayerOnPallet = (pallet, candidateCargo, takeCount) => {
      if (pallet.layers.length === 0) return true;
      const topLayer = pallet.layers[pallet.layers.length - 1];

      // 규칙 1: 이미 부분 단(Partial Layer)이 올라간 파레트 위에는 절대 추가 적재 불가!
      if (topLayer.isPartialLayer) return false;

      // 동일 품목의 연속 적재(완적 단 위에 같은 품목의 완적/부분 단 적재)는 항상 허용
      if (topLayer.cargoId === candidateCargo.id) return true;

      // 규칙 2: 타 품목 적재 시 단중(무게) 역전 체크 (위층 박스가 아래층 박스보다 25% 초과 무거우면 파손 위험으로 차단)
      if (topLayer.unitWeight > 0 && candidateCargo.weight > topLayer.unitWeight * 1.25) {
        return false;
      }

      // 규칙 3: 하부 지지 면적(Support Footprint) 체크 — 위층 박스가 아래층 외곽 밖으로 허공에 뜨는지 검증
      const preview = buildLayerPlacement(pallet, candidateCargo, takeCount);
      const overhangMargin = 10; // 10mm 이내 미세 정렬 오차만 허용
      const supportedInX =
        preview.minX >= topLayer.minX - overhangMargin &&
        preview.maxX <= topLayer.maxX + overhangMargin;
      const supportedInZ =
        preview.minZ >= topLayer.minZ - overhangMargin &&
        preview.maxZ <= topLayer.maxZ + overhangMargin;

      if (!supportedInX || !supportedInZ) {
        return false;
      }

      return true;
    };

    let currentPallet = null;
    let safetyCounter = 0;
    while (remainderQueue.some((c) => c.remaining > 0) && safetyCounter < 5000) {
      safetyCounter++;

      if (!currentPallet) {
        const firstCand = remainderQueue.find((c) => c.remaining > 0);
        if (!firstCand) break;
        currentPallet = createEmptyPallet(
          pallets.length + 1,
          firstCand.palletW,
          firstCand.palletL,
          firstCand.palletSpecId,
          firstCand.palletSpecName
        );
        currentPallet.primaryCargoId = firstCand.id;
        currentPallet.primaryCargoName = firstCand.name;
      }

      const remHeight = maxLoadH - currentPallet.cargoHeight;
      const remWeight = maxCargoWeight - currentPallet.cargoWeight;

      // 현재 파레트 위에 물리적으로 안전하게 올릴 수 있는 다음 층 탐색
      // (현재 쌓고 있던 품목이 남아 있으면 그 품목을 최우선으로 마저 적재)
      const lastCargoId =
        currentPallet.layers.length > 0
          ? currentPallet.layers[currentPallet.layers.length - 1].cargoId
          : null;

      const orderedCandidates = [...remainderQueue].sort((a, b) => {
        if (a.id === lastCargoId && b.id !== lastCargoId) return -1;
        if (b.id === lastCargoId && a.id !== lastCargoId) return 1;
        return 0;
      });

      let matchedCargo = null;
      let matchedTakeCount = 0;

      for (const cand of orderedCandidates) {
        if (cand.remaining <= 0) continue;
        if (cand.palletW !== currentPallet.width || cand.palletL !== currentPallet.length) continue;
        if (cand.height > remHeight) continue;
        if (cand.weight > remWeight && currentPallet.boxes.length > 0) continue;

        const meta = templateMeta.get(cand.id);
        const maxByW =
          cand.weight > 0
            ? Math.max(
                currentPallet.boxes.length === 0 ? 1 : 0,
                Math.floor((maxCargoWeight - currentPallet.cargoWeight) / cand.weight)
              )
            : cand.remaining;
        const takeCount = Math.min(meta.fullCount, cand.remaining, maxByW);
        if (takeCount <= 0) continue;

        if (canStackLayerOnPallet(currentPallet, cand, takeCount)) {
          matchedCargo = cand;
          matchedTakeCount = takeCount;
          break;
        }
      }

      if (!matchedCargo) {
        if (currentPallet.boxes.length > 0) {
          pallets.push(currentPallet);
          currentPallet = null;
          continue;
        }
        break;
      }

      addLayerToPallet(currentPallet, matchedCargo, matchedTakeCount);

      // 방금 올린 층이 부분 단(Partial Layer)이면 그 위에는 아무것도 올릴 수 없으므로 즉시 파레트 마감!
      const justAddedLayer = currentPallet.layers[currentPallet.layers.length - 1];
      if (justAddedLayer.isPartialLayer) {
        pallets.push(currentPallet);
        currentPallet = null;
      }
    }

    if (currentPallet && currentPallet.boxes.length > 0) {
      pallets.push(currentPallet);
    }

    // 품목별 완적 파레트 바로 뒤에 동일 품목 부분 파레트가 이어지도록 정렬 (복합 혼적 파레트는 맨 뒤 배치)
    const cargoOrderMap = new Map(queue.map((c, idx) => [c.id, idx]));
    pallets.sort((a, b) => {
      const aMixed = Object.keys(a.cargoCounts).length > 1 ? 1 : 0;
      const bMixed = Object.keys(b.cargoCounts).length > 1 ? 1 : 0;
      if (aMixed !== bMixed) return aMixed - bMixed;
      const aOrder = cargoOrderMap.get(a.primaryCargoId) ?? 999;
      const bOrder = cargoOrderMap.get(b.primaryCargoId) ?? 999;
      if (aOrder !== bOrder) return aOrder - bOrder;
      return b.boxes.length - a.boxes.length;
    });
    pallets.forEach((p, idx) => {
      p.index = idx + 1;
      p.id = `pallet-${idx + 1}`;
    });
  }

  // Compute CBM, Volume Utilization, Overhang, and Local CoG per pallet
  for (const p of pallets) {
    let boxVolumeMm3 = 0;
    let minBoxX = Infinity,
      maxBoxX = -Infinity,
      minBoxZ = Infinity,
      maxBoxZ = -Infinity;
    for (const b of p.boxes) {
      boxVolumeMm3 += b.w * b.h * b.l;
      if (b.x < minBoxX) minBoxX = b.x;
      if (b.x + b.w > maxBoxX) maxBoxX = b.x + b.w;
      if (b.z < minBoxZ) minBoxZ = b.z;
      if (b.z + b.l > maxBoxZ) maxBoxZ = b.z + b.l;
    }
    const cargoSpanW = p.boxes.length > 0 ? Math.round(maxBoxX - minBoxX) : 0;
    const cargoSpanL = p.boxes.length > 0 ? Math.round(maxBoxZ - minBoxZ) : 0;
    p.cargoSpanW = cargoSpanW;
    p.cargoSpanL = cargoSpanL;
    p.overhangW = Math.max(0, cargoSpanW - p.width);
    p.overhangL = Math.max(0, cargoSpanL - p.length);
    p.maxOverhangMm = Math.max(p.overhangW, p.overhangL);

    const palletEnvelopeMm3 = p.width * p.length * p.totalHeight;
    const maxAllowedCargoMm3 = p.width * p.length * maxLoadH;
    p.cargoCbm = Number((boxVolumeMm3 / 1e9).toFixed(3));
    p.totalCbm = Number((palletEnvelopeMm3 / 1e9).toFixed(3));
    p.volumeUtilization = Number(
      Math.min(100, (boxVolumeMm3 / Math.max(1, maxAllowedCargoMm3)) * 100).toFixed(1)
    );
    p.localCoG = computePalletLocalCoG(p);
    p.isPartial =
      p.boxes.length > 0 &&
      p.layers.length > 0 &&
      (p.layers.length < Math.floor(maxLoadH / (p.boxes[0]?.h || 200)) ||
        p.boxes.length < p.layers.length * (p.layers[0]?.boxCount || 1));
  }

  // Generate Pallet Weight Breakdown Groups with rich loading instructions
  const groupMap = new Map();
  pallets.forEach((p, pIdx) => {
    const cargoDesc = Object.entries(p.cargoCounts)
      .map(([cid, cnt]) => {
        const cObj = cargos.find((c) => c.id === cid);
        return `${cObj ? cObj.name : cid} · ${cnt}박스`;
      })
      .join(' + ');
    const key = `${cargoDesc}|${p.width}x${p.length}|${p.totalWeight}`;
    if (!groupMap.has(key)) {
      const layer0Boxes = p.boxes.filter((b) => (b.layerIndex || 0) === 0);
      const normalCnt = layer0Boxes.filter((b) => !b.rotated).length;
      const rotCnt = layer0Boxes.filter((b) => b.rotated).length;
      let orientDesc = '';
      if (normalCnt > 0 && rotCnt > 0) {
        orientDesc = `정방향 ${normalCnt}개 + 90°회전 ${rotCnt}개 (1단 ${layer0Boxes.length}박스)`;
      } else if (rotCnt > 0) {
        orientDesc = `90°회전 ${rotCnt}개 (1단 ${layer0Boxes.length}박스)`;
      } else {
        orientDesc = `정방향 ${normalCnt}개 (1단 ${layer0Boxes.length}박스)`;
      }

      groupMap.set(key, {
        label: cargoDesc,
        primaryCargoName: p.primaryCargoName,
        palletSpecId: p.palletSpecId,
        palletDim: `${p.width}×${p.length}mm`,
        palletW: p.width,
        palletL: p.length,
        cargoSpanW: p.cargoSpanW,
        cargoSpanL: p.cargoSpanL,
        overhangW: p.overhangW,
        overhangL: p.overhangL,
        maxOverhangMm: p.maxOverhangMm,
        palletCount: 0,
        firstLayerBoxCount: layer0Boxes.length,
        layerCount: p.layers.length,
        boxesPerPallet: p.boxes.length,
        totalHeight: p.totalHeight,
        cargoHeight: p.cargoHeight,
        unitPalletWeight: p.totalWeight,
        totalGroupWeight: 0,
        orientDesc,
        samplePalletIndex: pIdx,
        palletIndices: [],
      });
    }
    const g = groupMap.get(key);
    g.palletCount += 1;
    g.totalGroupWeight = Number((g.palletCount * g.unitPalletWeight).toFixed(1));
    g.palletIndices.push(p.index);
  });

  return {
    pallets,
    palletWeightGroups: Array.from(groupMap.values()),
    unpackedErrors,
  };
}

/**
 * 컨테이너 내부의 3D 무게중심(Center of Gravity) 및 전후/좌우 밸런스 분석
 */
function analyzeContainerCoG(container) {
  const cL = container.spec.length;
  const cW = container.spec.width;
  const cH = container.spec.height;

  let momentX = 0; // Length direction (0 = Front/Inner wall, cL = Door)
  let momentY = 0; // Height direction (0 = Floor, cH = Ceiling)
  let momentZ = 0; // Width direction (0 = Left wall, cW = Right wall)
  let totalMass = 0;

  let frontHalfWeight = 0; // 0 .. cL/2 (안쪽 벽면)
  let rearHalfWeight = 0; // cL/2 .. cL (도어 쪽)
  let leftRowWeight = 0; // 0 .. cW/2 (좌측 열)
  let rightRowWeight = 0; // cW/2 .. cW (우측 열)

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

  // Compute occupied cargo length span for realistic CoG center evaluation
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

  // Safety evaluation: longitudinal CoG within 40%~60% and lateral within 45%~55%
  const isLateralSafe = Math.abs(50 - widthRatioPct) <= 6;
  const isLongitudinalSafe = Math.abs(50 - lengthRatioPct) <= 10;

  let status = 'SAFE';
  let statusText = '안전 (무게중심 균형 양호)';
  if (!isLateralSafe || !isLongitudinalSafe) {
    status = 'WARN';
    statusText = !isLateralSafe
      ? '주의 (좌우 중량 편차 확인)'
      : '안내 (전후 무게중심 안쪽 이동)';
  }

  return {
    cogX,
    cogY,
    cogZ,
    maxOccupiedX,
    offsetXFromContainerCenter,
    offsetXFromLoadCenter,
    offsetZFromCenter,
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
 * Step 2: 생성된 파레트들을 컨테이너에 적재 (다중 파레트 규격 1100x1100 & 1200x1000 혼합 및 무게중심 밸런싱 지원)
 */
export function packPalletsIntoContainers(pallets, containerSpec, options = {}) {
  const cLength = Number(containerSpec.length) || 12032;
  const cWidth = Number(containerSpec.width) || 2352;
  const cHeight = Number(containerSpec.height) || 2698;
  const cMaxWeight = Number(containerSpec.maxWeight) || 26500;
  const allowDoubleStack = Boolean(options.doubleStack);
  const balanceContainers = options.balanceContainers !== false; // 기본 균등/무게중심 배분 활성화
  const optimizeCoG = options.optimizeCoG !== false; // 무게중심 최적화 배치

  if (!pallets || pallets.length === 0) {
    return {
      containers: [],
      floorSlotsPerContainer: 0,
      maxPalletsPerContainer: 0,
      unfitPallets: [],
    };
  }

  // Filter pallets that fit inside container height and width
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

  // Estimate floor slot capacity per container (typically 20 for 40ft, 10 for 20ft)
  const avgLength =
    validPallets.reduce((acc, p) => acc + Math.max(p.width, p.length), 0) /
    Math.max(1, validPallets.length);
  const colsPerContainer = Math.max(1, Math.floor(cLength / Math.min(1150, avgLength)));
  const floorSlotsPerContainer = colsPerContainer * 2;
  const maxPalletsPerContainer = allowDoubleStack
    ? floorSlotsPerContainer * 2
    : floorSlotsPerContainer;

  // Group and distribute pallets across containers when balanceContainers is active:
  // If we have e.g. 38 pallets and 2 containers, split each SKU's full pallets evenly between Container #1 and Container #2,
  // and put partial/light pallets in Container #2 near the door!
  let orderedContainerBuckets = [];

  // Helper to orient a pair of pallets (p1, p2) or single pallet (p1) across container width (cWidth = 2352mm)
  // while adapting to whether we want compact X-length (to fit 10 columns in 40ft) or extended X-length (to cover more floor when <10 columns)
  const orientPalletFor2Rows = (p, preferCompactX = false) => {
    const halfW = cWidth / 2; // 1176mm
    const maxDim = Math.max(p.width, p.length);
    const minDim = Math.min(p.width, p.length);

    // If pallet is 1200x1000 and preferCompactX is true, check if 1200mm can go along Z (when paired with <=1100mm or alone)
    if (preferCompactX && maxDim <= 1220 && minDim <= 1050 && p.width !== p.length) {
      // lengthX = 1000, widthZ = 1200
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
  };

  // Try packing a given list of pallets into 1 container; returns { placedPallets, overflowPallets }
  // 핵심 원칙:
  // 1) 무조건 1단 바닥(Tier 1)을 컨테이너 끝까지 먼저 채워서 바닥 면적을 최대로 활용한다.
  // 2) 2단 적재(allowDoubleStack)가 켜져 있더라도 바닥(Tier 1)이 다 차기 전에는 절대 2단에 올리지 않는다.
  // 3) 바닥 마지막 열이 홀수(1개)로 끝날 경우, 한쪽 구석이 아니라 폭 중앙(Center-Lock)에 배치해 좌우 열을 동시에 지지한다.
  const tryPackSingleContainer = (palletList) => {
    let workingList = [...palletList];

    if (optimizeCoG && workingList.length > 2) {
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

    const placedPallets = [];
    const overflowPallets = [];
    let currentWeight = 0;
    let cursorX = 0;
    let slotCounter = 0;

    // Estimate how many floor columns we want to fit so we can pick adaptive gap & orientation
    const targetFloorPallets = Math.min(workingList.length, floorSlotsPerContainer);
    const estCols = Math.ceil(targetFloorPallets / 2);
    const rawLengthSum = workingList
      .slice(0, targetFloorPallets)
      .reduce((acc, p, i) => (i % 2 === 0 ? acc + Math.max(p.width, p.length) : acc), 0);
    const needsTightFit = rawLengthSum + Math.max(0, estCols - 1) * 15 > cLength;
    const colGapX = needsTightFit ? 2 : 12;

    let idx = 0;
    const openTopSlots = []; // floor slots available for 2nd tier AFTER floor is filled

    // =========================================================================
    // PHASE 1: 컨테이너 1단 바닥(Tier 1) 우선 배치
    // =========================================================================
    while (idx < workingList.length) {
      const p1 = workingList[idx];

      if (currentWeight + p1.totalWeight > cMaxWeight && placedPallets.length > 0) {
        break;
      }

      const p2Candidate = idx + 1 < workingList.length ? workingList[idx + 1] : null;

      // Determine orientation for p1 (and p2Candidate if present)
      let o1 = orientPalletFor2Rows(p1, false);
      let o2 = p2Candidate ? orientPalletFor2Rows(p2Candidate, false) : null;

      // If tight fit is needed and one of (p1, p2) is 1100 and the other is 1200x1000, we can orient 1200 along Z (1200+1100=2300 <= 2352) to save 100mm of container length!
      if (needsTightFit && p2Candidate) {
        const tryO1 = orientPalletFor2Rows(p1, true);
        const tryO2 = orientPalletFor2Rows(p2Candidate, true);
        if (tryO1.widthZ + tryO2.widthZ <= cWidth) {
          o1 = tryO1;
          o2 = tryO2;
        } else if (tryO1.widthZ + o2.widthZ <= cWidth) {
          o1 = tryO1;
        } else if (o1.widthZ + tryO2.widthZ <= cWidth) {
          o2 = tryO2;
        }
      }

      if (cursorX + o1.lengthX > cLength) {
        // 1단 바닥 길이 소진 완료 -> Phase 2(2단 적재) 또는 다음 컨테이너로 이동
        break;
      }

      // Check if a second pallet (Right Row) will also be placed in this column
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
        currentWeight += p1.totalWeight + p2Candidate.totalWeight;
        if (allowDoubleStack) {
          openTopSlots.push({ ...slot1, bottomPallet: p1 });
          openTopSlots.push({ ...slot2, bottomPallet: p2Candidate });
        }
        idx += 2;
        cursorX += Math.max(o1.lengthX, o2.lengthX) + colGapX;
      } else {
        // 마지막 단독 파레트(홀수 파레트): 한쪽 구석에 치우치지 않도록 폭 중앙(Center-Lock)에 배치하여 앞열 좌·우 파레트를 동시에 지지!
        const zCenter = Math.max(0, Math.round((cWidth - o1.widthZ) / 2));
        const slot1 = {
          pallet: p1,
          slotIndex: slotCounter++,
          tier: 1,
          x: cursorX,
          y: 0,
          z: zCenter,
          length: o1.lengthX,
          width: o1.widthZ,
          rotated: o1.rotated,
        };
        placedPallets.push(slot1);
        currentWeight += p1.totalWeight;
        if (allowDoubleStack) {
          openTopSlots.push({ ...slot1, bottomPallet: p1 });
        }
        idx += 1;
        cursorX += o1.lengthX + colGapX;
      }
    }

    // =========================================================================
    // PHASE 2: 1단 바닥을 모두 채운 뒤에도 남은 파레트가 있고 2단 적재가 허용된 경우에만 2단(Tier 2) 배치
    // =========================================================================
    if (allowDoubleStack && idx < workingList.length && openTopSlots.length > 0) {
      // 무게중심(CoG) 안정을 위해 컨테이너 중앙부 슬롯부터 2단 적재
      const midX = cursorX / 2;
      openTopSlots.sort(
        (a, b) => Math.abs(a.x + a.length / 2 - midX) - Math.abs(b.x + b.length / 2 - midX)
      );

      for (let k = idx; k < workingList.length; k++) {
        const cand = workingList[k];
        const sIdx = openTopSlots.findIndex(
          (s) =>
            !s.bottomPallet.isPartial &&
            s.bottomPallet.totalHeight + cand.totalHeight <= cHeight &&
            currentWeight + cand.totalWeight <= cMaxWeight &&
            cand.totalWeight <= s.bottomPallet.totalWeight * 1.15
        );
        if (sIdx !== -1) {
          const targetSlot = openTopSlots.splice(sIdx, 1)[0];
          placedPallets.push({
            pallet: cand,
            slotIndex: targetSlot.slotIndex,
            tier: 2,
            x: targetSlot.x,
            y: targetSlot.bottomPallet.totalHeight,
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
    } else if (idx < workingList.length) {
      overflowPallets.push(...workingList.slice(idx));
    }

    return { placedPallets, overflowPallets };
  };

  // ===========================================================================
  // 다수 컨테이너(2대 이상: 2대, 3대, 4대 등 모든 경우) 생성 시 전 호기 바닥 균등 배분
  // - 1호기만 가득 채우고 나머지 호기에 잔여 화물을 싣는 현상을 원천 방지
  // - 2단 적재 모드일 때도 모든 호기의 1단 바닥을 먼저 균등하게 채운 뒤 2단에 배분
  // ===========================================================================
  const containers = [];

  if (balanceContainers && validPallets.length > 0) {
    // 1. 먼저 최소 몇 대의 컨테이너(neededCount)가 필요한지 시뮬레이션
    let testRem = [...validPallets];
    let neededCount = 0;
    while (testRem.length > 0 && neededCount < 50) {
      const res = tryPackSingleContainer(testRem);
      if (res.placedPallets.length === 0) break;
      neededCount++;
      testRem = res.overflowPallets;
    }

    if (neededCount >= 2) {
      const buckets = Array.from({ length: neededCount }, () => []);
      const bucketWeights = new Array(neededCount).fill(0);
      const targetMaxPerBucket = Math.ceil(validPallets.length / neededCount);

      // 품목(SKU)별로 완파레트(full)와 부분파레트(partial)를 나누어 N개 컨테이너 버킷에 골고루 라운드로빈/중량균형 배분
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

      // 완파레트들을 N개 컨테이너에 수량·중량 균등 배분
      for (const p of allFulls) {
        // 현재 파레트 수가 가장 적은 버킷(동률이면 총 중량이 가장 적은 버킷) 선택
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
      }

      // 부분/잔여 파레트들도 파레트 수가 적은 버킷부터 골고루 배분
      for (const p of allPartials) {
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
      }

      orderedContainerBuckets = buckets;
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

  // Finalize container metrics & Center of Gravity (CoG) analysis
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
    c.skuBreakdown = skuBreakdown;
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

    // 실무 컨테이너 작업성 & 쇼링/에어백/도어 클리어런스 정밀 진단
    const maxStackH = c.placedPallets.reduce(
      (max, pp) => Math.max(max, pp.y + pp.pallet.totalHeight),
      0
    );
    const doorH = Number(c.spec.doorHeight) || cHeight - 110;
    const doorClearanceMm = doorH - maxStackH;
    let doorStatus = 'SAFE';
    let doorStatusText = `도어 통과 여유 +${doorClearanceMm}mm (지게차 진입 원활)`;
    if (doorClearanceMm < 0) {
      doorStatus = 'DANGER';
      doorStatusText = `도어 입구 높이(${doorH}mm) ${Math.abs(doorClearanceMm)}mm 초과 — 문턱 걸림 주의!`;
    } else if (doorClearanceMm < 80) {
      doorStatus = 'WARN';
      doorStatusText = `도어 상부 여유 ${doorClearanceMm}mm (밀착 진입·마스트 틸팅 주의)`;
    }

    const maxOccupiedX = c.placedPallets.reduce(
      (max, pp) => Math.max(max, pp.x + pp.length),
      0
    );
    const rearClearanceMm = Math.max(0, cLength - maxOccupiedX);
    let shoringText = '여유 공간 적정';
    if (rearClearanceMm <= 180) {
      shoringText = `도어 쪽 잔여 ${rearClearanceMm}mm — 밀착 적재로 전후 쏠림/쇼링 부담 최소화`;
    } else if (rearClearanceMm <= 900) {
      shoringText = `도어 쪽 잔여 ${rearClearanceMm}mm — 운송 중 밀림 방지를 위해 후미 쇼링목/라싱 벨트 권장`;
    } else {
      shoringText = `도어 쪽 여유 ${(rearClearanceMm / 1000).toFixed(2)}m — 후미 파레트 고박(Lashing) 또는 계단식 배치 권장`;
    }

    // 폭 방향(Z축) 유격 및 에어백(Dunnage Bag) 진단
    const tier1Pallets = c.placedPallets.filter((p) => p.tier === 1);
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

    c.fieldDiagnostics = {
      maxStackHeightMm: maxStackH,
      doorHeightMm: doorH,
      doorClearanceMm,
      doorStatus,
      doorStatusText,
      rearClearanceMm,
      shoringText,
      lateralGapMm,
      dunnageBagText,
      floorUtilizationPct,
    };
  }

  return {
    containers,
    floorSlotsPerContainer: cLength < 7000 ? 10 : 20,
    maxPalletsPerContainer: (cLength < 7000 ? 10 : 20) * (allowDoubleStack ? 2 : 1),
    unfitPallets,
  };
}

/**
 * 품목별 최적 파레트 규격(T11 1100x1100 vs T12 1200x1000) 자동 추천
 */
export function autoRecommendPalletSpecs(cargos, overhang = 0) {
  return cargos.map((c) => {
    const t11Count = computeBest2DLayer(
      1100 + overhang,
      1100 + overhang,
      c.width,
      c.length,
      c.allowRotate !== false
    ).length;
    const t12Count = computeBest2DLayer(
      1200 + overhang,
      1000 + overhang,
      c.width,
      c.length,
      c.allowRotate !== false
    ).length;

    // T12가 1단 적재 수량이 더 많으면 T12 선택, 같거나 T11이 더 많으면 표준 T11 선택
    const bestSpec = t12Count > t11Count ? 'T12' : 'T11';
    return {
      ...c,
      palletSpecId: bestSpec,
    };
  });
}

/**
 * 사후 파레트 돌출(Overhang) 자동 감지 및 품목별 돌출 허용 시 적재 효율 분석
 * - 정사이즈(0mm) 적재 결과와 소폭 돌출(1~150mm) 허용 시의 단당 적재 수량·파레트 절감 효과를 비교
 * - 또한 1200×1000 파레트로 전환 시 돌출(0mm) 없이 적재 가능한지도 함께 진단
 */
export function analyzeOverhangDiagnostics(cargos, palletConfig, options = {}) {
  const baseH = Math.max(0, Number(palletConfig.baseHeight) ?? 150);
  const maxTotalH = Math.max(baseH + 50, Number(palletConfig.maxTotalHeight) || 1700);
  const maxLoadH = maxTotalH - baseH;
  const maxCargoWeight = Math.max(1, Number(palletConfig.maxWeight) || 1000);
  const defaultOv = Math.max(0, Number(options.overhang) || 0);

  const measureBounds = (tpl) => {
    if (!tpl || tpl.length === 0) return { count: 0, spanW: 0, spanL: 0 };
    let minX = Infinity,
      maxX = -Infinity,
      minZ = Infinity,
      maxZ = -Infinity;
    for (const b of tpl) {
      if (b.x < minX) minX = b.x;
      if (b.x + b.w > maxX) maxX = b.x + b.w;
      if (b.z < minZ) minZ = b.z;
      if (b.z + b.l > maxZ) maxZ = b.z + b.l;
    }
    return {
      count: tpl.length,
      spanW: Math.round(maxX - minX),
      spanL: Math.round(maxZ - minZ),
    };
  };

  const calcPalletNeed = (perLayerCount, item) => {
    if (perLayerCount <= 0) {
      return { maxLayers: 0, boxesPerPallet: 0, totalPallets: 0 };
    }
    const maxLayersByH = Math.max(1, Math.floor(maxLoadH / Math.max(1, Number(item.height) || 1)));
    const layerWeight = perLayerCount * Math.max(0, Number(item.weight) || 0);
    const maxLayersByW =
      layerWeight > 0 ? Math.max(1, Math.floor(maxCargoWeight / layerWeight)) : maxLayersByH;
    const customMaxL = Number(item.maxLayers) > 0 ? Math.floor(Number(item.maxLayers)) : 999;
    const maxLayers = Math.max(1, Math.min(maxLayersByH, maxLayersByW, customMaxL));
    const boxesPerPallet = perLayerCount * maxLayers;
    const qty = Math.max(0, Math.floor(Number(item.quantity) || 0));
    return {
      maxLayers,
      boxesPerPallet,
      totalPallets: Math.ceil(qty / boxesPerPallet),
    };
  };

  return cargos
    .filter((c) => Number(c.quantity) > 0 && Number(c.width) > 0 && Number(c.length) > 0)
    .map((c, idx) => {
      const resolved = resolvePalletDimsForCargo(c, palletConfig);
      const pW = resolved.width;
      const pL = resolved.length;
      const allowRot = c.allowRotate !== false;
      const appliedOverhang =
        c.allowedOverhang !== undefined && c.allowedOverhang !== null
          ? Math.max(0, Number(c.allowedOverhang) || 0)
          : defaultOv;

      // 1. 정사이즈(0mm 돌출) 적재 기준
      const strictTpl = computeBest2DLayer(pW, pL, c.width, c.length, allowRot);
      const strictBounds = measureBounds(strictTpl);
      const strictStats = calcPalletNeed(strictBounds.count, c);

      // 2. 현재 적용된 돌출 기준
      const curTpl = computeBest2DLayer(
        pW + appliedOverhang,
        pL + appliedOverhang,
        c.width,
        c.length,
        allowRot
      );
      const curBounds = measureBounds(curTpl);
      const curStats = calcPalletNeed(curBounds.count, c);
      const curOverhangW = Math.max(0, curBounds.spanW - pW);
      const curOverhangL = Math.max(0, curBounds.spanL - pL);
      const curMaxOverhangMm = Math.max(curOverhangW, curOverhangL);

      // 3. 소폭 돌출(1~150mm) 허용 시 적재 수량이 증가하는 최소 돌출 구간 탐색
      let opportunity = null;
      for (let testOv = 2; testOv <= 150; testOv += 2) {
        const candTpl = computeBest2DLayer(
          pW + testOv,
          pL + testOv,
          c.width,
          c.length,
          allowRot
        );
        if (candTpl.length > strictBounds.count) {
          const candBounds = measureBounds(candTpl);
          const ovW = Math.max(0, candBounds.spanW - pW);
          const ovL = Math.max(0, candBounds.spanL - pL);
          const exactOvMm = Math.max(ovW, ovL);
          const candStats = calcPalletNeed(candBounds.count, c);
          opportunity = {
            requiredOverhangMm: exactOvMm,
            overhangW: ovW,
            overhangL: ovL,
            eachSideW: Number((ovW / 2).toFixed(1)),
            eachSideL: Number((ovL / 2).toFixed(1)),
            eachSideMax: Number((exactOvMm / 2).toFixed(1)),
            spanW: candBounds.spanW,
            spanL: candBounds.spanL,
            layerCount: candBounds.count,
            boxesPerPallet: candStats.boxesPerPallet,
            totalPallets: candStats.totalPallets,
            savedPallets: Math.max(0, strictStats.totalPallets - candStats.totalPallets),
            needsOverhangToFitAtAll: strictBounds.count === 0,
          };
          break;
        }
      }

      // 4. 1200×1000 (T12) 파레트 사용 시 돌출(0mm) 없이 적재 수량이 늘어나는지 확인
      const t12Tpl = computeBest2DLayer(1200, 1000, c.width, c.length, allowRot);
      const t12Bounds = measureBounds(t12Tpl);
      const t12Stats = calcPalletNeed(t12Bounds.count, c);
      const canSolveWithT12NoOverhang =
        (pW !== 1200 || pL !== 1000) && t12Bounds.count > strictBounds.count;

      return {
        cargoId: c.id || `cargo-${idx + 1}`,
        cargoName: c.name || `화물 ${idx + 1}`,
        color: c.color || CARGO_COLORS[idx % CARGO_COLORS.length],
        boxW: Number(c.width),
        boxL: Number(c.length),
        boxH: Number(c.height),
        quantity: Number(c.quantity),
        palletSpecId: resolved.specId,
        palletSpecName: resolved.specName,
        palletW: pW,
        palletL: pL,
        appliedOverhang,
        isOverhangActive: curMaxOverhangMm > 0,
        strict: {
          layerCount: strictBounds.count,
          spanW: strictBounds.spanW,
          spanL: strictBounds.spanL,
          boxesPerPallet: strictStats.boxesPerPallet,
          totalPallets: strictStats.totalPallets,
        },
        current: {
          layerCount: curBounds.count,
          spanW: curBounds.spanW,
          spanL: curBounds.spanL,
          overhangW: curOverhangW,
          overhangL: curOverhangL,
          maxOverhangMm: curMaxOverhangMm,
          eachSideMax: Number((curMaxOverhangMm / 2).toFixed(1)),
          boxesPerPallet: curStats.boxesPerPallet,
          totalPallets: curStats.totalPallets,
        },
        opportunity,
        t12Alternative: canSolveWithT12NoOverhang
          ? {
              layerCount: t12Bounds.count,
              spanW: t12Bounds.spanW,
              spanL: t12Bounds.spanL,
              boxesPerPallet: t12Stats.boxesPerPallet,
              totalPallets: t12Stats.totalPallets,
              savedPallets: Math.max(0, strictStats.totalPallets - t12Stats.totalPallets),
            }
          : null,
      };
    });
}

/**
 * 컨테이너 바닥 빈 슬롯을 채우기 위해 고단 파레트의 상부 층(Layer)을 분할하여 바닥 전체에 고르게 펼치는 함수
 * - 예: 40ft 2대(바닥 총 40슬롯)에 30~38파레트가 있을 때, 빈 바닥 공간으로 인해 운항 중 화물이 쏠리거나
 *   추가 쇼링/고정장치 비용이 발생하지 않도록 5단 파레트 일부를 3단+2단으로 나누어 40슬롯(20+20)을 모두 채움
 */
export function spreadPalletsToFillFloorSlots(initialPallets, targetFloorSlots, cargos, palletConfig) {
  if (!initialPallets || initialPallets.length === 0 || initialPallets.length >= targetFloorSlots) {
    return null;
  }

  const baseH = Math.max(0, Number(palletConfig.baseHeight) ?? 150);
  const maxTotalH = Math.max(baseH + 50, Number(palletConfig.maxTotalHeight) || 1700);
  const maxLoadH = maxTotalH - baseH;
  const tareWeight = Math.max(0, Number(palletConfig.tareWeight) ?? 17);

  const rebuildPalletStats = (rawPallet, newBoxes, newIndex) => {
    const layerMap = new Map();
    let maxY = baseH;
    let cargoW = 0;
    let boxVolMm3 = 0;
    let minX = Infinity,
      maxX = -Infinity,
      minZ = Infinity,
      maxZ = -Infinity;
    const cargoCounts = {};

    for (const b of newBoxes) {
      const lIdx = b.layerIndex || 0;
      if (!layerMap.has(lIdx)) {
        layerMap.set(lIdx, {
          layerIndex: lIdx,
          cargoId: b.cargoId,
          cargoName: b.name,
          boxCount: 0,
          y: b.y,
          height: b.h,
        });
      }
      layerMap.get(lIdx).boxCount += 1;
      if (b.y + b.h > maxY) maxY = b.y + b.h;
      cargoW += b.weight || 0;
      boxVolMm3 += b.w * b.h * b.l;
      if (b.x < minX) minX = b.x;
      if (b.x + b.w > maxX) maxX = b.x + b.w;
      if (b.z < minZ) minZ = b.z;
      if (b.z + b.l > maxZ) maxZ = b.z + b.l;
      cargoCounts[b.cargoId] = (cargoCounts[b.cargoId] || 0) + 1;
    }

    const layers = Array.from(layerMap.values()).sort((a, b) => a.layerIndex - b.layerIndex);
    const totalHeight = Math.round(maxY);
    const cargoHeight = Math.max(0, totalHeight - baseH);
    const cargoWeight = Number(cargoW.toFixed(2));
    const totalWeight = Number((tareWeight + cargoWeight).toFixed(2));
    const cargoSpanW = newBoxes.length > 0 ? Math.round(maxX - minX) : 0;
    const cargoSpanL = newBoxes.length > 0 ? Math.round(maxZ - minZ) : 0;
    const maxAllowedCargoMm3 = rawPallet.width * rawPallet.length * maxLoadH;
    const palletEnvelopeMm3 = rawPallet.width * rawPallet.length * totalHeight;

    const updated = {
      ...rawPallet,
      id: `pallet-${newIndex}`,
      index: newIndex,
      boxes: newBoxes,
      layers,
      cargoCounts,
      cargoHeight,
      totalHeight,
      cargoWeight,
      totalWeight,
      cargoSpanW,
      cargoSpanL,
      overhangW: Math.max(0, cargoSpanW - rawPallet.width),
      overhangL: Math.max(0, cargoSpanL - rawPallet.length),
      maxOverhangMm: Math.max(
        0,
        cargoSpanW - rawPallet.width,
        cargoSpanL - rawPallet.length
      ),
      cargoCbm: Number((boxVolMm3 / 1e9).toFixed(3)),
      totalCbm: Number((palletEnvelopeMm3 / 1e9).toFixed(3)),
      volumeUtilization: Number(
        Math.min(100, (boxVolMm3 / Math.max(1, maxAllowedCargoMm3)) * 100).toFixed(1)
      ),
      isPartial: true,
    };
    updated.localCoG = computePalletLocalCoG(updated);
    return updated;
  };

  const working = initialPallets.map((p) => ({ ...p, boxes: [...p.boxes], layers: [...p.layers] }));

  while (working.length < targetFloorSlots) {
    // 가장 층수(단수)가 높고 무거운 파레트를 찾아 절반 층으로 분할
    let bestIdx = -1;
    let bestScore = -1;
    for (let i = 0; i < working.length; i++) {
      const p = working[i];
      if (p.layers.length >= 2) {
        const score = p.layers.length * 10000 + p.totalHeight + p.cargoWeight;
        if (score > bestScore) {
          bestScore = score;
          bestIdx = i;
        }
      }
    }
    if (bestIdx === -1) break; // 더 이상 2단 이상인 파레트가 없으면 종료

    const target = working[bestIdx];
    const keepLayers = Math.ceil(target.layers.length / 2);
    const boxesA = target.boxes
      .filter((b) => (b.layerIndex || 0) < keepLayers)
      .map((b) => ({ ...b }));
    const rawBoxesB = target.boxes.filter((b) => (b.layerIndex || 0) >= keepLayers);
    const minBY = rawBoxesB.reduce((min, b) => Math.min(min, b.y), Infinity);
    const yShift = minBY - target.baseHeight;
    const boxesB = rawBoxesB.map((b, bIdx) => ({
      ...b,
      id: `${b.id}-sp-${working.length}-${bIdx}`,
      layerIndex: (b.layerIndex || 0) - keepLayers,
      y: Math.round(b.y - yShift),
    }));

    const pA = rebuildPalletStats(target, boxesA, target.index);
    const pB = rebuildPalletStats(target, boxesB, working.length + 1);
    working.splice(bestIdx, 1, pA, pB);
  }

  // Re-index cleanly
  working.forEach((p, idx) => {
    p.index = idx + 1;
    p.id = `pallet-${idx + 1}`;
  });

  // Rebuild palletWeightGroups
  const groupMap = new Map();
  working.forEach((p, pIdx) => {
    const cargoDesc = Object.entries(p.cargoCounts)
      .map(([cid, cnt]) => {
        const cObj = cargos.find((c) => c.id === cid);
        return `${cObj ? cObj.name : cid} · ${cnt}박스`;
      })
      .join(' + ');
    const key = `${cargoDesc}|${p.width}x${p.length}|${p.totalWeight}`;
    if (!groupMap.has(key)) {
      const layer0Boxes = p.boxes.filter((b) => (b.layerIndex || 0) === 0);
      const normalCnt = layer0Boxes.filter((b) => !b.rotated).length;
      const rotCnt = layer0Boxes.filter((b) => b.rotated).length;
      let orientDesc = '';
      if (normalCnt > 0 && rotCnt > 0) {
        orientDesc = `정방향 ${normalCnt}개 + 90°회전 ${rotCnt}개 (1단 ${layer0Boxes.length}박스)`;
      } else if (rotCnt > 0) {
        orientDesc = `90°회전 ${rotCnt}개 (1단 ${layer0Boxes.length}박스)`;
      } else {
        orientDesc = `정방향 ${normalCnt}개 (1단 ${layer0Boxes.length}박스)`;
      }

      groupMap.set(key, {
        label: cargoDesc,
        primaryCargoName: p.primaryCargoName,
        palletSpecId: p.palletSpecId,
        palletDim: `${p.width}×${p.length}mm`,
        palletW: p.width,
        palletL: p.length,
        cargoSpanW: p.cargoSpanW,
        cargoSpanL: p.cargoSpanL,
        overhangW: p.overhangW,
        overhangL: p.overhangL,
        maxOverhangMm: p.maxOverhangMm,
        palletCount: 0,
        firstLayerBoxCount: layer0Boxes.length,
        layerCount: p.layers.length,
        boxesPerPallet: p.boxes.length,
        totalHeight: p.totalHeight,
        cargoHeight: p.cargoHeight,
        unitPalletWeight: p.totalWeight,
        totalGroupWeight: 0,
        orientDesc,
        samplePalletIndex: pIdx,
        palletIndices: [],
      });
    }
    const g = groupMap.get(key);
    g.palletCount += 1;
    g.totalGroupWeight = Number((g.palletCount * g.unitPalletWeight).toFixed(1));
    g.palletIndices.push(p.index);
  });

  return {
    pallets: working,
    palletWeightGroups: Array.from(groupMap.values()),
  };
}

/**
 * 품목(SKU)별로 '상자를 어떻게 쌓을지' (1층 평면 배열 패턴 5종 / 층간 교차 방식 3종 / 상자 세움·눕힘 자세 3종) 비교 분석
 */
export function analyzeCargoStackingOptions(cargos, palletConfig, options = {}) {
  const baseH = Math.max(0, Number(palletConfig.baseHeight) ?? 150);
  const maxTotalH = Math.max(baseH + 50, Number(palletConfig.maxTotalHeight) || 1700);
  const maxLoadH = maxTotalH - baseH;
  const maxCargoWeight = Math.max(1, Number(palletConfig.maxWeight) || 1000);
  const defaultOv = Math.max(0, Number(options.overhang) || 0);
  const defaultInterlock = options.interlockLayers !== false;

  const PATTERN_DEFS = [
    {
      id: 'AUTO_MAX',
      label: '⚡ 자동 최대 혼합',
      shortDesc: '가장 많이 들어가는 최적 배열 자동 선택',
    },
    {
      id: 'PINWHEEL',
      label: '🌀 핀휠 (풍차형 맞물림)',
      shortDesc: '4면을 풍차처럼 돌려 맞물리게 배치 (흔들림에 강함)',
    },
    {
      id: 'SPLIT_MIX',
      label: '🧩 블록 혼합 (정방향+회전)',
      shortDesc: '정방향 열과 90° 회전 열을 조합하여 빈 공간 최소화',
    },
    {
      id: 'GRID_NORMAL',
      label: '⬆️ 일자 정방향 바둑판',
      shortDesc: '모든 상자를 회전 없이 같은 방향으로 줄 맞춰 정렬',
    },
    {
      id: 'GRID_ROTATED',
      label: '↪️ 일자 90°회전 바둑판',
      shortDesc: '모든 상자를 90° 회전 방향으로 통일하여 줄 맞춰 정렬',
    },
  ];

  const STACK_STYLE_DEFS = [
    {
      id: 'INTERLOCK',
      label: '🧱 벽돌식 홀·짝수단 대칭 교차',
      shortDesc: '홀수단과 짝수단을 180° 대칭 교차하여 층간 무너짐 방지',
    },
    {
      id: 'CROSS_TIER',
      label: '🔄 홀·짝수단 90° 직교 교차',
      shortDesc: '홀수단 가로열 ↔ 짝수단 세로열로 층마다 결을 90° 직교 배치',
    },
    {
      id: 'COLUMN',
      label: '🏛️ 기둥식 수직 일자 정렬',
      shortDesc: '1단~끝단까지 동일 위치로 수직 기둥 정렬 (박스 모서리 강도 최고)',
    },
  ];

  const POSTURE_DEFS = [
    { id: 'UPRIGHT', label: '⬆️ 기본 세워 쌓기' },
    { id: 'FLAT_W_H', label: '📐 앞으로 눕혀 쌓기 (세로=높이)' },
    { id: 'FLAT_H_L', label: '📐 옆으로 눕혀 쌓기 (가로=높이)' },
  ];

  return cargos
    .filter((c) => Number(c.quantity) > 0 && Number(c.width) > 0 && Number(c.length) > 0)
    .map((c, idx) => {
      const resolvedPallet = resolvePalletDimsForCargo(c, palletConfig);
      const itemOv =
        c.allowedOverhang !== undefined && c.allowedOverhang !== null
          ? Math.max(0, Number(c.allowedOverhang) || 0)
          : defaultOv;
      const effPalletW = resolvedPallet.width + itemOv;
      const effPalletL = resolvedPallet.length + itemOv;

      const curPosture = resolveCargoBoxDimsByPosture(c);
      const curPattern = c.layerPattern || options.layerPattern || 'AUTO_MAX';
      const curStackStyle =
        c.stackingStyle ||
        options.stackingStyle ||
        (defaultInterlock ? 'INTERLOCK' : 'COLUMN');
      const qty = Math.max(0, Math.floor(Number(c.quantity) || 0));
      const unitW = Math.max(0, Number(c.weight) || 0);
      const customMaxL = Number(c.maxLayers) > 0 ? Math.floor(Number(c.maxLayers)) : 999;

      const calcStats = (perLayerCnt, boxH) => {
        if (perLayerCnt <= 0 || boxH > maxLoadH) {
          return { maxLayers: 0, boxesPerPallet: 0, totalPallets: 0 };
        }
        const byH = Math.max(1, Math.floor(maxLoadH / Math.max(1, boxH)));
        const layerW = perLayerCnt * unitW;
        const byW = layerW > 0 ? Math.max(1, Math.floor(maxCargoWeight / layerW)) : byH;
        const maxLayers = Math.max(1, Math.min(byH, byW, customMaxL));
        const boxesPerPallet = perLayerCnt * maxLayers;
        return {
          maxLayers,
          boxesPerPallet,
          totalPallets: Math.ceil(qty / boxesPerPallet),
        };
      };

      // 1. 5가지 1층 평면 배열 패턴별 결과 비교
      const patternOptions = PATTERN_DEFS.map((pDef) => {
        const tpl = computeBest2DLayer(
          effPalletW,
          effPalletL,
          curPosture.width,
          curPosture.length,
          c.allowRotate !== false,
          pDef.id
        );
        const normalCnt = tpl.filter((b) => !b.rotated).length;
        const rotCnt = tpl.filter((b) => b.rotated).length;
        const stats = calcStats(tpl.length, curPosture.height);
        return {
          ...pDef,
          layerBoxCount: tpl.length,
          normalCnt,
          rotCnt,
          ...stats,
        };
      });

      // 2. 3가지 상자 세움/눕힘 자세별 결과 비교
      const postureOptions = POSTURE_DEFS.map((posDef) => {
        const pDims = resolveCargoBoxDimsByPosture(c, posDef.id);
        const tpl = computeBest2DLayer(
          effPalletW,
          effPalletL,
          pDims.width,
          pDims.length,
          c.allowRotate !== false,
          curPattern
        );
        const stats = calcStats(tpl.length, pDims.height);
        return {
          ...posDef,
          dimText: `바닥 ${pDims.width}×${pDims.length}mm · 높이 ${pDims.height}mm`,
          layerBoxCount: tpl.length,
          ...stats,
        };
      });

      return {
        cargoId: c.id || `cargo-${idx + 1}`,
        cargoName: c.name || `화물 ${idx + 1}`,
        color: c.color || CARGO_COLORS[idx % CARGO_COLORS.length],
        currentPattern: curPattern,
        currentStackStyle: curStackStyle,
        currentPosture: curPosture.posture,
        patternOptions,
        stackStyleOptions: STACK_STYLE_DEFS,
        postureOptions,
      };
    });
}

/**
 * 전체 시뮬레이션 통합 실행 (파레트 규격별 비교 + 컨테이너 규격별 비교 포함)
 */
export function runFullSimulation(cargos, palletConfig, selectedContainerId, options = {}) {
  const palletResult = packCargosIntoPallets(cargos, palletConfig, options);
  let { pallets, palletWeightGroups } = palletResult;
  const { unpackedErrors } = palletResult;
  const basePalletCount = pallets.length;
  const overhangDiagnostics = analyzeOverhangDiagnostics(cargos, palletConfig, options);
  const stackingDiagnostics = analyzeCargoStackingOptions(cargos, palletConfig, options);

  const selectedSpec =
    CONTAINER_SPECS[selectedContainerId] || CONTAINER_SPECS['40FT_HC'];

  // 먼저 기본 파레트로 컨테이너 적재 시뮬레이션 실행
  let containerResult = packPalletsIntoContainers(pallets, selectedSpec, options);

  const floorSlotsPerUnit = selectedSpec.id === '20FT_DRY' ? 10 : 20;
  const totalAvailableFloorSlots = containerResult.containers.length * floorSlotsPerUnit;
  const emptyFloorSlotsBeforeSpread = Math.max(0, totalAvailableFloorSlots - basePalletCount);

  // 만약 '컨테이너 바닥 전체 채움(단수 분산)' 옵션(fullFloorSpread)이 켜져 있고 빈 바닥 슬롯이 있다면,
  // 고단 파레트의 상부 단을 분할하여 모든 컨테이너 바닥 슬롯을 골고루 채우도록 재적재!
  if (options.fullFloorSpread && emptyFloorSlotsBeforeSpread > 0) {
    const spreadRes = spreadPalletsToFillFloorSlots(
      pallets,
      totalAvailableFloorSlots,
      cargos,
      palletConfig
    );
    if (spreadRes) {
      pallets = spreadRes.pallets;
      palletWeightGroups = spreadRes.palletWeightGroups;
      containerResult = packPalletsIntoContainers(pallets, selectedSpec, options);
    }
  }

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
    let res = packPalletsIntoContainers(palletsForSpec, spec, options);
    const specFloorSlots = (spec.id === '20FT_DRY' ? 10 : 20) * res.containers.length;
    if (options.fullFloorSpread && palletsForSpec.length < specFloorSlots) {
      const spreadSpec = spreadPalletsToFillFloorSlots(
        palletsForSpec,
        specFloorSlots,
        cargos,
        palletConfig
      );
      if (spreadSpec) {
        palletsForSpec = spreadSpec.pallets;
        res = packPalletsIntoContainers(palletsForSpec, spec, options);
      }
    }
    return {
      spec,
      palletCount: palletsForSpec.length,
      containerCount: res.containers.length,
      containers: res.containers,
      floorSlots: spec.id === '20FT_DRY' ? 10 : 20,
      maxCapacity: (spec.id === '20FT_DRY' ? 10 : 20) * (options.doubleStack ? 2 : 1),
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
  const cap40 = hcComp ? hcComp.maxCapacity : 20;
  const cap20 = ft20Comp ? ft20Comp.maxCapacity : 10;
  const totalPlt = pallets.length;

  const fleetRecommendations = [];
  if (totalPlt > 0) {
    const hcOnlyCnt = Math.ceil(totalPlt / cap40);
    const hcOnlySlots = hcOnlyCnt * cap40;
    const hcOnlyEmpty = hcOnlySlots - totalPlt;

    const full40Cnt = Math.floor(totalPlt / cap40);
    const remPlt = totalPlt - full40Cnt * cap40;

    if (remPlt > 0 && remPlt <= cap20 && full40Cnt >= 1) {
      const comboSlots = full40Cnt * cap40 + cap20;
      const comboEmpty = comboSlots - totalPlt;
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
      detail: `총 바닥 ${hcOnlySlots}슬롯 중 ${totalPlt}파레트 균등 배치 (남는 바닥 슬롯 총 ${hcOnlyEmpty}칸)`,
      note:
        hcOnlyEmpty === 0
          ? '전 컨테이너 바닥 100% 밀착 채움 완료 (쏠림·고정장치 불필요)'
          : `호기별 균등 배분 적용됨 · '바닥 100% 풀채움(단수 분산)' 활성화 시 ${hcOnlySlots}칸 전량 채움 가능`,
      desc:
        hcOnlyEmpty <= 2
          ? `총 ${hcOnlySlots}슬롯 중 ${totalPlt}파레트를 채워 바닥 공간 활용도가 매우 높습니다 (여유 ${hcOnlyEmpty}슬롯).`
          : `총 ${hcOnlySlots}슬롯 중 ${totalPlt}파레트 적재 (여유 ${hcOnlyEmpty}슬롯 · 호차별 균등 배분 적용).`,
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
      isSpreadActive: Boolean(options.fullFloorSpread && pallets.length > basePalletCount),
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
