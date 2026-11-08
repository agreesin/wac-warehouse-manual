// 현장 로딩 지시서(A4 가로 1장) 순서표 생성 헬퍼 함수

/**
 * 파레트 번호 배열을 받아 실제 연속 구간(Contiguous Runs)으로만 묶어 표기하는 헬퍼
 * - 비연속 번호가 섞여 있을 때 'P#1 ~ P#2 (총 12개)'처럼 잘못 축약되는 문제를 원천 차단합니다.
 */
function formatPalletLabels(items) {
  const count = items.length;
  if (count === 0) return '-';
  if (count === 1) return items[0].pLabel;
  if (count <= 4) return items.map((it) => it.pLabel).join(', ');

  // 2단 적재가 포함된 경우나 특수 라벨은 그대로 나열
  if (items.some((it) => it.tier2Cand || !Number.isInteger(it.palletIdx))) {
    return `${items[0].pLabel} ~ ${items[count - 1].pLabel} (총 ${count}개)`;
  }

  const indices = items.map((it) => it.palletIdx);
  // 오름차순으로 정확히 1씩 연속되는지 확인
  let isStrictlyContiguous = true;
  for (let i = 1; i < indices.length; i++) {
    if (indices[i] !== indices[i - 1] + 1) {
      isStrictlyContiguous = false;
      break;
    }
  }
  if (isStrictlyContiguous) {
    return `${items[0].pLabel} ~ ${items[count - 1].pLabel} (총 ${count}개)`;
  }

  // 정렬 후 연속 구간별로 묶어서 표기 (예: P#1~P#6, P#13~P#18 (총 12개))
  const sorted = [...indices].sort((a, b) => a - b);
  const runs = [];
  let runStart = sorted[0];
  let runEnd = sorted[0];
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i] === runEnd + 1) {
      runEnd = sorted[i];
    } else {
      runs.push(runStart === runEnd ? `P#${runStart}` : `P#${runStart}~P#${runEnd}`);
      runStart = sorted[i];
      runEnd = sorted[i];
    }
  }
  runs.push(runStart === runEnd ? `P#${runStart}` : `P#${runStart}~P#${runEnd}`);
  return `${runs.join(', ')} (총 ${count}개)`;
}

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
      // 파레트 시작점(pp.z)이 아닌 파레트 폭 중심점(pp.z + pp.width / 2)으로 좌/우 판정
      sideLabel = pp.z + pp.width / 2 < cWidth / 2 ? '우' : '좌';
    }

    // 상단 2단적 화물 존재 여부 확인
    const tier2Cand = container.placedPallets.find(
      (top) => top.tier === 2 && top.stackedOn === pp.pallet.id
    );

    const palletIdx = Number(pp.pallet.index || pp.palletIndex);
    const baseLabel = `P#${palletIdx}`;
    const pLabel = tier2Cand
      ? `하:${baseLabel}/상:P#${tier2Cand.pallet.index || tier2Cand.palletIndex}`
      : baseLabel;
    const isLow = lowPalletSet.has(baseLabel);
    const cargoName = pp.pallet.primaryCargoName?.split(' ')[0] || '화물';
    const specDesc = `${pp.pallet.width}×${pp.pallet.length}`;
    const heightMm = tier2Cand
      ? pp.pallet.totalHeight + tier2Cand.pallet.totalHeight
      : pp.pallet.totalHeight;
    const weightKg = tier2Cand
      ? Number((pp.pallet.totalWeight + tier2Cand.pallet.totalWeight).toFixed(1))
      : pp.pallet.totalWeight;
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

    return {
      seq: idx + 1,
      colIdx,
      sideLabel,
      palletIdx,
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

    const pLabels = formatPalletLabels(g.items);

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
