import React, { useMemo } from 'react';
import {
  computeBest2DLayer,
  resolvePalletDimsForCargo,
  resolveCargoBoxDimsByPosture,
  estimate40HcContainerNeeds,
} from '../packingEngine';

const PALLET_MODE_META = {
  T11: {
    badge: '국내 표준',
    title: 'T11 (1100 × 1100)',
    sub: '1,100 × 1,100 mm',
    desc: '전체 T11 단일 규격 적재',
  },
  T12: {
    badge: '국제 표준',
    title: 'T12 (1200 × 1000)',
    sub: '1,200 × 1,000 mm',
    desc: '전체 T12 단일 규격 적재',
  },
  EUR: {
    badge: '유럽 규격',
    title: 'EUR (1200 × 800)',
    sub: '1,200 × 800 mm',
    desc: '전체 EUR 단일 규격 적재',
  },
  EXPORT_1200: {
    badge: '1200×1200',
    title: '1200×1200',
    sub: '1,200 × 1,200 mm',
    desc: '전체 1200×1200 단일 규격 적재',
  },
};

/**
 * 2-A: 파레트 규격 선택 카드 및 품목별 파레트 사용 설정 패널
 */
export function PalletSpecSelectorCard({
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
  effectivePalletConfig,
  overhang,
  handleAutoRecommendPalletMix,
  handleCargoChange,
  wrappingConfig,
  setWrappingConfig,
}) {
  const mixPalletCount = customMixComparison?.totalPallets || simResult.summary.totalPallets;
  const mixHcEst = estimate40HcContainerNeeds(mixPalletCount, 'CUSTOM_MIX');

  const minPalletSpec = useMemo(() => {
    if (!simResult?.palletSpecComparison?.length) return null;
    return [...simResult.palletSpecComparison].sort((a, b) => a.totalPallets - b.totalPallets)[0];
  }, [simResult]);

  const companyContainerCount = simResult.summary.totalContainers;
  const minSpecContainerCount = minPalletSpec?.containerCount || minPalletSpec?.hcEstimate?.containerCount || 0;
  const containerDiff = companyContainerCount - minSpecContainerCount;

  return (
    <div className="cbm-card">
      <div className="cbm-card-header">
        <h2>2-A. 파레트 규격 선택</h2>
      </div>

      {/* 품목별 파레트 선택 기준 설정 패널 */}
      <div className="cbm-policy-config-panel">
        <div className="cbm-policy-config-head">
          <div>
            <strong>품목별 파레트 선택 기준</strong>
            <p>기본 파레트 유지를 원칙으로 하되, 층 적재 효율 개선 시에만 대체 규격으로 전환합니다.</p>
          </div>
          <button
            type="button"
            className="cbm-btn-xs primary"
            onClick={handleAutoRecommendPalletMix}
          >
            품목별 파레트 적용
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
              <option value="EXPORT_1200">수출용 (1200×1200)</option>
            </select>
          </div>

          {/* 2. 대체 허용 규격 (복수 선택) */}
          <div className="cbm-policy-field">
            <label className="cbm-policy-label">대체 허용 규격 (복수 선택)</label>
            <div className="cbm-policy-check-group">
              {[
                { id: 'T11', label: '1100×1100 (T11)' },
                { id: 'T12', label: '1200×1000 (T12)' },
                { id: 'EUR', label: '1200×800 (EUR)' },
                { id: 'EXPORT_1200', label: '수출용 (1200×1200)' },
              ]
                .filter((item) => item.id !== policyBasePallet)
                .map((item) => {
                  const isChecked = policyAllowedAlternates.includes(item.id);
                  return (
                    <label key={item.id} className="cbm-policy-check-label">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) => {
                          if (!setPolicyAllowedAlternates) return;
                          if (e.target.checked) {
                            setPolicyAllowedAlternates([...policyAllowedAlternates, item.id]);
                          } else {
                            setPolicyAllowedAlternates(policyAllowedAlternates.filter((x) => x !== item.id));
                          }
                        }}
                      />
                      <span>{item.label}</span>
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
                style={policyOverhang > 50 ? { borderColor: '#ef4444', color: '#fca5a5' } : undefined}
              />
              <span className="cbm-policy-unit">mm</span>
            </div>
            {policyOverhang > 50 && (
              <span style={{ fontSize: '11px', color: '#f87171', display: 'block', marginTop: '3px' }}>
                [주의] 과다 돌출 시 컨테이너 길이/내폭 초과로 적입 불가
              </span>
            )}
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
              <span className="cbm-policy-tolerance-title">현장 안전 공차 설정</span>
              <span className="cbm-policy-tolerance-sub">래핑 배부름·어긋남·진입 여유를 반영하여 적재 안정성을 진단합니다.</span>
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
                <label>
                  지게차 측면 진입 여유 <small style={{ fontSize: '10.5px', color: '#94a3b8' }}>(가정값, 실측 시 교체)</small>
                </label>
                <div className="cbm-policy-input-box">
                  <input
                    type="number"
                    min={0}
                    max={60}
                    step={5}
                    value={wrappingConfig.forkliftLateralClearanceMm ?? wrappingConfig.forkliftClearanceMm ?? 20}
                    onChange={(e) => {
                      const val = Math.max(0, Number(e.target.value) || 0);
                      setWrappingConfig({
                        ...wrappingConfig,
                        forkliftLateralClearanceMm: val,
                        forkliftClearanceMm: val,
                      });
                    }}
                    className="cbm-policy-number-input"
                  />
                  <span className="cbm-policy-unit">mm</span>
                </div>
              </div>

              <div className="cbm-tolerance-item">
                <label>
                  지게차 도어 인양 여유 <small style={{ fontSize: '10.5px', color: '#94a3b8' }}>(가정값, 실측 시 교체)</small>
                </label>
                <div className="cbm-policy-input-box">
                  <input
                    type="number"
                    min={40}
                    max={150}
                    step={10}
                    value={wrappingConfig.forkliftLiftingClearanceMm ?? 100}
                    onChange={(e) =>
                      setWrappingConfig({
                        ...wrappingConfig,
                        forkliftLiftingClearanceMm: Math.max(0, Number(e.target.value) || 0),
                      })
                    }
                    className="cbm-policy-number-input"
                  />
                  <span className="cbm-policy-unit">mm</span>
                </div>
              </div>

              <div className="cbm-tolerance-item">
                <label>
                  에어백 유효 길이 <small style={{ fontSize: '10.5px', color: '#94a3b8' }}>(가정값, 실측 시 교체)</small>
                </label>
                <div className="cbm-policy-input-box">
                  <input
                    type="number"
                    min={1000}
                    max={2400}
                    step={100}
                    value={wrappingConfig.airbagEffectiveLengthMm ?? 1800}
                    onChange={(e) =>
                      setWrappingConfig({
                        ...wrappingConfig,
                        airbagEffectiveLengthMm: Math.max(500, Number(e.target.value) || 1800),
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
                  <option value={2330}>ISO 최소 하한 (2,330 mm)</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="cbm-pallet-mode-grid">
        {/* Card 0: 품목별 파레트 사용 Mode */}
        <button
          type="button"
          className={`cbm-pallet-mode-card mix-mode-card ${
            palletSelectionMode === 'CUSTOM_MIX' ? 'active' : ''
          }`}
          onClick={() => setPalletSelectionMode('CUSTOM_MIX')}
        >
          <div className="cbm-pm-header">
            <div className="cbm-pm-badge-wrapper">
              <span className="cbm-pm-badge mix-badge">품목별 사용</span>
            </div>
            <strong className="cbm-pm-title">품목별 파레트 사용</strong>
            <small className="cbm-pm-sub">기본 {policyBasePallet} 유지</small>
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
                    최소 파레트안({minPalletSpec.shortLabel || minPalletSpec.name} {minPalletSpec.totalPallets}PLT) 대비 컨테이너 {Math.abs(containerDiff)}대 {containerDiff > 0 ? '추가' : '절감'}
                  </span>
                ) : (
                  <span>
                    최소 파레트안({minPalletSpec.shortLabel || minPalletSpec.name} {minPalletSpec.totalPallets}PLT)과 동일한 컨테이너 {companyContainerCount}대 유지
                  </span>
                )}
              </div>
            )}
            <div className="cbm-pm-desc">
              기본 규격 유지 및 필요 품목만 대체
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

      {/* 품목별 파레트 판정 사유 패널 */}
      <div className="cbm-policy-decisions-panel">
        <div className="cbm-policy-decisions-head">
          <strong className="cbm-policy-decisions-title">품목별 파레트 규격 판정 사유</strong>
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
              <p>각 박스 크기에 맞는 파레트 규격을 직접 변경하거나 품목별 파레트 적용 버튼을 누르세요.</p>
            </div>
            <button
              type="button"
              className="cbm-btn-xs primary"
              onClick={handleAutoRecommendPalletMix}
            >
              품목별 파레트 적용
            </button>
          </div>
          <div className="cbm-mix-items-grid">
            {cargos.map((cargo) => {
              const resolved = resolvePalletDimsForCargo(cargo, effectivePalletConfig);
              const resolvedPosture = resolveCargoBoxDimsByPosture(cargo);
              const itemOv =
                typeof cargo.allowedOverhang === 'number'
                  ? cargo.allowedOverhang
                  : overhang;
              const layerCnt = computeBest2DLayer(
                resolved.width + itemOv,
                resolved.length + itemOv,
                resolvedPosture.width,
                resolvedPosture.length,
                cargo.allowRotate !== false,
                cargo.layerPattern || 'AUTO_MAX'
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
                      <option value="T11">1100 × 1100 mm (T11)</option>
                      <option value="T12">1200 × 1000 mm (T12)</option>
                      <option value="EUR">1200 × 800 mm (EUR)</option>
                      <option value="EXPORT_1200">1200 × 1200 mm</option>
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
  );
}
