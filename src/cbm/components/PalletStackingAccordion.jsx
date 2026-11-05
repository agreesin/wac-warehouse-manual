import React, { useState } from 'react';

/**
 * 상자 쌓기 패턴 및 자세 미세 조정 접이식 서랍 컴포넌트
 */
export function PalletStackingAccordion({
  simResult,
  currentPallet,
  setSelectedPalletIdx,
  handleCargoChange,
}) {
  const [showStackingDetails, setShowStackingDetails] = useState(false);

  if (!simResult?.stackingDiagnostics || simResult.stackingDiagnostics.length === 0) {
    return null;
  }

  const activeCargoDiag =
    simResult.stackingDiagnostics.find(
      (d) => d.cargoId === currentPallet?.primaryCargoId
    ) || simResult.stackingDiagnostics[0];

  return (
    <div className="cbm-stacking-accordion-wrap">
      <button
        type="button"
        className="cbm-stacking-toggle-btn"
        onClick={() => setShowStackingDetails((prev) => !prev)}
      >
        <span>
          <strong>상자 적재 패턴 및 자세 설정</strong>
        </span>
        <span style={{ color: '#38bdf8', fontSize: '0.8rem' }}>
          {showStackingDetails ? '▲ 닫기' : '▼ 상세 설정'}
        </span>
      </button>

      {showStackingDetails && activeCargoDiag && (
        <div style={{ marginTop: '10px' }}>
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
                    ② 층간 쌓기 방식 (기둥식 vs 교차식)
                  </div>
                  <div
                    style={{
                      fontSize: '0.71rem',
                      color: '#cbd5e1',
                      marginBottom: '6px',
                      padding: '4px 8px',
                      borderRadius: '6px',
                      background: 'rgba(30, 41, 59, 0.7)',
                      border: '1px solid rgba(148, 163, 184, 0.25)',
                      lineHeight: 1.4,
                    }}
                  >
                    네 모서리가 반듯하게 일치하여 상자 하중 지지력이 최고인 <strong>[수직 기둥 정렬]</strong>이 기본 표준으로 적용되어 있습니다.
                  </div>
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
                            {isSel ? '✓ 적용' : '선택'}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* ③ 상자 세움/눕힘 자세 */}
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
                    ③ 상자 세움/눕힘 자세 (3면 회전)
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
                              'postureMode',
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
        </div>
      )}
    </div>
  );
}
