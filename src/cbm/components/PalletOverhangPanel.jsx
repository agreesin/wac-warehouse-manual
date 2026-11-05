import React from 'react';

/**
 * 2-C 파레트 외곽 돌출(Overhang) 보조 설정 및 래핑 공차 가이드 패널 컴포넌트
 */
export function PalletOverhangPanel({
  simResult,
  setOverhang,
  setCargos,
  handleCargoChange,
  setPalletSelectionMode,
  wrappingConfig,
}) {
  if (!simResult?.overhangDiagnostics || simResult.overhangDiagnostics.length === 0) {
    return null;
  }

  const bulge = wrappingConfig?.wrappingBulgeMm ?? 20;
  const mis = wrappingConfig?.stackingMisalignmentMm ?? 10;
  const fork = wrappingConfig?.forkliftLateralClearanceMm ?? wrappingConfig?.forkliftClearanceMm ?? 20;
  const inW = wrappingConfig?.containerInnerWidthOption ?? 2352;
  const t11RowW = 1100 * 2 + (bulge + mis) * 2;
  const t11Margin = inW - t11RowW - fork;

  return (
    <div className="cbm-card cbm-overhang-compact-card">
      <div className="cbm-card-header" style={{ flexWrap: 'wrap', gap: '8px', paddingBottom: '6px' }}>
        <div>
          <h2 style={{ color: '#fbbf24', fontSize: '0.98rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
            파레트 돌출(Overhang) 설정
          </h2>
          <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: '#94a3b8' }}>
            파레트 외곽 돌출 허용 여부를 설정하여 파레트당 적재 수량을 조정합니다.
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
            돌출 없음 (0mm)
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
            감지된 돌출 일괄 적용
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
                  {isOvApplied ? (
                    <span style={{ color: '#fbbf24', fontWeight: 700 }}>
                      [돌출 적용] {diag.current.ovDirectionText || `+${diag.current.maxOverhangMm}mm`} ({diag.current.totalPallets} PLT)
                    </span>
                  ) : opp && opp.savedPallets > 0 ? (
                    opp.isViable ? (
                      <span style={{ color: '#fde68a' }}>
                        {opp.ovDirectionText || `+${opp.requiredOverhangMm}mm`} 돌출 시 <strong>{opp.savedPallets} PLT 절감 가능</strong> ({diag.strict.totalPallets} → {opp.totalPallets} PLT)
                      </span>
                    ) : (
                      <span style={{ color: '#f87171' }}>
                        {opp.ovDirectionText || `+${opp.requiredOverhangMm}mm`} 돌출 시 {opp.savedPallets} PLT 절감 가능하나 <strong>[{opp.reason || '컨테이너 허용한도 초과로 현장 불가'}]</strong>
                      </span>
                    )
                  ) : (
                    <span style={{ color: '#94a3b8' }}>
                      정사이즈(0mm) 유지 (돌출 절감 효과 없음)
                    </span>
                  )}
                </div>
                {/* 래핑 공차 및 컨테이너 벽면 간섭 실시간 진단 */}
                {cFit && (isOvApplied || (opp && opp.savedPallets > 0 && opp.requiredOverhangMm > 25)) && (
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
                  0mm (정사이즈)
                </button>

                {opp && opp.savedPallets > 0 && opp.isViable && (
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
                    +{opp.requiredOverhangMm}mm ({opp.savedPallets} PLT 절감)
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
                    1200×1000 규격 변경 (무돌출)
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
        <strong>현장 래핑 공차 가이드:</strong> 현재 설정 기준 배부름(+{bulge}mm/파레트), 적재 어긋남(+{mis}mm), 지게차 진입 여유({fork}mm), 내폭 {inW}mm 적용 시 T11 2열 유효 폭은 약 {t11RowW}mm(잔여 여유 {t11Margin}mm)입니다. 과도한 돌출은 내벽 간섭 위험을 초래하므로, 돌출을 지양하거나 <strong>1200×1000mm 규격으로 무돌출 전환</strong>하는 것이 현장 안전상 가장 추천됩니다.
      </div>
    </div>
  );
}
