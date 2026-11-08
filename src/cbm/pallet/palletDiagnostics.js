// Step 2: 사후 파레트 돌출(Overhang) 자동 감지 및 품목별 적재 방식(패턴·교차·자세) 비교 진단 모듈
import {
  CARGO_COLORS,
  PATTERN_DEFS,
  STACK_STYLE_DEFS,
  POSTURE_DEFS,
  INTERLOCK_STRENGTH_FACTOR,
} from '../constants.js';
import {
  resolveCargoBoxDimsByPosture,
  resolvePalletDimsForCargo,
  computeBest2DLayer,
  measureLayerBounds,
  isLayerSymmetricForInterlock,
  doesMirrorChangeSeams,
} from '../layerLayout.js';
import {
  resolveFlatTopLayerIfSameHeight,
  checkLayerCantileverRisk,
} from './palletLayerUtils.js';

/**
 * 사후 파레트 돌출(Overhang) 자동 감지 및 품목별 돌출 허용 시 적재 효율 분석
 */
export function analyzeOverhangDiagnostics(cargos, palletConfig, options = {}) {
  const baseH = Number(palletConfig.baseHeight) || 150;
  const maxTotalH = Number(palletConfig.maxTotalHeight) || 1700;
  const maxLoadH = maxTotalH - baseH;
  const maxCargoWeight = Number(palletConfig.maxWeight) || 1000;
  const defaultOv = Math.max(0, Number(options.overhang) || 0);

  const wrappingConfig = options.wrappingConfig || {};
  const wrappingBulge = Number(wrappingConfig.wrappingBulgeMm) || 20;
  const misalignment = Number(wrappingConfig.stackingMisalignmentMm) || 10;
  const forkliftClearance = Number(wrappingConfig.forkliftLateralClearanceMm || wrappingConfig.forkliftClearanceMm) || 20;
  const containerInnerWidth = Number(wrappingConfig.containerInnerWidthOption) || 2352;

  const calcPalletNeed = (perLayerCount, item, tplRef = null) => {
    if (perLayerCount <= 0) {
      return { maxLayers: 0, boxesPerPallet: 0, totalPallets: 0 };
    }
    const maxLayersByH = Math.max(1, Math.floor(maxLoadH / Math.max(1, Number(item.height) || 1)));
    const layerWeight = perLayerCount * Math.max(0, Number(item.weight) || 0);
    const maxLayersByW =
      layerWeight > 0 ? Math.max(1, Math.floor(maxCargoWeight / layerWeight)) : maxLayersByH;

    const isSym = tplRef ? isLayerSymmetricForInterlock(tplRef) : true;
    const hasSeamShift = tplRef ? doesMirrorChangeSeams(tplRef) : false;
    const effectiveStackStyle =
      item.stackingStyle || (options.interlockLayers !== false && isSym ? 'INTERLOCK' : 'COLUMN');
    const isTrueSeamShift =
      effectiveStackStyle === 'CROSS_TIER' ||
      (effectiveStackStyle === 'INTERLOCK' && isSym && hasSeamShift);
    const strengthFactor = isTrueSeamShift ? INTERLOCK_STRENGTH_FACTOR : 1.0;
    const effectiveTopLoad = Number(item.maxTopLoad) > 0 ? Number(item.maxTopLoad) * strengthFactor : 0;
    const maxLayersByStrength =
      effectiveTopLoad > 0 && Number(item.weight) > 0
        ? Math.max(1, Math.floor(1 + effectiveTopLoad / Number(item.weight)))
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
      const strictStats = calcPalletNeed(strictBounds.count, c, strictTpl);

      const curTpl = computeBest2DLayer(
        pW + appliedOverhang,
        pL + appliedOverhang,
        c.width,
        c.length,
        allowRot
      );
      const curBounds = measureLayerBounds(curTpl);
      const curStats = calcPalletNeed(curBounds.count, c, curTpl);
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
          const candStats = calcPalletNeed(candBounds.count, c, candTpl);
          const savedPallets = Math.max(0, strictStats.totalPallets - candStats.totalPallets);

          const candOuterW = Math.max(pW, candBounds.spanW);
          const candOuterL = Math.max(pL, candBounds.spanL);
          const candRowWidth = Math.min(candOuterW, candOuterL) * 2;
          const candRowLength = Math.max(candOuterW, candOuterL);
          const totalRequiredLateral = wrappingBulge * 2 + misalignment * 2 + forkliftClearance;
          const lateralClearance = containerInnerWidth - (candRowWidth + totalRequiredLateral);
          const estCols = Math.ceil(candStats.totalPallets / 2);
          const totalLoadLength = estCols * candRowLength;
          const netLengthClearance = 12032 - (totalLoadLength + estCols * (wrappingBulge + misalignment));

          const isViable = lateralClearance >= 30 && netLengthClearance >= 50 && exactOvMm <= 60;

          if (savedPallets > 0 || strictBounds.count === 0) {
            const ovDirectionText =
              ovW > 0 && ovL === 0
                ? `가로(W) 방향만 +${ovW}mm (외경 ${candOuterW}×${candOuterL}mm)`
                : ovL > 0 && ovW === 0
                ? `길이(L) 방향만 +${ovL}mm (외경 ${candOuterW}×${candOuterL}mm)`
                : `가로 +${ovW}mm / 길이 +${ovL}mm (외경 ${candOuterW}×${candOuterL}mm)`;

            const candOpp = {
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
              isViable,
              lateralClearance,
              netLengthClearance,
              reason: !isViable
                ? netLengthClearance < 50
                  ? `컨테이너 내부 길이(12,032mm) 대비 화물 적재길이(${totalLoadLength}mm) 및 래핑 공차 초과로 적입 불가`
                  : lateralClearance < 30
                  ? `컨테이너 내폭(${containerInnerWidth}mm) 대비 열 폭(${candRowWidth}mm) 및 측면 공차 초과로 적입 불가`
                  : `돌출 ${exactOvMm}mm 과다(파레트 외곽 지지력 상실 및 전도 위험)로 현장 불가`
                : '적입 가능',
            };

            if (isViable) {
              opportunity = candOpp;
              break;
            }
          }
        }
      }

      const t12Tpl = computeBest2DLayer(1200, 1000, c.width, c.length, allowRot);
      const t12Bounds = measureLayerBounds(t12Tpl);
      const t12Stats = calcPalletNeed(t12Bounds.count, c, t12Tpl);
      const canSolveWithT12NoOverhang =
        (pW !== 1200 || pL !== 1000) && t12Bounds.count > strictBounds.count;

      const baseRowWidth = Math.min(pW, pL) * 2;
      const totalToleranceMargin = wrappingBulge * 2 + misalignment * 2 + forkliftClearance;
      const safeOverhangLimitMm = Math.max(0, containerInnerWidth - baseRowWidth - totalToleranceMargin);
      const safeOverhangPerPalletMm = Math.floor(safeOverhangLimitMm / 2);

      const activeOv = appliedOverhang;
      const estimatedRowWidthWithWrap = baseRowWidth + activeOv + (wrappingBulge * 2 + misalignment * 2);
      const remainingClearanceMm = containerInnerWidth - estimatedRowWidthWithWrap - forkliftClearance;
      const isOverSafeLimit = activeOv > safeOverhangLimitMm;

      const isCurrentOverhangImpossible = curMaxOverhangMm > 60 || remainingClearanceMm < 30;
      let impossibleReason = null;
      if (remainingClearanceMm < 30) {
        impossibleReason = `컨테이너 측면 잔여 여유 부족 (${remainingClearanceMm}mm < 최소 30mm)`;
      } else if (curMaxOverhangMm > 60) {
        impossibleReason = `돌출 ${curMaxOverhangMm}mm 과다 (파레트 외곽 지지 한계 초과 및 전도 위험)`;
      }

      const containerFit = {
        containerInnerWidth,
        baseRowWidth,
        safeOverhangLimitMm,
        safeOverhangPerPalletMm,
        estimatedRowWidthWithWrap,
        remainingClearanceMm,
        isOverSafeLimit,
        isCurrentOverhangImpossible,
        impossibleReason,
        riskLevel: isCurrentOverhangImpossible || remainingClearanceMm < 40 ? 'danger' : remainingClearanceMm < 80 ? 'warning' : 'safe',
        warningText:
          isCurrentOverhangImpossible
            ? `[현장 불가] ${impossibleReason} — 적입 불가 및 운송 중 화물 손상 위험`
            : remainingClearanceMm < 40
            ? `래핑 후 2열 폭 약 ${estimatedRowWidthWithWrap}mm — 내벽 잔여 여유 ${remainingClearanceMm}mm (지게차 진입 시 정밀 작업 필요)`
            : remainingClearanceMm < 80
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
      const qty = Math.max(0, Math.floor(Number(c.quantity) || 0));
      const unitW = Math.max(0, Number(c.weight) || 0);
      const customMaxL = Number(c.maxLayers) > 0 ? Math.floor(Number(c.maxLayers)) : 999;
      const maxLayersEst = Math.max(1, Math.floor(maxLoadH / Math.max(1, curPosture.height)));

      const curTpl = resolveFlatTopLayerIfSameHeight(
        effPalletW,
        effPalletL,
        curPosture.width,
        curPosture.length,
        c.allowRotate !== false,
        curPattern,
        qty,
        maxLayersEst
      );
      const curBounds = measureLayerBounds(curTpl);
      const cantileverCheck = checkLayerCantileverRisk(
        curTpl,
        curBounds,
        resolvedPallet.width,
        resolvedPallet.length
      );

      const isSymmetricCur = isLayerSymmetricForInterlock(curTpl);
      const isCurSafe = !cantileverCheck.hasRisk && isSymmetricCur;
      const reqStackStyle =
        c.stackingStyle ||
        options.stackingStyle ||
        (defaultInterlock && isCurSafe ? 'INTERLOCK' : 'COLUMN');
      const curStackStyle =
        reqStackStyle === 'INTERLOCK' && !isCurSafe ? 'COLUMN' : reqStackStyle;

      const calcStats = (perLayerCnt, boxH, tplRef = curTpl) => {
        if (perLayerCnt <= 0 || boxH > maxLoadH) {
          return { maxLayers: 0, boxesPerPallet: 0, totalPallets: 0 };
        }
        const byH = Math.max(1, Math.floor(maxLoadH / Math.max(1, boxH)));
        const layerW = perLayerCnt * unitW;
        const byW = layerW > 0 ? Math.max(1, Math.floor(maxCargoWeight / layerW)) : byH;
        const isTrueSeamShift =
          curStackStyle === 'CROSS_TIER' ||
          (curStackStyle === 'INTERLOCK' && isCurSafe && doesMirrorChangeSeams(tplRef));
        const strengthFactor = isTrueSeamShift ? INTERLOCK_STRENGTH_FACTOR : 1.0;
        const effectiveTopLoad =
          Number(c.maxTopLoad) > 0 ? Number(c.maxTopLoad) * strengthFactor : 0;
        const maxLayersByStrength =
          effectiveTopLoad > 0 && unitW > 0
            ? Math.max(1, Math.floor(1 + effectiveTopLoad / unitW))
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
        const tpl = resolveFlatTopLayerIfSameHeight(
          effPalletW,
          effPalletL,
          curPosture.width,
          curPosture.length,
          c.allowRotate !== false,
          pDef.id,
          qty,
          maxLayersEst
        );
        const normalCnt = tpl.filter((b) => !b.rotated).length;
        const rotCnt = tpl.filter((b) => b.rotated).length;
        const stats = calcStats(tpl.length, curPosture.height, tpl);
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
        const stats = calcStats(tpl.length, pDims.height, tpl);
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
