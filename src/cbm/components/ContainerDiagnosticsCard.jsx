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
        🚜 현장 적입(Stuffing) · 도어 통과 · 쇼링/에어백 진단
      </div>

      <div className="cbm-cog-metrics-grid">
        <div className="cbm-cog-metric">
          <span>🚪 도어 프레임 통과 여유 (유효고 {currentContainer.spec?.doorHeight || 2588}mm)</span>
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
          <span>⚓ 도어측 잔여 길이 & 쇼링 진단</span>
          <strong>
            적재길이 {(diag.usedLengthMm / 1000).toFixed(2)}m / 잔여 {diag.rearClearanceMm}mm
          </strong>
          <small>{diag.shoringText}</small>
        </div>

        <div className="cbm-cog-metric">
          <span>🛡️ 측면 유격 & 에어백 규격</span>
          <strong>
            폭 유격 {diag.lateralGapMm}mm (바닥 효율 {diag.floorUtilizationPct}%)
          </strong>
          <small>{diag.dunnageBagText}</small>
        </div>
      </div>

      {/* 도어측 저단 파레트 쇼링 시공 실무 가이드 */}
      {diag.doorShoringGuide && (
        <div
          style={{
            marginTop: '10px',
            padding: '10px 14px',
            borderRadius: '8px',
            background: 'linear-gradient(180deg, rgba(245, 158, 11, 0.12), rgba(180, 83, 9, 0.18))',
            border: '1px solid rgba(245, 158, 11, 0.45)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <span style={{ fontSize: '1.1rem' }}>🛡️</span>
            <strong style={{ fontSize: '0.86rem', color: '#fbbf24' }}>
              {diag.doorShoringGuide.title}
            </strong>
          </div>
          <p style={{ margin: '0 0 6px', fontSize: '0.79rem', color: '#fef3c7', lineHeight: 1.45 }}>
            {diag.doorShoringGuide.summary}
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.76rem', color: '#cbd5e1' }}>
            <div>• {diag.doorShoringGuide.action1}</div>
            <div>• {diag.doorShoringGuide.action2}</div>
          </div>
        </div>
      )}
    </div>
  );
}
