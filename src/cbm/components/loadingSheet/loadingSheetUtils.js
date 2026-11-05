// 현장 로딩 지시서(A4 가로 1장) 순서표 생성 헬퍼 함수

/**
 * 적재 순서표 생성 헬퍼:
 * 연속된 동일 품목·규격·높이 파레트를 한 줄로 묶어 A4 1장에 컴팩트하게 들어가도록 가공
 */
export function buildGroupedSequenceRows(container) {
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
    const isSingle =
      pp.isSingleIncompleteCol ||
      pp.width > 1300 ||
      container.fieldDiagnostics?.colGapDetails?.find((c) => c.colIndex === colIdx)?.isSingle;
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
        (container.fieldDiagnostics?.hasDoorIncompleteCol &&
          container.fieldDiagnostics?.doorIncompleteColInfo?.colIndex === colIdx)
    );

    // 파레트 적재 방향 (가로 / 세로 / 정방향 대신 명확한 길이 방향 치수로 표현)
    let orientation = '';
    if (pp.length !== pp.width) {
      orientation = `${pp.length.toLocaleString()}mm가 길이 방향`;
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
    const orientTag = g.orientation ? ` [${g.orientation}]` : '';

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
