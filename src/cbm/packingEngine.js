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

  let currentPallet = null;
  const hasRemaining = () => queue.some((c) => c.remaining > 0);

  let safetyCounter = 0;
  while (hasRemaining() && safetyCounter < 5000) {
    safetyCounter++;

    const nextCandidate = queue.find((c) => c.remaining > 0);
    if (!nextCandidate) break;

    if (!currentPallet) {
      currentPallet = createEmptyPallet(
        pallets.length + 1,
        nextCandidate.palletW,
        nextCandidate.palletL,
        nextCandidate.palletSpecId,
        nextCandidate.palletSpecName
      );
      currentPallet.primaryCargoId = nextCandidate.id;
      currentPallet.primaryCargoName = nextCandidate.name;
    }

    const currentY = currentPallet.cargoHeight;
    const remHeight = maxLoadH - currentY;
    const remWeight = maxCargoWeight - currentPallet.cargoWeight;

    // Only allow cargos with matching pallet dimensions on the same pallet
    const activeCargo = queue.find(
      (c) =>
        c.remaining > 0 &&
        c.palletW === currentPallet.width &&
        c.palletL === currentPallet.length &&
        (mixCargos || currentPallet.boxes.length === 0 || c.id === currentPallet.primaryCargoId) &&
        c.height <= remHeight &&
        (c.weight <= remWeight || currentPallet.boxes.length === 0)
    );

    if (!activeCargo) {
      if (currentPallet.boxes.length > 0) {
        pallets.push(currentPallet);
        currentPallet = null;
        continue;
      }
      break;
    }

    const template = layerTemplates.get(activeCargo.id) || [];
    if (template.length === 0) {
      activeCargo.remaining = 0;
      continue;
    }

    const maxByWeight =
      activeCargo.weight > 0
        ? Math.max(
            currentPallet.boxes.length === 0 ? 1 : 0,
            Math.floor((maxCargoWeight - currentPallet.cargoWeight) / activeCargo.weight)
          )
        : activeCargo.remaining;

    const takeCount = Math.min(template.length, activeCargo.remaining, maxByWeight);
    if (takeCount <= 0) {
      if (currentPallet.boxes.length > 0) {
        pallets.push(currentPallet);
        currentPallet = null;
        continue;
      }
      break;
    }

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

    // Center the boxes on the pallet for optimal Center of Gravity (CoG)
    const offsetX = Math.floor((currentPallet.width - (maxX - minX)) / 2) - minX;
    const offsetZ = Math.floor((currentPallet.length - (maxZ - minZ)) / 2) - minZ;

    const layerY = baseH + currentPallet.cargoHeight;
    const layerBoxes = placedTemplate.map((p, bIdx) => ({
      id: `${currentPallet.id}-box-${currentPallet.boxes.length + bIdx + 1}`,
      cargoId: activeCargo.id,
      name: activeCargo.name,
      color: activeCargo.color,
      weight: activeCargo.weight,
      x: p.x + offsetX,
      y: layerY,
      z: p.z + offsetZ,
      w: p.w,
      h: activeCargo.height,
      l: p.l,
      rotated: p.rotated,
      layerIndex: currentPallet.layers.length,
    }));

    currentPallet.boxes.push(...layerBoxes);
    currentPallet.layers.push({
      index: currentPallet.layers.length,
      y: layerY,
      height: activeCargo.height,
      boxCount: layerBoxes.length,
    });
    currentPallet.cargoHeight += activeCargo.height;
    currentPallet.totalHeight = baseH + currentPallet.cargoHeight;

    const addedWeight = layerBoxes.length * activeCargo.weight;
    currentPallet.cargoWeight = Number((currentPallet.cargoWeight + addedWeight).toFixed(2));
    currentPallet.totalWeight = Number((tareWeight + currentPallet.cargoWeight).toFixed(1));
    currentPallet.cargoCounts[activeCargo.id] =
      (currentPallet.cargoCounts[activeCargo.id] || 0) + layerBoxes.length;

    activeCargo.remaining -= layerBoxes.length;

    if (!mixCargos && activeCargo.remaining === 0) {
      pallets.push(currentPallet);
      currentPallet = null;
    }
  }

  if (currentPallet && currentPallet.boxes.length > 0) {
    pallets.push(currentPallet);
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
  }

  return {
    containers,
    floorSlotsPerContainer: 20,
    maxPalletsPerContainer: allowDoubleStack ? 40 : 20,
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

  return {
    pallets,
    palletWeightGroups,
    palletSpecComparison,
    unpackedErrors,
    selectedSpec,
    containerResult,
    containerComparison,
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
