import React from 'react';

/**
 * 2D 컨테이너 평면 배치도 SVG 컴포넌트
 */
export function ContainerFloorPlanSvg({
  theme = 'dark',
  currentContainer,
  setSelectedPalletIdx,
  step2Ref,
}) {
  if (!currentContainer?.spec) return null;

  const isLight = theme === 'light';
  const placedList = currentContainer.placedPallets || [];
  const tier1Pallets = placedList.filter((pp) => pp.tier === 1);
  const tier2Pallets = placedList.filter((pp) => pp.tier === 2);

  // Build dynamic legend from actual placed pallet dimensions
  const uniqueSpecs = Array.from(
    new Set(placedList.map((pp) => `${pp.pallet.width}×${pp.pallet.length}`))
  );

  // Find Tier 2 pallet stacked above a given Tier 1 slot
  const findTier2Above = (t1) =>
    tier2Pallets.find(
      (t2) => Math.abs(t2.x - t1.x) < 50 && Math.abs(t2.z - t1.z) < 50
    );

  return (
    <div className="cbm-2d-floor-box">
      <div className="cbm-2d-floor-title">
        <span>
          {currentContainer.spec.name} #{currentContainer.index}호기 평면 배치도 (총{' '}
          {placedList.length} PLT
          {tier2Pallets.length > 0
            ? ` / 1단 ${tier1Pallets.length} + 2단 ${tier2Pallets.length}`
            : ''}
          )
        </span>
        <span>
          {uniqueSpecs.map((specStr, idx) => {
            const isT12Spec = specStr.includes('1200');
            const col = isT12Spec
              ? isLight
                ? '#d97706'
                : '#f59e0b'
              : isLight
              ? '#2563eb'
              : '#60a5fa';
            return (
              <React.Fragment key={specStr}>
                <strong style={{ color: col }}>■ {specStr}</strong>
                {' | '}
              </React.Fragment>
            );
          })}
          {tier2Pallets.length > 0 && (
            <>
              <strong style={{ color: isLight ? '#7c3aed' : '#a78bfa' }}>
                ■ 2단 적재 슬롯
              </strong>{' '}
              |{' '}
            </>
          )}
          <strong style={{ color: isLight ? '#059669' : '#10b981' }}>■ 잔여/부분</strong> |{' '}
          <strong style={{ color: isLight ? '#b45309' : '#facc15' }}>CoG (무게중심)</strong>
        </span>
      </div>

      <svg
        viewBox={`-160 -200 ${currentContainer.spec.length + 320} ${
          currentContainer.spec.width + 400
        }`}
        className="cbm-container-floor-svg"
      >
        {/* 컨테이너 벽면 방향 표기 (도어에서 바라본 기준 통일: 상단 z=0 우측, 하단 z=cW 좌측) */}
        <text
          x={currentContainer.spec.length / 2}
          y={-75}
          textAnchor="middle"
          dominantBaseline="middle"
          fill={isLight ? '#475569' : '#94a3b8'}
          fontSize="155"
          fontWeight="bold"
        >
          ▲ 우측 벽면 (Right Side — 도어에서 바라본 기준)
        </text>
        <text
          x={currentContainer.spec.length / 2}
          y={currentContainer.spec.width + 95}
          textAnchor="middle"
          dominantBaseline="middle"
          fill={isLight ? '#475569' : '#94a3b8'}
          fontSize="155"
          fontWeight="bold"
        >
          ▼ 좌측 벽면 (Left Side)
        </text>
        <text
          x={120}
          y={-75}
          textAnchor="start"
          dominantBaseline="middle"
          fill={isLight ? '#0284c7' : '#38bdf8'}
          fontSize="150"
          fontWeight="bold"
        >
          ◀ 안쪽 벽면 (Front Wall)
        </text>
        <text
          x={currentContainer.spec.length - 120}
          y={-75}
          textAnchor="end"
          dominantBaseline="middle"
          fill="#f59e0b"
          fontSize="150"
          fontWeight="bold"
        >
          문쪽 (Door Side) ▶
        </text>

        <rect
          x={0}
          y={0}
          width={currentContainer.spec.length}
          height={currentContainer.spec.width}
          fill={isLight ? '#f8fafc' : '#0f172a'}
          stroke={isLight ? '#0284c7' : '#38bdf8'}
          strokeWidth={45}
          rx={30}
        />
        <line
          x1={currentContainer.spec.length / 2}
          y1={0}
          x2={currentContainer.spec.length / 2}
          y2={currentContainer.spec.width}
          stroke={isLight ? '#cbd5e1' : '#475569'}
          strokeWidth={22}
          strokeDasharray="80,80"
        />
        <line
          x1={0}
          y1={currentContainer.spec.width / 2}
          x2={currentContainer.spec.length}
          y2={currentContainer.spec.width / 2}
          stroke={isLight ? '#cbd5e1' : '#475569'}
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

        {tier1Pallets.map((pp) => {
          const topPallet = findTier2Above(pp);
          const isT12 = pp.pallet.width === 1200 || pp.pallet.length === 1200;
          const fillCol = pp.pallet.isPartial
            ? '#10b981'
            : isT12
            ? '#d97706'
            : '#2563eb';
          const combinedWeight =
            pp.pallet.totalWeight + (topPallet ? topPallet.pallet.totalWeight : 0);

          return (
            <g
              key={`slot-${pp.slotIndex}`}
              className="cbm-svg-pallet-slot"
              onClick={() => {
                if (setSelectedPalletIdx) {
                  setSelectedPalletIdx(pp.pallet.index - 1);
                }
                step2Ref?.current?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              <rect
                x={pp.x + 15}
                y={pp.z + 15}
                width={pp.length - 30}
                height={pp.width - 30}
                fill={fillCol}
                fillOpacity={0.86}
                stroke={topPallet ? '#a78bfa' : '#f8fafc'}
                strokeWidth={topPallet ? 34 : 24}
                rx={25}
              />
              {topPallet && (
                <rect
                  x={pp.x + 42}
                  y={pp.z + 42}
                  width={pp.length - 84}
                  height={pp.width - 84}
                  fill="none"
                  stroke="#ddd6fe"
                  strokeWidth={14}
                  strokeDasharray="45,25"
                  rx={18}
                />
              )}
              <text
                x={pp.x + pp.length / 2}
                y={pp.z + pp.width / 2 - 190}
                textAnchor="middle"
                dominantBaseline="middle"
                fill="#ffffff"
                fontSize={topPallet ? '160' : '185'}
                fontWeight="bold"
              >
                {topPallet
                  ? `1단:P#${pp.pallet.index} / 2단:P#${topPallet.pallet.index}`
                  : `P#${pp.pallet.index} (${pp.pallet.primaryCargoName?.split(' ')[0]})`}
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
                {topPallet
                  ? `합 ${combinedWeight}kg (${pp.pallet.totalWeight}+${topPallet.pallet.totalWeight})`
                  : `${pp.pallet.totalWeight}kg`}
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
                {pp.orientation && pp.orientation !== '정방향' ? ` (${pp.orientation})` : ''}
              </text>
            </g>
          );
        })}

        {/* 문쪽 미완성 열 측면 블로킹 표기 (파레트 양옆) */}
        {currentContainer.placedPallets.map((pp) => {
          if (pp.tier === 2 || !pp.isSingleIncompleteCol) return null;
          const leftGap = pp.leftGapMm || Math.floor((currentContainer.spec.width - pp.width) / 2);
          const rightGap = pp.rightGapMm || (currentContainer.spec.width - (pp.z + pp.width));
          return (
            <g key={`side-block-${pp.slotIndex}`}>
              <rect
                x={pp.x + 15}
                y={15}
                width={pp.length - 30}
                height={Math.max(10, pp.z - 30)}
                fill="rgba(245, 158, 11, 0.22)"
                stroke="#f59e0b"
                strokeWidth={18}
                strokeDasharray="40,20"
                rx={15}
              />
              <text
                x={pp.x + pp.length / 2}
                y={pp.z / 2}
                textAnchor="middle"
                dominantBaseline="middle"
                fill="#fbbf24"
                fontSize="140"
                fontWeight="bold"
              >
                측면 블로킹 ({leftGap}mm)
              </text>
              <rect
                x={pp.x + 15}
                y={pp.z + pp.width + 15}
                width={pp.length - 30}
                height={Math.max(10, currentContainer.spec.width - (pp.z + pp.width) - 30)}
                fill="rgba(245, 158, 11, 0.22)"
                stroke="#f59e0b"
                strokeWidth={18}
                strokeDasharray="40,20"
                rx={15}
              />
              <text
                x={pp.x + pp.length / 2}
                y={pp.z + pp.width + (currentContainer.spec.width - (pp.z + pp.width)) / 2}
                textAnchor="middle"
                dominantBaseline="middle"
                fill="#fbbf24"
                fontSize="140"
                fontWeight="bold"
              >
                측면 블로킹 ({rightGap}mm)
              </text>
            </g>
          );
        })}

        {currentContainer.cog && (
          <>
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
          </>
        )}
      </svg>
    </div>
  );
}
