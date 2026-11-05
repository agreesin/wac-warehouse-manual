import React from 'react';

/**
 * 3단계 상단 컨테이너 호기별 파레트 배분 비교 표 컴포넌트
 */
export function AllocationComparisonTable({
  plans = [],
  selectedPlanId,
  onSelectPlan,
  theme = 'dark',
}) {
  if (!plans || plans.length === 0) return null;

  const isLight = theme === 'light';

  return (
    <div className="cbm-card cbm-alloc-table-card" style={{ marginBottom: '14px', padding: '14px 16px' }}>
      <div className="cbm-card-header" style={{ marginBottom: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <span className="cbm-badge" style={{ background: '#0284c7', color: '#fff' }}>
            배분 최적화
          </span>
          <h3 style={{ margin: 0, fontSize: '0.96rem', fontWeight: 700, color: isLight ? '#0f172a' : '#f8fafc' }}>
            호기별 파레트 배분 비교
          </h3>
        </div>
        <span style={{ fontSize: '0.75rem', color: isLight ? '#64748b' : '#94a3b8' }}>
          클릭 시 3D·평면도·지시서 전환
        </span>
      </div>

      <div className="cbm-alloc-table-wrapper" style={{ overflowX: 'auto' }}>
        <table className="cbm-alloc-table">
          <thead>
            <tr>
              <th style={{ width: '130px' }}>배분 안</th>
              <th>호기별 파레트 수</th>
              <th>화물 중량 (상한 대비 %)</th>
              <th style={{ textAlign: 'center' }}>미완성 열</th>
              <th>문 앞 빈 공간</th>
              <th>전후 CoG 편차</th>
              <th>예상 쇼링 자재</th>
              <th>선택 이유 및 특징</th>
            </tr>
          </thead>
          <tbody>
            {plans.map((plan) => {
              const isSelected = plan.id === selectedPlanId || (!selectedPlanId && plan.isOptimal);
              return (
                <tr
                  key={plan.id}
                  className={`cbm-alloc-row ${isSelected ? 'selected' : ''} ${plan.isOverweight ? 'overweight' : ''}`}
                  onClick={() => onSelectPlan && onSelectPlan(plan.id)}
                  title="클릭하여 이 배분으로 3D 시뮬레이션 및 현장 지시서 적용"
                >
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <input
                        type="radio"
                        name="allocation-plan-radio"
                        checked={isSelected}
                        onChange={() => onSelectPlan && onSelectPlan(plan.id)}
                        style={{ cursor: 'pointer' }}
                      />
                      <div>
                        <strong>{plan.name}</strong>
                        {isSelected && (
                          <span className="cbm-plan-badge active">적용중</span>
                        )}
                        {plan.isOverweight && (
                          <span className="cbm-plan-badge danger">상한초과</span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td>
                    <strong style={{ color: isSelected ? '#38bdf8' : 'inherit' }}>
                      {plan.palletCountsText}
                    </strong>
                  </td>
                  <td style={{ fontSize: '0.78rem' }}>
                    <span style={{ color: plan.isOverweight ? '#f87171' : 'inherit' }}>
                      {plan.weightsText}
                    </span>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    {plan.incompleteColsCount === 0 ? (
                      <span className="cbm-plan-pill safe">0개 (완적)</span>
                    ) : (
                      <span className="cbm-plan-pill warn">{plan.incompleteColsCount}개 (주의)</span>
                    )}
                  </td>
                  <td style={{ fontSize: '0.78rem' }}>{plan.rearClearanceText}</td>
                  <td style={{ fontSize: '0.78rem' }}>{plan.cogOffsetText}</td>
                  <td style={{ fontSize: '0.76rem', color: isLight ? '#475569' : '#cbd5e1' }}>
                    {plan.shoringSummary}
                  </td>
                  <td style={{ fontSize: '0.77rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ color: isSelected ? '#10b981' : (isLight ? '#334155' : '#94a3b8') }}>
                        {plan.selectionReason}
                      </span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
