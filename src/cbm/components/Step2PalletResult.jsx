import React, { useMemo } from 'react';
import {
  computeBest2DLayer,
  resolvePalletDimsForCargo,
  estimate40HcContainerNeeds,
} from '../packingEngine';
import { ThreeViewport } from '../ThreeViewport';
import { Pallet2DBlueprint } from './Pallet2DBlueprint';
import { PalletStackingAccordion } from './PalletStackingAccordion';
import { PalletOverhangPanel } from './PalletOverhangPanel';

const PALLET_MODE_META = {
  T11: {
    badge: '국내 표준',
    title: 'T11 (1100 × 1100)',
    sub: '1,100 × 1,100 mm (국내 유통·제조)',
    desc: '모든 품목을 T11 표준 규격으로 통일하여 적재합니다.',
  },
  T12: {
    badge: '국제 표준',
    title: 'T12 (1200 × 1000)',
    sub: '1,200 × 1,000 mm (수출 및 범용)',
    desc: '모든 품목을 T12 국제 규격으로 통일하여 적재합니다.',
  },
  EUR: {
    badge: '유럽 규격',
    title: 'EUR (1200 × 800)',
    sub: '1,200 × 800 mm (유럽 EPAL 표준)',
    desc: '모든 품목을 EUR 유럽 규격으로 통일하여 적재합니다.',
  },
  EXPORT_1200: {
    badge: '수출 대형',
    title: '1200 대형 (1200 × 1200)',
    sub: '1,200 × 1,200 mm (대형 벌크 수출용)',
    desc: '모든 품목을 1200 대형 규격으로 통일하여 적재합니다.',
  },
};

export function Step2PalletResult({
  theme = 'dark',
  step2Ref,
  simResult,
  palletSelectionMode,
  setPalletSelectionMode,
  policyBasePallet = 'T11',
  setPolicyBasePallet,
  policyAllowedAlternates = ['T12'],
  setPolicyAllowedAlternates,
  policyOverhang = 0,
  setPolicyOverhang,
  policyMinEfficiency = 70,
  setPolicyMinEfficiency,
  companyPolicyResult,
  customMixComparison,
  cargos,
  setCargos,
  effectiveCargos,
  effectivePalletConfig,
  overhang,
  setOverhang,
  handleAutoRecommendPalletMix,
  handleCargoChange,
  currentPallet,
  selectedPalletIdx,
  setSelectedPalletIdx,
  palletVisibleStep,
  setPalletVisibleStep,
  isPalletPlaying,
  setIsPalletPlaying,
  explodePalletLayers,
  setExplodePalletLayers,
  handleRunStep2ToStep3,
  wrappingConfig,
  setWrappingConfig,
}) {
  // 현재 선택된 파레트 규격에 대한 40HC 컨테이너 바닥 완적 기준 소요 대수 실시간 계산
  const { currentModePallets, currentModeLabel, currentModeHcEst } = useMemo(() => {
    if (palletSelectionMode === 'CUSTOM_MIX') {
      const pCount = customMixComparison?.totalPallets || simResult.summary.totalPallets;
      return {
        currentModePallets: pCount,
        currentModeLabel: '회사 기준안 (품목별 맞춤 혼용)',
        currentModeHcEst: estimate40HcContainerNeeds(pCount, 'CUSTOM_MIX'),
      };
    }
    const spec = simResult.palletSpecComparison?.find((s) => s.id === palletSelectionMode);
    const pCount = spec ? spec.totalPallets : simResult.summary.totalPallets;
    return {
      currentModePallets: pCount,
      currentModeLabel: spec ? `${spec.name} (${spec.width}×${spec.length}mm)` : palletSelectionMode,
      currentModeHcEst: estimate40HcContainerNeeds(pCount, palletSelectionMode),
    };
  }, [palletSelectionMode, customMixComparison, simResult]);

  const mixPalletCount = customMixComparison?.totalPallets || simResult.summary.totalPallets;
  const mixHcEst = estimate40HcContainerNeeds(mixPalletCount, 'CUSTOM_MIX');

  // 단일 규격 중 파레트 수 최소인 '최소 파레트안' 추출 및 컨테이너 대수 차이 계산
  const minPalletSpec = useMemo(() => {
    if (!simResult?.palletSpecComparison?.length) return null;
    return [...simResult.palletSpecComparison].sort((a, b) => a.totalPallets - b.totalPallets)[0];
  }, [simResult]);

  const companyContainerCount = simResult.summary.totalContainers;
  const minSpecContainerCount = minPalletSpec?.containerCount || minPalletSpec?.hcEstimate?.containerCount || 0;
  const containerDiff = companyContainerCount - minSpecContainerCount;

  return (
    <section ref={step2Ref} className="cbm-step-section">
      <div className="cbm-section-banner step2-banner">
        <div className="cbm-section-banner-left">
          <span className="cbm-step-badge badge-amber">STEP 2</span>
          <div>
            <h2>파레트 규격 선택 및 한 파레트 적재 시뮬레이션</h2>
            <p>
              파레트 규격을 선택하면 총 파레트 수와 40HC 컨테이너 소요 대수, 그리고 한 파레트에 박스가 어떻게 쌓이는지 2D/3D로 즉시 시각화합니다.
            </p>
          </div>
        </div>
        <div className="cbm-section-summary-pills">
          <div className="cbm-mini-stat highlight-amber">
            <span>총 산출 파레트 수</span>
            <strong>{simResult.summary.totalPallets.toLocaleString()} 파레트 (PLT)</strong>
          </div>
          <div className="cbm-mini-stat">
            <span>파레트 포함 총 중량</span>
            <strong>{simResult.summary.totalWeight.toLocaleString()} kg</strong>
          </div>
          <div className="cbm-mini-stat">
            <span>파레트 외경 총 부피</span>
            <strong>{simResult.summary.totalPalletCbm.toFixed(2)} CBM</strong>
          </div>
        </div>
      </div>

      {/* 2-A: Pallet Size Selection Cards (4 Uniform Presets + 1 Multi-Size Mix Card) */}
      <div className="cbm-card">
        <div className="cbm-card-header">
          <h2>2-A. 파레트 사이즈 선택 (단일 사이즈 통일 vs 여러 사이즈 섞어 쓰기)</h2>
          <span className="cbm-badge">카드를 클릭하면 즉시 적용됩니다</span>
        </div>

        {/* 파레트 운영 기준 설정 (회사 기준안 설정 영역) */}
        <div className="cbm-policy-config-panel">
          <div className="cbm-policy-config-head">
            <div>
              <strong>파레트 운영 기준 설정 (회사 기준안)</strong>
              <p>기본 파레트 유지 원칙을 적용하며, 층 적재 효율이 기준에 미달하고 대체 규격 적용 시 파레트 수가 실제로 줄어드는 품목만 전환합니다.</p>
            </div>
            <button
              type="button"
              className="cbm-btn-xs primary"
              onClick={handleAutoRecommendPalletMix}
            >
              회사 기준안 적용
            </button>
          </div>
          <div className="cbm-policy-config-grid">
            {/* 1. 기본 파레트 */}
            <div className="cbm-policy-field">
              <label className="cbm-policy-label">기본 파레트</label>
              <select
                className="cbm-table-select cbm-policy-select"
                value={policyBasePallet}
                onChange={(e) => {
                  const newBase = e.target.value;
                  if (setPolicyBasePallet) setPolicyBasePallet(newBase);
                  if (policyAllowedAlternates.includes(newBase) && setPolicyAllowedAlternates) {
                    setPolicyAllowedAlternates(policyAllowedAlternates.filter((id) => id !== newBase));
                  }
                }}
              >
                <option value="T11">T11 국내표준 (1100×1100)</option>
                <option value="T12">T12 국제규격 (1200×1000)</option>
                <option value="EUR">EUR 유럽규격 (1200×800)</option>
                <option value="EXPORT_1200">1200 대형 (1200×1200)</option>
              </select>
            </div>

            {/* 2. 대체 허용 규격 (복수 선택) */}
            <div className="cbm-policy-field">
              <label className="cbm-policy-label">대체 허용 규격 (복수 선택)</label>
              <div className="cbm-policy-check-group">
                {['T11', 'T12', 'EUR', 'EXPORT_1200']
                  .filter((id) => id !== policyBasePallet)
                  .map((id) => {
                    const isChecked = policyAllowedAlternates.includes(id);
                    return (
                      <label key={id} className="cbm-policy-check-label">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (!setPolicyAllowedAlternates) return;
                            if (e.target.checked) {
                              setPolicyAllowedAlternates([...policyAllowedAlternates, id]);
                            } else {
                              setPolicyAllowedAlternates(policyAllowedAlternates.filter((x) => x !== id));
                            }
                          }}
                        />
                        <span>{id}</span>
                      </label>
                    );
                  })}
              </div>
            </div>

            {/* 3. 허용 돌출 (mm) */}
            <div className="cbm-policy-field">
              <label className="cbm-policy-label">허용 돌출</label>
              <div className="cbm-policy-input-box">
                <input
                  type="number"
                  min={0}
                  max={150}
                  step={5}
                  value={policyOverhang}
                  onChange={(e) => setPolicyOverhang && setPolicyOverhang(Math.max(0, Number(e.target.value) || 0))}
                  className="cbm-policy-number-input"
                />
                <span className="cbm-policy-unit">mm</span>
              </div>
            </div>

            {/* 4. 전환 기준 층 적재 효율 (%) */}
            <div className="cbm-policy-field">
              <label className="cbm-policy-label">전환 기준 층 적재 효율</label>
              <div className="cbm-policy-input-box">
                <input
                  type="number"
                  min={10}
                  max={95}
                  step={1}
                  value={policyMinEfficiency}
                  onChange={(e) =>
                    setPolicyMinEfficiency &&
                    setPolicyMinEfficiency(Math.max(10, Math.min(100, Number(e.target.value) || 70)))
                  }
                  className="cbm-policy-number-input"
                />
                <span className="cbm-policy-unit">%</span>
              </div>
            </div>
          </div>

          {/* 실무 적재 공차 및 컨테이너 유격 기준 설정 */}
          {wrappingConfig && setWrappingConfig && (
            <div className="cbm-policy-tolerance-section">
              <div className="cbm-policy-tolerance-head">
                <span className="cbm-policy-tolerance-title">현장 안전 공차 및 컨테이너 유격 기준</span>
                <span className="cbm-policy-tolerance-sub">래핑 배부름·어긋남·인양 여유를 반영하여 측면 2열 및 길이 방향 폐쇄 안정성을 진단합니다.</span>
              </div>
              <div className="cbm-policy-tolerance-grid">
                <div className="cbm-tolerance-item">
                  <label>래핑 배부름 공차</label>
                  <div className="cbm-policy-input-box">
                    <input
                      type="number"
                      min={0}
                      max={50}
                      step={5}
                      value={wrappingConfig.wrappingBulgeMm ?? 20}
                      onChange={(e) =>
                        setWrappingConfig({
                          ...wrappingConfig,
                          wrappingBulgeMm: Math.max(0, Number(e.target.value) || 0),
                        })
                      }
                      className="cbm-policy-number-input"
                    />
                    <span className="cbm-policy-unit">mm/파레트</span>
                  </div>
                </div>

                <div className="cbm-tolerance-item">
                  <label>박스 적재 어긋남</label>
                  <div className="cbm-policy-input-box">
                    <input
                      type="number"
                      min={0}
                      max={30}
                      step={2}
                      value={wrappingConfig.stackingMisalignmentMm ?? 10}
                      onChange={(e) =>
                        setWrappingConfig({
                          ...wrappingConfig,
                          stackingMisalignmentMm: Math.max(0, Number(e.target.value) || 0),
                        })
                      }
                      className="cbm-policy-number-input"
                    />
                    <span className="cbm-policy-unit">mm</span>
                  </div>
                </div>

                <div className="cbm-tolerance-item">
                  <label>지게차 인양/도어 여유</label>
                  <div className="cbm-policy-input-box">
                    <input
                      type="number"
                      min={0}
                      max={50}
                      step={5}
                      value={wrappingConfig.forkliftClearanceMm ?? 20}
                      onChange={(e) =>
                        setWrappingConfig({
                          ...wrappingConfig,
                          forkliftClearanceMm: Math.max(0, Number(e.target.value) || 0),
                        })
                      }
                      className="cbm-policy-number-input"
                    />
                    <span className="cbm-policy-unit">mm</span>
                  </div>
                </div>

                <div className="cbm-tolerance-item">
                  <label>컨테이너 내폭 기준</label>
                  <select
                    className="cbm-table-select cbm-tolerance-select"
                    value={wrappingConfig.containerInnerWidthOption ?? 2352}
                    onChange={(e) =>
                      setWrappingConfig({
                        ...wrappingConfig,
                        containerInnerWidthOption: Number(e.target.value) || 2352,
                      })
                    }
                  >
                    <option value={2352}>표준 내폭 (2,352 mm)</option>
                    <option value={2330}>ISO 최소 하한 (2,330 mm / 보수적)</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="cbm-pallet-mode-grid">
          {/* Card 0: 회사 기준안 Mode */}
          <button
            type="button"
            className={`cbm-pallet-mode-card mix-mode-card ${
              palletSelectionMode === 'CUSTOM_MIX' ? 'active' : ''
            }`}
            onClick={() => setPalletSelectionMode('CUSTOM_MIX')}
          >
            <div className="cbm-pm-header">
              <div className="cbm-pm-badge-wrapper">
                <span className="cbm-pm-badge mix-badge">회사 기준안</span>
              </div>
              <strong className="cbm-pm-title">회사 기준안</strong>
              <small className="cbm-pm-sub">기본 {policyBasePallet} 유지 · 기준 미달만 대체</small>
            </div>
            <div className="cbm-pm-body">
              <div className="cbm-pm-stat highlight">
                <span>총 소요 파레트</span>
                <strong>{mixPalletCount} PLT</strong>
              </div>
              <div className="cbm-pm-stat">
                <span>40HC 컨테이너 예상</span>
                <strong>
                  {mixHcEst.isDoubleStack
                    ? `${simResult.summary.totalContainers}대 (2단적 완적 기준)`
                    : `${simResult.summary.totalContainers}대 (1단 바닥 기준)`}
                </strong>
              </div>
              {minPalletSpec && (
                <div className={`cbm-pm-container-diff ${containerDiff !== 0 ? 'warn-diff' : 'match-diff'}`}>
                  {containerDiff !== 0 ? (
                    <span>
                      최소 파레트안({minPalletSpec.name} {minPalletSpec.totalPallets}PLT) 대비 컨테이너 {Math.abs(containerDiff)}대 {containerDiff > 0 ? '추가' : '절감'}
                    </span>
                  ) : (
                    <span>
                      최소 파레트안({minPalletSpec.name} {minPalletSpec.totalPallets}PLT)과 동일한 컨테이너 {companyContainerCount}대 유지
                    </span>
                  )}
                </div>
              )}
              <div className="cbm-pm-desc">
                기본 파레트 유지, 기준 미달 품목만 대체 규격 적용
              </div>
            </div>
          </button>

          {/* Cards 1..N: Uniform Pallet Presets */}
          {simResult.palletSpecComparison?.map((spec) => {
            const isSelected = palletSelectionMode === spec.id;
            const hcEst = spec.hcEstimate || estimate40HcContainerNeeds(spec.totalPallets, spec.id);
            const meta = PALLET_MODE_META[spec.id] || {
              badge: spec.id,
              title: spec.name,
              sub: `${spec.width} × ${spec.length} mm`,
              desc: `모든 품목을 ${spec.name} 단일 규격으로 통일하여 적재합니다.`,
            };
            return (
              <button
                key={spec.id}
                type="button"
                className={`cbm-pallet-mode-card ${isSelected ? 'active' : ''}`}
                onClick={() => setPalletSelectionMode(spec.id)}
              >
                <div className="cbm-pm-header">
                  <div className="cbm-pm-badge-wrapper">
                    <span
                      className={`cbm-pm-badge ${
                        spec.id === 'T11' ? 'std-badge' : spec.id === 'T12' ? 'int-badge' : ''
                      }`}
                    >
                      {meta.badge}
                    </span>
                  </div>
                  <strong className="cbm-pm-title">{meta.title}</strong>
                  <small className="cbm-pm-sub">{meta.sub}</small>
                </div>
                <div className="cbm-pm-body">
                  <div className="cbm-pm-stat highlight">
                    <span>총 소요 파레트</span>
                    <strong>{spec.totalPallets} PLT</strong>
                  </div>
                  <div className="cbm-pm-stat">
                    <span>40HC 컨테이너 예상</span>
                    <strong>
                      {hcEst.isDoubleStack
                        ? `${hcEst.containerCount}대 (2단적 완적 기준)`
                        : `${hcEst.containerCount}대 (1단 바닥 기준)`}
                    </strong>
                  </div>
                  <div className="cbm-pm-desc">{meta.desc}</div>
                </div>
              </button>
            );
          })}
        </div>

        {/* 회사 기준안 품목별 판정 사유 패널 */}
        <div className="cbm-policy-decisions-panel">
          <div className="cbm-policy-decisions-head">
            <strong className="cbm-policy-decisions-title">회사 기준안 품목별 규격 판정 사유</strong>
            <span className="cbm-policy-decisions-sub">
              기본 {policyBasePallet} 유지 원칙 · 층 효율 {policyMinEfficiency}% 미달 및 수량 절감 품목만 대체 규격 적용
            </span>
          </div>
          <div className="cbm-policy-decisions-list">
            {companyPolicyResult?.decisions?.map((d) => (
              <div
                key={d.cargoId}
                className={`cbm-policy-decision-item ${d.isAlternate ? 'is-switched' : 'is-maintained'}`}
              >
                <span className={`cbm-policy-status-badge ${d.isAlternate ? 'switched' : 'maintained'}`}>
                  {d.isAlternate ? `${d.selectedSpecId} 전환` : `${d.selectedSpecId} 유지`}
                </span>
                <span className="cbm-policy-reason-text">{d.reason}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Multi-Pallet Mix Detailed SKU Assigner */}
        {palletSelectionMode === 'CUSTOM_MIX' && (
          <div className="cbm-mix-assigner-panel">
            <div className="cbm-mix-panel-header">
              <div>
                <strong>품목별 파레트 규격 개별 매칭</strong>
                <p>각 박스 크기에 맞는 파레트 규격을 직접 변경하거나 회사 기준안 적용 버튼을 누르세요.</p>
              </div>
              <button
                type="button"
                className="cbm-btn-xs primary"
                onClick={handleAutoRecommendPalletMix}
              >
                회사 기준안 적용
              </button>
            </div>
            <div className="cbm-mix-items-grid">
              {cargos.map((cargo) => {
                const resolved = resolvePalletDimsForCargo(cargo, effectivePalletConfig);
                const itemOv =
                  typeof cargo.allowedOverhang === 'number'
                    ? cargo.allowedOverhang
                    : overhang;
                const layerCnt = computeBest2DLayer(
                  resolved.width + itemOv,
                  resolved.length + itemOv,
                  cargo.width,
                  cargo.length,
                  cargo.allowRotate
                ).length;
                return (
                  <div key={cargo.id} className="cbm-mix-assign-item">
                    <div className="cbm-mix-item-info">
                      <span
                        className="cbm-color-dot"
                        style={{ background: cargo.color }}
                      />
                      <strong className="cbm-mix-item-name">{cargo.name}</strong>
                      <span className="cbm-mix-item-dim">
                        {cargo.width}×{cargo.length}×{cargo.height}mm · {cargo.quantity}박스
                      </span>
                    </div>
                    <div className="cbm-mix-item-control">
                      <select
                        className="cbm-table-select cbm-mix-select"
                        value={cargo.palletSpecId || 'T11'}
                        onChange={(e) =>
                          handleCargoChange(cargo.id, 'palletSpecId', e.target.value)
                        }
                      >
                        <option value="T11">1100 × 1100 mm (T11 표준)</option>
                        <option value="T12">1200 × 1000 mm (T12 국제/돌출방지)</option>
                        <option value="EUR">1200 × 800 mm (EUR 유럽)</option>
                        <option value="EXPORT_1200">1200 × 1200 mm (수출 대형)</option>
                      </select>
                      <span className="cbm-mix-layer-badge">1단 {layerCnt}박스</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* 2-B: 파레트 적재 도면 (2D) 및 3D 시뮬레이션 */}
      <div className="cbm-card">
        <div className="cbm-card-header" style={{ flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <h2>2-B. 파레트 적재 도면 (2D) 및 3D 시뮬레이션</h2>
            <p style={{ margin: '3px 0 0', fontSize: '0.8rem', color: '#cbd5e1' }}>
              선택한 파레트에 화물이 실제로 어떻게 적재되는지 2D 평면 도면과 3D 뷰어로 실시간 확인합니다.
            </p>
          </div>
          <span className="cbm-badge">3D 드래그: 회전 · 클릭 후 휠/Ctrl+휠: 확대/축소</span>
        </div>

        {/* Single Pallet Selector & 2D/3D Split Visualizer */}
        {currentPallet && (
          <div className="cbm-single-pallet-visualizer">
            <div className="cbm-vis-subheader">
              <div className="cbm-pallet-selector-bar">
                <label>선택 파레트:</label>
                <select
                  value={selectedPalletIdx}
                  onChange={(e) => {
                    setSelectedPalletIdx(Number(e.target.value));
                    setPalletVisibleStep(100);
                  }}
                  className="cbm-pallet-select"
                >
                  {simResult.palletWeightGroups?.length > 0 ? (
                    simResult.palletWeightGroups.map((g) => (
                      <optgroup
                        key={g.label}
                        label={`${g.label} — ${g.palletDim} (${g.layerCount}단 · ${g.palletCount}개 파레트)`}
                      >
                        {g.palletIndices.map((pIdx1) => {
                          const p = simResult.pallets[pIdx1 - 1];
                          if (!p) return null;
                          const cargoLabel = p.primaryCargoName || g.label.split(' — ')[0];
                          return (
                            <option key={p.id} value={pIdx1 - 1}>
                              Pallet #{p.index} [{p.width}×{p.length}mm] — {cargoLabel} ({p.boxes.length}박스 · {p.totalHeight}mm · {p.totalWeight}kg)
                            </option>
                          );
                        })}
                      </optgroup>
                    ))
                  ) : (
                    simResult.pallets.map((p, idx) => {
                      const breakdown = effectiveCargos
                        .map((c) =>
                          p.cargoCounts[c.id]
                            ? `${c.name}(${p.cargoCounts[c.id]}박스)`
                            : null
                        )
                        .filter(Boolean)
                        .join(' + ');
                      return (
                        <option key={p.id} value={idx}>
                          Pallet #{p.index} [{p.width}×{p.length}mm] — {breakdown} ({p.layers.length}단 ·{' '}
                          {p.totalHeight}mm · {p.totalWeight}kg)
                        </option>
                      );
                    })
                  )}
                </select>
                <div className="cbm-pallet-nav-btns">
                  <button
                    type="button"
                    disabled={selectedPalletIdx <= 0}
                    onClick={() => setSelectedPalletIdx((i) => Math.max(0, i - 1))}
                  >
                    ◀ 이전
                  </button>
                  <button
                    type="button"
                    disabled={selectedPalletIdx >= simResult.pallets.length - 1}
                    onClick={() =>
                      setSelectedPalletIdx((i) =>
                        Math.min(simResult.pallets.length - 1, i + 1)
                      )
                    }
                  >
                    다음 ▶
                  </button>
                </div>
              </div>

              <label className="cbm-mini-check">
                <input
                  type="checkbox"
                  checked={explodePalletLayers}
                  onChange={(e) => setExplodePalletLayers(e.target.checked)}
                />
                <span>층간 분리뷰(Explode)</span>
              </label>
            </div>

            <div className="cbm-pallet-split-view">
              {/* Left: 2D Top-Down Layer Blueprint (Subcomponent) */}
              <Pallet2DBlueprint currentPallet={currentPallet} theme={theme} />

              {/* Right: 3D Single Pallet Viewport */}
              <div className="cbm-pallet-3d-col">
                <ThreeViewport
                  theme={theme}
                  mode="pallet"
                  palletInstance={currentPallet}
                  visibleStep={palletVisibleStep}
                  explodeLayers={explodePalletLayers}
                />
                <div className="cbm-playback-bar">
                  <button
                    type="button"
                    className="cbm-play-btn"
                    onClick={() => {
                      if (palletVisibleStep >= 100) setPalletVisibleStep(5);
                      setIsPalletPlaying((p) => !p);
                    }}
                  >
                    {isPalletPlaying ? '일시정지' : '▶ 적재 순서 재생'}
                  </button>
                  <div className="cbm-slider-wrap">
                    <span>순서 ({palletVisibleStep}%)</span>
                    <input
                      type="range"
                      min={1}
                      max={100}
                      value={palletVisibleStep}
                      onChange={(e) => {
                        setIsPalletPlaying(false);
                        setPalletVisibleStep(Number(e.target.value));
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Summary Table by Pallet Group */}
        <div className="cbm-weight-table-wrap" style={{ marginTop: '16px' }}>
          <table className="cbm-weight-summary-table">
            <thead>
              <tr>
                <th>품목 및 파레트당 박스 수</th>
                <th>사용 규격</th>
                <th>1층 배열 방식</th>
                <th>적재 단수</th>
                <th>파레트 수</th>
                <th>파레트당 중량</th>
                <th>합계 중량</th>
                <th>도면/3D 확인</th>
              </tr>
            </thead>
            <tbody>
              {simResult.palletWeightGroups.map((g, idx) => {
                const isSelectedGroup =
                  currentPallet && g.palletIndices.includes(currentPallet.index);
                return (
                  <tr
                    key={idx}
                    className={isSelectedGroup ? 'selected-group-row' : ''}
                    style={{ cursor: 'pointer' }}
                    onClick={() => {
                      setSelectedPalletIdx(g.samplePalletIndex);
                      setPalletVisibleStep(100);
                    }}
                  >
                    <td>
                      <strong>{g.label}</strong>
                    </td>
                    <td>
                      <span
                        className={`cbm-spec-chip ${
                          g.palletDim.includes('1200×1000') ? 't12' : 't11'
                        }`}
                      >
                        {g.palletDim}
                      </span>
                      {g.maxOverhangMm > 0 && (
                        <span
                          style={{
                            marginLeft: '6px',
                            fontSize: '0.7rem',
                            padding: '2px 6px',
                            borderRadius: '999px',
                            background: 'rgba(245, 158, 11, 0.22)',
                            color: '#fcd34d',
                            border: '1px solid rgba(245, 158, 11, 0.45)',
                            fontWeight: 700,
                          }}
                        >
                          돌출 +{g.maxOverhangMm}mm
                        </span>
                      )}
                    </td>
                    <td>{g.orientDesc}</td>
                    <td>
                      <strong>{g.layerCount}단</strong> ({g.totalHeight}mm)
                    </td>
                    <td>
                      <strong style={{ color: '#38bdf8' }}>{g.palletCount}개</strong>
                    </td>
                    <td>약 {g.unitPalletWeight.toFixed(1)}kg</td>
                    <td>
                      <strong>{g.totalGroupWeight.toLocaleString()}kg</strong>
                    </td>
                    <td>
                      <button
                        type="button"
                        className={`cbm-btn-xs ${isSelectedGroup ? 'primary' : ''}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedPalletIdx(g.samplePalletIndex);
                          setPalletVisibleStep(100);
                        }}
                      >
                        {isSelectedGroup ? '✓ 선택됨' : '선택'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr>
                <td>
                  <strong>총합</strong>
                </td>
                <td>-</td>
                <td>-</td>
                <td>-</td>
                <td>
                  <strong style={{ color: '#38bdf8', fontSize: '14.5px' }}>
                    총 {simResult.summary.totalPallets}개 파레트
                  </strong>
                </td>
                <td>-</td>
                <td>
                  <strong style={{ color: '#fbbf24', fontSize: '14.5px' }}>
                    {simResult.summary.totalWeight.toLocaleString()}kg
                  </strong>
                </td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* 상자 쌓기 패턴/자세 미세 변경 접이식 서랍 (Subcomponent) */}
        <PalletStackingAccordion
          simResult={simResult}
          currentPallet={currentPallet}
          setSelectedPalletIdx={setSelectedPalletIdx}
          handleCargoChange={handleCargoChange}
        />
      </div>

      {/* 2-C: 파레트 외곽 돌출(Overhang) 허용 설정 (Subcomponent) */}
      <PalletOverhangPanel
        simResult={simResult}
        setOverhang={setOverhang}
        setCargos={setCargos}
        handleCargoChange={handleCargoChange}
        setPalletSelectionMode={setPalletSelectionMode}
      />

      {/* Step 2 -> Step 3 Action Button Bar */}
      <div className="cbm-step-action-bar">
        <button
          type="button"
          className="cbm-calculate-btn step-cta-btn step3-cta"
          onClick={handleRunStep2ToStep3}
        >
          2단계: 컨테이너 적재 시뮬레이션
        </button>
        <div className="cbm-action-sub" style={{ fontSize: '0.82rem', color: '#94a3b8', marginTop: '6px' }}>
          산출된 {simResult.summary.totalPallets}개 파레트를 컨테이너 규격(20ft/40ft/40HC)별로 적재하고 3D 배치 및 소요 대수를 산출합니다.
        </div>
      </div>
    </section>
  );
}
