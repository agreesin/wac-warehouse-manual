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
 * 2D 평면(W x L) 위에 단일 규격 박스(bw x bl)를 가장 많이 배치하는 레이아웃 계산
 */
export function computeBest2DLayer(surfaceW, surfaceL, boxW, boxL, allowRotate = true) {
  const bw = Math.max(1, Number(boxW) || 1);
  const bl = Math.max(1, Number(boxL) || 1);
  if (bw > surfaceW && bw > surfaceL) return [];
  if (bl > surfaceW && bl > surfaceL) return [];

  const candidates = [];

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

  if (bw <= surfaceW && bl <= surfaceL) {
    candidates.push(fillGrid(0, 0, surfaceW, surfaceL, bw, bl, false));
  }

  if (allowRotate && bl <= surfaceW && bw <= surfaceL) {
    candidates.push(fillGrid(0, 0, surfaceW, surfaceL, bl, bw, true));
  }

  if (allowRotate && bw !== bl) {
    const maxKx = Math.floor(surfaceW / bw);
    for (let k = 1; k <= maxKx; k++) {
      const usedW = k * bw;
      const remW = surfaceW - usedW;
      const part1 = fillGrid(0, 0, usedW, surfaceL, bw, bl, false);
      const part2 = fillGrid(usedW, 0, remW, surfaceL, bl, bw, true);
      candidates.push([...part1, ...part2]);
    }

    const maxKxRot = Math.floor(surfaceW / bl);
    for (let k = 1; k <= maxKxRot; k++) {
      const usedW = k * bl;
      const remW = surfaceW - usedW;
      const part1 = fillGrid(0, 0, usedW, surfaceL, bl, bw, true);
      const part2 = fillGrid(usedW, 0, remW, surfaceL, bw, bl, false);
      candidates.push([...part1, ...part2]);
    }

    const maxMz = Math.floor(surfaceL / bl);
    for (let m = 1; m <= maxMz; m++) {
      const usedL = m * bl;
      const remL = surfaceL - usedL;
      const part1 = fillGrid(0, 0, surfaceW, usedL, bw, bl, false);
      const part2 = fillGrid(0, usedL, surfaceW, remL, bl, bw, true);
      candidates.push([...part1, ...part2]);
    }

    const maxMzRot = Math.floor(surfaceL / bw);
    for (let m = 1; m <= maxMzRot; m++) {
      const usedL = m * bw;
      const remL = surfaceL - usedL;
      const part1 = fillGrid(0, 0, surfaceW, usedL, bl, bw, true);
      const part2 = fillGrid(0, usedL, surfaceW, remL, bw, bl, false);
      candidates.push([...part1, ...part2]);
    }
  }

  let best = [];
  for (const cand of candidates) {
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
      return {
        id: c.id || `cargo-${idx + 1}`,
        name: (c.name || `화물 ${idx + 1}`).trim(),
        width: Math.max(1, Number(c.width) || 0),
        length: Math.max(1, Number(c.length) || 0),
        height: Math.max(1, Number(c.height) || 0),
        quantity: Math.max(0, Math.floor(Number(c.quantity) || 0)),
        remaining: Math.max(0, Math.floor(Number(c.quantity) || 0)),
        weight: Math.max(0, Number(c.weight) || 0),
        maxLayers: Math.max(0, Math.floor(Number(c.maxLayers) || 0)), // 품목별 최대 적재 단수 제한 (0 = 자동)
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
    const effW = item.palletW + overhang;
    const effL = item.palletL + overhang;
    const template = computeBest2DLayer(effW, effL, item.width, item.length, item.allowRotate);
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

    // 짝수 단(2단, 4단, 6단...)이고 완적 단일 때 교차 적재(interlockLayers)가 켜져 있으면
    // 외곽 경계는 100% 동일하게 유지하면서 내부 박스 배열을 180° 대칭 교차(벽돌식 이음선 엇갈림)
    const shouldMirror = interlockLayers && isFull && isEvenLayer;

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

  // Compute CBM, Volume Utilization, and Local CoG per pallet
  for (const p of pallets) {
    let boxVolumeMm3 = 0;
    for (const b of p.boxes) {
      boxVolumeMm3 += b.w * b.h * b.l;
    }
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

  // Helper to pack a list of pallets into a single container using 2-row column layout
  // For each pallet, orient it so that 2 pallets fit side-by-side across container width (cWidth = 2352mm):
  // - 1100 x 1100 -> length 1100 (along X), width 1100 (along Z, 2*1100 = 2200 <= 2352)
  // - 1200 x 1000 -> length 1200 (along X), width 1000 (along Z, 2*1000 = 2000 <= 2352)
  //   OR if paired with 1100, 1000+1100 = 2100 <= 2352!
  const orientPalletFor2Rows = (p) => {
    // We want the Z-dimension (width inside container) to be <= cWidth / 2 (1176mm) if possible
    const halfW = cWidth / 2;
    if (p.width <= halfW && p.length <= halfW) {
      return { lengthX: p.length, widthZ: p.width, rotated: false };
    }
    if (p.length <= halfW && p.width > halfW) {
      // e.g. width=1200, length=1000 -> put 1200 along X (container length), 1000 along Z (container width)
      return { lengthX: p.width, widthZ: p.length, rotated: true };
    }
    if (p.width <= halfW && p.length > halfW) {
      return { lengthX: p.length, widthZ: p.width, rotated: false };
    }
    return { lengthX: p.length, widthZ: p.width, rotated: false };
  };

  // Try packing a given list of pallets into 1 container; returns { placedPallets, overflowPallets }
  const tryPackSingleContainer = (palletList) => {
    let workingList = [...palletList];

    // If optimizeCoG is enabled, order pallets so heavy full pallets are balanced in the middle/front
    // and lighter/partial pallets are placed near the door (end), while alternating left/right rows by weight!
    if (optimizeCoG && workingList.length > 2) {
      // Keep full pallets of each SKU grouped cleanly, but ensure heaviest pallets are toward the center/front
      // and lightest partial pallets are at the very end (door side) for safe unloading
      workingList.sort((a, b) => {
        if (a.isPartial !== b.isPartial) return a.isPartial ? 1 : -1;
        return b.totalWeight - a.totalWeight;
      });

      // Symmetrize longitudinal CoG: place medium-heavy at front wall, heaviest in the middle, medium-heavy + light toward door
      const fullHeavy = workingList.filter((p) => !p.isPartial);
      const partials = workingList.filter((p) => p.isPartial);
      if (fullHeavy.length >= 6) {
        const reordered = new Array(fullHeavy.length);
        // Place from center outward or alternate front/back pairs to keep CoG near 50% of occupied length
        let leftPtr = 0;
        let rightPtr = fullHeavy.length - 1;
        // Put medium-heavy at outer ends and heaviest near center so longitudinal CoG is dead-center
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

    // Pair pallets into columns of 2 (Row 0: Left Z, Row 1: Right Z)
    // If doubleStack is enabled, each floor slot can also take a 2nd-tier pallet
    let idx = 0;
    const openTopSlots = []; // floor slots available for 2nd tier

    while (idx < workingList.length) {
      const p = workingList[idx];

      if (currentWeight + p.totalWeight > cMaxWeight && placedPallets.length > 0) {
        overflowPallets.push(...workingList.slice(idx));
        break;
      }

      // First check if doubleStack is enabled and we can place on an open 2nd-tier slot
      if (allowDoubleStack && openTopSlots.length > 0) {
        const compatibleSlotIdx = openTopSlots.findIndex(
          (s) =>
            s.bottomPallet.totalHeight + p.totalHeight <= cHeight &&
            s.bottomPallet.width === p.width &&
            s.bottomPallet.length === p.length
        );
        if (compatibleSlotIdx !== -1) {
          const targetSlot = openTopSlots.splice(compatibleSlotIdx, 1)[0];
          placedPallets.push({
            pallet: p,
            slotIndex: targetSlot.slotIndex,
            tier: 2,
            x: targetSlot.x,
            y: targetSlot.bottomPallet.totalHeight,
            z: targetSlot.z,
            length: targetSlot.length,
            width: targetSlot.width,
            rotated: targetSlot.rotated,
          });
          currentWeight += p.totalWeight;
          idx++;
          continue;
        }
      }

      // Otherwise, open a new floor column at cursorX (takes up to 2 pallets side by side: Left & Right)
      const p1 = workingList[idx];
      const o1 = orientPalletFor2Rows(p1);

      if (cursorX + o1.lengthX > cLength) {
        // No more floor length in this container
        // Before overflowing, check if remaining pallets can go onto any openTopSlots
        if (allowDoubleStack && openTopSlots.length > 0) {
          let anyPlacedOnTop = false;
          const stillUnplaced = [];
          for (let k = idx; k < workingList.length; k++) {
            const cand = workingList[k];
            const sIdx = openTopSlots.findIndex(
              (s) =>
                s.bottomPallet.totalHeight + cand.totalHeight <= cHeight &&
                currentWeight + cand.totalWeight <= cMaxWeight
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
              anyPlacedOnTop = true;
            } else {
              stillUnplaced.push(cand);
            }
          }
          overflowPallets.push(...stillUnplaced);
          break;
        } else {
          overflowPallets.push(...workingList.slice(idx));
          break;
        }
      }

      // Place Left Row (Row 0)
      const zGap = Math.max(10, Math.floor((cWidth - o1.widthZ * 2) / 3));
      const zLeft = Math.max(0, zGap);
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
      placedPallets.push(slot1);
      currentWeight += p1.totalWeight;
      if (allowDoubleStack) {
        openTopSlots.push({ ...slot1, bottomPallet: p1 });
      }
      idx++;

      let colMaxLenX = o1.lengthX;

      // Try placing Right Row (Row 1) in the same column if there is a next pallet that fits in width & weight
      if (idx < workingList.length) {
        const p2 = workingList[idx];
        const o2 = orientPalletFor2Rows(p2);
        if (
          o1.widthZ + o2.widthZ <= cWidth &&
          cursorX + o2.lengthX <= cLength &&
          currentWeight + p2.totalWeight <= cMaxWeight
        ) {
          const zRight = cWidth - o2.widthZ - Math.max(0, zGap);
          const slot2 = {
            pallet: p2,
            slotIndex: slotCounter++,
            tier: 1,
            x: cursorX,
            y: 0,
            z: zRight,
            length: o2.lengthX,
            width: o2.widthZ,
            rotated: o2.rotated,
          };
          placedPallets.push(slot2);
          currentWeight += p2.totalWeight;
          if (allowDoubleStack) {
            openTopSlots.push({ ...slot2, bottomPallet: p2 });
          }
          colMaxLenX = Math.max(colMaxLenX, o2.lengthX);
          idx++;
        }
      }

      cursorX += colMaxLenX + 15; // 15mm clearance between columns
    }

    // Center the entire packed block slightly or keep from front wall (x=0)
    return { placedPallets, overflowPallets };
  };

  // Check if balanced multi-container split should be applied (e.g. 38 pallets across 2 containers -> 19 + 19)
  const containers = [];

  if (balanceContainers && !allowDoubleStack && validPallets.length > 0) {
    // First do a sequential pass to see how many containers are needed
    let testRem = [...validPallets];
    let neededCount = 0;
    while (testRem.length > 0 && neededCount < 50) {
      const res = tryPackSingleContainer(testRem);
      if (res.placedPallets.length === 0) break;
      neededCount++;
      testRem = res.overflowPallets;
    }

    if (neededCount === 2) {
      // Balanced 2-container distribution by SKU (just like the report:
      // Container 1 gets half of full Item 1 + half of Item 2; Container 2 gets the rest + partials)
      const bucket1 = [];
      const bucket2 = [];

      // Group pallets by primaryCargoId
      const byCargo = new Map();
      for (const p of validPallets) {
        const key = p.primaryCargoId || 'other';
        if (!byCargo.has(key)) byCargo.set(key, []);
        byCargo.get(key).push(p);
      }

      const targetBucket1Size = Math.ceil(validPallets.length / 2);

      for (const [, group] of byCargo.entries()) {
        const fulls = group.filter((p) => !p.isPartial);
        const partials = group.filter((p) => p.isPartial);

        const halfFull = Math.ceil(fulls.length / 2);
        for (let i = 0; i < fulls.length; i++) {
          if (i < halfFull && bucket1.length < targetBucket1Size) {
            bucket1.push(fulls[i]);
          } else {
            bucket2.push(fulls[i]);
          }
        }
        // Put partial pallets in bucket2 (or whichever bucket has fewer pallets)
        for (const part of partials) {
          if (bucket1.length < bucket2.length && bucket1.length < targetBucket1Size) {
            bucket1.push(part);
          } else {
            bucket2.push(part);
          }
        }
      }

      orderedContainerBuckets = [bucket1, bucket2];
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
 * 전체 시뮬레이션 통합 실행 (파레트 규격별 비교 + 컨테이너 규격별 비교 포함)
 */
export function runFullSimulation(cargos, palletConfig, selectedContainerId, options = {}) {
  const palletResult = packCargosIntoPallets(cargos, palletConfig, options);
  const { pallets, palletWeightGroups, unpackedErrors } = palletResult;

  const selectedSpec =
    CONTAINER_SPECS[selectedContainerId] || CONTAINER_SPECS['40FT_HC'];

  const containerResult = packPalletsIntoContainers(pallets, selectedSpec, options);

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
    let palletsForSpec = pallets;
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
        badge: '💰 운임·공간 최적 혼합 배차',
        title: `40ft HC × ${full40Cnt}대 + 20ft Dry × 1대 (총 ${full40Cnt + 1}대)`,
        desc: `잔여 ${remPlt}파레트를 40HC 대신 20ft 1대에 적재하여 빈 바닥 슬롯을 ${hcOnlyEmpty}개 → ${comboEmpty}개로 줄이는 실무 추천 조합입니다.`,
        totalSlots: comboSlots,
        emptySlots: comboEmpty,
        isRecommended: true,
      });
    }

    fleetRecommendations.push({
      id: 'SINGLE_40HC',
      badge: hcOnlyEmpty <= 4 ? '⭐ 바닥 정원 최적 매칭' : '표준 단일 배차',
      title: `40ft High Cube × ${hcOnlyCnt}대 단독 배차`,
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
    unpackedErrors,
    selectedSpec,
    containerResult,
    containerComparison,
    fleetRecommendations,
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
