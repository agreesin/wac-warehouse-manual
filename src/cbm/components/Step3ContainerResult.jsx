import React, { useState } from 'react';
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
            <span className="cbm-ribbon-label">🚢 컨테이너:</span>
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
            <span className="cbm-ribbon-label">🚜 적재 전략:</span>
            <div className="cbm-ribbon-btn-group">
              <button
                type="button"
                className={`cbm-ribbon-btn ${
                  stuffingStrategy === 'convenience' ? 'active amber' : ''
                }`}
                onClick={() => setStuffingStrategy && setStuffingStrategy('convenience')}
                title="단일 품목으로 채울 수 있는 호기는 100% 전용 완적하여 지게차 동선 단순화"
              >
                🚜 작업 편의성 우선
              </button>
              <button
                type="button"
                className={`cbm-ribbon-btn ${
                  stuffingStrategy === 'balance' ? 'active indigo' : ''
                }`}
                onClick={() => setStuffingStrategy && setStuffingStrategy('balance')}
                title="모든 호기에 품목과 무게를 골고루 분산"
              >
                ⚖️ 균등 밸런스 우선
              </button>
            </div>
          </div>

          {/* 3) 바닥 배치 선택 */}
          <div className="cbm-ribbon-group">
            <span className="cbm-ribbon-label">🛡️ 바닥 배치:</span>
            <div className="cbm-ribbon-btn-group">
              <button
                type="button"
                className={`cbm-ribbon-btn ${fullFloorSpread ? 'active emerald' : ''}`}
                onClick={() => setFullFloorSpread(true)}
                title="1단적(평적)으로 바닥 전체에 파레트를 균등 간격으로 끝까지 배치하여 운송 중 쏠림 방지"
              >
                🛡️ 빈 바닥 채움 (1단적 전체)
              </button>
              <button
                type="button"
                className={`cbm-ribbon-btn ${!fullFloorSpread ? 'active' : ''}`}
                onClick={() => setFullFloorSpread(false)}
                title="상단 적재 가능 파레트를 2단적으로 높게 쌓아 도어 쪽에 넓은 바닥 여유 공간 확보"
              >
                📦 바닥 공간 확보 (2단적 밀착)
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
              <span style={{ fontSize: '0.78rem' }}>🎯 CoG 밸런싱</span>
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
              <h4>🚜 적재 전략 실무 가이드</h4>
              <div>
                • <strong>작업 편의성 우선 (권장):</strong> 단일 품목으로 1대를 채울 수 있는 물량은 1호기를 100% 전용 완적(FCL)하여 지게차 왕복 동선을 줄이고 도착지 소팅(분류) 작업을 생략합니다. (2단적 진행 시에도 1호기에 2단적을 집중 완적하고 2호기는 안전한 1단적 평적으로 끝냅니다)
                <br />
                • <strong>균등 밸런스 우선:</strong> 전 호기에 각 품목과 중량을 균등하게 나누어 실어 호기간 중량/부피 편차를 최소화합니다.
              </div>
            </div>
            <div className="cbm-guide-card">
              <h4>🛡️ 바닥 배치 방식 실무 가이드</h4>
              <div>
                • <strong>빈 바닥 채움 (기본값):</strong> 모든 파레트를 1단적(평적)으로 바닥 전체에 고르게 펼쳐 배치하여 선박 롤링·피칭 시 전도를 원천 차단하고 추가 고정 쇼링목 비용을 절감합니다.
                <br />
                • <strong>바닥 공간 확보 (선택):</strong> 상단 적재 가능 파레트를 2단적으로 높게 쌓고 앞벽 쪽으로 밀착하여 도어 쪽에 넓은 바닥 여유 공간을 만듭니다.
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

          {/* 도어(Door) 쪽 저단 파레트 낙하 방지 쇼링 알림 바 */}
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
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '1rem' }}>⚠️</span>
                <strong>
                  {currentContainer.fieldDiagnostics.doorShoringGuide.title}:
                </strong>
                <span style={{ color: '#fde68a' }}>
                  도어 개방 시 쏟아짐(Door Spill) 방지 ➔ <strong>라싱 벨트 X자 결속 또는 카고 안전망 쇼링 필수</strong>
                </span>
              </div>
              <span style={{ fontSize: '0.72rem', color: '#cbd5e1' }}>
                (앞 화물과의 단차 -{currentContainer.fieldDiagnostics.doorShoringGuide.heightDiffMm}mm)
              </span>
            </div>
          )}
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
                  {currentContainer.placedPallets.length} 파레트 — 클릭 시 Step 2 이동)
                </span>
                <span>
                  <strong style={{ color: '#60a5fa' }}>■ 1100×1100</strong> |{' '}
                  <strong style={{ color: '#f59e0b' }}>■ 1200×1000</strong> |{' '}
                  <strong style={{ color: '#10b981' }}>■ 잔여/부분</strong> |{' '}
                  <strong style={{ color: '#facc15' }}>🎯 CoG</strong>
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
                        fill="#cbd5e1"
                        fontSize="155"
                      >
                        {pp.pallet.width}×{pp.pallet.length}
                      </text>
                    </g>
                  );
                })}

                <circle
                  cx={currentContainer.cog.cogX}
                  cy={currentContainer.cog.cogZ}
                  r={140}
                  fill="#facc15"
                  stroke="#ffffff"
                  strokeWidth={28}
                />
                <circle
                  cx={currentContainer.cog.cogX}
                  cy={currentContainer.cog.cogZ}
                  r={220}
                  fill="none"
                  stroke="#facc15"
                  strokeWidth={14}
                  strokeDasharray="40,30"
                />
                <text
                  x={currentContainer.cog.cogX}
                  y={currentContainer.cog.cogZ - 200}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill="#facc15"
                  fontSize="210"
                  fontWeight="bold"
                >
                  CoG ({currentContainer.cog.lengthRatioPct}%, {currentContainer.cog.widthRatioPct}%)
                </text>
              </svg>
            </div>

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
                  {currentContainer.cog.status === 'SAFE'
                    ? '컨테이너 전후 및 좌우 대칭 하중이 안전 범위 내에 정밀하게 유지되어 있습니다.'
                    : '전후 또는 좌우 중량 편차가 감지되었습니다. 지게차 적입 시 하중 분산 상태를 확인하세요.'}
                </p>
              </div>

              <div className="cbm-cog-metrics-grid">
                <div className="cbm-cog-metric">
                  <span>좌우 밸런스 (Left vs Right)</span>
                  <strong>
                    좌 {currentContainer.cog.leftRatio}% : 우 {currentContainer.cog.rightRatio}%
                  </strong>
                  <small>이상 기준 50:50 (안전 범위 ±6% 이내)</small>
                </div>
                <div className="cbm-cog-metric">
                  <span>전후 밸런스 (Front vs Rear)</span>
                  <strong>
                    앞(벽) {currentContainer.cog.frontRatio}% : 뒤(문){' '}
                    {currentContainer.cog.rearRatio}%
                  </strong>
                  <small>
                    전방(헤드) 측 {currentContainer.cog.lengthRatioPct}% 지점 배치
                  </small>
                </div>
                <div className="cbm-cog-metric">
                  <span>단적(段積) 분석</span>
                  <strong>
                    1단적(바닥) {currentContainer.tier1Count}PLT / 2단적(상단){' '}
                    {currentContainer.tier2Count}PLT
                  </strong>
                  <small>
                    총 {currentContainer.placedPallets.length}개 파레트 (
                    {currentContainer.boxCount.toLocaleString()} 박스)
                  </small>
                </div>
              </div>

              {/* Field Operations & Shoring Diagnostics */}
              {currentContainer.fieldDiagnostics && (
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
                      <span>🚪 도어 프레임 통과 여유 (유효고 {currentContainer.spec.doorHeight}mm)</span>
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
                        최고고 {currentContainer.fieldDiagnostics.maxStackHeightMm}mm (여유{' '}
                        {currentContainer.fieldDiagnostics.doorClearanceMm >= 0 ? '+' : ''}
                        {currentContainer.fieldDiagnostics.doorClearanceMm}mm)
                      </strong>
                      <small>{currentContainer.fieldDiagnostics.doorStatusText}</small>
                    </div>

                    <div className="cbm-cog-metric">
                      <span>⚓ 도어측 잔여 길이 & 쇼링 진단</span>
                      <strong>
                        적재길이 {(currentContainer.fieldDiagnostics.usedLengthMm / 1000).toFixed(2)}m / 잔여{' '}
                        {currentContainer.fieldDiagnostics.rearClearanceMm}mm
                      </strong>
                      <small>{currentContainer.fieldDiagnostics.shoringText}</small>
                    </div>

                    <div className="cbm-cog-metric">
                      <span>🛡️ 측면 유격 & 에어백 규격</span>
                      <strong>
                        폭 유격 {currentContainer.fieldDiagnostics.lateralGapMm}mm (바닥 효율{' '}
                        {currentContainer.fieldDiagnostics.floorUtilizationPct}%)
                      </strong>
                      <small>{currentContainer.fieldDiagnostics.dunnageBagText}</small>
                    </div>
                  </div>

                  {/* 도어측 저단 파레트 쇼링 시공 실무 가이드 */}
                  {currentContainer.fieldDiagnostics.doorShoringGuide && (
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
                          {currentContainer.fieldDiagnostics.doorShoringGuide.title}
                        </strong>
                      </div>
                      <p style={{ margin: '0 0 6px', fontSize: '0.79rem', color: '#fef3c7', lineHeight: 1.45 }}>
                        {currentContainer.fieldDiagnostics.doorShoringGuide.summary}
                      </p>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.76rem', color: '#cbd5e1' }}>
                        <div>• {currentContainer.fieldDiagnostics.doorShoringGuide.action1}</div>
                        <div>• {currentContainer.fieldDiagnostics.doorShoringGuide.action2}</div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 3-B: 컨테이너 호기별 품목(SKU) 적재 명세표 & 최적 복합 배차 제안 */}
      <div className="cbm-card" style={{ marginTop: '16px' }}>
        <div className="cbm-card-header">
          <h2>3-B. 컨테이너 호기별 적재 품목(SKU) 배분 명세표 & 실무 최적 배차 제안</h2>
          <span className="cbm-badge">출고 및 선적 검수용</span>
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
              📋 호기별 적재 품목(SKU) 명세표 ({simResult.selectedSpec.name})
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
        </div>
      </div>

      {/* 3-C: 컨테이너 종류별 규격 및 적재 가능량 상세 비교 */}
      <div className="cbm-card" style={{ marginTop: '16px' }}>
        <div className="cbm-card-header">
          <h2>3-C. 컨테이너 종류별 적재 가능 파레트 수 & 규격 상세 비교</h2>
          <span className="cbm-badge">카드를 클릭하면 해당 규격으로 즉시 전환됩니다</span>
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
    </section>
  );
}
