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

  return (
    <div className="cbm-2d-floor-box">
      <div className="cbm-2d-floor-title">
        <span>
          {currentContainer.spec.name} #{currentContainer.index}호기 평면 배치도 (총{' '}
          {currentContainer.placedPallets.length} PLT)
        </span>
        <span>
          <strong style={{ color: isLight ? '#2563eb' : '#60a5fa' }}>■ 1100×1100</strong> |{' '}
          <strong style={{ color: isLight ? '#d97706' : '#f59e0b' }}>■ 1200×1000</strong> |{' '}
          <strong style={{ color: isLight ? '#059669' : '#10b981' }}>■ 잔여/부분</strong> |{' '}
          <strong style={{ color: isLight ? '#b45309' : '#facc15' }}>CoG (무게중심)</strong>
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

        {currentContainer.placedPallets.map((pp) => {
          if (pp.tier === 2) return null;
          const isT12 = pp.pallet.width === 1200 || pp.pallet.length === 1200;
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
                {pp.pallet.width}×{pp.pallet.length}{pp.orientation && pp.orientation !== '정방향' ? ` (${pp.orientation})` : ''}
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
