import React, { useState } from 'react';

/**
 * 적재 순서표 생성 헬퍼:
 * 연속된 동일 품목·규격·높이 파레트를 한 줄로 묶어 A4 1장에 컴팩트하게 들어가도록 가공
 */
function buildGroupedSequenceRows(container) {
  if (!container?.placedPallets?.length) return [];

  const cWidth = Number(container.spec?.width) || 2352;
  const doorGuide = container.fieldDiagnostics?.doorShoringGuide;
  const lowPalletSet = new Set(doorGuide?.lowPalletLabels || []);

  // 1단적(Tier 1) 기준 정렬: X좌표(앞벽->도어) 오름차순, Z좌표(우측->좌측) 오름차순
  const sortedFloor = [...container.placedPallets]
    .filter((pp) => pp.tier === 1)
    .sort((a, b) => {
      if (a.x !== b.x) return a.x - b.x;
      return a.z - b.z;
    });

  // 고유 X 좌표 목록으로 열 번호(Col Index) 매핑
  const uniqueXs = Array.from(new Set(sortedFloor.map((p) => p.x))).sort((a, b) => a - b);
  const xToColIdx = new Map(uniqueXs.map((x, i) => [x, i + 1]));

  // 각 슬롯별 항목 매핑
  const rawItems = sortedFloor.map((pp, idx) => {
    const colIdx = xToColIdx.get(pp.x) || idx + 1;
    const isSingle = pp.isSingleIncompleteCol || pp.width > 1300 || container.fieldDiagnostics?.colGapDetails?.find((c) => c.colIndex === colIdx)?.isSingle;
    let sideLabel = '중앙';
    if (!isSingle) {
      sideLabel = pp.z < cWidth / 2 ? '우' : '좌';
    }

    const pLabel = `P#${pp.pallet.index || pp.palletIndex}`;
    const isLow = lowPalletSet.has(pLabel);
    const cargoName = pp.pallet.primaryCargoName?.split(' ')[0] || '화물';
    const specDesc = `${pp.pallet.width}×${pp.pallet.length}`;
    const heightMm = pp.pallet.totalHeight;
    const weightKg = pp.pallet.totalWeight;
    const isIncomplete = Boolean(
      pp.isSingleIncompleteCol ||
      (container.fieldDiagnostics?.hasDoorIncompleteCol && container.fieldDiagnostics?.doorIncompleteColInfo?.colIndex === colIdx)
    );

    // 파레트 적재 방향 (가로 / 세로 / 정방향)
    let orientation = pp.orientation || '';
    if (!orientation) {
      if (pp.length < pp.width) orientation = '가로';
      else if (pp.length > pp.width) orientation = '세로';
      else orientation = '정방향';
    }

    // 상단 2단적 화물 존재 여부 확인
    const tier2Cand = container.placedPallets.find(
      (top) => top.tier === 2 && top.stackedOn === pp.pallet.id
    );

    return {
      seq: idx + 1,
      colIdx,
      sideLabel,
      pLabel,
      cargoName,
      specDesc,
      orientation,
      heightMm,
      weightKg,
      isLow,
      isIncomplete,
      tier2Cand,
    };
  });

  // 연속된 동일 품목·규격·방향·높이·단차여부 묶기
  const grouped = [];
  let currentGroup = null;

  for (const item of rawItems) {
    if (!currentGroup) {
      currentGroup = {
        items: [item],
        cargoName: item.cargoName,
        specDesc: item.specDesc,
        orientation: item.orientation,
        heightMm: item.heightMm,
        isLow: item.isLow,
        isIncomplete: item.isIncomplete,
        hasTier2: Boolean(item.tier2Cand),
      };
      continue;
    }

    const isMatch =
      currentGroup.cargoName === item.cargoName &&
      currentGroup.specDesc === item.specDesc &&
      currentGroup.orientation === item.orientation &&
      currentGroup.heightMm === item.heightMm &&
      currentGroup.isLow === item.isLow &&
      currentGroup.isIncomplete === item.isIncomplete &&
      currentGroup.hasTier2 === Boolean(item.tier2Cand);

    if (isMatch) {
      currentGroup.items.push(item);
    } else {
      grouped.push(currentGroup);
      currentGroup = {
        items: [item],
        cargoName: item.cargoName,
        specDesc: item.specDesc,
        orientation: item.orientation,
        heightMm: item.heightMm,
        isLow: item.isLow,
        isIncomplete: item.isIncomplete,
        hasTier2: Boolean(item.tier2Cand),
      };
    }
  }
  if (currentGroup) grouped.push(currentGroup);

  // 테이블 표시용 행 객체 변환
  const rows = grouped.map((g) => {
    const first = g.items[0];
    const last = g.items[g.items.length - 1];
    const count = g.items.length;

    const seqText = count === 1 ? `${first.seq}` : `${first.seq} ~ ${last.seq}`;
    const colMin = first.colIdx;
    const colMax = last.colIdx;
    const isCenter = first.sideLabel === '중앙';
    const colText =
      colMin === colMax
        ? count === 1
          ? `${colMin}열 (${first.sideLabel})`
          : isCenter
          ? `${colMin}열 (중앙)`
          : `${colMin}열 (좌/우)`
        : isCenter
        ? `${colMin}~${colMax}열 (중앙)`
        : `${colMin}~${colMax}열 (좌/우)`;

    const pLabels =
      count === 1
        ? first.pLabel
        : count <= 4
        ? g.items.map((it) => it.pLabel).join(', ')
        : `${first.pLabel} ~ ${last.pLabel} (총 ${count}개)`;

    const avgWeight = Math.round(g.items.reduce((s, it) => s + it.weightKg, 0) / count);
    const orientTag =
      g.orientation && g.orientation !== '정방향' ? ` [${g.orientation}]` : '';

    let itemDesc = `${g.cargoName} (${g.specDesc})${orientTag}${g.hasTier2 ? ' [2단적]' : ''}`;
    if (g.isIncomplete) {
      itemDesc += ' — [문쪽 미완성 열] (폭 중앙 적재, 양옆 각재/빈파레트 측면 블로킹, 에어백 금지)';
    }

    return {
      seqText,
      colText,
      pLabels,
      itemDesc,
      heightText: `${g.heightMm.toLocaleString()} mm${g.isLow ? ' (단차 주의)' : ''}`,
      weightText: count > 1 ? `${avgWeight} kg (개당)` : `${first.weightKg} kg`,
      isLow: g.isLow,
      isClosing: false,
    };
  });

  // 마지막 마감 줄 추가
  rows.push({
    seqText: '마감',
    colText: '문 앞 공간',
    pLabels: '-',
    itemDesc: '마감: 각재 펜스 세우고 코너포스트 버팀목 시공 (문 앞 빈 공간 밀림 차단)',
    heightText: '-',
    weightText: '-',
    isLow: false,
    isClosing: true,
  });

  return rows;
}

/**
 * 2D 평면 배치도 SVG 컴포넌트 (흑백 인쇄 전용)
 */
function FloorPlanPrintSvg({ container }) {
  const spec = container.spec;
  const cLen = Number(spec.length) || 12032;
  const cWid = Number(spec.width) || 2352;
  const doorGuide = container.fieldDiagnostics?.doorShoringGuide;
  const lowPalletSet = new Set(doorGuide?.lowPalletLabels || []);
  const rearClearanceMm = container.fieldDiagnostics?.rearClearanceMm ?? Math.max(0, cLen - 10600);

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
  const wideCols = colGaps.filter((cg) => cg.gap > 150 && !cg.isSingle && !cg.isDoorCol && cg.pallets.length >= 2);
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
    <div style={{ width: '100%', border: '1.5px solid #000', padding: '5px 8px', background: '#fff', boxSizing: 'border-box' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3px', fontSize: '11px', fontWeight: 'bold' }}>
        <span>[ 평면 적재 배치도 ] — 왼쪽: 앞벽(Front) / 오른쪽: 도어(Door) / 위쪽: 우측(Right) / 아래쪽: 좌측(Left)</span>
        <span>범례: 일반[ □ ] | 단차 경고 대상[ 빗금/// ] | 각재 펜스[ 굵은선━━ ] | 문 앞 빈 공간({rearClearanceMm.toLocaleString()}mm)</span>
      </div>

      <svg
        viewBox={`-80 -80 ${cLen + 160} ${cWid + 160}`}
        style={{ width: '100%', height: 'auto', maxHeight: '128px', display: 'block', background: '#fff' }}
      >
        <defs>
          {/* 낮은 파레트(단차 경고) 빗금 패턴 */}
          <pattern id="diag-hatch-bw" width="300" height="300" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
            <line x1="0" y1="0" x2="0" y2="300" stroke="#000" strokeWidth="35" />
          </pattern>
        </defs>

        {/* 컨테이너 외곽선 */}
        <rect x={0} y={0} width={cLen} height={cWid} fill="#ffffff" stroke="#000000" strokeWidth="40" rx="20" />

        {/* 벽면 안내 라벨 */}
        <text x={80} y={cWid / 2} textAnchor="start" dominantBaseline="middle" fill="#000" fontSize="220" fontWeight="bold">
          [ 앞벽 / Front ]
        </text>
        <text x={cLen - 80} y={cWid / 2} textAnchor="end" dominantBaseline="middle" fill="#000" fontSize="220" fontWeight="bold">
          [ 도어 / Door ]
        </text>
        <text x={cLen / 2} y={120} textAnchor="middle" dominantBaseline="middle" fill="#666" fontSize="180">
          ▲ 우측 벽면 (우)
        </text>
        <text x={cLen / 2} y={cWid - 120} textAnchor="middle" dominantBaseline="middle" fill="#666" fontSize="180">
          ▼ 좌측 벽면 (좌)
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
                {pp.pallet.totalHeight}mm{pp.orientation && pp.orientation !== '정방향' ? ` (${pp.orientation})` : ''}{isLow ? ' (!)' : ''}
              </text>
            </g>
          );
        })}

        {/* 문쪽 미완성 열 측면 블로킹 (각재 또는 세운 빈 파레트) */}
        {floorPallets.map((pp) => {
          if (!pp.isSingleIncompleteCol) return null;
          const leftGap = pp.leftGapMm || Math.floor((cWid - pp.width) / 2);
          const rightGap = pp.rightGapMm || (cWid - (pp.z + pp.width));
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

        {/* 열간 측면 유격 에어백 표기 (구간별 밴드로 표시) */}
        {airbagBands.map((band, bIdx) => {
          const len = band.maxX - band.minX;
          const colRangeText =
            band.minCol === band.maxCol
              ? `${band.minCol}열`
              : `${band.minCol}~${band.maxCol}열`;

          return (
            <g key={`airbag-band-${bIdx}`}>
              <rect
                x={band.minX}
                y={band.midZ - 75}
                width={len}
                height={150}
                rx={45}
                fill="#ffffff"
                stroke="#000000"
                strokeWidth="18"
                strokeDasharray="40,20"
              />
              <text
                x={band.minX + len / 2}
                y={band.midZ}
                textAnchor="middle"
                dominantBaseline="middle"
                fill="#000000"
                fontSize="150"
                fontWeight="bold"
              >
                에어백 충진 구역 ({colRangeText} 중앙 틈 {band.gap}mm)
              </text>
            </g>
          );
        })}

        {/* 문쪽 미완성 열 측면 블로킹 (각재 또는 세운 빈 파레트) */}
        {floorPallets.map((pp) => {
          if (!pp.isSingleIncompleteCol) return null;
          const leftGap = pp.leftGapMm || Math.floor((cWid - pp.width) / 2);
          const rightGap = pp.rightGapMm || (cWid - (pp.z + pp.width));
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

        {/* 마지막 열 뒤 각재 펜스 및 코너포스트 버팀목 */}
        {maxOccupiedX > 0 && maxOccupiedX < cLen && (
          <g>
            {/* 각재 펜스 굵은 선 */}
            <line
              x1={maxOccupiedX + 40}
              y1={40}
              x2={maxOccupiedX + 40}
              y2={cWid - 40}
              stroke="#000000"
              strokeWidth="90"
            />
            <text
              x={maxOccupiedX + 160}
              y={cWid / 2 - 350}
              textAnchor="start"
              dominantBaseline="middle"
              fill="#000000"
              fontSize="190"
              fontWeight="bold"
            >
              [ 각재 펜스 시공 위치 ]
            </text>

            {/* 코너포스트 대각 버팀목 선 */}
            <line
              x1={maxOccupiedX + 40}
              y1={180}
              x2={cLen - 40}
              y2={80}
              stroke="#000000"
              strokeWidth="45"
              strokeDasharray="50,30"
            />
            <line
              x1={maxOccupiedX + 40}
              y1={cWid - 180}
              x2={cLen - 40}
              y2={cWid - 80}
              stroke="#000000"
              strokeWidth="45"
              strokeDasharray="50,30"
            />
            <text
              x={(maxOccupiedX + cLen) / 2}
              y={cWid / 2 + 350}
              textAnchor="middle"
              dominantBaseline="middle"
              fill="#000000"
              fontSize="170"
              fontWeight="bold"
            >
              ← 문 앞 빈 공간 {rearClearanceMm.toLocaleString()}mm (목재 블로킹/버팀목) →
            </text>
          </g>
        )}
      </svg>
    </div>
  );
}

/**
 * 쇼링 단면도 SVG 컴포넌트 (도어에서 안쪽을 바라본 단면 모습)
 */
function ShoringCrossSectionSvg({ container }) {
  const doorGuide = container.fieldDiagnostics?.doorShoringGuide;
  const hasHeightGap = doorGuide?.hasHeightGapRisk;

  if (!hasHeightGap) {
    // 단차가 없는 경우: 문 앞 목재 각재 펜스 + 버팀목 개략도
    return (
      <div style={{ width: '100%', height: '85px', border: '1px solid #000', padding: '4px', background: '#fff', boxSizing: 'border-box' }}>
        <div style={{ fontSize: '11px', fontWeight: 'bold', marginBottom: '2px' }}>[ 문 앞 펜스·버팀목 시공 단면 안내 ]</div>
        <svg viewBox="0 0 600 180" style={{ width: '100%', height: '62px' }}>
          <rect x="20" y="20" width="560" height="140" fill="#fff" stroke="#000" strokeWidth="4" />
          <line x1="20" y1="65" x2="580" y2="65" stroke="#000" strokeWidth="6" />
          <line x1="20" y1="115" x2="580" y2="115" stroke="#000" strokeWidth="6" />
          <text x="300" y="42" textAnchor="middle" fontSize="16" fontWeight="bold">상단 각재 (내폭 맞춤)</text>
          <text x="300" y="90" textAnchor="middle" fontSize="16" fontWeight="bold">중단 각재 (내폭 맞춤)</text>
          <text x="300" y="140" textAnchor="middle" fontSize="16" fontWeight="bold">하단 각재 + 코너포스트 버팀목 6본 결속</text>
        </svg>
      </div>
    );
  }

  // 단차가 있는 경우: 바로 앞 열(1620mm) + 낮은 파레트(570mm/850mm) + 합판 + 수평래싱 2줄 단면도
  const lashH1 = 1150;
  const lashH2 = 1450;
  const lowPallets = doorGuide.lowPalletDetails || [];
  const p1 = lowPallets[0] || { label: 'P#23', height: 570 };
  const p2 = lowPallets[1] || { label: 'P#38', height: 850 };

  return (
    <div style={{ width: '100%', height: '115px', border: '1px solid #000', padding: '4px 6px', background: '#fff', boxSizing: 'border-box' }}>
      <div style={{ fontSize: '11px', fontWeight: 'bold', marginBottom: '2px', display: 'flex', justifyContent: 'space-between' }}>
        <span>[ 도어측 단차 결속 단면도 (문에서 안쪽을 볼 때) ]</span>
        <span style={{ fontSize: '10.5px' }}>수평 래싱 2줄: 높이 {lashH1.toLocaleString()}mm / {lashH2.toLocaleString()}mm</span>
      </div>

      <svg viewBox="0 0 720 220" style={{ width: '100%', height: '92px' }}>
        {/* 컨테이너 내벽 윤곽 */}
        <rect x="30" y="10" width="660" height="200" fill="#ffffff" stroke="#000000" strokeWidth="4" />
        <text x="40" y="30" fontSize="12" fill="#666">컨테이너 내벽</text>

        {/* 배경: 바로 앞 완적 열 (1620mm) */}
        <rect x="70" y="35" width="580" height="175" fill="#e5e5e5" stroke="#000000" strokeWidth="2" strokeDasharray="6,4" />
        <text x="360" y="55" textAnchor="middle" fontSize="14" fontWeight="bold" fill="#000">
          바로 앞 완적 열 전면 (높이 1,620 mm)
        </text>

        {/* 완충 판재 (합판) */}
        <line x1="80" y1="70" x2="640" y2="70" stroke="#000" strokeWidth="5" />
        <text x="360" y="85" textAnchor="middle" fontSize="12" fill="#000" fontWeight="bold">
          [완충 판재] 합판 12T 지지면
        </text>

        {/* 수평 래싱 2줄 */}
        <line x1="30" y1="60" x2="690" y2="60" stroke="#000" strokeWidth="3" />
        <text x="685" y="54" textAnchor="end" fontSize="11" fontWeight="bold">수평래싱2: 1,450mm ▶</text>

        <line x1="30" y1="100" x2="690" y2="100" stroke="#000" strokeWidth="3" />
        <text x="685" y="94" textAnchor="end" fontSize="11" fontWeight="bold">수평래싱1: 1,150mm ▶</text>

        {/* 전경 좌측: 낮은 파레트 1 (P#23, 570mm) */}
        <rect x="100" y="145" width="220" height="65" fill="#ffffff" stroke="#000000" strokeWidth="3" />
        <text x="210" y="172" textAnchor="middle" fontSize="13" fontWeight="bold">
          {p1.label} ({p1.height}mm)
        </text>
        <text x="210" y="195" textAnchor="middle" fontSize="11" fill="#333">
          단차 -{1620 - p1.height}mm (빗금)
        </text>

        {/* 전경 우측: 낮은 파레트 2 (P#38, 850mm) */}
        <rect x="400" y="125" width="220" height="85" fill="#ffffff" stroke="#000000" strokeWidth="3" />
        <text x="510" y="157" textAnchor="middle" fontSize="13" fontWeight="bold">
          {p2.label} ({p2.height}mm)
        </text>
        <text x="510" y="180" textAnchor="middle" fontSize="11" fill="#333">
          단차 -{1620 - p2.height}mm (빗금)
        </text>

        {/* 톱오버 래싱 벨트 곡선 */}
        <path d="M 80 210 Q 210 120 340 210" fill="none" stroke="#000" strokeWidth="3" strokeDasharray="4,3" />
        <path d="M 380 210 Q 510 100 640 210" fill="none" stroke="#000" strokeWidth="3" strokeDasharray="4,3" />

        {/* 바닥 래싱 링 마크 */}
        <circle cx="80" cy="205" r="4" fill="#000" />
        <circle cx="340" cy="205" r="4" fill="#000" />
        <circle cx="380" cy="205" r="4" fill="#000" />
        <circle cx="640" cy="205" r="4" fill="#000" />
        <text x="360" y="120" textAnchor="middle" fontSize="11" fontWeight="bold">
          ▲ 톱오버 래싱 벨트 (바닥 링 결속, 전도 방지) ▲
        </text>
      </svg>
    </div>
  );
}

/**
 * 단일 호기 A4 가로 1장 완성 시트
 */
function SingleLoadingSheetPage({ container, totalContainers }) {
  const spec = container.spec;
  const placedPallets = container.placedPallets || [];
  const fieldDiag = container.fieldDiagnostics || {};
  const doorGuide = fieldDiag.doorShoringGuide;
  const seqRows = buildGroupedSequenceRows(container);
  const bomList = fieldDiag.shoringBOM || [];

  // 품목별 파레트 수 요약 텍스트
  const skuSummary = container.skuBreakdown
    ?.map((s) => `${s.name.split(' (')[0]} ${s.palletCount}PLT`)
    .join(', ') || '';

  // 1단적 vs 2단적 문구
  const stackTypeDesc =
    container.tier2Count > 0
      ? `2단 적재 (1단 ${container.tier1Count}PLT + 2단 ${container.tier2Count}PLT)`
      : '1단 평적 (바닥 전방 밀착)';

  // 포크 진입면 안내
  const is1200T12 = placedPallets.some((p) => p.pallet.width === 1200 || p.pallet.length === 1200);
  const forkEntryGuide = is1200T12
    ? '박스B(T12 1200×1000): 문 쪽을 향하는 폭 1,000mm 면으로 포크 진입 / 박스A(T11): 1,100mm 면 진입'
    : '공칭 파레트 폭에 맞춰 포크 진입';

  // 쇼링 액션 단계 5개
  const rearClr = fieldDiag.rearClearanceMm ?? 0;
  const defaultShoring = rearClr >= 600
    ? [
        '앞벽부터 파레트 간격 없이 전방 밀착 적재 완료',
        `문 앞 빈 공간(${rearClr}mm) 실측 확인`,
        '마지막 열 뒤에 각재 펜스를 세우고 코너포스트까지 대각 버팀목 시공',
        '코너포스트 지지 확인 및 화물 유동 여부 검수 (문 앞 에어백 사용 금지)',
        '컨테이너 도어 닫힘 간섭 여부 확인 후 잠금',
      ]
    : [
        '앞벽부터 파레트 간격 없이 전방 밀착 적재 완료',
        `문 앞 빈 틈(${rearClr}mm) 실측 확인`,
        '세운 빈 파레트 2~4장을 끼우고 각재로 단단히 조임 (문 앞 에어백 금지)',
        '화물 유동 여부 검수',
        '컨테이너 도어 닫힘 간섭 여부 확인 후 잠금',
      ];
  const shoringSteps = doorGuide?.actions?.slice(0, 5) || defaultShoring;

  return (
    <div className="cbm-loading-sheet-page">
      {/* 1. 머리말 */}
      <div className="cbm-ls-header">
        <div className="cbm-ls-header-title-box">
          <h1 className="cbm-ls-main-title">현장 로딩 지시서</h1>
          <div className="cbm-ls-meta-info">
            <strong>{container.index}호기</strong> (총 {totalContainers}대 중) &nbsp;|&nbsp; 규격: <strong>{spec?.name}</strong> ({spec?.subName || '40ft High Cube'})
          </div>
        </div>

        {/* 밑줄 빈칸 기입란 */}
        <div className="cbm-ls-form-grid">
          <div className="cbm-ls-form-row">
            <span>작업일: <u>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</u></span>
            <span>출고번호: <u>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</u></span>
            <span>도크: <u>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</u></span>
            <span>작업 시간: <u>&nbsp;&nbsp;&nbsp;&nbsp;:&nbsp;&nbsp;&nbsp;&nbsp; ~ &nbsp;&nbsp;&nbsp;&nbsp;:&nbsp;&nbsp;&nbsp;&nbsp;</u></span>
          </div>
          <div className="cbm-ls-form-row" style={{ marginTop: '3px' }}>
            <span>컨테이너 번호: <u>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</u></span>
            <span>씰(Seal) 번호: <u>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</u></span>
            <span>지게차 기사 서명: <u>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</u></span>
            <span>검수자 서명: <u>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</u></span>
          </div>
        </div>
      </div>

      {/* 2. 요약 한 줄 */}
      <div className="cbm-ls-summary-bar">
        <span><strong>총 파레트:</strong> {placedPallets.length} PLT</span>
        <span><strong>화물 총중량:</strong> {container.totalWeight.toLocaleString()} kg</span>
        <span><strong>적재 방식:</strong> {stackTypeDesc}</span>
        <span><strong>품목 구성:</strong> {skuSummary}</span>
        <span className="cbm-ls-coord-rule">※ 좌우 기준: 문 앞에서 안쪽을 바라볼 때 (상단: 우측 / 하단: 좌측)</span>
      </div>

      {/* 3. 평면 배치도 (가로로 넓게) */}
      <FloorPlanPrintSvg container={container} />

      {/* 하단 2개 컬럼 본문 (순서표/체크 vs 쇼링/BOM) */}
      <div className="cbm-ls-body-grid">
        {/* 좌측 컬럼: 4. 적재 순서표 & 7. 적재 전후 확인 */}
        <div className="cbm-ls-col-left">
          {/* 4. 적재 순서표 */}
          <div className="cbm-ls-section-box">
            <div className="cbm-ls-section-head">
              <strong>[ 적재 순서 및 위치 명세표 ]</strong>
              <small>연속된 동일 규격은 묶어서 표기 (앞벽부터 순차 적재)</small>
            </div>
            <table className="cbm-ls-table">
              <thead>
                <tr>
                  <th style={{ width: '13%' }}>순서</th>
                  <th style={{ width: '22%' }}>위치 (열·좌/우)</th>
                  <th style={{ width: '25%' }}>파레트 번호</th>
                  <th>품목 및 규격</th>
                  <th style={{ width: '17%' }}>높이</th>
                  <th style={{ width: '15%' }}>중량</th>
                  <th style={{ width: '8%', textAlign: 'center' }}>확인</th>
                </tr>
              </thead>
              <tbody>
                {seqRows.map((r, i) => (
                  <tr key={i} className={r.isClosing ? 'tr-closing' : r.isLow ? 'tr-warn' : ''}>
                    <td style={{ fontWeight: 'bold' }}>{r.seqText}</td>
                    <td>{r.colText}</td>
                    <td style={{ fontWeight: 'bold' }}>{r.pLabels}</td>
                    <td>{r.itemDesc}</td>
                    <td>{r.heightText}</td>
                    <td>{r.weightText}</td>
                    <td style={{ textAlign: 'center', fontSize: '13px' }}>□</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* 작업 메모 */}
            <div className="cbm-ls-work-memo">
              <div><strong>• 밀착 기준:</strong> 앞벽부터 열간 틈새 없이 전방 밀착 적재 (도어 쪽에 잔여 공간 형성)</div>
              <div><strong>• 포크 진입:</strong> {forkEntryGuide}</div>
              <div><strong>• 에어백 충진:</strong> 150mm 초과 측면 유격 열간 에어백 충진 (문 앞 공간에는 에어백 사용 금지)</div>
            </div>
          </div>

          {/* 7. 적재 전후 확인 (체크칸) */}
          <div className="cbm-ls-section-box" style={{ marginTop: '5px' }}>
            <div className="cbm-ls-section-head">
              <strong>[ 적재 전·후 필수 확인 체크리스트 ]</strong>
            </div>
            <div className="cbm-ls-checklist-grid">
              <div>□ 1. 컨테이너 외관 파손, 빛 샘(Hole), 바닥 돌출, 이물질 및 냄새 없음 확인</div>
              <div>□ 2. 컨테이너 내폭 실측 기록: 문쪽 [ &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; ] mm &nbsp;/&nbsp; 중앙 [ &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; ] mm</div>
              <div>□ 3. 첫 번째 열(Front) 적재 후 좌우 작업 여유 실측: 좌우 [ &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; ] mm</div>
              <div>□ 4. 도어 외부에 "쇼링 완료, 문 개방 시 화물 낙하 주의" 표지 부착</div>
              <div>□ 5. 단계별 현장 사진 촬영 완료: ① 앞벽 첫 열 &nbsp; ② 중간 적재 &nbsp; ③ 최종 쇼링 시공 &nbsp; ④ 씰(Seal) 체결</div>
            </div>
          </div>
        </div>

        {/* 우측 컬럼: 5. 쇼링 지시 & 6. 준비 자재 (BOM) */}
        <div className="cbm-ls-col-right">
          {/* 5. 쇼링 지시 */}
          <div className="cbm-ls-section-box">
            <div className="cbm-ls-section-head">
              <strong>[ 도어측 화물 전도·슬라이딩 방지 쇼링 지시 ]</strong>
              <small>{doorGuide?.hasHeightGapRisk ? '단차 및 밀림 동시 방어' : '후방 슬라이딩 차단'}</small>
            </div>

            {/* 문에서 본 단면도 */}
            <ShoringCrossSectionSvg container={container} />

            {/* 쇼링 작업 5단계 */}
            <div className="cbm-ls-shoring-steps">
              {shoringSteps.map((step, idx) => (
                <div key={idx} className="cbm-ls-step-item">
                  <span className="step-num">{idx + 1}</span>
                  <span>{step}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 6. 준비 자재 (예상 BOM) */}
          <div className="cbm-ls-section-box" style={{ marginTop: '5px' }}>
            <div className="cbm-ls-section-head">
              <strong>[ 필요 쇼링 자재 목록 (BOM) ]</strong>
              <small>작업 전 도크 옆에 사전 불출</small>
            </div>
            <table className="cbm-ls-table">
              <thead>
                <tr>
                  <th style={{ width: '22%' }}>자재명</th>
                  <th style={{ width: '24%' }}>규격</th>
                  <th style={{ width: '16%' }}>소요수량</th>
                  <th>시공 목적</th>
                  <th style={{ width: '10%', textAlign: 'center' }}>준비</th>
                </tr>
              </thead>
              <tbody>
                {bomList.slice(0, 5).map((b, i) => (
                  <tr key={i}>
                    <td style={{ fontWeight: 'bold' }}>{b.name.split(' (')[0]}</td>
                    <td>{b.spec}</td>
                    <td style={{ fontWeight: 'bold' }}>{b.quantity}</td>
                    <td style={{ fontSize: '11px' }}>{b.purpose.split('(')[0]}</td>
                    <td style={{ textAlign: 'center', fontSize: '13px' }}>□</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="cbm-ls-ht-notice">
              ※ 수출 건은 반드시 <strong>ISPM 15 (HT) 열처리 검역 마크</strong>가 각인된 목재 자재(각재·파레트)만 사용하십시오. (가공목재인 합판은 검역 면제)
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * 3단계 현장 로딩 지시서 출력 모달 컴포넌트
 */
export function LoadingInstructionSheetModal({
  containers = [],
  initialContainerIdx = 0,
  onClose,
}) {
  const [selectedTarget, setSelectedTarget] = useState('all'); // 'all' or container index number

  const targetContainers =
    selectedTarget === 'all'
      ? containers
      : [containers[Number(selectedTarget)]].filter(Boolean);

  const handlePrint = () => {
    // 인쇄 전용 모드 클래스 추가 후 브라우저 인쇄 다이얼로그 호출
    document.body.classList.add('printing-loading-sheet');
    window.print();
    // 인쇄 다이얼로그 닫힌 후 복원
    setTimeout(() => {
      document.body.classList.remove('printing-loading-sheet');
    }, 1000);
  };

  return (
    <div className="cbm-modal-backdrop" onClick={onClose} style={{ zIndex: 9999 }}>
      <div
        className="cbm-modal-content cbm-loading-sheet-modal"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '95vw',
          maxWidth: '1240px',
          maxHeight: '94vh',
          display: 'flex',
          flexDirection: 'column',
          padding: '16px 20px',
          background: '#0f172a',
          color: '#f8fafc',
          border: '1px solid #334155',
          borderRadius: '12px',
        }}
      >
        {/* 모달 상단 컨트롤 툴바 */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingBottom: '12px',
            borderBottom: '1px solid #334155',
            gap: '12px',
            flexWrap: 'wrap',
          }}
        >
          <div>
            <h2 style={{ margin: 0, fontSize: '1.15rem', color: '#f8fafc' }}>
              현장 로딩 지시서 출력 (창고 지게차 작업용 · A4 가로)
            </h2>
            <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: '#94a3b8' }}>
              호기당 A4 가로 1장 완결 | 흑백 인쇄 기준 | 실무 지게차 적재 순서·도어측 쇼링 지침서
            </p>
          </div>

          {/* 호기 선택 버튼 그룹 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.8rem', color: '#cbd5e1' }}>인쇄 대상:</span>
            <div className="cbm-ribbon-btn-group">
              <button
                type="button"
                className={`cbm-ribbon-btn ${selectedTarget === 'all' ? 'active emerald' : ''}`}
                onClick={() => setSelectedTarget('all')}
              >
                전체 호기 (총 {containers.length}대 / {containers.length}장)
              </button>
              {containers.map((c, i) => (
                <button
                  key={c.id || i}
                  type="button"
                  className={`cbm-ribbon-btn ${selectedTarget === i ? 'active' : ''}`}
                  onClick={() => setSelectedTarget(i)}
                >
                  #{c.index}호기만
                </button>
              ))}
            </div>

            {/* 인쇄 버튼 */}
            <button
              type="button"
              className="cbm-btn cbm-btn-primary"
              onClick={handlePrint}
              style={{
                padding: '8px 18px',
                fontSize: '0.88rem',
                fontWeight: 700,
                background: '#10b981',
                borderColor: '#059669',
              }}
            >
              인쇄 / PDF 저장 (A4 가로)
            </button>

            <button
              type="button"
              className="cbm-btn cbm-btn-outline"
              onClick={onClose}
              style={{ padding: '8px 14px', fontSize: '0.85rem' }}
            >
              닫기
            </button>
          </div>
        </div>

        {/* 인쇄 미리보기 영역 (화면 스크롤 가능) */}
        <div
          className="cbm-ls-preview-container"
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '16px 0',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '24px',
            background: '#1e293b',
            borderRadius: '8px',
            marginTop: '12px',
          }}
        >
          {targetContainers.map((c) => (
            <div key={c.id || c.index} className="cbm-ls-page-wrapper">
              <SingleLoadingSheetPage container={c} totalContainers={containers.length} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * 인쇄 시에만 DOM에 마운트되어 종이로 출력되는 루트 렌더러
 */
export function LoadingInstructionPrintRoot({ containers = [] }) {
  if (!containers || containers.length === 0) return null;

  return (
    <div id="cbm-loading-sheet-print-root">
      {containers.map((c) => (
        <SingleLoadingSheetPage key={c.id || c.index} container={c} totalContainers={containers.length} />
      ))}
    </div>
  );
}
