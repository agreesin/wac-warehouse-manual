import React, { useMemo, useState } from 'react';
import {
  computeBest2DLayer,
  resolvePalletDimsForCargo,
  estimate40HcContainerNeeds,
} from '../packingEngine';
import { ThreeViewport } from '../ThreeViewport';

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
  // 상자 적재 패턴 및 자세 미세 조정 접이식 아코디언 상태
  const [showStackingDetails, setShowStackingDetails] = useState(false);

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
            <div className="cbm-pm-top">
              <span className="cbm-pm-tag mix-tag">여러 사이즈 혼합 (추천)</span>
              <strong className="cbm-pm-count">
                총 {mixPalletCount} PLT
              </strong>
            </div>
            <div className="cbm-pm-title">🔀 품목별 파레트 섞어 쓰기</div>
            <div className="cbm-pm-sub">
              화물 치수에 맞춰 1100×1100과 1200×1000 등을 품목별로 조합 ({customMixComparison?.usedSpecs})
            </div>
            <div className="cbm-pm-hc-badge-row">
              <span className="cbm-pm-hc-badge">
                🚢 40HC 바닥 완적: 약 <strong>{mixHcEst.containerCount}대</strong>
              </span>
              <small className="cbm-pm-hc-note">({mixHcEst.floorCapacity}PLT/대 · {mixHcEst.splitText})</small>
            </div>
          </button>

          {/* Cards 1~4: Uniform Pallet Presets */}
          {simResult.palletSpecComparison.map((specItem) => {
            const isSelected = palletSelectionMode === specItem.id;
            const specHcEst = specItem.hcEstimate || estimate40HcContainerNeeds(specItem.totalPallets, specItem.id);
            return (
              <button
                key={specItem.id}
                type="button"
                className={`cbm-pallet-mode-card ${isSelected ? 'active' : ''}`}
                onClick={() => setPalletSelectionMode(specItem.id)}
              >
                <div className="cbm-pm-top">
                  <span className="cbm-pm-tag">단일 사이즈 통일</span>
                  <strong className="cbm-pm-count">총 {specItem.totalPallets} PLT</strong>
                </div>
                <div className="cbm-pm-title">{specItem.shortLabel}</div>
                <div className="cbm-pm-sub">
                  모든 화물을 {specItem.width}×{specItem.length}mm 파레트로 통일 | 평균 공간효율{' '}
                  {specItem.avgUtilization}%
                </div>
                <div className="cbm-pm-hc-badge-row">
                  <span className="cbm-pm-hc-badge">
                    🚢 40HC 바닥 완적: 약 <strong>{specHcEst.containerCount}대</strong>
                  </span>
                  <small className="cbm-pm-hc-note">({specHcEst.floorCapacity}PLT/대 · {specHcEst.splitText})</small>
                </div>
              </button>
            );
          })}
        </div>

        {/* 40HC 컨테이너 바닥 완적 기준 소요 대수 실시간 예측 안내 배너 */}
        {currentModeHcEst && (
          <div className="cbm-hc-floor-est-banner" style={{ padding: '9px 14px' }}>
            <div className="cbm-hc-est-left" style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <span className="cbm-hc-est-tag">🚢 40ft HC 필요 대수</span>
              <div style={{ fontSize: '0.84rem', color: '#f8fafc' }}>
                총 <strong style={{ color: '#38bdf8' }}>{currentModePallets} PLT</strong> ➔{' '}
                <span className="cbm-hc-est-target">40ft HC × {currentModeHcEst.containerCount}대 필요</span>{' '}
                <span style={{ color: '#6ee7b7', fontWeight: 600 }}>({currentModeHcEst.splitText} 균등 배치)</span>
              </div>
            </div>
            <div className="cbm-hc-est-right">
              <button
                type="button"
                className="cbm-btn-xs primary"
                onClick={handleRunStep2ToStep3}
              >
                🚢 3D 컨테이너 적재 보러가기 ▶
              </button>
            </div>
          </div>
        )}

        {/* Per-Cargo Pallet Spec Selector Bar when CUSTOM_MIX is active */}
        {palletSelectionMode === 'CUSTOM_MIX' && (
          <div className="cbm-mix-assign-box">
            <div className="cbm-mix-assign-head">
              <div>
                <strong>🛠️ 품목별 사용할 파레트 사이즈 지정 (여러 파레트 섞어 쓰기 설정)</strong>
                <span>
                  각 화물마다 가장 잘 맞는 파레트 규격을 선택하세요. (예: 일반 화물은 1100×1100, 돌출 화물은 1200×1000)
                </span>
              </div>
              <button
                type="button"
                className="cbm-btn-xs primary"
                onClick={handleAutoRecommendPalletMix}
              >
                ⚡ 품목별 최적 파레트 자동 매칭
              </button>
            </div>

            <div className="cbm-mix-assign-list">
              {cargos.map((cargo) => {
                const resolved = resolvePalletDimsForCargo(cargo, effectivePalletConfig);
                const itemOv =
                  cargo.allowedOverhang !== undefined && cargo.allowedOverhang !== null
                    ? Number(cargo.allowedOverhang) || 0
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

      {/* 2-B: 파레트 적재 도면 (2D) 및 3D 시뮬레이션 (위쪽으로 이동!) */}
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
              {/* Left: 2D Top-Down Layer Blueprint & Loading Guide */}
              <div className="cbm-pallet-blueprint-col">
                <div className="cbm-blueprint-box">
                  <h3>📐 한 파레트 1층 평면 적재 도면 (위에서 본 모습)</h3>
                  <p className="cbm-blueprint-sub">
                    파레트: <strong>{currentPallet.width} × {currentPallet.length} mm</strong> | 1층:{' '}
                    <strong>{currentPallet.layers[0]?.boxCount || 0}박스</strong>
                    {currentPallet.maxOverhangMm > 0 ? (
                      <span style={{ color: '#fbbf24', marginLeft: '8px', fontWeight: 700 }}>
                        (⚠️ 돌출 +{currentPallet.maxOverhangMm}mm / 외곽 {currentPallet.cargoSpanW}×{currentPallet.cargoSpanL}mm)
                      </span>
                    ) : (
                      <span style={{ color: '#34d399', marginLeft: '8px' }}>
                        (정사이즈 · 돌출 0mm)
                      </span>
                    )}
                  </p>
                  <div className="cbm-blueprint-svg-wrap">
                    <svg
                      viewBox={`-100 -100 ${currentPallet.width + 200} ${
                        currentPallet.length + 200
                      }`}
                      className="cbm-pallet-2d-svg"
                    >
                      {/* Pallet Base */}
                      <rect
                        x={0}
                        y={0}
                        width={currentPallet.width}
                        height={currentPallet.length}
                        fill="#78350f"
                        fillOpacity={0.38}
                        stroke="#f59e0b"
                        strokeWidth={14}
                        rx={14}
                      />
                      {/* Dimension Labels */}
                      <text
                        x={currentPallet.width / 2}
                        y={-34}
                        textAnchor="middle"
                        fill="#94a3b8"
                        fontSize="42"
                        fontWeight="bold"
                      >
                        가로 {currentPallet.width} mm
                      </text>
                      {/* Boxes on 1st layer */}
                      {currentPallet.boxes
                        .filter((b) => (b.layerIndex || 0) === 0)
                        .map((b) => (
                          <g key={b.id}>
                            <rect
                              x={b.x + 3}
                              y={b.z + 3}
                              width={b.w - 6}
                              height={b.l - 6}
                              fill={b.color}
                              fillOpacity={0.9}
                              stroke="#0f172a"
                              strokeWidth={8}
                              rx={6}
                            />
                            {b.w >= 140 && b.l >= 100 && (
                              <>
                                <text
                                  x={b.x + b.w / 2}
                                  y={b.z + b.l / 2 - 16}
                                  textAnchor="middle"
                                  dominantBaseline="middle"
                                  fill="#ffffff"
                                  fontSize={Math.min(44, Math.min(b.w, b.l) * 0.2)}
                                  fontWeight="bold"
                                >
                                  {b.name.split(' ')[0]} {b.rotated ? '↻' : ''}
                                </text>
                                <text
                                  x={b.x + b.w / 2}
                                  y={b.z + b.l / 2 + 26}
                                  textAnchor="middle"
                                  dominantBaseline="middle"
                                  fill="#e2e8f0"
                                  fontSize={Math.min(36, Math.min(b.w, b.l) * 0.17)}
                                >
                                  {b.w}×{b.l}
                                </text>
                              </>
                            )}
                          </g>
                        ))}
                      {/* Dashed Pallet Boundary Overlay when Overhang is Active */}
                      {currentPallet.maxOverhangMm > 0 && (
                        <rect
                          x={0}
                          y={0}
                          width={currentPallet.width}
                          height={currentPallet.length}
                          fill="none"
                          stroke="#fbbf24"
                          strokeWidth={12}
                          strokeDasharray="28,18"
                          rx={14}
                        />
                      )}
                    </svg>
                  </div>
                </div>

                {/* Worker Loading Guide Box */}
                <div className="cbm-pallet-info-list">
                  <h4>📋 Pallet #{currentPallet.index} 적재 가이드</h4>
                  <div className="cbm-info-row">
                    <span>파레트 규격:</span>
                    <strong>
                      {currentPallet.width} × {currentPallet.length} mm
                    </strong>
                  </div>
                  <div className="cbm-info-row">
                    <span>1층 적재 수량:</span>
                    <strong>{currentPallet.layers[0]?.boxCount || 0} 박스 / 층</strong>
                  </div>
                  <div className="cbm-info-row">
                    <span>적재 단수 / 박스수:</span>
                    <strong>
                      {currentPallet.layers.length}단 적재 / 총{' '}
                      {currentPallet.boxes.length.toLocaleString()} 박스
                    </strong>
                  </div>
                  <div className="cbm-info-row">
                    <span>총 높이:</span>
                    <strong>
                      {currentPallet.totalHeight} mm (파레트 {currentPallet.baseHeight}mm + 화물{' '}
                      {currentPallet.cargoHeight}mm)
                    </strong>
                  </div>
                  <div className="cbm-info-row">
                    <span>파레트 총 중량:</span>
                    <strong style={{ color: '#fbbf24' }}>
                      약 {currentPallet.totalWeight.toFixed(1)} kg
                    </strong>
                  </div>
                </div>
              </div>

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

        {/* 🧱 상자 쌓기 패턴/자세 미세 변경 접이식 서랍 (선택 시에만 확장) */}
        {simResult.stackingDiagnostics && simResult.stackingDiagnostics.length > 0 && (
          <div className="cbm-stacking-accordion-wrap">
            <button
              type="button"
              className="cbm-stacking-toggle-btn"
              onClick={() => setShowStackingDetails((prev) => !prev)}
            >
              <span>
                🧱 <strong>상자 쌓기 패턴 및 자세 설정</strong> (현재 AI 추천 최적 배열 적용 중)
              </span>
              <span style={{ color: '#38bdf8', fontSize: '0.8rem' }}>
                {showStackingDetails ? '▲ 설정 닫기' : '▼ 펼쳐서 배열/자세 변경하기'}
              </span>
            </button>

            {showStackingDetails && (
              <div style={{ marginTop: '10px' }}>
                {(() => {
                  const activeCargoDiag =
                    simResult.stackingDiagnostics.find(
                      (d) => d.cargoId === currentPallet?.primaryCargoId
                    ) || simResult.stackingDiagnostics[0];
                  if (!activeCargoDiag) return null;

                  return (
                    <div
                      style={{
                        padding: '12px 14px',
                        borderRadius: '9px',
                        background: 'rgba(15, 23, 42, 0.8)',
                        border: '1px solid rgba(56, 189, 248, 0.3)',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          flexWrap: 'wrap',
                          gap: '8px',
                          marginBottom: '10px',
                          paddingBottom: '8px',
                          borderBottom: '1px solid rgba(148, 163, 184, 0.18)',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span
                            className="cbm-color-dot"
                            style={{ background: activeCargoDiag.color }}
                          />
                          <strong style={{ fontSize: '0.86rem', color: '#f8fafc' }}>
                            설정 품목: {activeCargoDiag.cargoName}
                          </strong>
                        </div>
                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                          {simResult.stackingDiagnostics.map((d) => {
                            const isCurrent = d.cargoId === activeCargoDiag.cargoId;
                            return (
                              <button
                                key={d.cargoId}
                                type="button"
                                className="cbm-btn-xs"
                                style={{
                                  background: isCurrent ? '#2563eb' : 'rgba(30, 41, 59, 0.7)',
                                  borderColor: isCurrent ? '#3b82f6' : '#475569',
                                  color: isCurrent ? '#ffffff' : '#cbd5e1',
                                  fontWeight: isCurrent ? 700 : 500,
                                }}
                                onClick={() => {
                                  const sampleIdx = simResult.pallets.findIndex(
                                    (p) => p.primaryCargoId === d.cargoId
                                  );
                                  if (sampleIdx !== -1) setSelectedPalletIdx(sampleIdx);
                                }}
                              >
                                {d.cargoName} 보기
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div className="cbm-stacking-options-grid">
                        {/* ① 1층 평면 배열 모양 (5종) */}
                        <div
                          style={{
                            background: 'rgba(30, 41, 59, 0.55)',
                            border: '1px solid rgba(148, 163, 184, 0.2)',
                            borderRadius: '8px',
                            padding: '9px 11px',
                          }}
                        >
                          <div
                            style={{
                              fontSize: '0.78rem',
                              fontWeight: 700,
                              color: '#93c5fd',
                              marginBottom: '6px',
                            }}
                          >
                            ① 한 층(1단) 평면 배열 모양 선택
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                            {activeCargoDiag.patternOptions.map((opt) => {
                              const isSel = activeCargoDiag.currentPattern === opt.id;
                              return (
                                <button
                                  key={opt.id}
                                  type="button"
                                  onClick={() =>
                                    handleCargoChange(
                                      activeCargoDiag.cargoId,
                                      'layerPattern',
                                      opt.id
                                    )
                                  }
                                  style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    padding: '5px 8px',
                                    borderRadius: '6px',
                                    border: isSel
                                      ? '1px solid #38bdf8'
                                      : '1px solid rgba(148, 163, 184, 0.16)',
                                    background: isSel
                                      ? 'rgba(56, 189, 248, 0.18)'
                                      : 'rgba(15, 23, 42, 0.65)',
                                    color: '#f8fafc',
                                    cursor: 'pointer',
                                    textAlign: 'left',
                                    fontSize: '0.75rem',
                                  }}
                                >
                                  <div>
                                    <strong style={{ color: isSel ? '#38bdf8' : '#e2e8f0' }}>
                                      {opt.label}
                                    </strong>
                                    <div style={{ fontSize: '0.68rem', color: '#94a3b8' }}>
                                      {opt.shortDesc}
                                    </div>
                                  </div>
                                  <span
                                    style={{
                                      fontSize: '0.71rem',
                                      fontWeight: 700,
                                      color: isSel ? '#fde047' : '#cbd5e1',
                                      whiteSpace: 'nowrap',
                                      marginLeft: '6px',
                                    }}
                                  >
                                    1단 {opt.layerBoxCount}박스 · {opt.totalPallets}PLT
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* ② 층간 교차 & ③ 상자 세움/눕힘 자세 */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          <div
                            style={{
                              background: 'rgba(30, 41, 59, 0.55)',
                              border: '1px solid rgba(148, 163, 184, 0.2)',
                              borderRadius: '8px',
                              padding: '9px 11px',
                            }}
                          >
                            <div
                              style={{
                                fontSize: '0.78rem',
                                fontWeight: 700,
                                color: '#fcd34d',
                                marginBottom: '6px',
                              }}
                            >
                              ② 층간 쌓기 방식 (교차 vs 기둥)
                            </div>
                            {activeCargoDiag.cantileverCheck?.hasRisk && (
                              <div
                                style={{
                                  fontSize: '0.71rem',
                                  color: '#fde047',
                                  marginBottom: '6px',
                                  padding: '4px 8px',
                                  borderRadius: '6px',
                                  background: 'rgba(245, 158, 11, 0.15)',
                                  border: '1px solid rgba(245, 158, 11, 0.35)',
                                  lineHeight: 1.4,
                                }}
                              >
                                🛡️ <strong>실무 안전 진단:</strong> 1단 배열이 비대칭이어서, 층간 교차 시 박스가 공중에 뜨는 붕괴 위험을 방지하고자 <strong>[기둥식 수직 정렬]</strong>이 기본 추천되었습니다.
                              </div>
                            )}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                              {activeCargoDiag.stackStyleOptions.map((stOpt) => {
                                const isSel = activeCargoDiag.currentStackStyle === stOpt.id;
                                return (
                                  <button
                                    key={stOpt.id}
                                    type="button"
                                    onClick={() =>
                                      handleCargoChange(
                                        activeCargoDiag.cargoId,
                                        'stackingStyle',
                                        stOpt.id
                                      )
                                    }
                                    style={{
                                      display: 'flex',
                                      justifyContent: 'space-between',
                                      alignItems: 'center',
                                      padding: '5px 8px',
                                      borderRadius: '6px',
                                      border: isSel
                                        ? '1px solid #f59e0b'
                                        : '1px solid rgba(148, 163, 184, 0.16)',
                                      background: isSel
                                        ? 'rgba(245, 158, 11, 0.18)'
                                        : 'rgba(15, 23, 42, 0.65)',
                                      color: '#f8fafc',
                                      cursor: 'pointer',
                                      textAlign: 'left',
                                      fontSize: '0.75rem',
                                    }}
                                  >
                                    <div>
                                      <strong style={{ color: isSel ? '#fbbf24' : '#e2e8f0' }}>
                                        {stOpt.label}
                                      </strong>
                                      <span style={{ fontSize: '0.68rem', color: '#94a3b8', marginLeft: '6px' }}>
                                        {stOpt.shortDesc}
                                      </span>
                                    </div>
                                    <span
                                      style={{
                                        fontSize: '0.7rem',
                                        fontWeight: 700,
                                        color: isSel ? '#fbbf24' : '#64748b',
                                      }}
                                    >
                                      {isSel ? '적용 중' : '선택'}
                                    </span>
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                          <div
                            style={{
                              background: 'rgba(30, 41, 59, 0.55)',
                              border: '1px solid rgba(148, 163, 184, 0.2)',
                              borderRadius: '8px',
                              padding: '9px 11px',
                            }}
                          >
                            <div
                              style={{
                                fontSize: '0.78rem',
                                fontWeight: 700,
                                color: '#6ee7b7',
                                marginBottom: '6px',
                              }}
                            >
                              ③ 상자 놓는 자세 (세움 vs 눕힘)
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                              {activeCargoDiag.postureOptions.map((posOpt) => {
                                const isSel = activeCargoDiag.currentPosture === posOpt.id;
                                return (
                                  <button
                                    key={posOpt.id}
                                    type="button"
                                    onClick={() =>
                                      handleCargoChange(
                                        activeCargoDiag.cargoId,
                                        'boxPosture',
                                        posOpt.id
                                      )
                                    }
                                    style={{
                                      display: 'flex',
                                      justifyContent: 'space-between',
                                      alignItems: 'center',
                                      padding: '5px 8px',
                                      borderRadius: '6px',
                                      border: isSel
                                        ? '1px solid #10b981'
                                        : '1px solid rgba(148, 163, 184, 0.16)',
                                      background: isSel
                                        ? 'rgba(16, 185, 129, 0.18)'
                                        : 'rgba(15, 23, 42, 0.65)',
                                      color: '#f8fafc',
                                      cursor: 'pointer',
                                      textAlign: 'left',
                                      fontSize: '0.75rem',
                                    }}
                                  >
                                    <div>
                                      <strong style={{ color: isSel ? '#34d399' : '#e2e8f0' }}>
                                        {posOpt.label}
                                      </strong>
                                      <span style={{ fontSize: '0.68rem', color: '#94a3b8', marginLeft: '6px' }}>
                                        ({posOpt.dimText})
                                      </span>
                                    </div>
                                    <span
                                      style={{
                                        fontSize: '0.71rem',
                                        fontWeight: 700,
                                        color: isSel ? '#6ee7b7' : '#cbd5e1',
                                        whiteSpace: 'nowrap',
                                      }}
                                    >
                                      1단 {posOpt.layerBoxCount}박스 · {posOpt.totalPallets}PLT
                                    </span>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 2-C: 파레트 외곽 돌출(Overhang) 허용 설정 (간략화된 컴팩트 패널!) */}
      {simResult.overhangDiagnostics && simResult.overhangDiagnostics.length > 0 && (
        <div className="cbm-card cbm-overhang-compact-card">
          <div className="cbm-card-header" style={{ flexWrap: 'wrap', gap: '8px', paddingBottom: '6px' }}>
            <div>
              <h2 style={{ color: '#fbbf24', fontSize: '0.98rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                📏 파레트 외곽 돌출(Overhang) 허용 설정
              </h2>
              <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: '#94a3b8' }}>
                파레트 외곽으로 약간 돌출 적재하여 <strong>파레트 수(40HC 소요 대수)를 줄일지</strong> 선택합니다. (컨테이너 내폭 2,352mm 2열 적재 시 안전 한계: T11 약 +25mm)
              </p>
            </div>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              <button
                type="button"
                className="cbm-btn-xs"
                onClick={() => {
                  setOverhang(0);
                  setCargos((prev) =>
                    prev.map((c) => ({ ...c, allowedOverhang: 0 }))
                  );
                }}
              >
                🔒 전 품목 0mm (정사이즈)
              </button>
              <button
                type="button"
                className="cbm-btn-xs primary"
                style={{ background: '#d97706', borderColor: '#f59e0b' }}
                onClick={() => {
                  const oppMap = new Map(
                    simResult.overhangDiagnostics.map((d) => [
                      d.cargoId,
                      d.opportunity ? d.opportunity.requiredOverhangMm : 0,
                    ])
                  );
                  setCargos((prev) =>
                    prev.map((c) => ({
                      ...c,
                      allowedOverhang: oppMap.get(c.id) || 0,
                    }))
                  );
                }}
              >
                ⚠️ 감지된 돌출 일괄 허용
              </button>
            </div>
          </div>

          <div className="cbm-overhang-list">
            {simResult.overhangDiagnostics.map((diag) => {
              const opp = diag.opportunity;
              const t12Alt = diag.t12Alternative;
              const isOvApplied = diag.appliedOverhang > 0 && diag.isOverhangActive;
              const cFit = diag.containerFit;

              return (
                <div
                  key={diag.cargoId}
                  className={`cbm-overhang-row ${isOvApplied ? 'active-overhang' : ''}`}
                >
                  {/* 좌측 품목 기본 정보 */}
                  <div className="cbm-overhang-row-left">
                    <span
                      className="cbm-color-dot"
                      style={{ background: diag.color }}
                    />
                    <strong style={{ color: '#f8fafc', fontSize: '0.84rem' }}>
                      {diag.cargoName}
                    </strong>
                    <span style={{ fontSize: '0.74rem', color: '#94a3b8' }}>
                      ({diag.boxW}×{diag.boxL}×{diag.boxH}mm · {diag.quantity.toLocaleString()}박스)
                    </span>
                    <span className="cbm-spec-chip t11" style={{ fontSize: '0.71rem' }}>
                      {diag.palletW}×{diag.palletL}
                    </span>
                  </div>

                  {/* 중앙 돌출 진단 및 절감 요약 메시지 */}
                  <div className="cbm-overhang-row-mid" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '2px' }}>
                    <div>
                      {opp ? (
                        isOvApplied ? (
                          <span style={{ color: '#fbbf24', fontWeight: 700 }}>
                            ⚠️ +{diag.current.maxOverhangMm}mm 허용 적용 중 ({diag.current.totalPallets || opp.totalPallets}PLT)
                          </span>
                        ) : (
                          <span style={{ color: '#fde68a' }}>
                            💡 +{opp.requiredOverhangMm}mm 돌출 시 <strong>{opp.savedPallets}PLT 절감!</strong> ({diag.strict.totalPallets} ➔ {opp.totalPallets}PLT)
                          </span>
                        )
                      ) : (
                        <span style={{ color: '#94a3b8' }}>
                          정사이즈(0mm) 최적 적재 중 (돌출 여지 없음)
                        </span>
                      )}
                    </div>
                    {/* 래핑 공차 및 컨테이너 벽면 간섭 실시간 진단 */}
                    {cFit && (isOvApplied || (opp && opp.requiredOverhangMm > 25)) && (
                      <div style={{ fontSize: '0.71rem', color: cFit.riskLevel === 'danger' ? '#fca5a5' : '#cbd5e1' }}>
                        {cFit.warningText}
                      </div>
                    )}
                  </div>

                  {/* 우측 빠른 토글 버튼 그룹 */}
                  <div className="cbm-overhang-row-actions">
                    <button
                      type="button"
                      className={`cbm-btn-xs ${!isOvApplied ? 'primary' : ''}`}
                      onClick={() => handleCargoChange(diag.cargoId, 'allowedOverhang', 0)}
                    >
                      🔒 0mm 불허
                    </button>

                    {opp && (
                      <button
                        type="button"
                        className="cbm-btn-xs"
                        style={{
                          background: isOvApplied ? '#d97706' : 'rgba(245, 158, 11, 0.16)',
                          borderColor: '#f59e0b',
                          color: isOvApplied ? '#ffffff' : '#fcd34d',
                          fontWeight: 700,
                        }}
                        onClick={() =>
                          handleCargoChange(
                            diag.cargoId,
                            'allowedOverhang',
                            opp.requiredOverhangMm
                          )
                        }
                      >
                        ⚠️ +{opp.requiredOverhangMm}mm 허용 ({opp.savedPallets}개↓)
                      </button>
                    )}

                    {t12Alt && (
                      <button
                        type="button"
                        className="cbm-btn-xs"
                        style={{
                          background: 'rgba(16, 185, 129, 0.18)',
                          borderColor: '#10b981',
                          color: '#6ee7b7',
                        }}
                        onClick={() => {
                          setPalletSelectionMode('CUSTOM_MIX');
                          setCargos((prev) =>
                            prev.map((c) =>
                              c.id === diag.cargoId
                                ? { ...c, palletSpecId: 'T12', allowedOverhang: 0 }
                                : c
                            )
                          );
                        }}
                        title="1200×1000 파레트로 변경 시 무돌출로 적재되며 컨테이너 좌우 여유 300mm 이상 확보"
                      >
                        🔄 1200×1000 변경 (무돌출 권장)
                      </button>
                    )}

                    <label
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '3px',
                        fontSize: '0.72rem',
                        color: '#94a3b8',
                        marginLeft: '3px',
                      }}
                    >
                      <span>직접:</span>
                      <input
                        type="number"
                        min={0}
                        max={150}
                        step={5}
                        value={diag.appliedOverhang}
                        onChange={(e) =>
                          handleCargoChange(
                            diag.cargoId,
                            'allowedOverhang',
                            Math.max(0, Number(e.target.value) || 0)
                          )
                        }
                        style={{
                          width: '46px',
                          padding: '2px 4px',
                          borderRadius: '4px',
                          border: '1px solid #475569',
                          background: '#0f172a',
                          color: '#f8fafc',
                          fontSize: '0.74rem',
                          textAlign: 'right',
                        }}
                      />
                      <span>mm</span>
                    </label>
                  </div>
                </div>
              );
            })}
          </div>

          {/* 현장 래핑 공차 가이드 팁 */}
          <div
            style={{
              marginTop: '10px',
              padding: '6px 10px',
              borderRadius: '6px',
              background: 'rgba(15, 23, 42, 0.5)',
              border: '1px dashed rgba(148, 163, 184, 0.25)',
              fontSize: '0.73rem',
              color: '#94a3b8',
              lineHeight: 1.4,
            }}
          >
            💡 <strong>현장 래핑 공차 가이드:</strong> 스트레치 필름을 5~10회 래핑하고 상자 하중 배부름이 생기면 파레트당 외경이 약 +15~20mm 불어납니다. T11에서 +40mm 돌출 시 2열 실측 외경이 2,320mm가 되어 컨테이너 벽면 주름에 닿을 수 있으므로, 돌출을 줄이거나 <strong>1200×1000mm 규격으로 무돌출 전환</strong>하는 것이 현장 안전상 가장 추천됩니다.
          </div>
        </div>
      )}

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
