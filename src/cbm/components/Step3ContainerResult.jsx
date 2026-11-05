import React, { useState } from 'react';
import { ThreeViewport } from '../ThreeViewport';
import { ContainerFloorPlanSvg } from './ContainerFloorPlanSvg';
import { ContainerDiagnosticsCard } from './ContainerDiagnosticsCard';
import { ContainerComparisonTable } from './ContainerComparisonTable';
import { AllocationComparisonTable } from './AllocationComparisonTable';
import { LoadingInstructionSheetModal, LoadingInstructionPrintRoot } from './LoadingInstructionSheet';

export function Step3ContainerResult({
  theme = 'dark',
  step3Ref,
  step2Ref,
  simResult,
  currentContainer,
  selectedContainerId,
  setSelectedContainerId,
  selectedContainerIdx,
  setSelectedContainerIdx,
  stuffingStrategy = 'convenience',
  setStuffingStrategy,
  balanceContainers,
  setBalanceContainers,
  fullFloorSpread,
  setFullFloorSpread,
  optimizeCoG,
  setOptimizeCoG,
  maxWeightPerContainerLimit,
  setMaxWeightPerContainerLimit,
  containerVisibleStep,
  setContainerVisibleStep,
  isContainerPlaying,
  setIsContainerPlaying,
  tierFilter,
  setTierFilter,
  explodeContainerLayers,
  setExplodeContainerLayers,
  setSelectedPalletIdx,
}) {
  const [showGuide, setShowGuide] = useState(false);
  const [showLoadingSheetModal, setShowLoadingSheetModal] = useState(false);

  const allocationPlans = simResult?.containerResult?.allocationPlans || [];
  const [selectedPlanId, setSelectedPlanId] = useState(() => allocationPlans[0]?.id || 'plan-optimal');

  // 활성 플랜 및 활성 컨테이너 목록 동기화
  const activePlan = allocationPlans.find((p) => p.id === selectedPlanId) || allocationPlans[0];
  const activeContainers = activePlan ? activePlan.containers : (simResult?.containerResult?.containers || []);
  const effectiveCurrentContainer =
    activeContainers[selectedContainerIdx] || activeContainers[0] || currentContainer;

  const isCustomWeightLimit = Boolean(maxWeightPerContainerLimit && Number(maxWeightPerContainerLimit) > 0);
  const hasWeightLimitWarning =
    isCustomWeightLimit &&
    (activeContainers.length > (simResult?.containerResult?.containers?.length || 1) ||
      (activePlan?.incompleteColsCount || 0) > 0);

  return (
    <section ref={step3Ref} className="cbm-step-section">
      {/* Step 3 Header & Executive KPI Summary Pills */}
      <div className="cbm-section-banner step3-banner">
        <div className="cbm-section-banner-left">
          <span className="cbm-step-badge badge-emerald">STEP 3</span>
          <div>
            <h2>컨테이너 3D 적재 및 필요 대수 산출</h2>
            <p>
              컨테이너 3D 적재 배치, 무게중심(CoG) 및 소요 대수를 확인합니다.
            </p>
          </div>
        </div>
        <div className="cbm-section-summary-pills">
          <div className="cbm-mini-stat highlight-emerald">
            <span>선택 규격 & 필요 대수</span>
            <strong>
              {simResult.selectedSpec.name} × {simResult.summary.totalContainers}대
            </strong>
          </div>
          <div className="cbm-mini-stat">
            <span>호기별 파레트 배분</span>
            <strong>
              {activeContainers
                .map((c) => `${c.index}호기 ${c.placedPallets.length}PLT`)
                .join(' / ')}
            </strong>
          </div>
          <div className="cbm-mini-stat">
            <span>무게중심(CoG) 상태</span>
            <strong style={{ color: '#6ee7b7' }}>
              {effectiveCurrentContainer?.cog?.statusText || '정상 (균형)'}
            </strong>
          </div>
          <button
            type="button"
            className="cbm-loading-sheet-btn"
            onClick={() => setShowLoadingSheetModal(true)}
            title="창고 지게차 기사용 A4 가로 흑백 현장 로딩 지시서 출력"
            style={{ alignSelf: 'center', height: '36px', fontSize: '12.5px', whiteSpace: 'nowrap' }}
          >
            현장 로딩 지시서 출력
          </button>
        </div>
      </div>

      {/* 슬림 일원화 컨트롤 리본 (컨테이너 규격 · 적재 전략 · 바닥 방식 · CoG · 가이드) */}
      <div className="cbm-control-ribbon">
        <div className="cbm-ribbon-row">
          {/* 1) 컨테이너 규격 선택 */}
          <div className="cbm-ribbon-group">
            <span className="cbm-ribbon-label">컨테이너:</span>
            <div className="cbm-ribbon-btn-group">
              {simResult.containerComparison.map((item) => {
                const isSelected = item.spec.id === selectedContainerId;
                return (
                  <button
                    key={item.spec.id}
                    type="button"
                    className={`cbm-ribbon-btn ${isSelected ? 'active' : ''}`}
                    onClick={() => {
                      setSelectedContainerId(item.spec.id);
                      setSelectedContainerIdx(0);
                    }}
                  >
                    {item.spec.name} ({item.containerCount}대)
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2) 적재 전략 선택 */}
          <div className="cbm-ribbon-group">
            <span className="cbm-ribbon-label">적재 전략:</span>
            <div className="cbm-ribbon-btn-group">
              <button
                type="button"
                className={`cbm-ribbon-btn ${
                  stuffingStrategy === 'convenience' ? 'active amber' : ''
                }`}
                onClick={() => setStuffingStrategy && setStuffingStrategy('convenience')}
                title="단일 품목으로 채울 수 있는 호기는 100% 전용 완적하여 지게차 동선 단순화"
              >
                작업 편의성 우선
              </button>
              <button
                type="button"
                className={`cbm-ribbon-btn ${
                  stuffingStrategy === 'balance' ? 'active indigo' : ''
                }`}
                onClick={() => setStuffingStrategy && setStuffingStrategy('balance')}
                title="모든 호기에 품목과 무게를 골고루 분산"
              >
                균등 밸런스 우선
              </button>
            </div>
          </div>

          {/* 3) 바닥 배치 선택 */}
          <div className="cbm-ribbon-group">
            <span className="cbm-ribbon-label">바닥 배치:</span>
            <div className="cbm-ribbon-btn-group">
              <button
                type="button"
                className={`cbm-ribbon-btn ${fullFloorSpread ? 'active emerald' : ''}`}
                onClick={() => setFullFloorSpread(true)}
                title="1단적(평적)으로 바닥 전체에 파레트를 균등 간격으로 끝까지 배치하여 운송 중 쏠림 방지"
              >
                빈 바닥 채움
              </button>
              <button
                type="button"
                className={`cbm-ribbon-btn ${!fullFloorSpread ? 'active' : ''}`}
                onClick={() => setFullFloorSpread(false)}
                title="상단 적재 가능 파레트를 2단적으로 높게 쌓아 도어 쪽에 넓은 바닥 여유 공간 확보"
              >
                공간 확보 (2단적)
              </button>
            </div>
          </div>

          {/* 4) 호기당 화물 중량 상한(kg) 설정 */}
          <div className="cbm-ribbon-group">
            <span className="cbm-ribbon-label">중량 상한:</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <input
                type="number"
                min={1000}
                max={40000}
                step={500}
                placeholder="제한 없음"
                value={maxWeightPerContainerLimit || ''}
                onChange={(e) => setMaxWeightPerContainerLimit && setMaxWeightPerContainerLimit(e.target.value)}
                style={{
                  width: '90px',
                  padding: '4px 8px',
                  fontSize: '0.8rem',
                  borderRadius: '6px',
                  border: isCustomWeightLimit ? '1px solid #3b82f6' : '1px solid rgba(148, 163, 184, 0.3)',
                  background: 'rgba(15, 23, 42, 0.6)',
                  color: '#fff',
                  textAlign: 'right',
                }}
              />
              <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>kg</span>
              {isCustomWeightLimit && (
                <button
                  type="button"
                  onClick={() => setMaxWeightPerContainerLimit && setMaxWeightPerContainerLimit('')}
                  style={{
                    border: 'none',
                    background: 'transparent',
                    color: '#94a3b8',
                    cursor: 'pointer',
                    fontSize: '0.75rem',
                    padding: '2px 4px',
                  }}
                  title="제한 해제"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* 5) CoG 체크박스 & 실무 가이드 토글 */}
          <div className="cbm-ribbon-group" style={{ marginLeft: 'auto' }}>
            <label
              className="cbm-mini-check"
              style={{ margin: 0 }}
              title="컨테이너 내 파레트 무게중심을 정렬합니다. 작업 편의성 모드에서는 품목(SKU) 블록을 유지하며 완적/무거운 파레트를 앞벽에 안정 배치하고 자투리를 도어 측으로 정돈합니다."
            >
              <input
                type="checkbox"
                checked={optimizeCoG}
                onChange={(e) => setOptimizeCoG(e.target.checked)}
              />
              <span style={{ fontSize: '0.78rem' }}>CoG 밸런싱</span>
            </label>
            <button
              type="button"
              className="cbm-guide-toggle-btn"
              onClick={() => setShowGuide((prev) => !prev)}
            >
              ⓘ 적재 가이드 {showGuide ? '▲' : '▼'}
            </button>
          </div>
        </div>

        {/* 접이식 실무 적재 가이드 드로어 (기본은 접힘, 클릭 시만 노출) */}
        {showGuide && (
          <div className="cbm-guide-drawer">
            <div className="cbm-guide-card">
              <h4>적재 전략 및 CoG 밸런싱 실무 가이드</h4>
              <div>
                • <strong>작업 편의성 우선 (권장):</strong> 단일 품목으로 1대를 채울 수 있는 물량은 1호기를 100% 전용 완적(FCL)하여 지게차 왕복 동선을 줄이고 도착지 소팅(분류) 작업을 생략합니다.
                <br />
                • <strong>균등 밸런스 우선:</strong> 전 호기에 각 품목과 중량을 균등하게 나누어 실어 호기간 중량/부피 편차를 최소화합니다.
                <br />
                • <strong>CoG 밸런싱 & 안전 트레이드오프:</strong> 컨테이너 무게중심(L/2) 편차를 줄이도록 정렬합니다. 단, 잔여 화물이 적은 호기(2호기 등)에서 도어 측 빈 공간(2.1m)으로 인한 전방 편차(-7.4%) 해소를 위해 앞벽을 띄우거나 저단 파레트를 앞벽에 두면, 차량 급제동(0.8G) 시 뒤쪽 화물이 앞으로 전도·붕괴될 위험이 커지므로 '앞벽 밀착 적재 + 후방 목재 펜스 차단'이 안전 수칙상 표준입니다.
              </div>
            </div>
            <div className="cbm-guide-card">
              <h4>바닥 배치 방식 실무 가이드</h4>
              <div>
                • <strong>바닥 분산 배치:</strong> 모든 파레트를 1단적(평적)으로 바닥 전체에 고르게 분산 배치합니다. 열(Row) 간격이 30mm 이상 벌어질 경우 해상 운송 중 쏠림 방지를 위해 에어백(Dunnage Bag) 등 충전재 시공이 필요합니다.
                <br />
                • <strong>전방 밀착 배치:</strong> 안쪽(Front) 벽면부터 빈틈없이 밀착 적재하며, 도어 전면의 빈 공간에는 목재 블로킹(Chocking & Blocking) 및 차단 래싱 벨트를 시공합니다.
              </div>
            </div>
          </div>
        )}

        {/* 도로 운송 중량 제한 안내 문구 */}
        <div style={{ marginTop: '8px', fontSize: '0.76rem', color: '#94a3b8', padding: '0 4px' }}>
          [안내] 도로 운송 중량 제한(축중 제한 등)을 고려해 회사의 실제 선적 중량 상한을 설정할 수 있습니다. (기본값: 컨테이너 제원 최대적재중량)
        </div>

        {/* 상한으로 인한 대수 증가 또는 미완성 열 발생 경고 */}
        {hasWeightLimitWarning && (
          <div className="cbm-weight-limit-alert" style={{ marginTop: '8px' }}>
            <span style={{ fontWeight: 700, color: '#f59e0b' }}>[안내] 중량 상한:</span>
            <span>
              호기당 중량 상한({Number(maxWeightPerContainerLimit).toLocaleString()}kg)을 맞추기 위해{' '}
              {activeContainers.length > (simResult?.containerResult?.containers?.length || 1)
                ? '컨테이너 소요 대수가 늘어났습니다.'
                : '미완성 열이 발생했습니다.'}
            </span>
          </div>
        )}
      </div>

      {/* 3단계 상단: 호기별 배분 비교 표 (추천안 vs 대안) */}
      {allocationPlans.length > 0 && (
        <AllocationComparisonTable
          plans={allocationPlans}
          selectedPlanId={selectedPlanId}
          onSelectPlan={(id) => {
            setSelectedPlanId(id);
            setSelectedContainerIdx(0);
          }}
          theme={theme}
        />
      )}

      {/* 3-A: 3D 컨테이너 적재 시각화 & 2D 평면도 (Visual-First! 최상단 배치) */}
      <div className="cbm-visualizer-card">
        <div className="cbm-vis-subheader">
          <div className="cbm-instance-pills">
            {activeContainers.map((c, idx) => (
              <button
                key={c.id}
                type="button"
                className={`cbm-instance-pill ${
                  selectedContainerIdx === idx ? 'active' : ''
                }`}
                onClick={() => {
                  setSelectedContainerIdx(idx);
                  setContainerVisibleStep(100);
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '6px',
                    width: '100%',
                  }}
                >
                  <strong>
                    {c.spec.name} #{c.index}호기
                  </strong>
                  {c.stuffingBadge && (
                    <span
                      style={{
                        fontSize: '0.68rem',
                        padding: '1px 6px',
                        borderRadius: '999px',
                        background: c.stuffingBadge.bg,
                        border: c.stuffingBadge.border,
                        color: c.stuffingBadge.color,
                        fontWeight: 700,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {c.stuffingBadge.tagText}
                    </span>
                  )}
                </div>
                <span>
                  {c.placedPallets.length} 파레트 · {c.boxCount.toLocaleString()}박스 ·{' '}
                  {c.totalWeight.toLocaleString()}kg · 부피 {c.volumeUtilization}%
                </span>
              </button>
            ))}
          </div>

          <div className="cbm-vis-filters">
            <div className="cbm-segmented-filter">
              <button
                type="button"
                className={tierFilter === 'all' ? 'active' : ''}
                onClick={() => setTierFilter('all')}
              >
                전체 보기
              </button>
              <button
                type="button"
                className={tierFilter === 'tier1' ? 'active' : ''}
                onClick={() => setTierFilter('tier1')}
              >
                1단적만 ({effectiveCurrentContainer?.tier1Count || 0})
              </button>
              <button
                type="button"
                className={tierFilter === 'tier2' ? 'active' : ''}
                onClick={() => setTierFilter('tier2')}
              >
                2단적만 ({effectiveCurrentContainer?.tier2Count || 0})
              </button>
            </div>

            <label className="cbm-mini-check">
              <input
                type="checkbox"
                checked={explodeContainerLayers}
                onChange={(e) => setExplodeContainerLayers(e.target.checked)}
              />
              <span>층간 분리뷰</span>
            </label>

            <button
              type="button"
              className="cbm-loading-sheet-btn"
              onClick={() => setShowLoadingSheetModal(true)}
              style={{ padding: '4px 10px', fontSize: '11.5px', height: '28px' }}
              title="A4 가로 흑백 현장 로딩 지시서 출력"
            >
              지시서 출력
            </button>
          </div>

          {/* 도어(Door) 쪽 저단 파레트 낙하 방지 & 화물 밀림 방지 쇼링 알림 바 */}
          {effectiveCurrentContainer?.fieldDiagnostics?.doorShoringGuide && (
            <div
              style={{
                width: '100%',
                marginTop: '8px',
                padding: '7px 12px',
                borderRadius: '8px',
                background: 'rgba(245, 158, 11, 0.15)',
                border: '1px solid rgba(245, 158, 11, 0.45)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '8px',
                fontSize: '0.8rem',
                color: '#fef3c7',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
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
                  쇼링 안전
                </span>
                <strong>
                  {effectiveCurrentContainer.fieldDiagnostics.doorShoringGuide.title}:
                </strong>
                <span style={{ color: '#fde68a' }}>
                  {effectiveCurrentContainer.fieldDiagnostics.doorShoringGuide.action1}
                </span>
              </div>
              {effectiveCurrentContainer.fieldDiagnostics.doorShoringGuide.action2 && (
                <span style={{ fontSize: '0.72rem', color: '#cbd5e1' }}>
                  {effectiveCurrentContainer.fieldDiagnostics.doorShoringGuide.action2}
                </span>
              )}
            </div>
          )}

          {/* 길이 방향 래핑 공차 경고 바 */}
          {effectiveCurrentContainer?.fieldDiagnostics?.lengthWrappingWarning && (
            <div
              style={{
                width: '100%',
                marginTop: '6px',
                padding: '6px 12px',
                borderRadius: '8px',
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.45)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '0.8rem',
                color: '#fca5a5',
              }}
            >
              <span
                style={{
                  fontSize: '0.72rem',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  background: 'rgba(239, 68, 68, 0.3)',
                  color: '#f87171',
                  fontWeight: 700,
                }}
              >
                래핑 공차 주의
              </span>
              <span>{effectiveCurrentContainer.fieldDiagnostics.lengthWrappingWarning.text}</span>
            </div>
          )}
        </div>

        {/* 3D Container Canvas */}
        <ThreeViewport
          theme={theme}
          mode="container"
          containerInstance={effectiveCurrentContainer}
          containerSpec={simResult.selectedSpec}
          visibleStep={containerVisibleStep}
          tierFilter={tierFilter}
          showWireframeWall={true}
          explodeLayers={explodeContainerLayers}
          onSelectPallet={(pIdx) => {
            setSelectedPalletIdx(pIdx);
            step2Ref.current?.scrollIntoView({ behavior: 'smooth' });
          }}
        />

        {/* Container Step-by-Step Loading Playback Slider */}
        <div className="cbm-playback-bar">
          <button
            type="button"
            className="cbm-play-btn"
            onClick={() => {
              if (containerVisibleStep >= 100) setContainerVisibleStep(5);
              setIsContainerPlaying((p) => !p);
            }}
          >
            {isContainerPlaying ? '일시정지' : '▶ 컨테이너 파레트 적재 순서 재생'}
          </button>
          <div className="cbm-slider-wrap">
            <span>컨테이너 적재 진행률 ({containerVisibleStep}%)</span>
            <input
              type="range"
              min={0}
              max={100}
              value={containerVisibleStep}
              onChange={(e) => {
                setIsContainerPlaying(false);
                setContainerVisibleStep(Number(e.target.value));
              }}
            />
          </div>
        </div>

        {/* 2D Container Floor Slot Map & Center of Gravity (CoG) Analysis */}
        {effectiveCurrentContainer && effectiveCurrentContainer.cog && (
          <div className="cbm-container-detail-footer">
            {/* 2D Top-Down Container Floor Layout SVG (Subcomponent) */}
            <ContainerFloorPlanSvg
              theme={theme}
              currentContainer={effectiveCurrentContainer}
              setSelectedPalletIdx={setSelectedPalletIdx}
              step2Ref={step2Ref}
            />

            {/* CoG Metric Cards */}
            <div className="cbm-cog-stats-col">
              <div
                className={`cbm-cog-status-box ${
                  effectiveCurrentContainer.cog.status === 'SAFE' ? 'status-safe' : 'status-warn'
                }`}
              >
                <div className="cbm-cs-top">
                  <span>무게중심(CoG) 평가</span>
                  <strong>{effectiveCurrentContainer.cog.statusText}</strong>
                </div>
                <p>
                  {effectiveCurrentContainer.cog.offsetDirXText} · {effectiveCurrentContainer.cog.offsetDirZText}
                  <br />
                  <span style={{ fontSize: '0.73rem', color: '#94a3b8' }}>
                    {effectiveCurrentContainer.cog.axleLoadNote}
                  </span>
                </p>
              </div>

              {/* CoG 기준 초과 시 원인 분석 & 트레이드오프 비교 안내 */}
              {effectiveCurrentContainer.cog.cogTradeoffNote && (
                <div
                  style={{
                    background: 'rgba(245, 158, 11, 0.08)',
                    border: '1px solid rgba(245, 158, 11, 0.35)',
                    borderRadius: '8px',
                    padding: '10px 12px',
                    fontSize: '0.78rem',
                    color: '#fef3c7',
                    lineHeight: 1.45,
                    marginBottom: '10px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px', flexWrap: 'wrap' }}>
                    <span style={{ background: '#f59e0b', color: '#000', fontSize: '10px', padding: '1px 6px', borderRadius: '4px', fontWeight: 800 }}>
                      CoG 밸런스 분석 & 트레이드오프
                    </span>
                    <strong style={{ color: '#fbbf24', fontSize: '0.82rem' }}>
                      {effectiveCurrentContainer.cog.cogTradeoffNote.title}
                    </strong>
                  </div>
                  <div style={{ marginBottom: '6px', color: '#e2e8f0' }}>
                    <strong>• 발생 원인:</strong> {effectiveCurrentContainer.cog.cogTradeoffNote.cause}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '6px' }}>
                    <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '6px 8px', borderRadius: '6px', border: '1px solid #334155' }}>
                      <span style={{ color: '#38bdf8', fontWeight: 700, display: 'block', marginBottom: '2px', fontSize: '0.76rem' }}>
                        대안 검토 (앞벽 이격 / 저단 배치)
                      </span>
                      <span style={{ fontSize: '0.72rem', color: '#cbd5e1' }}>
                        {effectiveCurrentContainer.cog.cogTradeoffNote.alternativeOption}
                      </span>
                    </div>
                    <div style={{ background: 'rgba(239, 68, 68, 0.12)', padding: '6px 8px', borderRadius: '6px', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
                      <span style={{ color: '#f87171', fontWeight: 700, display: 'block', marginBottom: '2px', fontSize: '0.76rem' }}>
                        현장 리스크 (급제동 전도 위험)
                      </span>
                      <span style={{ fontSize: '0.72rem', color: '#fca5a5' }}>
                        {effectiveCurrentContainer.cog.cogTradeoffNote.tradeoffRisk}
                      </span>
                    </div>
                  </div>
                  <div style={{ color: '#a7f3d0', fontSize: '0.75rem', fontWeight: 600 }}>
                    ▶ 결론 및 권장: {effectiveCurrentContainer.cog.cogTradeoffNote.conclusion}
                  </div>
                </div>
              )}

              <div className="cbm-cog-metrics-grid">
                <div className="cbm-cog-metric">
                  <span>좌우 밸런스 및 편차</span>
                  <strong>
                    좌 {effectiveCurrentContainer.cog.leftRatio}% : 우 {effectiveCurrentContainer.cog.rightRatio}% ({effectiveCurrentContainer.cog.offsetDirZText})
                  </strong>
                  <small>{effectiveCurrentContainer.cog.lateralCriteriaText}</small>
                </div>
                <div className="cbm-cog-metric">
                  <span>전후 밸런스 및 편차</span>
                  <strong>
                    전 {effectiveCurrentContainer.cog.frontRatio}% : 후 {effectiveCurrentContainer.cog.rearRatio}% ({effectiveCurrentContainer.cog.offsetDirXText})
                  </strong>
                  <small>
                    {effectiveCurrentContainer.cog.longitudinalCriteriaText}
                  </small>
                </div>
                <div className="cbm-cog-metric">
                  <span>단적(段積) 분석</span>
                  <strong>
                    1단적 {effectiveCurrentContainer.tier1Count}PLT / 2단적 {effectiveCurrentContainer.tier2Count}PLT
                  </strong>
                  <small>
                    총 {effectiveCurrentContainer.placedPallets.length}개 파레트 (
                    {effectiveCurrentContainer.boxCount.toLocaleString()} 박스)
                  </small>
                </div>
              </div>

              {/* Field Operations & Shoring Diagnostics (Subcomponent) */}
              <ContainerDiagnosticsCard currentContainer={effectiveCurrentContainer} />
            </div>
          </div>
        )}
      </div>

      {/* 3-B & 3-C: SKU 배분 명세표, 최적 배차 제안 & 규격별 비교 카드 (Subcomponent) */}
      <ContainerComparisonTable
        simResult={simResult}
        selectedContainerId={selectedContainerId}
        setSelectedContainerId={setSelectedContainerId}
        setSelectedContainerIdx={setSelectedContainerIdx}
      />

      {/* 현장 로딩 지시서 출력 모달 & 인쇄 전용 DOM */}
      {showLoadingSheetModal && (
        <LoadingInstructionSheetModal
          containers={activeContainers}
          initialContainerIdx={selectedContainerIdx}
          onClose={() => setShowLoadingSheetModal(false)}
        />
      )}
      <LoadingInstructionPrintRoot containers={activeContainers} />
    </section>
  );
}
