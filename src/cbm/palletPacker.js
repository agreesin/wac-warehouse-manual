// Step 2: 파레트 적재 시뮬레이션 코어 엔진 및 하위 진단·정책 모듈 오케스트레이터
import {
  CARGO_COLORS,
  INTERLOCK_STRENGTH_FACTOR,
} from './constants.js';
import {
  resolveCargoBoxDimsByPosture,
  resolvePalletDimsForCargo,
  measureLayerBounds,
  describeLayerOrientation,
  isLayerSymmetricForInterlock,
  doesMirrorChangeSeams,
} from './layerLayout.js';
import {
  resolveFlatTopLayerIfSameHeight,
  computePalletLocalCoG,
  pickBalancedSubset,
  checkLayerCantileverRisk,
} from './pallet/palletLayerUtils.js';
import { evaluateCompanyPolicyWithPacker } from './pallet/palletPolicy.js';
import {
  analyzeOverhangDiagnostics,
  analyzeCargoStackingOptions,
} from './pallet/palletDiagnostics.js';

export {
  computePalletLocalCoG,
  pickBalancedSubset,
  checkLayerCantileverRisk,
  analyzeOverhangDiagnostics,
  analyzeCargoStackingOptions,
};

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
      const maxLayersEst = Math.max(1, Math.floor(maxLoadH / Math.max(1, resolvedPosture.height)));
      const sampleTpl = resolveFlatTopLayerIfSameHeight(
        effW,
        effL,
        resolvedPosture.width,
        resolvedPosture.length,
        c.allowRotate !== false,
        curPattern,
        Math.max(0, Math.floor(Number(c.quantity) || 0)),
        maxLayersEst
      );
      const sampleBounds = measureLayerBounds(sampleTpl);
      const cantileverCheck = checkLayerCantileverRisk(
        sampleTpl,
        sampleBounds,
        resolvedPallet.width,
        resolvedPallet.length
      );

      // 적재 방식 기본값: 캔틸레버(허공 걸침) 위험이 있거나 비대칭 배열인 경우
      // 층간 요철 단차 및 붕괴를 원천 방지하기 위해 무조건 안전한 [수직 기둥 일자 정렬(COLUMN)]을 강제 적용합니다.
      const isSymmetric = isLayerSymmetricForInterlock(sampleTpl);
      const isInterlockSafe = !cantileverCheck.hasRisk && isSymmetric;
      const requestedStyle =
        c.stackingStyle ||
        options.stackingStyle ||
        (interlockLayers && isInterlockSafe ? 'INTERLOCK' : 'COLUMN');
      const finalStackStyle =
        requestedStyle === 'INTERLOCK' && !isInterlockSafe ? 'COLUMN' : requestedStyle;

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
        strengthReductionFactor: Number(c.strengthReductionFactor) > 0 ? Number(c.strengthReductionFactor) : 1.0,
        palletSpecId: resolvedPallet.specId,
        palletSpecName: resolvedPallet.specName,
        palletW: resolvedPallet.nominalWidth || resolvedPallet.width,
        palletL: resolvedPallet.nominalLength || resolvedPallet.length,
        nominalWidth: resolvedPallet.nominalWidth || resolvedPallet.width,
        nominalLength: resolvedPallet.nominalLength || resolvedPallet.length,
        measuredWidth: resolvedPallet.measuredWidth,
        measuredLength: resolvedPallet.measuredLength,
        hasMeasured: resolvedPallet.hasMeasured,
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
    const maxLayersByH = Math.max(1, Math.floor(maxLoadH / item.height));
    const template = resolveFlatTopLayerIfSameHeight(
      effW,
      effL,
      item.width,
      item.length,
      item.allowRotate,
      item.layerPattern,
      item.quantity,
      maxLayersByH
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

      const fullLayerWeight = template.length * item.weight;
      const maxLayersByW =
        fullLayerWeight > 0
          ? Math.max(1, Math.floor(maxCargoWeight / fullLayerWeight))
          : maxLayersByH;
      const isSymmetricTpl = isLayerSymmetricForInterlock(template);
      const hasSeamShift = doesMirrorChangeSeams(template);
      const effectiveStackStyle =
        item.stackingStyle || (interlockLayers && isSymmetricTpl ? 'INTERLOCK' : 'COLUMN');
      const isTrueSeamInterlock =
        effectiveStackStyle === 'CROSS_TIER' ||
        (effectiveStackStyle === 'INTERLOCK' && isSymmetricTpl && hasSeamShift);
      const baseStrengthFactor = isTrueSeamInterlock ? INTERLOCK_STRENGTH_FACTOR : 1.0;
      const strengthFactor = baseStrengthFactor * (Number(item.strengthReductionFactor) > 0 ? Number(item.strengthReductionFactor) : 1.0);
      const effectiveTopLoad =
        item.maxTopLoad > 0 ? item.maxTopLoad * strengthFactor : 0;
      const maxLayersByStrength =
        effectiveTopLoad > 0 && item.weight > 0
          ? Math.max(1, Math.floor(1 + effectiveTopLoad / item.weight))
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

  const createEmptyPallet = (
    index,
    pW,
    pL,
    specId,
    specName,
    nominalW,
    nominalL,
    measuredW,
    measuredL,
    hasMeasured
  ) => ({
    id: `pallet-${index}`,
    index,
    palletSpecId: specId,
    palletSpecName: specName,
    width: pW,
    length: pL,
    nominalWidth: nominalW || pW,
    nominalLength: nominalL || pL,
    measuredWidth: measuredW || null,
    measuredLength: measuredL || null,
    hasMeasured: Boolean(hasMeasured),
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
      const prevBoxes = pallet.boxes.filter(
        (b) => b.layerIndex === pallet.layers.length - 1
      );
      const positionedTpl =
        prevBoxes.length === template.length
          ? prevBoxes.map((b) => ({
              x: b.x,
              z: b.z,
              w: b.w,
              l: b.l,
              rotated: b.rotated,
            }))
          : template.map((p) => ({
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
      cargoItem.stackingStyle || (interlockLayers ? 'INTERLOCK' : 'COLUMN');

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

    const isSymmetricPlaced = isLayerSymmetricForInterlock(placedTemplate);
    const isCantileverSafe = !cargoItem.cantileverCheck?.hasRisk;
    const shouldMirror =
      itemStackStyle === 'INTERLOCK' && isFull && isEvenLayer && isSymmetricPlaced && isCantileverSafe;
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
        item.palletSpecName,
        item.nominalWidth,
        item.nominalLength,
        item.measuredWidth,
        item.measuredLength,
        item.hasMeasured
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
            item.palletSpecName,
            item.nominalWidth,
            item.nominalLength,
            item.measuredWidth,
            item.measuredLength,
            item.hasMeasured
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
          firstCand.palletSpecName,
          firstCand.nominalWidth,
          firstCand.nominalLength,
          firstCand.measuredWidth,
          firstCand.measuredLength,
          firstCand.hasMeasured
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
 * 품목별 파레트 사용(기본 규격 유지 · 선별 대체) 자동 판정
 */
export function evaluateCompanyPolicy(params) {
  return evaluateCompanyPolicyWithPacker(params, packCargosIntoPallets);
}

/**
 * 품목별 최적 파레트 규격 자동 추천 (품목별 파레트 사용 기본값 연계)
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
