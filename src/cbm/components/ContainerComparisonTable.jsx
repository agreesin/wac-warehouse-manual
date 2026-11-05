import React from 'react';

/**
 * 3-B 호기별 품목(SKU) 배분 명세표, 최적 배차 제안 및 3-C 컨테이너 규격별 비교 카드 그리드 컴포넌트
 */
export function ContainerComparisonTable({
  simResult,
  selectedContainerId,
  setSelectedContainerId,
  setSelectedContainerIdx,
}) {
  if (!simResult?.containerComparison) return null;

  return (
    <>
      {/* 3-B: 컨테이너 호기별 품목(SKU) 적재 명세표 & 최적 복합 배차 제안 */}
      <div className="cbm-card" style={{ marginTop: '16px' }}>
        <div className="cbm-card-header">
          <h2>3-B. 호기별 적재 명세 및 배차 제안</h2>
        </div>

        <div className="cbm-fleet-sku-grid" style={{ marginTop: 0 }}>
          {/* 호기별 SKU 배분 명세표 */}
          <div
            style={{
              background: 'rgba(15, 23, 42, 0.75)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              borderRadius: '10px',
              padding: '12px 14px',
            }}
          >
            <div
              style={{
                fontSize: '0.84rem',
                fontWeight: 700,
                color: '#34d399',
                marginBottom: '8px',
              }}
            >
              호기별 적재 명세표 ({simResult.selectedSpec.name})
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {simResult.containerResult.containers.map((c) => (
                <div
                  key={`sku-bd-${c.id}`}
                  style={{
                    padding: '7px 10px',
                    borderRadius: '8px',
                    background: 'rgba(30, 41, 59, 0.65)',
                    border: '1px solid rgba(148, 163, 184, 0.18)',
                    fontSize: '0.78rem',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      fontWeight: 700,
                      color: '#f8fafc',
                      marginBottom: '4px',
                      flexWrap: 'wrap',
                      gap: '6px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <span>
                        #{c.index}호기 (총 {c.placedPallets.length} PLT /{' '}
                        {c.boxCount.toLocaleString()} 박스)
                      </span>
                      {c.stuffingBadge && (
                        <span
                          style={{
                            fontSize: '0.72rem',
                            padding: '2px 8px',
                            borderRadius: '999px',
                            background: c.stuffingBadge.bg,
                            border: c.stuffingBadge.border,
                            color: c.stuffingBadge.color,
                            fontWeight: 700,
                          }}
                        >
                          {c.stuffingBadge.label}
                        </span>
                      )}
                    </div>
                    <span style={{ color: '#6ee7b7' }}>
                      총 {c.totalWeight.toLocaleString()} kg
                    </span>
                  </div>
                  <div style={{ color: '#cbd5e1', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {(c.skuBreakdown || []).map((s) => (
                      <span key={s.name}>
                        • <strong>{s.name}</strong>: {s.palletCount}PLT (
                        {s.boxes.toLocaleString()}박스, {s.weightKg.toLocaleString()}kg)
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 최적 복합 배차 조합 제안 */}
          {simResult.fleetRecommendations && simResult.fleetRecommendations.length > 0 && (
            <div
              style={{
                background: 'rgba(15, 23, 42, 0.75)',
                border: '1px solid rgba(56, 189, 248, 0.3)',
                borderRadius: '10px',
                padding: '12px 14px',
              }}
            >
              <div
                style={{
                  fontSize: '0.84rem',
                  fontWeight: 700,
                  color: '#38bdf8',
                  marginBottom: '8px',
                }}
              >
                최적 배차 조합 제안
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {simResult.fleetRecommendations.map((rec) => (
                  <div
                    key={rec.id}
                    style={{
                      padding: '8px 10px',
                      borderRadius: '8px',
                      background: rec.badge.includes('추천')
                        ? 'rgba(16, 185, 129, 0.12)'
                        : 'rgba(30, 41, 59, 0.65)',
                      border: rec.badge.includes('추천')
                        ? '1px solid rgba(16, 185, 129, 0.4)'
                        : '1px solid rgba(148, 163, 184, 0.2)',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        fontSize: '0.82rem',
                        fontWeight: 700,
                        color: '#f8fafc',
                      }}
                    >
                      <span>{rec.title}</span>
                      <span
                        style={{
                          fontSize: '0.72rem',
                          padding: '2px 7px',
                          borderRadius: '999px',
                          background: rec.badge.includes('추천') ? '#059669' : '#334155',
                          color: '#fff',
                        }}
                      >
                        {rec.badge}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.77rem', color: '#cbd5e1', marginTop: '3px' }}>
                      {rec.detail} — <span style={{ color: '#94a3b8' }}>{rec.note}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 3-C: 컨테이너 종류별 규격 및 적재 가능량 상세 비교 */}
      <div className="cbm-card" style={{ marginTop: '16px' }}>
        <div className="cbm-card-header">
          <h2>3-C. 컨테이너 규격별 비교</h2>
        </div>

        <div className="cbm-container-3col-grid">
          {simResult.containerComparison.map((item) => {
            const isSelected = item.spec.id === selectedContainerId;
            return (
              <button
                key={item.spec.id}
                type="button"
                className={`cbm-container-cmp-card ${isSelected ? 'selected' : ''}`}
                onClick={() => {
                  setSelectedContainerId(item.spec.id);
                  setSelectedContainerIdx(0);
                }}
              >
                <div className="cbm-cc-top">
                  <div>
                    <h3>{item.spec.name}</h3>
                    <span>{item.spec.subName}</span>
                  </div>
                  <div className="cbm-cc-needed-badge">{item.containerCount}대 필요</div>
                </div>

                <div className="cbm-cc-specs">
                  <div>
                    <span>내부 치수 (길이×폭×높이)</span>
                    <strong>
                      {(item.spec.length / 1000).toFixed(2)}m ×{' '}
                      {(item.spec.width / 1000).toFixed(2)}m ×{' '}
                      {(item.spec.height / 1000).toFixed(2)}m
                    </strong>
                  </div>
                  <div>
                    <span>1대당 최대 수용량</span>
                    <strong>
                      바닥 1단적 {item.floorSlots}PLT (최대 {item.maxCapacity}PLT/대)
                    </strong>
                  </div>
                  <div>
                    <span>호기별 적재 내역 (총 {item.palletCount}PLT)</span>
                    <strong>
                      {item.containers
                        .map((c) => `${c.index}호기: ${c.placedPallets.length}PLT`)
                        .join(' / ')}
                    </strong>
                  </div>
                  <div>
                    <span>평균 공간 활용률</span>
                    <strong>{item.avgUtilization}% (공인 {item.spec.nominalCbm} CBM)</strong>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}
