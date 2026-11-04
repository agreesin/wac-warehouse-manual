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

export function Step2PalletResult({
  step2Ref,
  simResult,
  palletSelectionMode,
  setPalletSelectionMode,
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
}) {
  // 현재 선택된 파레트 규격에 대한 40HC 컨테이너 바닥 완적 기준 소요 대수 실시간 계산
  const { currentModePallets, currentModeLabel, currentModeHcEst } = useMemo(() => {
    if (palletSelectionMode === 'CUSTOM_MIX') {
      const pCount = customMixComparison?.totalPallets || simResult.summary.totalPallets;
      return {
        currentModePallets: pCount,
        currentModeLabel: '품목별 복합 파레트 섞어 쓰기',
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

        <div className="cbm-pallet-mode-grid">
          {/* Card 0: Multi-Pallet Mix Mode (여러 파레트 사이즈 섞어 쓰기) */}
          <button
            type="button"
            className={`cbm-pallet-mode-card mix-mode-card ${
              palletSelectionMode === 'CUSTOM_MIX' ? 'active' : ''
            }`}
            onClick={() => setPalletSelectionMode('CUSTOM_MIX')}
          >
            <div className="cbm-pm-header">
              <span className="cbm-pm-badge mix-badge">💡 추천 조합</span>
              <strong className="cbm-pm-title">품목별 최적 사이즈 섞어 쓰기</strong>
              <small className="cbm-pm-sub">박스별로 1100 또는 1200 최적 매칭</small>
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
                    ? `${mixHcEst.containerCount}대 (2단적 완적 기준)`
                    : `${mixHcEst.containerCount}대 (1단 바닥 기준)`}
                </strong>
              </div>
              <div className="cbm-pm-desc">
                박스 크기에 맞게 T11/T12를 각각 배정하여 빈 공간을 최소화합니다.
              </div>
            </div>
          </button>

          {/* Cards 1..N: Uniform Pallet Presets */}
          {simResult.palletSpecComparison?.map((spec) => {
            const isSelected = palletSelectionMode === spec.id;
            const hcEst = estimate40HcContainerNeeds(spec.totalPallets, spec.id);
            return (
              <button
                key={spec.id}
                type="button"
                className={`cbm-pallet-mode-card ${isSelected ? 'active' : ''}`}
                onClick={() => setPalletSelectionMode(spec.id)}
              >
                <div className="cbm-pm-header">
                  <span className={`cbm-pm-badge ${spec.id === 'T11' ? 'std-badge' : ''}`}>
                    {spec.id} {spec.id === 'T11' ? '국내표준' : spec.id === 'T12' ? '국제표준' : ''}
                  </span>
                  <strong className="cbm-pm-title">{spec.name}</strong>
                  <small className="cbm-pm-sub">
                    {spec.width} × {spec.length} mm ({spec.desc})
                  </small>
                </div>
                <div className="cbm-pm-body">
                  <div className="cbm-pm-stat">
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
                  <div className="cbm-pm-desc">
                    모든 품목을 {spec.name} 단일 규격으로 통일하여 적재합니다.
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Multi-Pallet Mix Detailed SKU Assigner */}
        {palletSelectionMode === 'CUSTOM_MIX' && (
          <div className="cbm-mix-assigner-panel">
            <div className="cbm-mix-panel-header">
              <div>
                <strong>📦 품목별 파레트 규격 개별 매칭</strong>
                <p>각 박스 크기에 맞는 파레트 규격을 직접 변경하거나 최적 매칭 버튼을 누르세요.</p>
              </div>
              <button
                type="button"
                className="cbm-btn-xs primary"
                onClick={handleAutoRecommendPalletMix}
              >
                ⚡ 박스별 최적 파레트 자동 매칭
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
                      <strong>{cargo.name}</strong>
                      <small>
                        ({cargo.width}×{cargo.length}×{cargo.height}mm, {cargo.quantity}박스)
                      </small>
                    </div>
                    <div className="cbm-mix-item-control">
                      <select
                        className="cbm-table-select"
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
          <span className="cbm-badge">🖱️ 3D 드래그로 회전 · 휠로 확대/축소</span>
        </div>

        {/* Single Pallet Selector & 2D/3D Split Visualizer */}
        {currentPallet && (
          <div className="cbm-single-pallet-visualizer">
            <div className="cbm-vis-subheader">
              <div className="cbm-pallet-selector-bar">
                <label>📦 보고 있는 파레트:</label>
                <select
                  value={selectedPalletIdx}
                  onChange={(e) => {
                    setSelectedPalletIdx(Number(e.target.value));
                    setPalletVisibleStep(100);
                  }}
                  className="cbm-pallet-select"
                >
                  {simResult.pallets.map((p, idx) => {
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
                  })}
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
              <Pallet2DBlueprint currentPallet={currentPallet} />

              {/* Right: 3D Single Pallet Viewport */}
              <div className="cbm-pallet-3d-col">
                <ThreeViewport
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
                    {isPalletPlaying ? '⏸ 일시정지' : '▶ 적재 순서 재생'}
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
                          ⚠️ 돌출 +{g.maxOverhangMm}mm
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
                        {isSelectedGroup ? '✓ 현재 보는 중' : '🔍 보기'}
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

        {/* 🧱 상자 쌓기 패턴/자세 미세 변경 접이식 서랍 (Subcomponent) */}
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
          🚢 [2단계 계산하기] 산출된 {simResult.summary.totalPallets}개 파레트를 컨테이너 종류별로 넣고 시각화 보기 ▼
        </button>
      </div>
    </section>
  );
}
