import React from 'react';

/**
 * 컨테이너 현장 적재 정밀 진단(도어 통과 여유고, 전후 쇼링 진단, 측면 유격 및 에어백 규격, 도어측 저단 파레트 쇼링 가이드) 카드
 */
export function ContainerDiagnosticsCard({ currentContainer }) {
  if (!currentContainer?.fieldDiagnostics) return null;

  const diag = currentContainer.fieldDiagnostics;

  return (
    <div
      style={{
        marginTop: '10px',
        padding: '10px 12px',
        borderRadius: '8px',
        background: 'rgba(30, 41, 59, 0.65)',
        border: '1px solid rgba(148, 163, 184, 0.2)',
      }}
    >
      <div
        style={{
          fontSize: '0.82rem',
          fontWeight: 700,
          color: '#93c5fd',
          marginBottom: '8px',
        }}
      >
        현장 적재 및 쇼링 진단
      </div>

      <div className="cbm-cog-metrics-grid">
        <div className="cbm-cog-metric">
          <span>도어 통과 여유 (유효고 {currentContainer.spec?.doorHeight || 2588}mm)</span>
          <strong
            style={{
              color:
                diag.doorStatus === 'danger'
                  ? '#f87171'
                  : diag.doorStatus === 'warning'
                  ? '#fbbf24'
                  : '#34d399',
            }}
          >
            최고고 {diag.maxStackHeightMm}mm (여유 {diag.doorClearanceMm >= 0 ? '+' : ''}
            {diag.doorClearanceMm}mm)
          </strong>
          <small>{diag.doorStatusText}</small>
        </div>

        <div className="cbm-cog-metric">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>도어 잔여 길이</span>
            {diag.lengthStatus && (
              <span
                className={`cbm-policy-tag ${
                  diag.lengthStatus === 'DANGER'
                    ? 'tag-switched'
                    : diag.lengthStatus === 'WARN'
                    ? 'tag-warn'
                    : 'tag-maintained'
                }`}
                style={{ fontSize: '10px', padding: '1px 6px' }}
              >
                {diag.lengthStatus === 'DANGER' ? '불가' : diag.lengthStatus === 'WARN' ? '주의' : '가능'}
              </span>
            )}
          </div>
          <strong>
            {diag.blockingRequirementText
              ? `${diag.lengthStatusText} / ${diag.blockingRequirementText}`
              : `적재길이 ${(diag.usedLengthMm / 1000).toFixed(2)}m / 잔여 ${diag.rearClearanceMm}mm`}
          </strong>
          <small>
            적재길이 {(diag.usedLengthMm / 1000).toFixed(2)}m (도어 잔여 {diag.rearClearanceMm}mm) — {diag.shoringText}
          </small>
        </div>

        <div className="cbm-cog-metric">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>측면 유격 판정</span>
            {diag.lateralStatus && (
              <span
                className={`cbm-policy-tag ${
                  diag.lateralStatus === 'DANGER'
                    ? 'tag-switched'
                    : diag.lateralStatus === 'WARN'
                    ? 'tag-warn'
                    : 'tag-maintained'
                }`}
                style={{ fontSize: '10px', padding: '1px 6px' }}
              >
                {diag.lateralStatus === 'DANGER' ? '불가' : diag.lateralStatus === 'WARN' ? '주의' : '가능'}
              </span>
            )}
          </div>
          <strong>
            폭 유격 {diag.lateralGapMm}mm (바닥 효율 {diag.floorUtilizationPct}%)
          </strong>
          <small>{diag.lateralStatusText || diag.dunnageBagText}</small>
        </div>
      </div>

      {/* 도어측 저단 파레트 쇼링 시공 실무 가이드 및 필요 자재 산출 (BOM) */}
      {diag.doorShoringGuide && (
        <div
          style={{
            marginTop: '10px',
            padding: '12px 14px',
            borderRadius: '8px',
            background: 'linear-gradient(180deg, rgba(245, 158, 11, 0.12), rgba(180, 83, 9, 0.18))',
            border: '1px solid rgba(245, 158, 11, 0.45)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px', flexWrap: 'wrap', gap: '6px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span
                style={{
                  fontSize: '0.72rem',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  background: 'rgba(245, 158, 11, 0.3)',
                  color: '#fbbf24',
                  fontWeight: 700,
                }}
              >
                현장 쇼링 방안
              </span>
              <strong style={{ fontSize: '0.86rem', color: '#fbbf24' }}>
                {diag.doorShoringGuide.title}
              </strong>
            </div>
            {diag.doorShoringGuide.lowPalletDetails?.length > 0 && (
              <span style={{ fontSize: '0.76rem', color: '#fef08a', fontWeight: 600 }}>
                {diag.doorShoringGuide.lowPalletDetails
                  .map((d) => `${d.label}: 직전 열 대비 단차 -${d.diff}mm`)
                  .join(' | ')}
              </span>
            )}
          </div>

          <p style={{ margin: '0 0 8px', fontSize: '0.79rem', color: '#fef3c7', lineHeight: 1.45 }}>
            {diag.doorShoringGuide.summary}
          </p>

          {/* 작업 시공 단계 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', fontSize: '0.77rem', color: '#cbd5e1', marginBottom: '10px' }}>
            {diag.doorShoringGuide.actions?.map((act, i) => (
              <div key={i} style={{ lineHeight: 1.4 }}>
                <span style={{ color: '#fbbf24', marginRight: '5px' }}>▶</span>
                {act}
              </div>
            ))}
          </div>

          {/* 쇼링 필요 자재 산출 (BOM) 테이블 */}
          {diag.doorShoringGuide.bom && diag.doorShoringGuide.bom.length > 0 && (
            <div style={{ marginTop: '10px', paddingTop: '8px', borderTop: '1px solid rgba(245, 158, 11, 0.3)' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#fde68a', marginBottom: '6px' }}>
                쇼링 필요 자재 산출 목록 (BOM)
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table className="cbm-bom-table">
                  <thead>
                    <tr>
                      <th>구분</th>
                      <th>자재명</th>
                      <th>소요수량</th>
                      <th>시공 목적 및 위치</th>
                      <th>수출인증</th>
                    </tr>
                  </thead>
                  <tbody>
                    {diag.doorShoringGuide.bom.map((item, idx) => (
                      <tr key={idx}>
                        <td>
                          <span className="cbm-bom-badge">{item.category}</span>
                        </td>
                        <td>
                          <strong>{item.name}</strong>
                          <small style={{ display: 'block', color: '#94a3b8', fontSize: '11px' }}>{item.spec}</small>
                        </td>
                        <td>
                          <strong style={{ color: '#38bdf8' }}>{item.quantity}</strong>
                        </td>
                        <td style={{ fontSize: '11.5px', color: '#cbd5e1' }}>{item.purpose}</td>
                        <td>
                          {item.isHtCertified ? (
                            <span className="cbm-ht-badge">ISPM 15 HT 필수</span>
                          ) : (
                            <span style={{ color: '#94a3b8', fontSize: '11px' }}>일반</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 길이 방향 래핑 공차 경고 (도어 잔여 길이 < 열 수 × 20mm) */}
      {diag.lengthWrappingWarning && (
        <div
          style={{
            marginTop: '10px',
            padding: '9px 13px',
            borderRadius: '8px',
            background: 'rgba(239, 68, 68, 0.14)',
            border: '1px solid rgba(239, 68, 68, 0.45)',
            color: '#fca5a5',
            fontSize: '0.78rem',
            lineHeight: 1.45,
          }}
        >
          <strong style={{ color: '#f87171', marginRight: '6px' }}>[래핑 공차 주의]</strong>
          {diag.lengthWrappingWarning.text}
        </div>
      )}
    </div>
  );
}
