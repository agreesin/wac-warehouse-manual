import React from 'react';

/**
 * 2D 평면 배치도 SVG 컴포넌트 (흑백 인쇄 전용)
 */
export function FloorPlanPrintSvg({ container }) {
  const spec = container.spec;
  const cLen = Number(spec.length) || 12032;
  const cWid = Number(spec.width) || 2352;
  const doorGuide = container.fieldDiagnostics?.doorShoringGuide;
  const lowPalletSet = new Set(doorGuide?.lowPalletLabels || []);
  const rearClearanceMm =
    container.fieldDiagnostics?.rearClearanceMm ?? Math.max(0, cLen - 10600);

  // X 좌표 기준 정렬된 1단 파레트에 순서(1, 2, 3...) 부여
  const floorPallets = [...container.placedPallets]
    .filter((pp) => pp.tier === 1)
    .sort((a, b) => {
      if (a.x !== b.x) return a.x - b.x;
      return a.z - b.z;
    });

  const palletSeqMap = new Map();
  floorPallets.forEach((pp, idx) => {
    palletSeqMap.set(pp.pallet.id, idx + 1);
  });

  // 마지막 열 X 좌표 및 에어백 위치 산출
  const maxOccupiedX = floorPallets.reduce((max, pp) => Math.max(max, pp.x + pp.length), 0);
  const colGaps = container.fieldDiagnostics?.colGapDetails || [];

  // 측면 유격 > 150mm 인 열들을 연속된 구간(Zone)으로 묶어 깨끗하게 에어백 밴드로 표시 (도어 열은 에어백 금지)
  const wideCols = colGaps.filter(
    (cg) => cg.gap > 150 && !cg.isSingle && !cg.isDoorCol && cg.pallets.length >= 2
  );
  const airbagBands = [];
  let curBand = null;
  for (const cg of wideCols) {
    const p1 = cg.pallets[0];
    const p2 = cg.pallets[1];
    const midZ = (p1.z + p1.width + p2.z) / 2;
    if (!curBand) {
      curBand = {
        minCol: cg.colIndex,
        maxCol: cg.colIndex,
        gap: cg.gap,
        minX: p1.x + 80,
        maxX: p1.x + cg.colLen - 80,
        midZ,
      };
      continue;
    }
    if (curBand.maxCol + 1 === cg.colIndex && Math.abs(curBand.gap - cg.gap) <= 20) {
      curBand.maxCol = cg.colIndex;
      curBand.maxX = p1.x + cg.colLen - 80;
    } else {
      airbagBands.push(curBand);
      curBand = {
        minCol: cg.colIndex,
        maxCol: cg.colIndex,
        gap: cg.gap,
        minX: p1.x + 80,
        maxX: p1.x + cg.colLen - 80,
        midZ,
      };
    }
  }
  if (curBand) airbagBands.push(curBand);

  return (
    <div
      style={{
        width: '100%',
        border: '1.5px solid #000',
        padding: '2px 5px',
        background: '#fff',
        boxSizing: 'border-box',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '2px',
          fontSize: '11.5px',
          fontWeight: 'bold',
        }}
      >
        <span>
          [ 평면 적재 배치도 ] — 왼쪽: 앞벽(Front) / 오른쪽: 도어(Door) / 위쪽: 우측(Right) / 아래쪽: 좌측(Left)
        </span>
        <span>
          범례: 일반[ □ ] | 단차 경고 대상[ 빗금/// ] | 각재 펜스[ 굵은선━━ ] | 문 앞 빈 공간({rearClearanceMm.toLocaleString()}mm)
        </span>
      </div>

      <svg
        viewBox={`-80 -80 ${cLen + 160} ${cWid + 160}`}
        style={{
          width: '100%',
          height: 'auto',
          maxHeight: '92px',
          display: 'block',
          background: '#fff',
        }}
      >
        <defs>
          {/* 낮은 파레트(단차 경고) 빗금 패턴 */}
          <pattern
            id="diag-hatch-bw"
            width="300"
            height="300"
            patternTransform="rotate(45 0 0)"
            patternUnits="userSpaceOnUse"
          >
            <line x1="0" y1="0" x2="0" y2="300" stroke="#000" strokeWidth="35" />
          </pattern>
        </defs>

        {/* 컨테이너 외곽선 */}
        <rect
          x={0}
          y={0}
          width={cLen}
          height={cWid}
          fill="#ffffff"
          stroke="#000000"
          strokeWidth="40"
          rx="20"
        />

        {/* 벽면 안내 라벨 (화물과 겹치지 않도록 외곽 테두리선 정렬) */}
        <text
          x={40}
          y={cWid / 2}
          textAnchor="middle"
          dominantBaseline="middle"
          fill="#444444"
          fontSize="180"
          fontWeight="bold"
          transform={`rotate(-90 40 ${cWid / 2})`}
        >
          [ 앞벽 FRONT ]
        </text>
        <text
          x={cLen - 40}
          y={cWid / 2}
          textAnchor="middle"
          dominantBaseline="middle"
          fill="#444444"
          fontSize="180"
          fontWeight="bold"
          transform={`rotate(90 ${cLen - 40} ${cWid / 2})`}
        >
          [ 도어 DOOR ]
        </text>
        <text
          x={cLen / 2}
          y={100}
          textAnchor="middle"
          dominantBaseline="middle"
          fill="#666666"
          fontSize="150"
          fontWeight="bold"
        >
          ▲ 우측 벽면 (Right)
        </text>
        <text
          x={cLen / 2}
          y={cWid - 100}
          textAnchor="middle"
          dominantBaseline="middle"
          fill="#666666"
          fontSize="150"
          fontWeight="bold"
        >
          ▼ 좌측 벽면 (Left)
        </text>

        {/* 파레트 배치 슬롯 */}
        {floorPallets.map((pp) => {
          const seq = palletSeqMap.get(pp.pallet.id) || 1;
          const pLabel = `P#${pp.pallet.index || pp.palletIndex}`;
          const isLow = lowPalletSet.has(pLabel);
          const topCand = container.placedPallets.find(
            (top) => top.tier === 2 && top.stackedOn === pp.pallet.id
          );

          return (
            <g key={pp.slotIndex || pp.pallet.id}>
              {/* 파레트 박스 */}
              <rect
                x={pp.x + 15}
                y={pp.z + 15}
                width={pp.length - 30}
                height={pp.width - 30}
                fill={isLow ? 'url(#diag-hatch-bw)' : '#ffffff'}
                stroke="#000000"
                strokeWidth="24"
                rx="15"
              />
              {/* 빗금 배경 위 텍스트 가독성을 위한 흰색 반투명 바탕 */}
              <rect
                x={pp.x + pp.length / 2 - 280}
                y={pp.z + pp.width / 2 - 230}
                width={560}
                height={460}
                fill="#ffffff"
                fillOpacity={0.95}
                rx="10"
              />
              {/* 적재 순서 큰 숫자 */}
              <text
                x={pp.x + pp.length / 2}
                y={pp.z + pp.width / 2 - 110}
                textAnchor="middle"
                dominantBaseline="middle"
                fill="#000000"
                fontSize="290"
                fontWeight="900"
              >
                {seq}
              </text>
              {/* 파레트 번호 & 품목명 */}
              <text
                x={pp.x + pp.length / 2}
                y={pp.z + pp.width / 2 + 50}
                textAnchor="middle"
                dominantBaseline="middle"
                fill="#000000"
                fontSize="170"
                fontWeight="bold"
              >
                {topCand ? `하:${pLabel} / 상:P#${topCand.pallet.index}` : pLabel}
              </text>
              {/* 높이 치수 및 방향 */}
              <text
                x={pp.x + pp.length / 2}
                y={pp.z + pp.width / 2 + 180}
                textAnchor="middle"
                dominantBaseline="middle"
                fill="#222222"
                fontSize="145"
                fontWeight="600"
              >
                {pp.pallet.totalHeight}mm{pp.length !== pp.width ? ` (${pp.length}L)` : ''}
                {isLow ? ' (!)' : ''}
              </text>
            </g>
          );
        })}

        {/* 문쪽 미완성 열 측면 블로킹 (각재 또는 세운 빈 파레트) */}
        {floorPallets.map((pp) => {
          if (!pp.isSingleIncompleteCol) return null;
          const leftGap = pp.leftGapMm || Math.floor((cWid - pp.width) / 2);
          const rightGap = pp.rightGapMm || cWid - (pp.z + pp.width);
          return (
            <g key={`print-side-block-${pp.slotIndex || pp.pallet.id}`}>
              <rect
                x={pp.x + 15}
                y={15}
                width={pp.length - 30}
                height={Math.max(10, pp.z - 30)}
                fill="none"
                stroke="#000000"
                strokeWidth="18"
                strokeDasharray="40,20"
                rx="15"
              />
              <text
                x={pp.x + pp.length / 2}
                y={pp.z / 2}
                textAnchor="middle"
                dominantBaseline="middle"
                fill="#000000"
                fontSize="140"
                fontWeight="bold"
              >
                측면 블로킹 ({leftGap}mm)
              </text>
              <rect
                x={pp.x + 15}
                y={pp.z + pp.width + 15}
                width={pp.length - 30}
                height={Math.max(10, cWid - (pp.z + pp.width) - 30)}
                fill="none"
                stroke="#000000"
                strokeWidth="18"
                strokeDasharray="40,20"
                rx="15"
              />
              <text
                x={pp.x + pp.length / 2}
                y={pp.z + pp.width + (cWid - (pp.z + pp.width)) / 2}
                textAnchor="middle"
                dominantBaseline="middle"
                fill="#000000"
                fontSize="140"
                fontWeight="bold"
              >
                측면 블로킹 ({rightGap}mm)
              </text>
            </g>
          );
        })}

        {/* 열간 측면 유격 에어백 표기 (구간별 밴드로 표시, 화물 텍스트 침범 방지) */}
        {airbagBands.map((band, bIdx) => {
          const len = band.maxX - band.minX;
          const colRangeText =
            band.minCol === band.maxCol ? `${band.minCol}열` : `${band.minCol}~${band.maxCol}열`;

          return (
            <g key={`airbag-band-${bIdx}`}>
              <rect
                x={band.minX}
                y={band.midZ - 50}
                width={len}
                height={100}
                rx={30}
                fill="#f1f5f9"
                stroke="#000000"
                strokeWidth="14"
                strokeDasharray="30,20"
              />
              <rect
                x={band.minX + len / 2 - 800}
                y={band.midZ - 42}
                width={1600}
                height={84}
                fill="#ffffff"
                stroke="#000000"
                strokeWidth="8"
                rx="15"
              />
              <text
                x={band.minX + len / 2}
                y={band.midZ}
                textAnchor="middle"
                dominantBaseline="middle"
                fill="#000000"
                fontSize="110"
                fontWeight="bold"
              >
                에어백 충진 ({colRangeText}, 유격 {band.gap}mm)
              </text>
            </g>
          );
        })}

        {/* 마지막 열 뒤 각재 펜스 및 코너포스트 버팀목 */}
        {maxOccupiedX > 0 && maxOccupiedX < cLen && (
          <g>
            {/* 문 앞 빈 공간 바탕 음영 영역 (컨테이너 내부에 정확히 위치) */}
            <rect
              x={maxOccupiedX + 40}
              y={35}
              width={cLen - maxOccupiedX - 75}
              height={cWid - 70}
              fill="#f8fafc"
              stroke="#64748b"
              strokeWidth="16"
              strokeDasharray="40,25"
              rx="10"
            />

            {/* 각재 펜스 굵은 선 */}
            <line
              x1={maxOccupiedX + 45}
              y1={40}
              x2={maxOccupiedX + 45}
              y2={cWid - 40}
              stroke="#000000"
              strokeWidth="80"
            />

            {/* 코너포스트 대각 버팀목 선 */}
            <line
              x1={maxOccupiedX + 45}
              y1={220}
              x2={cLen - 60}
              y2={90}
              stroke="#000000"
              strokeWidth="40"
              strokeDasharray="50,30"
            />
            <line
              x1={maxOccupiedX + 45}
              y1={cWid - 220}
              x2={cLen - 60}
              y2={cWid - 90}
              stroke="#000000"
              strokeWidth="40"
              strokeDasharray="50,30"
            />

            {/* 문 앞 빈 공간 텍스트 라벨 (공간 내부에 쏙 들어가도록 콤팩트 카드 배치) */}
            <g transform={`translate(${(maxOccupiedX + cLen) / 2}, ${cWid / 2})`}>
              <rect
                x={-480}
                y={-180}
                width={960}
                height={360}
                fill="#ffffff"
                fillOpacity={0.96}
                stroke="#000000"
                strokeWidth="12"
                rx="15"
              />
              <text
                x={0}
                y={-90}
                textAnchor="middle"
                dominantBaseline="middle"
                fill="#000000"
                fontSize="120"
                fontWeight="bold"
              >
                [ 각재 펜스 시공 ]
              </text>
              <text
                x={0}
                y={10}
                textAnchor="middle"
                dominantBaseline="middle"
                fill="#000000"
                fontSize="140"
                fontWeight="900"
              >
                빈 공간 {rearClearanceMm.toLocaleString()}mm
              </text>
              <text
                x={0}
                y={105}
                textAnchor="middle"
                dominantBaseline="middle"
                fill="#444444"
                fontSize="110"
                fontWeight="bold"
              >
                (대각 버팀목 / 에어백 금지)
              </text>
            </g>
          </g>
        )}
      </svg>
    </div>
  );
}
