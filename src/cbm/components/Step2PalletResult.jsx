import React from 'react';
import { ThreeViewport } from '../ThreeViewport';
import { PalletSpecSelectorCard } from './PalletSpecSelectorCard';
import { Pallet2DBlueprint } from './Pallet2DBlueprint';
import { PalletStackingAccordion } from './PalletStackingAccordion';
import { PalletOverhangPanel } from './PalletOverhangPanel';

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
  return (
    <section ref={step2Ref} className="cbm-step-section">
      <div className="cbm-section-banner step2-banner">
        <div className="cbm-section-banner-left">
          <span className="cbm-step-badge badge-amber">STEP 2</span>
          <div>
            <h2>파레트 규격 선택 및 3D 적재</h2>
            <p>
              파레트 규격별 소요량 및 1파레트 3D 적재 도면을 확인합니다.
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
      <PalletSpecSelectorCard
        simResult={simResult}
        palletSelectionMode={palletSelectionMode}
        setPalletSelectionMode={setPalletSelectionMode}
        policyBasePallet={policyBasePallet}
        setPolicyBasePallet={setPolicyBasePallet}
        policyAllowedAlternates={policyAllowedAlternates}
        setPolicyAllowedAlternates={setPolicyAllowedAlternates}
        policyOverhang={policyOverhang}
        setPolicyOverhang={setPolicyOverhang}
        policyMinEfficiency={policyMinEfficiency}
        setPolicyMinEfficiency={setPolicyMinEfficiency}
        companyPolicyResult={companyPolicyResult}
        customMixComparison={customMixComparison}
        cargos={cargos}
        effectivePalletConfig={effectivePalletConfig}
        overhang={overhang}
        handleAutoRecommendPalletMix={handleAutoRecommendPalletMix}
        handleCargoChange={handleCargoChange}
        wrappingConfig={wrappingConfig}
        setWrappingConfig={setWrappingConfig}
      />

      {/* 2-B: 파레트 적재 도면 및 3D 시각화 */}
      <div className="cbm-card">
        <div className="cbm-card-header" style={{ flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <h2>2-B. 파레트 적재 도면 및 3D 시각화</h2>
          </div>
          <span className="cbm-badge">드래그: 회전 · 휠: 확대/축소</span>
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
                <span>층간 분리뷰</span>
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
        wrappingConfig={wrappingConfig}
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
