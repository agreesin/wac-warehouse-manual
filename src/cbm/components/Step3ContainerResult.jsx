import React from 'react';
import { ThreeViewport } from '../ThreeViewport';

export function Step3ContainerResult({
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
  return (
    <section ref={step3Ref} className="cbm-step-section">
      <div className="cbm-section-banner step3-banner">
        <div className="cbm-section-banner-left">
          <span className="cbm-step-badge badge-emerald">STEP 3</span>
          <div>
            <h2>컨테이너 종류별 수용 파레트 수 및 컨테이너 전체 적재 시각화</h2>
            <p>
              컨테이너 종류(20ft / 40ft / 40ft HC)에 따라 1대당 몇 파레트를 넣을 수 있는지 비교하고, 파레트를 모두 넣었을 때의 3D 컨테이너 내부와 무게중심(CoG)을 확인하세요.
            </p>
          </div>
        </div>
        <div className="cbm-section-summary-pills">
          <div className="cbm-mini-stat highlight-emerald">
            <span>선택 컨테이너 및 필요 대수</span>
            <strong>
              {simResult.selectedSpec.name} × {simResult.summary.totalContainers}대
            </strong>
          </div>
          <div className="cbm-mini-stat">
            <span>적재 전략 & 호기별 배분</span>
            <strong>
              {stuffingStrategy === 'convenience' ? '🚜 작업 편의성 우선' : '⚖️ 균등 밸런스'}{' '}
              ({simResult.containerResult.containers
                .map((c) => `${c.index}호기 ${c.placedPallets.length}PLT`)
                .join(' / ')})
            </strong>
          </div>
          <div className="cbm-mini-stat">
            <span>무게중심(CoG) 안전도</span>
            <strong style={{ color: '#6ee7b7' }}>
              {currentContainer?.cog?.statusText || '정상'}
            </strong>
          </div>
        </div>
      </div>

      {/* 3-A: Container Type Comparison Cards (20ft Dry / 40ft Dry / 40ft HC) */}
      <div className="cbm-card">
        <div className="cbm-card-header">
          <h2>3-A. 컨테이너 종류별 적재 가능 파레트 수 & 필요 대수 비교</h2>
          <div className="cbm-vis-filters">
            <div className="cbm-segmented-filter" style={{ marginRight: '6px' }}>
              <button
                type="button"
                className={stuffingStrategy === 'convenience' ? 'active' : ''}
                style={{
                  padding: '4px 10px',
                  fontWeight: stuffingStrategy === 'convenience' ? 700 : 500,
                  color: stuffingStrategy === 'convenience' ? '#fbbf24' : '#94a3b8',
                }}
                onClick={() => setStuffingStrategy && setStuffingStrategy('convenience')}
                title="단일 품목으로 채울 수 있는 호기는 100% 전용 완적하여 지게차 동선 단순화"
              >
                🚜 작업 편의성 우선 (품목별 전용 완적)
              </button>
              <button
                type="button"
                className={stuffingStrategy === 'balance' ? 'active' : ''}
                style={{
                  padding: '4px 10px',
                  fontWeight: stuffingStrategy === 'balance' ? 700 : 500,
                  color: stuffingStrategy === 'balance' ? '#a5b4fc' : '#94a3b8',
                }}
                onClick={() => setStuffingStrategy && setStuffingStrategy('balance')}
                title="모든 호기에 품목과 무게를 골고루 분산"
              >
                ⚖️ 균등 밸런스 우선 (전 호기 균등 배분)
              </button>
            </div>
            <label className="cbm-mini-check">
              <input
                type="checkbox"
                checked={fullFloorSpread}
                onChange={(e) => setFullFloorSpread(e.target.checked)}
              />
              <span style={{ color: '#fbbf24', fontWeight: 700 }}>
                🛡️ 빈 바닥 채움 (1단 바닥 전체 균등 배치)
              </span>
            </label>
            <label className="cbm-mini-check">
              <input
                type="checkbox"
                checked={optimizeCoG}
                onChange={(e) => setOptimizeCoG(e.target.checked)}
              />
              <span>🎯 무게중심(CoG) 밸런싱 배치</span>
            </label>
          </div>
        </div>

        {/* 적재 전략: 작업 편의성 우선(기본값) vs 균등 밸런스 우선(선택) 배너 */}
        <div
          style={{
            marginBottom: '12px',
            padding: '12px 14px',
            borderRadius: '10px',
            background:
              stuffingStrategy === 'convenience'
                ? 'rgba(245, 158, 11, 0.12)'
                : 'rgba(99, 102, 241, 0.12)',
            border:
              stuffingStrategy === 'convenience'
                ? '1px solid rgba(245, 158, 11, 0.45)'
                : '1px solid rgba(99, 102, 241, 0.45)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          <div className="cbm-floor-banner-text">
            {stuffingStrategy === 'convenience' ? (
              <>
                <div style={{ fontWeight: 700, color: '#fbbf24', fontSize: '0.88rem' }}>
                  🚜 [작업 편의성 우선 적용 중] 품목별 전용 컨테이너 몰아넣기 & 지게차 동선 단순화
                </div>
                <div style={{ color: '#e2e8f0', marginTop: '3px' }}>
                  단일 품목(SKU)으로 1대를 꽉 채울 수 있는 물량은 다른 품목을 섞지 않고{' '}
                  <strong style={{ color: '#fde047' }}>
                    {simResult.containerResult.containers
                      .filter((c) => c.stuffingBadge?.type === 'dedicated_full')
                      .map(
                        (c) =>
                          `#${c.index}호기 ${c.placedPallets.length}PLT (100% 전용 완적)`
                      )
                      .join(', ') || '전용 완적 호기'}
                  </strong>
                  로 우선 완적 적재합니다. 지게차가 품목별 보관 랙을 번갈아 오가지 않고 연속 인입할 수 있으며, 도착지에서도 소팅(분류) 없이 즉시 입고/생산 라인 투입이 가능합니다. (잔여 자투리 파레트는 후속 호기에 모음 적재)
                </div>
              </>
            ) : (
              <>
                <div style={{ fontWeight: 700, color: '#a5b4fc', fontSize: '0.88rem' }}>
                  ⚖️ [균등 밸런스 우선 적용 중] 전 컨테이너 호기별 품목 & 중량 균등 분산
                </div>
                <div style={{ color: '#e2e8f0', marginTop: '3px' }}>
                  모든 컨테이너 호기에 각 품목과 총중량을 균일하게 분산(
                  {simResult.containerResult.containers
                    .map((c) => `${c.index}호기 ${c.placedPallets.length}PLT`)
                    .join(' / ')}
                  )하여 적재합니다. 여러 목적지로 컨테이너가 분할 납품되거나 호기간 중량/부피 편차를 최소화해야 할 때 유리합니다.
                </div>
              </>
            )}
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button
              type="button"
              className="cbm-btn-xs"
              style={{
                background:
                  stuffingStrategy === 'convenience' ? '#d97706' : 'rgba(15, 23, 42, 0.8)',
                borderColor: stuffingStrategy === 'convenience' ? '#f59e0b' : '#475569',
                color: stuffingStrategy === 'convenience' ? '#ffffff' : '#cbd5e1',
                padding: '7px 12px',
                fontWeight: 700,
              }}
              onClick={() => setStuffingStrategy && setStuffingStrategy('convenience')}
            >
              🚜 작업 편의성 우선 (품목별 전용 완적)
            </button>
            <button
              type="button"
              className="cbm-btn-xs"
              style={{
                background:
                  stuffingStrategy === 'balance' ? '#4f46e5' : 'rgba(15, 23, 42, 0.8)',
                borderColor: stuffingStrategy === 'balance' ? '#6366f1' : '#475569',
                color: stuffingStrategy === 'balance' ? '#ffffff' : '#cbd5e1',
                padding: '7px 12px',
                fontWeight: 700,
              }}
              onClick={() => setStuffingStrategy && setStuffingStrategy('balance')}
            >
              ⚖️ 균등 밸런스 우선 (전 호기 균등 배분)
            </button>
          </div>
        </div>

        {/* 컨테이너 바닥 채움(기본값) vs 최대한 높게 쌓아 바닥 공간 만들기(선택사항) 전환 배너 */}
        {simResult.floorSpreadInfo && (
          <div
            style={{
              marginBottom: '14px',
              padding: '12px 14px',
              borderRadius: '10px',
              background: fullFloorSpread
                ? 'rgba(16, 185, 129, 0.14)'
                : 'rgba(37, 99, 235, 0.14)',
              border: fullFloorSpread
                ? '1px solid rgba(16, 185, 129, 0.5)'
                : '1px solid rgba(59, 130, 246, 0.5)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '12px',
            }}
          >
            <div className="cbm-floor-banner-text">
              {fullFloorSpread ? (
                <>
                  <div style={{ fontWeight: 700, color: '#34d399', fontSize: '0.88rem' }}>
                    🛡️ [기본값] 빈 바닥 채움 (1단 바닥 전체 균등 배치 · 총 {simResult.summary.totalPallets}PLT) 적용 중
                  </div>
                  <div style={{ color: '#e2e8f0', marginTop: '3px' }}>
                    산출된 총 <strong>{simResult.summary.totalPallets}개 파레트</strong>를{' '}
                    <strong style={{ color: '#6ee7b7' }}>
                      {simResult.containerResult.containers
                        .map((c) => `${c.index}호기 ${c.placedPallets.length}PLT`)
                        .join(' / ')}
                    </strong>
                    로 골고루 나누고, 모든 파레트를 <strong>1단 바닥 전체(평균 적재 길이 약{' '}
                    {((simResult.floorSpreadInfo.avgSpreadUsedLenMm || 0) / 1000).toFixed(2)}m /{' '}
                    {(simResult.selectedSpec.length / 1000).toFixed(2)}m)</strong>에 끝까지 고르게 배치(+ 후미 홀수 파레트 중앙 잠금)하여 운항 중 쏠림·전도 및 추가 고정장치(쇼링) 비용을 방지합니다.
                  </div>
                </>
              ) : (
                <>
                  <div style={{ fontWeight: 700, color: '#60a5fa', fontSize: '0.88rem' }}>
                    📦 [선택사항] 최대한 높게 쌓아 바닥 공간 만들기 (2단 적재 & 앞벽 밀착 · 총 {simResult.summary.totalPallets}PLT) 적용 중
                  </div>
                  <div style={{ color: '#e2e8f0', marginTop: '3px' }}>
                    산출된 총 <strong>{simResult.summary.totalPallets}개 파레트</strong> 중 상단 적재가 가능한 파레트(
                    <strong>총 {simResult.floorSpreadInfo.compactTier2Count || 0}PLT</strong>)를{' '}
                    <strong style={{ color: '#93c5fd' }}>2단(Tier 2)으로 높게 쌓아 올리고</strong> 앞벽 쪽으로 촘촘하게 밀착 배치하여, 컨테이너 도어 쪽에{' '}
                    <strong style={{ color: '#fde047' }}>
                      호기당 평균 약 {((simResult.floorSpreadInfo.avgCompactRearClearanceMm || 0) / 1000).toFixed(2)}m ({simResult.floorSpreadInfo.avgCompactRearClearanceMm || 0}mm)의 넓은 바닥 여유 공간
                    </strong>
                    을 확보했습니다.
                  </div>
                </>
              )}
            </div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <button
                type="button"
                className="cbm-btn-xs"
                style={{
                  background: fullFloorSpread ? '#059669' : 'rgba(15, 23, 42, 0.8)',
                  borderColor: fullFloorSpread ? '#10b981' : '#475569',
                  color: fullFloorSpread ? '#ffffff' : '#cbd5e1',
                  padding: '7px 12px',
                  fontWeight: 700,
                }}
                onClick={() => setFullFloorSpread(true)}
              >
                🛡️ 빈 바닥 채우기 (기본값 · 1단 바닥 전체 배치)
              </button>
              <button
                type="button"
                className="cbm-btn-xs"
                style={{
                  background: !fullFloorSpread ? '#2563eb' : 'rgba(15, 23, 42, 0.8)',
                  borderColor: !fullFloorSpread ? '#3b82f6' : '#475569',
                  color: !fullFloorSpread ? '#ffffff' : '#cbd5e1',
                  padding: '7px 12px',
                  fontWeight: 700,
                }}
                onClick={() => setFullFloorSpread(false)}
              >
                📦 최대한 높게 쌓아 바닥 공간 만들기 (선택 · 2단/밀착)
              </button>
            </div>
          </div>
        )}

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
                      바닥 1단 {item.floorSlots}PLT (최대 {item.maxCapacity}PLT/대)
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

        {/* 최적 혼합 배차 추천 & 컨테이너 호기별 품목(SKU) 적재 명세표 */}
        <div className="cbm-fleet-sku-grid">
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
                🚛 실무 최적 배차 조합 제안 (단독 배차 vs 혼합 배차 비교)
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
              📋 컨테이너 호기별 적재 품목(SKU) 배분 명세표 ({simResult.selectedSpec.name})
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
        </div>
      </div>

      {/* 3-B: 3D Container Stuffing Visualization & 2D Floor Map with CoG */}
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
                  {c.totalWeight.toLocaleString()}kg ({c.volumeUtilization}%)
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
                1단만 ({currentContainer?.tier1Count || 0})
              </button>
              <button
                type="button"
                className={tierFilter === 'tier2' ? 'active' : ''}
                onClick={() => setTierFilter('tier2')}
              >
                2단만 ({currentContainer?.tier2Count || 0})
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
        </div>

        {/* 3D Container Canvas */}
        <ThreeViewport
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
            {isContainerPlaying ? '⏸ 일시정지' : '▶ 컨테이너 파레트 적재 순서 재생'}
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
            {/* 2D Top-Down Container Floor Layout SVG */}
            <div className="cbm-2d-floor-box">
              <div className="cbm-2d-floor-title">
                <span>
                  📐 {currentContainer.spec.name} #{currentContainer.index}호기 평면 배치도 (총{' '}
                  {currentContainer.placedPallets.length} 파레트 — 파레트 클릭 시 Step 2 상세 도면으로 이동)
                </span>
                <span>
                  <strong style={{ color: '#60a5fa' }}>■ 1100×1100</strong> |{' '}
                  <strong style={{ color: '#f59e0b' }}>■ 1200×1000</strong> |{' '}
                  <strong style={{ color: '#10b981' }}>■ 잔여/부분 파레트</strong> |{' '}
                  <strong style={{ color: '#facc15' }}>🎯 무게중심(CoG)</strong>
                </span>
              </div>
              <svg
                viewBox={`-120 -120 ${currentContainer.spec.length + 240} ${
                  currentContainer.spec.width + 240
                }`}
                className="cbm-container-floor-svg"
              >
                <rect
                  x={0}
                  y={0}
                  width={currentContainer.spec.length}
                  height={currentContainer.spec.width}
                  fill="#0f172a"
                  stroke="#38bdf8"
                  strokeWidth={45}
                  rx={30}
                />
                <line
                  x1={currentContainer.spec.length / 2}
                  y1={0}
                  x2={currentContainer.spec.length / 2}
                  y2={currentContainer.spec.width}
                  stroke="#475569"
                  strokeWidth={22}
                  strokeDasharray="80,80"
                />
                <line
                  x1={0}
                  y1={currentContainer.spec.width / 2}
                  x2={currentContainer.spec.length}
                  y2={currentContainer.spec.width / 2}
                  stroke="#475569"
                  strokeWidth={22}
                  strokeDasharray="80,80"
                />
                <line
                  x1={currentContainer.spec.length}
                  y1={0}
                  x2={currentContainer.spec.length}
                  y2={currentContainer.spec.width}
                  stroke="#f59e0b"
                  strokeWidth={90}
                />

                {currentContainer.placedPallets.map((pp) => {
                  if (pp.tier === 2) return null;
                  const isT12 =
                    pp.pallet.width === 1200 || pp.pallet.length === 1200;
                  const fillCol = pp.pallet.isPartial
                    ? '#10b981'
                    : isT12
                    ? '#d97706'
                    : '#2563eb';

                  return (
                    <g
                      key={`slot-${pp.slotIndex}`}
                      className="cbm-svg-pallet-slot"
                      onClick={() => {
                        setSelectedPalletIdx(pp.pallet.index - 1);
                        step2Ref.current?.scrollIntoView({ behavior: 'smooth' });
                      }}
                    >
                      <rect
                        x={pp.x + 15}
                        y={pp.z + 15}
                        width={pp.length - 30}
                        height={pp.width - 30}
                        fill={fillCol}
                        fillOpacity={0.86}
                        stroke="#f8fafc"
                        strokeWidth={24}
                        rx={25}
                      />
                      <text
                        x={pp.x + pp.length / 2}
                        y={pp.z + pp.width / 2 - 190}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        fill="#ffffff"
                        fontSize="185"
                        fontWeight="bold"
                      >
                        P#{pp.pallet.index} ({pp.pallet.primaryCargoName?.split(' ')[0]})
                      </text>
                      <text
                        x={pp.x + pp.length / 2}
                        y={pp.z + pp.width / 2 + 20}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        fill="#fef08a"
                        fontSize="185"
                        fontWeight="bold"
                      >
                        {pp.pallet.totalWeight}kg
                      </text>
                      <text
                        x={pp.x + pp.length / 2}
                        y={pp.z + pp.width / 2 + 220}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        fill="#e2e8f0"
                        fontSize="150"
                      >
                        {pp.length}×{pp.width}
                      </text>
                    </g>
                  );
                })}

                <g
                  transform={`translate(${currentContainer.cog.cogX}, ${currentContainer.cog.cogZ})`}
                >
                  <circle
                    r={230}
                    fill="#facc15"
                    fillOpacity={0.28}
                    stroke="#facc15"
                    strokeWidth={35}
                  />
                  <circle r={85} fill="#ef4444" stroke="#ffffff" strokeWidth={25} />
                  <text
                    x={0}
                    y={-310}
                    textAnchor="middle"
                    fill="#facc15"
                    fontSize="195"
                    fontWeight="bold"
                  >
                    🎯 CoG (무게중심)
                  </text>
                </g>
              </svg>
            </div>

            {/* Center of Gravity 4-Metric Dashboard */}
            <div className="cbm-cog-panel">
              <div className="cbm-cog-header">
                <strong>
                  🎯 {currentContainer.spec.name} #{currentContainer.index}호기 무게중심 (Center of Gravity) 및 중량 밸런스
                </strong>
                <span className="cbm-cog-status-badge">
                  🟢 {currentContainer.cog.statusText}
                </span>
              </div>

              <div className="cbm-cog-metrics-grid">
                <div className="cbm-cog-metric">
                  <span>전후(길이) 무게중심 (X축)</span>
                  <strong>
                    {(currentContainer.cog.cogX / 1000).toFixed(2)}m 지점 (전체 길이의{' '}
                    {currentContainer.cog.lengthRatioPct}%)
                  </strong>
                  <small>
                    안쪽 절반 {currentContainer.cog.frontRatio}% : 도어쪽 절반{' '}
                    {currentContainer.cog.rearRatio}%
                  </small>
                </div>

                <div className="cbm-cog-metric">
                  <span>좌우(폭) 무게중심 (Z축)</span>
                  <strong>
                    중심 편차 {currentContainer.cog.offsetZFromCenter}mm (폭의{' '}
                    {currentContainer.cog.widthRatioPct}%)
                  </strong>
                  <small>
                    좌측열 {currentContainer.cog.leftRatio}% : 우측열{' '}
                    {currentContainer.cog.rightRatio}% (대칭 균형)
                  </small>
                </div>

                <div className="cbm-cog-metric">
                  <span>수직(높이) 무게중심 (Y축)</span>
                  <strong>
                    바닥으로부터 {currentContainer.cog.cogY}mm (높이의{' '}
                    {currentContainer.cog.heightRatioPct}%)
                  </strong>
                  <small>컨테이너 절반 이하 저중심 유지로 전도 위험 없음</small>
                </div>

                <div className="cbm-cog-metric">
                  <span>컨테이너 호기 총 중량</span>
                  <strong>
                    {currentContainer.totalWeight.toLocaleString()} kg ({currentContainer.placedPallets.length} PLT)
                  </strong>
                  <small>
                    최대 허용 중량({currentContainer.spec.maxWeight.toLocaleString()}kg) 대비{' '}
                    {currentContainer.weightUtilization}%
                  </small>
                </div>
              </div>

              {/* 현장 지게차 도어 통과 · 쇼링(Shoring) · 에어백 정밀 진단 패널 */}
              {currentContainer.fieldDiagnostics && (
                <div
                  style={{
                    marginTop: '12px',
                    paddingTop: '12px',
                    borderTop: '1px solid rgba(148, 163, 184, 0.2)',
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
                    🚜 현장 컨테이너 적입(Stuffing) · 도어 통과 · 쇼링/에어백 작업성 정밀 진단
                  </div>
                  <div className="cbm-cog-metrics-grid">
                    <div className="cbm-cog-metric">
                      <span>🚪 컨테이너 도어 프레임 통과 여유 (유효고 {currentContainer.spec.doorHeight}mm)</span>
                      <strong
                        style={{
                          color:
                            currentContainer.fieldDiagnostics.doorStatus === 'danger'
                              ? '#f87171'
                              : currentContainer.fieldDiagnostics.doorStatus === 'warning'
                              ? '#fbbf24'
                              : '#34d399',
                        }}
                      >
                        최고 적재고 {currentContainer.fieldDiagnostics.maxStackHeightMm}mm (도어 여유{' '}
                        {currentContainer.fieldDiagnostics.doorClearanceMm >= 0 ? '+' : ''}
                        {currentContainer.fieldDiagnostics.doorClearanceMm}mm)
                      </strong>
                      <small>{currentContainer.fieldDiagnostics.doorStatusText}</small>
                    </div>

                    <div className="cbm-cog-metric">
                      <span>⚓ 도어측 잔여 길이 & 쇼링(Shoring)/래싱 진단</span>
                      <strong>
                        적재 길이 {(currentContainer.fieldDiagnostics.usedLengthMm / 1000).toFixed(2)}m / 도어 여유{' '}
                        {currentContainer.fieldDiagnostics.rearClearanceMm}mm
                      </strong>
                      <small>{currentContainer.fieldDiagnostics.shoringText}</small>
                    </div>

                    <div className="cbm-cog-metric">
                      <span>🛡️ 좌우 측면 유격 & 에어백(Dunnage Bag) 규격</span>
                      <strong>
                        2열 폭 유격 {currentContainer.fieldDiagnostics.lateralGapMm}mm (바닥 면적 활용률{' '}
                        {currentContainer.fieldDiagnostics.floorUtilizationPct}%)
                      </strong>
                      <small>{currentContainer.fieldDiagnostics.dunnageBagText}</small>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
