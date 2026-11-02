import React from 'react';
import { computeBest2DLayer, resolvePalletDimsForCargo } from '../packingEngine';
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
  return (
    <section ref={step2Ref} className="cbm-step-section">
      <div className="cbm-section-banner step2-banner">
        <div className="cbm-section-banner-left">
          <span className="cbm-step-badge badge-amber">STEP 2</span>
          <div>
            <h2>파레트 종류(사이즈)별 필요 수량 및 한 파레트 적재 시각화</h2>
            <p>
              파레트 사이즈(단일 규격 통일 또는 품목별 여러 사이즈 섞어 쓰기)를 선택하면 총 몇 파레트가 나오는지, 그리고 한 파레트에 박스를 어떻게 쌓으면 되는지 보여줍니다.
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
                총 {customMixComparison?.totalPallets || simResult.summary.totalPallets} PLT
              </strong>
            </div>
            <div className="cbm-pm-title">🔀 품목별 파레트 섞어 쓰기</div>
            <div className="cbm-pm-sub">
              화물 치수에 맞춰 1100×1100과 1200×1000 등을 품목별로 조합 ({customMixComparison?.usedSpecs})
            </div>
          </button>

          {/* Cards 1~4: Uniform Pallet Presets */}
          {simResult.palletSpecComparison.map((specItem) => {
            const isSelected = palletSelectionMode === specItem.id;
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
              </button>
            );
          })}
        </div>

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

      {/* 2-A-2: 파레트 적재 후 돌출(Overhang) 자동 진단 & 허용 여부 선택 패널 */}
      {simResult.overhangDiagnostics && simResult.overhangDiagnostics.length > 0 && (
        <div
          className="cbm-card"
          style={{
            border: '1px solid rgba(245, 158, 11, 0.45)',
            background: 'linear-gradient(180deg, rgba(30, 41, 59, 0.92), rgba(15, 23, 42, 0.95))',
          }}
        >
          <div className="cbm-card-header" style={{ flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <h2 style={{ color: '#fbbf24', display: 'flex', alignItems: 'center', gap: '8px' }}>
                📏 파레트 적재 후 돌출(Overhang) 자동 감지 & 허용 여부 선택
              </h2>
              <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: '#cbd5e1' }}>
                파레트에 정사이즈(0mm)로 먼저 적재한 뒤, 각 품목별로 <strong>몇 mm 돌출되는지</strong>와{' '}
                <strong>돌출 허용 시 줄어드는 파레트 수</strong>를 자동 분석했습니다. 품목별로 허용 여부를 선택하세요.
              </p>
            </div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
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
                🔒 전 품목 정사이즈 (돌출 0mm 초기화)
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
                ⚠️ 감지된 돌출 일괄 허용 적용
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '8px' }}>
            {simResult.overhangDiagnostics.map((diag) => {
              const opp = diag.opportunity;
              const t12Alt = diag.t12Alternative;
              const isOvApplied = diag.appliedOverhang > 0 && diag.isOverhangActive;

              return (
                <div
                  key={diag.cargoId}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '12px',
                    padding: '12px 14px',
                    borderRadius: '10px',
                    background: isOvApplied
                      ? 'rgba(245, 158, 11, 0.12)'
                      : 'rgba(15, 23, 42, 0.75)',
                    border: isOvApplied
                      ? '1px solid rgba(245, 158, 11, 0.55)'
                      : '1px solid rgba(148, 163, 184, 0.22)',
                  }}
                >
                  <div style={{ flex: '1 1 420px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <span
                        className="cbm-color-dot"
                        style={{ background: diag.color }}
                      />
                      <strong style={{ fontSize: '0.92rem', color: '#f8fafc' }}>
                        {diag.cargoName}
                      </strong>
                      <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                        ({diag.boxW}×{diag.boxL}×{diag.boxH}mm · {diag.quantity.toLocaleString()}박스)
                      </span>
                      <span className="cbm-spec-chip t11" style={{ fontSize: '0.73rem' }}>
                        현재 파레트: {diag.palletW}×{diag.palletL}mm
                      </span>
                      {isOvApplied ? (
                        <span
                          style={{
                            fontSize: '0.73rem',
                            fontWeight: 700,
                            padding: '2px 8px',
                            borderRadius: '999px',
                            background: 'rgba(245, 158, 11, 0.25)',
                            color: '#fcd34d',
                            border: '1px solid rgba(245, 158, 11, 0.5)',
                          }}
                        >
                          ⚠️ 현재 돌출 허용 적용 중: 총 +{diag.current.maxOverhangMm}mm (편측 {diag.current.eachSideMax}mm)
                        </span>
                      ) : (
                        <span
                          style={{
                            fontSize: '0.73rem',
                            fontWeight: 600,
                            padding: '2px 8px',
                            borderRadius: '999px',
                            background: 'rgba(16, 185, 129, 0.15)',
                            color: '#6ee7b7',
                          }}
                        >
                          ✅ 정사이즈 적재 중 (돌출 0mm)
                        </span>
                      )}
                    </div>

                    <div style={{ marginTop: '6px', fontSize: '0.8rem', color: '#cbd5e1', lineHeight: 1.5 }}>
                      <div>
                        • <strong>정사이즈(돌출 0mm) 적재 시:</strong> 1단{' '}
                        <strong>{diag.strict.layerCount}박스</strong> (적재외곽 {diag.strict.spanW}×
                        {diag.strict.spanL}mm) → 파레트당 {diag.strict.boxesPerPallet}박스 · 총{' '}
                        <strong style={{ color: '#93c5fd' }}>{diag.strict.totalPallets} 파레트</strong>
                      </div>

                      {opp ? (
                        <div style={{ color: '#fde68a', marginTop: '2px' }}>
                          • <strong>💡 돌출 감지 결과:</strong> 파레트 밖으로{' '}
                          <strong style={{ color: '#fbbf24', textDecoration: 'underline' }}>
                            총 +{opp.requiredOverhangMm}mm (양쪽 편측 {opp.eachSideMax}mm, 외곽{' '}
                            {opp.spanW}×{opp.spanL}mm)
                          </strong>{' '}
                          돌출 허용 시 → 1단{' '}
                          <strong>
                            {diag.strict.layerCount}박스 → {opp.layerCount}박스
                          </strong>
                          로 증가 ({diag.strict.totalPallets}PLT →{' '}
                          <strong style={{ color: '#34d399' }}>{opp.totalPallets}PLT</strong>
                          {opp.savedPallets > 0 ? `, ${opp.savedPallets}파레트 절감!` : ''})
                        </div>
                      ) : (
                        <div style={{ color: '#94a3b8', marginTop: '2px' }}>
                          • 150mm 이내 돌출로는 추가 적재 가능한 박스 열이 없습니다 (현재 정사이즈가 최적).
                        </div>
                      )}

                      {t12Alt && (
                        <div style={{ color: '#6ee7b7', marginTop: '2px' }}>
                          • <strong>🔄 무돌출 파레트 변경 대안:</strong> 이 품목만{' '}
                          <strong>1200×1000mm 파레트</strong>로 변경하면{' '}
                          <strong>돌출(0mm) 없이 정사이즈</strong>로 1단{' '}
                          <strong>{t12Alt.layerCount}박스</strong> (적재외곽 {t12Alt.spanW}×
                          {t12Alt.spanL}mm, 총 <strong>{t12Alt.totalPallets}PLT</strong>) 적재가 가능합니다!
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 우측 허용/비허용 선택 컨트롤 */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      flexWrap: 'wrap',
                    }}
                  >
                    <button
                      type="button"
                      className={`cbm-btn-xs ${!isOvApplied ? 'primary' : ''}`}
                      onClick={() => handleCargoChange(diag.cargoId, 'allowedOverhang', 0)}
                    >
                      🔒 돌출 불허 (0mm)
                    </button>

                    {opp && (
                      <button
                        type="button"
                        className="cbm-btn-xs"
                        style={{
                          background:
                            diag.appliedOverhang >= opp.requiredOverhangMm
                              ? '#d97706'
                              : 'rgba(245, 158, 11, 0.16)',
                          borderColor: '#f59e0b',
                          color:
                            diag.appliedOverhang >= opp.requiredOverhangMm
                              ? '#ffffff'
                              : '#fcd34d',
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
                        ⚠️ +{opp.requiredOverhangMm}mm (편측 {opp.eachSideMax}mm) 돌출 허용
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
                          fontWeight: 700,
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
                      >
                        🔄 1200×1000 파레트 사용 (돌출 0mm)
                      </button>
                    )}

                    <label
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '0.74rem',
                        color: '#94a3b8',
                        marginLeft: '4px',
                      }}
                    >
                      <span>직접입력:</span>
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
                          width: '54px',
                          padding: '3px 5px',
                          borderRadius: '5px',
                          border: '1px solid #475569',
                          background: '#0f172a',
                          color: '#f8fafc',
                          fontSize: '0.76rem',
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
        </div>
      )}

      {/* 2-B: Pallet Breakdown Table & Single Pallet 2D/3D Visualization */}
      <div className="cbm-card">
        <div className="cbm-card-header" style={{ flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <h2>
              2-B. 품목별 산출 파레트 내역 및 「한 파레트에 어떻게 적재하면 되는지」 시각화
            </h2>
            <span className="cbm-badge" style={{ display: 'inline-block', marginTop: '4px' }}>
              표의 행을 클릭하면 아래 적재 도면과 3D가 전환됩니다
            </span>
          </div>
        </div>

        {/* Summary Table by Pallet Group */}
        <div className="cbm-weight-table-wrap" style={{ marginBottom: '18px' }}>
          <table className="cbm-weight-summary-table">
            <thead>
              <tr>
                <th>품목 및 파레트당 박스 수</th>
                <th>사용 파레트 규격</th>
                <th>한 파레트 1층 배열 방식</th>
                <th>적재 단수 (높이)</th>
                <th>파레트 수</th>
                <th>파레트당 중량</th>
                <th>합계 중량</th>
                <th>적재 방법 시각화</th>
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
                        🔍 이 파레트 보기
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

        {/* Single Pallet Selector & 2D/3D Split Visualizer */}
        {currentPallet && (
          <div className="cbm-single-pallet-visualizer">
            <div className="cbm-vis-subheader">
              <div className="cbm-pallet-selector-bar">
                <label>📦 현재 보고 있는 파레트:</label>
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
                    ◀ 이전 파레트
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
                    다음 파레트 ▶
                  </button>
                </div>
              </div>

              <label className="cbm-mini-check">
                <input
                  type="checkbox"
                  checked={explodePalletLayers}
                  onChange={(e) => setExplodePalletLayers(e.target.checked)}
                />
                <span>층간 분리뷰(Explode) 켜기</span>
              </label>
            </div>

            {/* 🧱 상자를 어떻게 쌓을지 선택 (1층 평면 배열 패턴 · 층간 교차 방식 · 상자 세움/눕힘 자세) */}
            {simResult.stackingDiagnostics &&
              simResult.stackingDiagnostics.length > 0 &&
              (() => {
                const activeCargoDiag =
                  simResult.stackingDiagnostics.find(
                    (d) => d.cargoId === currentPallet.primaryCargoId
                  ) || simResult.stackingDiagnostics[0];
                if (!activeCargoDiag) return null;

                return (
                  <div
                    style={{
                      marginBottom: '14px',
                      padding: '14px 16px',
                      borderRadius: '11px',
                      background: 'rgba(15, 23, 42, 0.85)',
                      border: '1px solid rgba(56, 189, 248, 0.35)',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: '10px',
                        marginBottom: '10px',
                        paddingBottom: '8px',
                        borderBottom: '1px solid rgba(148, 163, 184, 0.2)',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '0.92rem', fontWeight: 800, color: '#38bdf8' }}>
                          🧱 상자를 어떻게 쌓을지 선택 (적재 패턴 · 층간 방식 · 세움/눕힘 자세)
                        </span>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '3px 10px',
                            borderRadius: '999px',
                            background: 'rgba(30, 41, 59, 0.9)',
                            border: '1px solid rgba(148, 163, 184, 0.3)',
                            fontSize: '0.78rem',
                            fontWeight: 700,
                            color: '#f8fafc',
                          }}
                        >
                          <span
                            className="cbm-color-dot"
                            style={{ background: activeCargoDiag.color }}
                          />
                          현재 설정 품목: {activeCargoDiag.cargoName}
                        </span>
                      </div>

                      {/* 품목 빠른 전환 탭 */}
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
                              {d.cargoName} 설정 보기
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                        gap: '12px',
                      }}
                    >
                      {/* ① 1층 평면 배열 모양 (5종) */}
                      <div
                        style={{
                          background: 'rgba(30, 41, 59, 0.55)',
                          border: '1px solid rgba(148, 163, 184, 0.2)',
                          borderRadius: '9px',
                          padding: '10px 12px',
                        }}
                      >
                        <div
                          style={{
                            fontSize: '0.8rem',
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
                                  padding: '6px 9px',
                                  borderRadius: '7px',
                                  border: isSel
                                    ? '1px solid #38bdf8'
                                    : '1px solid rgba(148, 163, 184, 0.18)',
                                  background: isSel
                                    ? 'rgba(56, 189, 248, 0.18)'
                                    : 'rgba(15, 23, 42, 0.65)',
                                  color: '#f8fafc',
                                  cursor: 'pointer',
                                  textAlign: 'left',
                                  fontSize: '0.77rem',
                                }}
                              >
                                <div>
                                  <strong style={{ color: isSel ? '#38bdf8' : '#e2e8f0' }}>
                                    {opt.label}
                                  </strong>
                                  <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
                                    {opt.shortDesc}
                                  </div>
                                </div>
                                <span
                                  style={{
                                    fontSize: '0.73rem',
                                    fontWeight: 700,
                                    color: isSel ? '#fde047' : '#cbd5e1',
                                    whiteSpace: 'nowrap',
                                    marginLeft: '8px',
                                  }}
                                >
                                  1단 {opt.layerBoxCount}박스 · {opt.totalPallets}PLT
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* ② 위로 단을 올릴 때 층간 쌓기 방식 (3종) & ③ 상자 세움/눕힘 자세 (3종) */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <div
                          style={{
                            background: 'rgba(30, 41, 59, 0.55)',
                            border: '1px solid rgba(148, 163, 184, 0.2)',
                            borderRadius: '9px',
                            padding: '10px 12px',
                          }}
                        >
                          <div
                            style={{
                              fontSize: '0.8rem',
                              fontWeight: 700,
                              color: '#fcd34d',
                              marginBottom: '6px',
                            }}
                          >
                            ② 위로 단을 쌓아 올리는 방식 (층간 교차 vs 수직 기둥)
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
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
                                    padding: '6px 9px',
                                    borderRadius: '7px',
                                    border: isSel
                                      ? '1px solid #f59e0b'
                                      : '1px solid rgba(148, 163, 184, 0.18)',
                                    background: isSel
                                      ? 'rgba(245, 158, 11, 0.18)'
                                      : 'rgba(15, 23, 42, 0.65)',
                                    color: '#f8fafc',
                                    cursor: 'pointer',
                                    textAlign: 'left',
                                    fontSize: '0.77rem',
                                  }}
                                >
                                  <div>
                                    <strong style={{ color: isSel ? '#fbbf24' : '#e2e8f0' }}>
                                      {stOpt.label}
                                    </strong>
                                    <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
                                      {stOpt.shortDesc}
                                    </div>
                                  </div>
                                  <span
                                    style={{
                                      fontSize: '0.72rem',
                                      fontWeight: 700,
                                      color: isSel ? '#fbbf24' : '#64748b',
                                      marginLeft: '8px',
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
                            borderRadius: '9px',
                            padding: '10px 12px',
                          }}
                        >
                          <div
                            style={{
                              fontSize: '0.8rem',
                              fontWeight: 700,
                              color: '#6ee7b7',
                              marginBottom: '6px',
                            }}
                          >
                            ③ 상자 놓는 자세 (세워 쌓기 vs 옆/앞으로 눕혀 쌓기)
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
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
                                    padding: '6px 9px',
                                    borderRadius: '7px',
                                    border: isSel
                                      ? '1px solid #10b981'
                                      : '1px solid rgba(148, 163, 184, 0.18)',
                                    background: isSel
                                      ? 'rgba(16, 185, 129, 0.18)'
                                      : 'rgba(15, 23, 42, 0.65)',
                                    color: '#f8fafc',
                                    cursor: 'pointer',
                                    textAlign: 'left',
                                    fontSize: '0.77rem',
                                  }}
                                >
                                  <div>
                                    <strong style={{ color: isSel ? '#34d399' : '#e2e8f0' }}>
                                      {posOpt.label}
                                    </strong>
                                    <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
                                      {posOpt.dimText}
                                    </div>
                                  </div>
                                  <span
                                    style={{
                                      fontSize: '0.73rem',
                                      fontWeight: 700,
                                      color: isSel ? '#6ee7b7' : '#cbd5e1',
                                      whiteSpace: 'nowrap',
                                      marginLeft: '8px',
                                    }}
                                  >
                                    1단 {posOpt.layerBoxCount}박스 · {posOpt.maxLayers}단 (
                                    {posOpt.totalPallets}PLT)
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

            <div className="cbm-pallet-split-view">
              {/* Left: 2D Top-Down Layer Blueprint & Loading Guide */}
              <div className="cbm-pallet-blueprint-col">
                <div className="cbm-blueprint-box">
                  <h3>📐 한 파레트 1층 평면 적재 도면 (위에서 본 모습)</h3>
                  <p className="cbm-blueprint-sub">
                    파레트 사이즈: <strong>{currentPallet.width} × {currentPallet.length} mm</strong> | 1층 적재:{' '}
                    <strong>{currentPallet.layers[0]?.boxCount || 0}박스</strong>
                    {currentPallet.maxOverhangMm > 0 ? (
                      <span style={{ color: '#fbbf24', marginLeft: '8px', fontWeight: 700 }}>
                        (⚠️ 돌출 +{currentPallet.maxOverhangMm}mm / 적재외곽{' '}
                        {currentPallet.cargoSpanW}×{currentPallet.cargoSpanL}mm)
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
                  <h4>📋 Pallet #{currentPallet.index} 적재 작업 가이드</h4>
                  <div className="cbm-info-row">
                    <span>파레트 규격:</span>
                    <strong>
                      {currentPallet.width} × {currentPallet.length} mm
                    </strong>
                  </div>
                  <div className="cbm-info-row">
                    <span>1층(단) 적재 수량:</span>
                    <strong>{currentPallet.layers[0]?.boxCount || 0} 박스 / 층</strong>
                  </div>
                  <div className="cbm-info-row">
                    <span>총 적재 단수 / 박스수:</span>
                    <strong>
                      {currentPallet.layers.length}단 적재 / 총{' '}
                      {currentPallet.boxes.length.toLocaleString()} 박스
                    </strong>
                  </div>
                  <div className="cbm-info-row">
                    <span>총 높이 (파레트 포함):</span>
                    <strong>
                      {currentPallet.totalHeight} mm (파레트 {currentPallet.baseHeight}mm + 화물{' '}
                      {currentPallet.cargoHeight}mm)
                    </strong>
                  </div>
                  <div className="cbm-info-row">
                    <span>파레트당 총 중량:</span>
                    <strong style={{ color: '#fbbf24' }}>
                      약 {currentPallet.totalWeight.toFixed(1)} kg (화물 {currentPallet.cargoHeight > 0 ? currentPallet.cargoWeight : 0}kg + 자중{' '}
                      {currentPallet.tareWeight}kg)
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
                    {isPalletPlaying ? '⏸ 일시정지' : '▶ 박스 적재 순서 재생'}
                  </button>
                  <div className="cbm-slider-wrap">
                    <span>적재 순서 ({palletVisibleStep}%)</span>
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
      </div>

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
