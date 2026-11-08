// Step 2: 품목별 파레트 사용 정책(기본 규격 유지 · 선별 대체) 자동 판정 및 추천
import { PALLET_PRESETS } from '../constants.js';
import { computeBest2DLayer } from '../layerLayout.js';

/**
 * 품목별 파레트 사용(기본 규격 유지 · 선별 대체) 자동 판정
 * @param {Object} params
 * @param {Function} packFn - packCargosIntoPallets 함수 (순환 참조 방지)
 */
export function evaluateCompanyPolicyWithPacker(
  {
    cargos,
    palletConfig = {},
    basePalletId = 'T11',
    allowedAlternates = ['T12'],
    allowedOverhang = 0,
    minEfficiency = 70,
    options = {},
  },
  packFn
) {
  const baseSpec = PALLET_PRESETS[basePalletId] || PALLET_PRESETS.T11;
  const baseW = baseSpec.width;
  const baseL = baseSpec.length;
  const baseArea = baseW * baseL;

  const validAlternates = (Array.isArray(allowedAlternates) ? allowedAlternates : [allowedAlternates])
    .filter((id) => id !== basePalletId && PALLET_PRESETS[id]);
  const alternateSpecs = validAlternates.map((id) => PALLET_PRESETS[id]);

  const decisions = cargos.map((cargo) => {
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

    const baseRes = packFn(
      [{ ...cargo, palletSpecId: basePalletId }],
      { ...palletConfig, width: baseW, length: baseL },
      { ...options, overhang: allowedOverhang }
    );
    const basePalletCount = baseRes.pallets.length;

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
        const altRes = packFn(
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
    } else if (baseEfficiency < minEfficiency) {
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
    } else {
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
