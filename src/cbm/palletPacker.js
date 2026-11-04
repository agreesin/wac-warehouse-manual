// Step 2: 파레트 적재 시뮬레이션, 돌출(Overhang) 사후 자동 감지 및 상자 적재 방식(패턴/교차/자세) 비교 분석
import {
  PALLET_PRESETS,
  CARGO_COLORS,
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

/**
 * 파레트 내부 3D 무게중심(Local CoG) 계산
 */
export function computePalletLocalCoG(pallet) {
  let momentX = 0;
  let momentY = 0;
  let momentZ = 0;
  let totalMass = 0;

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
 * 자투리 잔여 층(Partial Layer) 박스 대칭 배치 헬퍼
 * - 완적 템플릿의 박스들 중 선택된 박스들의 중심이 파레트 중심(midX, midZ)에 가장 가깝도록 n개를 선택
 * - 파레트 중심 기준 대칭성과 무게중심 편차 최소화를 보장하여 한쪽 구석 쏠림 원천 방지
 */
export function pickBalancedSubset(template, takeCount, palletW, palletL) {
  if (!template || template.length === 0 || takeCount <= 0) return [];
  if (takeCount >= template.length) return template;

  const midX = palletW / 2;
  const midZ = palletL / 2;
  const k = takeCount;

  // 후보 풀이 큰 경우(20개 초과) 중심에서 너무 먼 박스는 사전 정리
  let pool = template;
  if (pool.length > 20) {
    pool = [...template]
      .sort((a, b) => {
        const da = Math.hypot(a.x + a.w / 2 - midX, a.z + a.l / 2 - midZ);
        const db = Math.hypot(b.x + b.w / 2 - midX, b.z + b.l / 2 - midZ);
        return da - db;
      })
      .slice(0, Math.min(pool.length, k + 8));
  }

  let bestSubset = null;
  let bestScore = Infinity;

  function search(start, chosen, sumX, sumZ) {
    const needed = k - chosen.length;
    if (needed === 0) {
      const avgX = sumX / k;
      const avgZ = sumZ / k;
      const distFromCenter = Math.hypot(avgX - midX, avgZ - midZ);
      if (distFromCenter < bestScore - 1e-6) {
        bestScore = distFromCenter;
        bestSubset = [...chosen];
      }
      return;
    }

    if (pool.length - start < needed) return;

    for (let i = start; i < pool.length; i++) {
      const b = pool[i];
      const bx = b.x + b.w / 2;
      const bz = b.z + b.l / 2;
      chosen.push(b);
      search(i + 1, chosen, sumX + bx, sumZ + bz);
      chosen.pop();
    }
  }

  search(0, [], 0, 0);

  return bestSubset || template.slice(0, takeCount);
}

/**
 * 1단 평면 레이어(template)가 비대칭이어서 짝수 층에서 180° 대칭 교차(INTERLOCK) 시
 * 아래층 지지 없이 허공에 걸치는(Cantilever Overhang) 박스가 발생하는지 검사
 */
export function checkLayerCantileverRisk(template, bounds, palletW, palletL) {
  if (!template || template.length <= 1) {
    return { hasRisk: false, minSupportRatio: 1.0, unsupportedCount: 0, reason: '단일 박스이므로 안전' };
  }

  const offsetX = Math.floor((palletW - bounds.spanW) / 2) - bounds.minX;
  const offsetZ = Math.floor((palletL - bounds.spanL) / 2) - bounds.minZ;
  const bMinX = bounds.minX + offsetX;
  const bMaxX = bounds.maxX + offsetX;
  const bMinZ = bounds.minZ + offsetZ;
  const bMaxZ = bounds.maxZ + offsetZ;

  // 1단(홀수단) 박스 경계 (x1, z1, x2, z2)
  const tier1Boxes = template.map((p) => {
    const x1 = p.x + offsetX;
    const z1 = p.z + offsetZ;
    return {
      x1,
      z1,
      x2: x1 + p.w,
      z2: z1 + p.l,
      w: p.w,
      l: p.l,
      area: p.w * p.l,
    };
  });

  // 2단(짝수단) INTERLOCK (180도 점대칭 반전) 적용 시 박스 경계
  const tier2Boxes = template.map((p) => {
    const rawX = p.x + offsetX;
    const rawZ = p.z + offsetZ;
    const x1 = bMinX + bMaxX - (rawX + p.w);
    const z1 = bMinZ + bMaxZ - (rawZ + p.l);
    return {
      x1,
      z1,
      x2: x1 + p.w,
      z2: z1 + p.l,
      w: p.w,
      l: p.l,
      area: p.w * p.l,
    };
  });

  let minSupportRatio = 1.0;
  let unsupportedCount = 0;

  for (const b2 of tier2Boxes) {
    let supportedArea = 0;
    for (const b1 of tier1Boxes) {
      const ox = Math.max(0, Math.min(b2.x2, b1.x2) - Math.max(b2.x1, b1.x1));
      const oz = Math.max(0, Math.min(b2.z2, b1.z2) - Math.max(b2.z1, b1.z1));
      supportedArea += ox * oz;
    }
    const ratio = b2.area > 0 ? supportedArea / b2.area : 0;
    if (ratio < minSupportRatio) {
      minSupportRatio = ratio;
    }
    // 바닥 지지 면적이 82% 미만이거나 한쪽이 허공에 삐져나오면 위험으로 판정
    if (ratio < 0.82) {
      unsupportedCount++;
    }
  }

  // 지지율이 85% 미만인 박스가 1개라도 있으면 허공 걸침 위험!
  const hasRisk = unsupportedCount > 0 || minSupportRatio < 0.85;

  return {
    hasRisk,
    minSupportRatio: Number(minSupportRatio.toFixed(2)),
    unsupportedCount,
    reason: hasRisk
      ? `1단 배열이 비대칭이어서 층간 교차 시 박스가 허공(최소 지지율 ${(minSupportRatio * 100).toFixed(0)}%)에 걸침`
      : '대칭 배열로 층간 100% 완벽 지지됨',
  };
}

/**
 * 화물(Cargos)을 파레트(Pallets)에 적재하는 시뮬레이션
 */
export function packCargosIntoPallets(cargos, palletConfig, options = {}) {
  const overhang = Math.max(0, Number(options.overhang) || 0);
  const baseH = Number(palletConfig.baseHeight) || 150;
  const maxTotalH = Number(palletConfig.maxTotalHeight) || 1700;
  const maxLoadH = maxTotalH - baseH;
  const maxCargoWeight = Number(palletConfig.maxWeight) || 1000;
  const tareWeight = Number(palletConfig.tareWeight) || 17;
  const mixCargos = Boolean(options.mixCargos);
  const interlockLayers = options.interlockLayers !== false;

  const queue = cargos
    .map((c, idx) => {
      const resolvedPallet = resolvePalletDimsForCargo(c, palletConfig);
      const resolvedPosture = resolveCargoBoxDimsByPosture(c);
      const itemOv =
        c.allowedOverhang !== undefined && c.allowedOverhang !== null
          ? Math.max(0, Number(c.allowedOverhang) || 0)
          : overhang;
      const effW = resolvedPallet.width + itemOv;
      const effL = resolvedPallet.length + itemOv;

      // 1단 평면 배열 템플릿 생성 및 캔틸레버 위험 사전 진단
      const curPattern = c.layerPattern || options.layerPattern || 'AUTO_MAX';
      const sampleTpl = computeBest2DLayer(
        effW,
        effL,
        resolvedPosture.width,
        resolvedPosture.length,
        c.allowRotate !== false,
        curPattern
      );
      const sampleBounds = measureLayerBounds(sampleTpl);
      const cantileverCheck = checkLayerCantileverRisk(
        sampleTpl,
        sampleBounds,
        resolvedPallet.width,
        resolvedPallet.length
      );

      // 표준 적재 기본값: 코너보드 결속 및 박스 하중 지지력이 최고인 수직 기둥 정렬(COLUMN)을 기본 표준으로 적용
      const finalStackStyle =
        c.stackingStyle ||
        options.stackingStyle ||
        'COLUMN';

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
        layerPattern: curPattern,
        stackingStyle: finalStackStyle,
        cantileverCheck,
        quantity: Math.max(0, Math.floor(Number(c.quantity) || 0)),
        remaining: Math.max(0, Math.floor(Number(c.quantity) || 0)),
        weight: Math.max(0, Number(c.weight) || 0),
        maxLayers: Math.max(0, Math.floor(Number(c.maxLayers) || 0)),
        maxTopLoad: Math.max(0, Number(c.maxTopLoad) || 0),
        noDoubleStack: Boolean(c.noDoubleStack),
        allowedOverhang: itemOv,
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
      const bounds = measureLayerBounds(template);
      const fullOffsetX = Math.floor((item.palletW - bounds.spanW) / 2) - bounds.minX;
      const fullOffsetZ = Math.floor((item.palletL - bounds.spanL) / 2) - bounds.minZ;

      const maxLayersByH = Math.max(1, Math.floor(maxLoadH / item.height));
      const fullLayerWeight = template.length * item.weight;
      const maxLayersByW =
        fullLayerWeight > 0
          ? Math.max(1, Math.floor(maxCargoWeight / fullLayerWeight))
          : maxLayersByH;
      const maxLayersByStrength =
        item.maxTopLoad > 0 && item.weight > 0
          ? Math.max(1, Math.floor(1 + item.maxTopLoad / item.weight))
          : 999;
      const customMaxL = item.maxLayers > 0 ? item.maxLayers : 999;
      const maxFullLayersPerPallet = Math.max(
        1,
        Math.min(maxLayersByH, maxLayersByW, maxLayersByStrength, customMaxL)
      );

      templateMeta.set(item.id, {
        fullCount: template.length,
        spanW: bounds.spanW,
        spanL: bounds.spanL,
        fullOffsetX,
        fullOffsetZ,
        actualMinX: bounds.minX + fullOffsetX,
        actualMaxX: bounds.maxX + fullOffsetX,
        actualMinZ: bounds.minZ + fullOffsetZ,
        actualMaxZ: bounds.maxZ + fullOffsetZ,
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

  const buildLayerPlacement = (pallet, cargoItem, takeCount) => {
    const template = layerTemplates.get(cargoItem.id) || [];
    const meta = templateMeta.get(cargoItem.id);
    const isFull = takeCount >= template.length;
    const prevLayer =
      pallet.layers.length > 0 ? pallet.layers[pallet.layers.length - 1] : null;
    const isEvenLayer = pallet.layers.length % 2 === 1;

    if (!isFull && prevLayer && prevLayer.cargoId === cargoItem.id) {
      // 기둥 적재 안정성을 위해 완적 템플릿의 위치를 유지하며, 파레트 중심 대비 대칭인 박스들을 최적 선택
      const positionedTpl = template.map((p) => ({
        ...p,
        x: p.x + meta.fullOffsetX,
        z: p.z + meta.fullOffsetZ,
      }));
      const chosen = pickBalancedSubset(positionedTpl, takeCount, pallet.width, pallet.length);
      let lMinX = Infinity,
        lMaxX = 0,
        lMinZ = Infinity,
        lMaxZ = 0;
      const coords = chosen.map((p) => {
        if (p.x < lMinX) lMinX = p.x;
        if (p.x + p.w > lMaxX) lMaxX = p.x + p.w;
        if (p.z < lMinZ) lMinZ = p.z;
        if (p.z + p.l > lMaxZ) lMaxZ = p.z + p.l;
        return { ...p };
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

    const tplBounds = measureLayerBounds(template);
    const placedTemplate = isFull
      ? template
      : pickBalancedSubset(template, takeCount, tplBounds.spanW, tplBounds.spanL);
    const bounds = measureLayerBounds(placedTemplate);
    const offsetX = Math.floor((pallet.width - bounds.spanW) / 2) - bounds.minX;
    const offsetZ = Math.floor((pallet.length - bounds.spanL) / 2) - bounds.minZ;
    const bMinX = bounds.minX + offsetX;
    const bMaxX = bounds.maxX + offsetX;
    const bMinZ = bounds.minZ + offsetZ;
    const bMaxZ = bounds.maxZ + offsetZ;

    const itemStackStyle =
      cargoItem.stackingStyle || 'COLUMN';

    if (
      itemStackStyle === 'CROSS_TIER' &&
      isFull &&
      isEvenLayer &&
      bounds.spanL <= pallet.width + (cargoItem.allowedOverhang || 0) &&
      bounds.spanW <= pallet.length + (cargoItem.allowedOverhang || 0)
    ) {
      const rotSpanW = bounds.spanL;
      const rotSpanL = bounds.spanW;
      const rotOffX = Math.floor((pallet.width - rotSpanW) / 2) - bounds.minZ;
      const rotOffZ = Math.floor((pallet.length - rotSpanL) / 2) - bounds.minX;
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
        minX: bounds.minZ + rotOffX,
        maxX: bounds.maxZ + rotOffX,
        minZ: bounds.minX + rotOffZ,
        maxZ: bounds.maxX + rotOffZ,
        spanW: rotSpanW,
        spanL: rotSpanL,
        isPartialLayer: false,
      };
    }

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
      spanW: bounds.spanW,
      spanL: bounds.spanL,
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

  // PHASE 1: 품목별 완적 파레트(Full Single-SKU Pallets) 우선 확정
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

  // PHASE 2: 다품종 혼적 허용 시 잔량(Remainder) 합포장 — 물리적 안정성 검증
  if (mixCargos) {
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
      if (topLayer.isPartialLayer) return false;
      if (topLayer.cargoId === candidateCargo.id) return true;
      if (topLayer.unitWeight > 0 && candidateCargo.weight > topLayer.unitWeight * 1.25) {
        return false;
      }
      const preview = buildLayerPlacement(pallet, candidateCargo, takeCount);
      const overhangMargin = 10;
      const supportedInX =
        preview.minX >= topLayer.minX - overhangMargin &&
        preview.maxX <= topLayer.maxX + overhangMargin;
      const supportedInZ =
        preview.minZ >= topLayer.minZ - overhangMargin &&
        preview.maxZ <= topLayer.maxZ + overhangMargin;
      return supportedInX && supportedInZ;
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

      const justAddedLayer = currentPallet.layers[currentPallet.layers.length - 1];
      if (justAddedLayer.isPartialLayer) {
        pallets.push(currentPallet);
        currentPallet = null;
      }
    }

    if (currentPallet && currentPallet.boxes.length > 0) {
      pallets.push(currentPallet);
    }

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
    p.noDoubleStack = Object.keys(p.cargoCounts).some((cid) => {
      const cObj = queue.find((c) => c.id === cid) || cargos.find((c) => c.id === cid);
      return Boolean(cObj?.noDoubleStack);
    });
  }

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
        orientDesc: describeLayerOrientation(layer0Boxes),
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
 * 회사 기준안(Company Policy) 기반 파레트 규격 자동 판정
 * 1. 기본 파레트에 허용 돌출 이내로 적재
 * 2. 기본 파레트 바닥 크기 초과 등 적재 불가 시 대체 규격으로 전환
 * 3. 층 적재 효율 < minEfficiency이고 대체 규격 중 파레트 수가 실제로 줄어들 때만 그 규격으로 전환 (여러 개면 파레트 수 최소인 것)
 * 4. 그 외에는 기본 파레트 유지
 */
export function evaluateCompanyPolicy({
  cargos,
  palletConfig = {},
  basePalletId = 'T11',
  allowedAlternates = ['T12'],
  allowedOverhang = 0,
  minEfficiency = 70,
  options = {},
}) {
  const baseSpec = PALLET_PRESETS[basePalletId] || PALLET_PRESETS.T11;
  const baseW = baseSpec.width;
  const baseL = baseSpec.length;
  const baseArea = baseW * baseL;

  const validAlternates = (Array.isArray(allowedAlternates) ? allowedAlternates : [allowedAlternates])
    .filter((id) => id !== basePalletId && PALLET_PRESETS[id]);
  const alternateSpecs = validAlternates.map((id) => PALLET_PRESETS[id]);

  const decisions = cargos.map((cargo) => {
    // 1. 기본 파레트 1층 배치 및 효율
    const baseLayer = computeBest2DLayer(
      baseW + allowedOverhang,
      baseL + allowedOverhang,
      cargo.width,
      cargo.length,
      cargo.allowRotate !== false
    );
    const baseBoxCount = baseLayer.length;
    const boxFloorArea = (Number(cargo.width) || 0) * (Number(cargo.length) || 0);
    const baseFloorAreaSum = baseBoxCount * boxFloorArea;
    const baseEfficiency = baseArea > 0 ? Number(((baseFloorAreaSum / baseArea) * 100).toFixed(1)) : 0;

    // 기본 파레트 적재 결과
    const baseRes = packCargosIntoPallets(
      [{ ...cargo, palletSpecId: basePalletId }],
      { ...palletConfig, width: baseW, length: baseL },
      { ...options, overhang: allowedOverhang }
    );
    const basePalletCount = baseRes.pallets.length;

    // 2. 대체 허용 규격별 적재 계산
    const altEvaluations = alternateSpecs
      .map((altSpec) => {
        const altLayer = computeBest2DLayer(
          altSpec.width + allowedOverhang,
          altSpec.length + allowedOverhang,
          cargo.width,
          cargo.length,
          cargo.allowRotate !== false
        );
        const altBoxCount = altLayer.length;
        const altArea = altSpec.width * altSpec.length;
        const altFloorAreaSum = altBoxCount * boxFloorArea;
        const altEff = altArea > 0 ? Number(((altFloorAreaSum / altArea) * 100).toFixed(1)) : 0;
        const altRes = packCargosIntoPallets(
          [{ ...cargo, palletSpecId: altSpec.id }],
          { ...palletConfig, width: altSpec.width, length: altSpec.length },
          { ...options, overhang: allowedOverhang }
        );
        return {
          id: altSpec.id,
          name: altSpec.name,
          width: altSpec.width,
          length: altSpec.length,
          boxCount: altBoxCount,
          efficiency: altEff,
          palletCount: altRes.pallets.length,
        };
      })
      .filter((a) => a.boxCount > 0);

    let selectedSpecId = basePalletId;
    let reason = '';

    // [품목별 판정 4] 기본 파레트에 아예 안 들어가는 경우
    if (baseBoxCount === 0) {
      if (altEvaluations.length > 0) {
        altEvaluations.sort((a, b) => a.palletCount - b.palletCount || b.efficiency - a.efficiency);
        const bestAlt = altEvaluations[0];
        selectedSpecId = bestAlt.id;
        reason = `${cargo.name}: 기본 ${basePalletId} 적재 불가로 ${bestAlt.id} 전환 (${bestAlt.palletCount} PLT)`;
      } else {
        selectedSpecId = basePalletId;
        reason = `${cargo.name}: 기본 및 대체 규격 모두 바닥 크기 초과`;
      }
    }
    // [품목별 판정 2] 층 적재 효율 < minEfficiency
    else if (baseEfficiency < minEfficiency) {
      const effectiveAlts = altEvaluations.filter((a) => a.palletCount < basePalletCount);
      if (effectiveAlts.length > 0) {
        effectiveAlts.sort((a, b) => a.palletCount - b.palletCount || b.efficiency - a.efficiency);
        const bestAlt = effectiveAlts[0];
        selectedSpecId = bestAlt.id;
        reason = `${cargo.name}: ${basePalletId} 효율 ${Math.round(baseEfficiency)}%, ${bestAlt.id} 전환 시 ${basePalletCount}에서 ${bestAlt.palletCount} PLT`;
      } else {
        selectedSpecId = basePalletId;
        const altNames = alternateSpecs.map((s) => s.id).join('/');
        const altCountInfo =
          altEvaluations.length > 0 ? `${altNames}도 ${basePalletCount} PLT라 줄지 않음` : '대체 규격 없음';
        reason = `${cargo.name}: ${basePalletId} 효율 ${Math.round(baseEfficiency)}%로 기준 미달이지만 ${altCountInfo}`;
      }
    }
    // [품목별 판정 1, 3] 층 적재 효율 >= minEfficiency: 기본 유지
    else {
      selectedSpecId = basePalletId;
      const betterAlts = altEvaluations.filter((a) => a.palletCount < basePalletCount);
      if (betterAlts.length > 0) {
        betterAlts.sort((a, b) => a.palletCount - b.palletCount);
        const bestAlt = betterAlts[0];
        const savings = basePalletCount - bestAlt.palletCount;
        reason = `${cargo.name}: ${basePalletId} 효율 ${Math.round(baseEfficiency)}%로 유지 (${bestAlt.id} 사용 시 ${savings} PLT 절감 가능)`;
      } else {
        reason = `${cargo.name}: ${basePalletId} 효율 ${Math.round(baseEfficiency)}%로 유지`;
      }
    }

    return {
      cargoId: cargo.id,
      cargoName: cargo.name,
      selectedSpecId,
      isAlternate: selectedSpecId !== basePalletId,
      baseEfficiency,
      basePalletCount,
      reason,
    };
  });

  const assignedCargos = cargos.map((c) => {
    const dec = decisions.find((d) => d.cargoId === c.id);
    return {
      ...c,
      palletSpecId: dec ? dec.selectedSpecId : basePalletId,
    };
  });

  return {
    basePalletId,
    allowedAlternates: validAlternates,
    allowedOverhang,
    minEfficiency,
    decisions,
    assignedCargos,
  };
}

/**
 * 품목별 최적 파레트 규격 자동 추천 (회사 기준안 기본값 연계)
 */
export function autoRecommendPalletSpecs(cargos, overhang = 0) {
  const policy = evaluateCompanyPolicy({
    cargos,
    basePalletId: 'T11',
    allowedAlternates: ['T12'],
    allowedOverhang: overhang,
    minEfficiency: 70,
  });
  return policy.assignedCargos;
}

/**
 * 사후 파레트 돌출(Overhang) 자동 감지 및 품목별 돌출 허용 시 적재 효율 분석
 */
export function analyzeOverhangDiagnostics(cargos, palletConfig, options = {}) {
  const baseH = Number(palletConfig.baseHeight) || 150;
  const maxTotalH = Number(palletConfig.maxTotalHeight) || 1700;
  const maxLoadH = maxTotalH - baseH;
  const maxCargoWeight = Number(palletConfig.maxWeight) || 1000;
  const defaultOv = Math.max(0, Number(options.overhang) || 0);

  const calcPalletNeed = (perLayerCount, item) => {
    if (perLayerCount <= 0) {
      return { maxLayers: 0, boxesPerPallet: 0, totalPallets: 0 };
    }
    const maxLayersByH = Math.max(1, Math.floor(maxLoadH / Math.max(1, Number(item.height) || 1)));
    const layerWeight = perLayerCount * Math.max(0, Number(item.weight) || 0);
    const maxLayersByW =
      layerWeight > 0 ? Math.max(1, Math.floor(maxCargoWeight / layerWeight)) : maxLayersByH;
    const maxLayersByStrength =
      Number(item.maxTopLoad) > 0 && Number(item.weight) > 0
        ? Math.max(1, Math.floor(1 + Number(item.maxTopLoad) / Number(item.weight)))
        : 999;
    const customMaxL = Number(item.maxLayers) > 0 ? Math.floor(Number(item.maxLayers)) : 999;
    const maxLayers = Math.max(1, Math.min(maxLayersByH, maxLayersByW, maxLayersByStrength, customMaxL));
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

      const strictTpl = computeBest2DLayer(pW, pL, c.width, c.length, allowRot);
      const strictBounds = measureLayerBounds(strictTpl);
      const strictStats = calcPalletNeed(strictBounds.count, c);

      const curTpl = computeBest2DLayer(
        pW + appliedOverhang,
        pL + appliedOverhang,
        c.width,
        c.length,
        allowRot
      );
      const curBounds = measureLayerBounds(curTpl);
      const curStats = calcPalletNeed(curBounds.count, c);
      const curOverhangW = Math.max(0, curBounds.spanW - pW);
      const curOverhangL = Math.max(0, curBounds.spanL - pL);
      const curMaxOverhangMm = Math.max(curOverhangW, curOverhangL);
      const curOuterW = Math.max(pW, curBounds.spanW);
      const curOuterL = Math.max(pL, curBounds.spanL);
      const curOvDirectionText =
        curOverhangW > 0 && curOverhangL === 0
          ? `가로(W) +${curOverhangW}mm (외경 ${curOuterW}×${curOuterL}mm)`
          : curOverhangL > 0 && curOverhangW === 0
          ? `길이(L) +${curOverhangL}mm (외경 ${curOuterW}×${curOuterL}mm)`
          : curOverhangW > 0 && curOverhangL > 0
          ? `가로 +${curOverhangW}mm / 길이 +${curOverhangL}mm (외경 ${curOuterW}×${curOuterL}mm)`
          : '0mm 정사이즈';

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
          const candBounds = measureLayerBounds(candTpl);
          const ovW = Math.max(0, candBounds.spanW - pW);
          const ovL = Math.max(0, candBounds.spanL - pL);
          const exactOvMm = Math.max(ovW, ovL);
          const candStats = calcPalletNeed(candBounds.count, c);
          const savedPallets = Math.max(0, strictStats.totalPallets - candStats.totalPallets);

          // Claude 피드백 반영: 실제로 파레트 절감 효과(savedPallets > 0)가 있는 경우에만 돌출 제안 (0PLT 절감 제안 숨김)
          if (savedPallets > 0 || strictBounds.count === 0) {
            const candOuterW = Math.max(pW, candBounds.spanW);
            const candOuterL = Math.max(pL, candBounds.spanL);
            const ovDirectionText =
              ovW > 0 && ovL === 0
                ? `가로(W) 방향만 +${ovW}mm (외경 ${candOuterW}×${candOuterL}mm)`
                : ovL > 0 && ovW === 0
                ? `길이(L) 방향만 +${ovL}mm (외경 ${candOuterW}×${candOuterL}mm)`
                : `가로 +${ovW}mm / 길이 +${ovL}mm (외경 ${candOuterW}×${candOuterL}mm)`;

            opportunity = {
              requiredOverhangMm: exactOvMm,
              ovDirectionText,
              overhangW: ovW,
              overhangL: ovL,
              outerW: candOuterW,
              outerL: candOuterL,
              eachSideW: Number((ovW / 2).toFixed(1)),
              eachSideL: Number((ovL / 2).toFixed(1)),
              eachSideMax: Number((exactOvMm / 2).toFixed(1)),
              spanW: candBounds.spanW,
              spanL: candBounds.spanL,
              layerCount: candBounds.count,
              boxesPerPallet: candStats.boxesPerPallet,
              totalPallets: candStats.totalPallets,
              savedPallets,
              needsOverhangToFitAtAll: strictBounds.count === 0,
            };
            break;
          }
        }
      }

      const t12Tpl = computeBest2DLayer(1200, 1000, c.width, c.length, allowRot);
      const t12Bounds = measureLayerBounds(t12Tpl);
      const t12Stats = calcPalletNeed(t12Bounds.count, c);
      const canSolveWithT12NoOverhang =
        (pW !== 1200 || pL !== 1000) && t12Bounds.count > strictBounds.count;

      // 컨테이너 폭(2,352mm) 2열 적재 시 래핑 공차 및 안전 돌출 한계치 계산
      const containerInnerWidth = 2352;
      const baseRowWidth = Math.min(pW, pL) * 2;
      const fieldToleranceMargin = 50; // 래핑 두께(+30mm) + 박스 배부름(+20mm)
      const safeOverhangLimitMm = Math.max(0, containerInnerWidth - baseRowWidth - fieldToleranceMargin);
      const safeOverhangPerPalletMm = Math.floor(safeOverhangLimitMm / 2);

      const activeOv = appliedOverhang;
      const estimatedRowWidthWithWrap = baseRowWidth + activeOv + 40; // 래핑+배부름 감안
      const remainingClearanceMm = containerInnerWidth - estimatedRowWidthWithWrap;
      const isOverSafeLimit = activeOv > safeOverhangLimitMm;

      const containerFit = {
        containerInnerWidth,
        baseRowWidth,
        safeOverhangLimitMm,
        safeOverhangPerPalletMm,
        estimatedRowWidthWithWrap,
        remainingClearanceMm,
        isOverSafeLimit,
        riskLevel: remainingClearanceMm < 50 ? 'danger' : remainingClearanceMm < 90 ? 'warning' : 'safe',
        warningText:
          remainingClearanceMm < 50
            ? `래핑 후 2열 폭 약 ${estimatedRowWidthWithWrap}mm — 내벽 잔여 여유 겨우 ${remainingClearanceMm}mm (지게차 진입 시 내벽 주름 간섭 위험!)`
            : remainingClearanceMm < 90
            ? `래핑 후 2열 폭 약 ${estimatedRowWidthWithWrap}mm — 내벽 여유 ${remainingClearanceMm}mm (정밀 진입 필요)`
            : `래핑 후 2열 폭 약 ${estimatedRowWidthWithWrap}mm — 내벽 여유 ${remainingClearanceMm}mm (진입 여유 충분)`,
      };

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
        containerFit,
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
          ovDirectionText: curOvDirectionText,
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
 * 품목(SKU)별로 '상자를 어떻게 쌓을지' (1층 평면 배열 패턴 5종 / 층간 교차 방식 3종 / 상자 세움·눕힘 자세 3종) 비교 분석
 */
export function analyzeCargoStackingOptions(cargos, palletConfig, options = {}) {
  const baseH = Number(palletConfig.baseHeight) || 150;
  const maxTotalH = Number(palletConfig.maxTotalHeight) || 1700;
  const maxLoadH = maxTotalH - baseH;
  const maxCargoWeight = Number(palletConfig.maxWeight) || 1000;
  const defaultOv = Math.max(0, Number(options.overhang) || 0);
  const defaultInterlock = options.interlockLayers !== false;

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

      // 1단 평면 배열 템플릿 생성 및 캔틸레버 위험 사전 진단
      const curTpl = computeBest2DLayer(
        effPalletW,
        effPalletL,
        curPosture.width,
        curPosture.length,
        c.allowRotate !== false,
        curPattern
      );
      const curBounds = measureLayerBounds(curTpl);
      const cantileverCheck = checkLayerCantileverRisk(
        curTpl,
        curBounds,
        resolvedPallet.width,
        resolvedPallet.length
      );

      // 표준 적재 기본값: 수직 기둥 정렬(COLUMN)을 기본 표준으로 설정
      const curStackStyle =
        c.stackingStyle ||
        options.stackingStyle ||
        'COLUMN';
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
        const maxLayersByStrength =
          Number(c.maxTopLoad) > 0 && unitW > 0
            ? Math.max(1, Math.floor(1 + Number(c.maxTopLoad) / unitW))
            : 999;
        const maxLayers = Math.max(1, Math.min(byH, byW, maxLayersByStrength, customMaxL));
        const boxesPerPallet = perLayerCnt * maxLayers;
        return {
          maxLayers,
          boxesPerPallet,
          totalPallets: Math.ceil(qty / boxesPerPallet),
        };
      };

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

      const stackStyleOptions = STACK_STYLE_DEFS.map((stDef) => {
        if (stDef.id === 'COLUMN') {
          return {
            ...stDef,
            label: '수직 기둥 정렬 (표준 권장)',
            shortDesc: '네 모서리가 일치하여 상자 하중 지지력 극대화',
            isRecommended: true,
          };
        }
        if (stDef.id === 'INTERLOCK') {
          return {
            ...stDef,
            label: cantileverCheck.hasRisk
              ? '벽돌식 대칭 교차 (허공 걸침 주의)'
              : '벽돌식 대칭 교차',
            shortDesc: cantileverCheck.hasRisk
              ? '비대칭 배열로 인해 짝수단 박스 일부가 허공에 뜸'
              : '홀수단과 짝수단을 180° 대칭 교차하여 층간 결속',
            isWarning: cantileverCheck.hasRisk,
          };
        }
        return stDef;
      });

      return {
        cargoId: c.id || `cargo-${idx + 1}`,
        cargoName: c.name || `화물 ${idx + 1}`,
        color: c.color || CARGO_COLORS[idx % CARGO_COLORS.length],
        currentPattern: curPattern,
        currentStackStyle: curStackStyle,
        currentPosture: curPosture.posture,
        cantileverCheck,
        patternOptions,
        stackStyleOptions,
        postureOptions,
      };
    });
}
