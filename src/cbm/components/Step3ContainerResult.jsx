import React, { useState } from 'react';
import { ThreeViewport } from '../ThreeViewport';
import { ContainerFloorPlanSvg } from './ContainerFloorPlanSvg';
import { ContainerDiagnosticsCard } from './ContainerDiagnosticsCard';
import { ContainerComparisonTable } from './ContainerComparisonTable';

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

  return (
    <section ref={step3Ref} className="cbm-step-section">
      {/* Step 3 Header & Executive KPI Summary Pills */}
      <div className="cbm-section-banner step3-banner">
        <div className="cbm-section-banner-left">
          <span className="cbm-step-badge badge-emerald">STEP 3</span>
          <div>
            <h2>컨테이너 3D 적재 시뮬레이션 & 필요 대수 산출</h2>
            <p>
              총 {simResult.summary.totalPallets}개 파레트의 컨테이너 3D 적재 배치와 무게중심(CoG), 규격별 필요 대수를 확인하세요.
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
              {simResult.containerResult.containers
                .map((c) => `${c.index}호기 ${c.placedPallets.length}PLT`)
                .join(' / ')}
            </strong>
          </div>
          <div className="cbm-mini-stat">
            <span>무게중심(CoG) 상태</span>
            <strong style={{ color: '#6ee7b7' }}>
              {currentContainer?.cog?.statusText || '정상 (균형)'}
            </strong>
          </div>
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
                빈 바닥 채움 (1단 평적)
              </button>
              <button
                type="button"
                className={`cbm-ribbon-btn ${!fullFloorSpread ? 'active' : ''}`}
                onClick={() => setFullFloorSpread(false)}
                title="상단 적재 가능 파레트를 2단적으로 높게 쌓아 도어 쪽에 넓은 바닥 여유 공간 확보"
              >
                바닥 공간 확보 (2단 밀착)
              </button>
            </div>
          </div>

          {/* 4) CoG 체크박스 & 실무 가이드 토글 */}
          <div className="cbm-ribbon-group" style={{ marginLeft: 'auto' }}>
            <label className="cbm-mini-check" style={{ margin: 0 }}>
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
              ⓘ 실무 적재 가이드 {showGuide ? '▲ 닫기' : '▼ 자세히'}
            </button>
          </div>
        </div>

        {/* 접이식 실무 적재 가이드 드로어 (기본은 접힘, 클릭 시만 노출) */}
        {showGuide && (
          <div className="cbm-guide-drawer">
            <div className="cbm-guide-card">
              <h4>적재 전략 실무 가이드</h4>
              <div>
                • <strong>작업 편의성 우선 (권장):</strong> 단일 품목으로 1대를 채울 수 있는 물량은 1호기를 100% 전용 완적(FCL)하여 지게차 왕복 동선을 줄이고 도착지 소팅(분류) 작업을 생략합니다. (2단적 진행 시에도 1호기에 2단적을 집중 완적하고 2호기는 안전한 1단적 평적으로 끝냅니다)
                <br />
                • <strong>균등 밸런스 우선:</strong> 전 호기에 각 품목과 중량을 균등하게 나누어 실어 호기간 중량/부피 편차를 최소화합니다.
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
      </div>

      {/* 3-A: 3D 컨테이너 적재 시각화 & 2D 평면도 (Visual-First! 최상단 배치) */}
      <div className="cbm-visualizer-card">
        <div className="cbm-vis-subheader">
          <div className="cbm-instance-pills">
            {simResult.containerResult.containers.map((c, idx) => (
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
                1단적만 ({currentContainer?.tier1Count || 0})
              </button>
              <button
                type="button"
                className={tierFilter === 'tier2' ? 'active' : ''}
                onClick={() => setTierFilter('tier2')}
              >
                2단적만 ({currentContainer?.tier2Count || 0})
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
          </div>

          {/* 도어(Door) 쪽 저단 파레트 낙하 방지 & 화물 밀림 방지 쇼링 알림 바 */}
          {currentContainer?.fieldDiagnostics?.doorShoringGuide && (
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
                  {currentContainer.fieldDiagnostics.doorShoringGuide.title}:
                </strong>
                <span style={{ color: '#fde68a' }}>
                  {currentContainer.fieldDiagnostics.doorShoringGuide.action1}
                </span>
              </div>
              {currentContainer.fieldDiagnostics.doorShoringGuide.action2 && (
                <span style={{ fontSize: '0.72rem', color: '#cbd5e1' }}>
                  {currentContainer.fieldDiagnostics.doorShoringGuide.action2}
                </span>
              )}
            </div>
          )}

          {/* 길이 방향 래핑 공차 경고 바 */}
          {currentContainer?.fieldDiagnostics?.lengthWrappingWarning && (
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
              <span>{currentContainer.fieldDiagnostics.lengthWrappingWarning.text}</span>
            </div>
          )}
        </div>

        {/* 3D Container Canvas */}
        <ThreeViewport
          theme={theme}
          mode="container"
          containerInstance={currentContainer}
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
        {currentContainer && currentContainer.cog && (
          <div className="cbm-container-detail-footer">
            {/* 2D Top-Down Container Floor Layout SVG (Subcomponent) */}
            <ContainerFloorPlanSvg
              theme={theme}
              currentContainer={currentContainer}
              setSelectedPalletIdx={setSelectedPalletIdx}
              step2Ref={step2Ref}
            />

            {/* CoG Metric Cards */}
            <div className="cbm-cog-stats-col">
              <div
                className={`cbm-cog-status-box ${
                  currentContainer.cog.status === 'SAFE' ? 'status-safe' : 'status-warn'
                }`}
              >
                <div className="cbm-cs-top">
                  <span>무게중심(CoG) 평가</span>
                  <strong>{currentContainer.cog.statusText}</strong>
                </div>
                <p>
                  {currentContainer.cog.offsetDirXText} · {currentContainer.cog.offsetDirZText}
                  <br />
                  <span style={{ fontSize: '0.73rem', color: '#94a3b8' }}>
                    {currentContainer.cog.axleLoadNote}
                  </span>
                </p>
              </div>

              <div className="cbm-cog-metrics-grid">
                <div className="cbm-cog-metric">
                  <span>좌우 밸런스 & 중앙 편차</span>
                  <strong>
                    좌 {currentContainer.cog.leftRatio}% : 우 {currentContainer.cog.rightRatio}% ({currentContainer.cog.offsetDirZText})
                  </strong>
                  <small>{currentContainer.cog.lateralCriteriaText}</small>
                </div>
                <div className="cbm-cog-metric">
                  <span>전후 밸런스 & 중앙 편차 (IMO CTU)</span>
                  <strong>
                    전 {currentContainer.cog.frontRatio}% : 후 {currentContainer.cog.rearRatio}% ({currentContainer.cog.offsetDirXText})
                  </strong>
                  <small>
                    {currentContainer.cog.longitudinalCriteriaText}
                  </small>
                </div>
                <div className="cbm-cog-metric">
                  <span>단적(段積) 분석</span>
                  <strong>
                    1단적 {currentContainer.tier1Count}PLT / 2단적 {currentContainer.tier2Count}PLT
                  </strong>
                  <small>
                    총 {currentContainer.placedPallets.length}개 파레트 (
                    {currentContainer.boxCount.toLocaleString()} 박스)
                  </small>
                </div>
              </div>

              {/* Field Operations & Shoring Diagnostics (Subcomponent) */}
              <ContainerDiagnosticsCard currentContainer={currentContainer} />
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
    </section>
  );
}
