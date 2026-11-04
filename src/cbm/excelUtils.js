import * as XLSX from 'xlsx';
import { CARGO_COLORS, DEFAULT_CARGOS } from './packingEngine';

/**
 * 컬럼 헤더 문자열 정규화 후 매칭
 */
function normalizeRowToCargo(row, idx) {
  const keys = Object.keys(row);
  const findVal = (patterns) => {
    for (const pat of patterns) {
      const matchKey = keys.find((k) =>
        k.toLowerCase().replace(/\s+/g, '').includes(pat.toLowerCase())
      );
      if (matchKey !== undefined && row[matchKey] !== undefined && row[matchKey] !== '') {
        return row[matchKey];
      }
    }
    return undefined;
  };

  const rawName = findVal(['화물명', '품목', '품명', '이름', '박스', 'name', 'item', 'cargo']);
  const rawW = findVal(['가로', '폭', 'width', 'w(mm)']);
  const rawL = findVal(['세로', '길이', '깊이', 'length', 'depth', 'l(mm)']);
  const rawH = findVal(['높이', 'height', 'h(mm)']);
  const rawQty = findVal(['수량', '개수', '박스수', 'qty', 'quantity', 'count']);
  const rawWeight = findVal(['중량', '무게', '단중', 'weight', 'kg']);
  const rawPallet = findVal(['파레트', '팔레트', 'pallet']);
  const rawTopLoad = findVal(['허용하중', '상단하중', 'topload', 'strength']);
  const rawNoDouble = findVal(['2단적금지', '2단금지', 'nodoublestack', 'singleonly']);

  const toNum = (val, fallback = 0) => {
    if (typeof val === 'number') return val;
    if (typeof val === 'string') {
      const cleaned = val.replace(/[^0-9.-]/g, '');
      const parsed = parseFloat(cleaned);
      return Number.isFinite(parsed) ? parsed : fallback;
    }
    return fallback;
  };

  const width = toNum(rawW, 0);
  const length = toNum(rawL, 0);
  const height = toNum(rawH, 0);
  const quantity = Math.round(toNum(rawQty, 0));
  const weight = toNum(rawWeight, 1);

  if (width <= 0 || length <= 0 || height <= 0 || quantity <= 0) {
    return null;
  }

  // Determine palletSpecId from Excel or auto-detect 1200x1000 for 750x410 overhang items
  let palletSpecId = 'DEFAULT';
  if (rawPallet) {
    const pStr = String(rawPallet).toLowerCase();
    if (pStr.includes('1200') && pStr.includes('1000')) palletSpecId = 'T12';
    else if (pStr.includes('t12')) palletSpecId = 'T12';
    else if (pStr.includes('1100')) palletSpecId = 'T11';
    else if (pStr.includes('t11')) palletSpecId = 'T11';
    else if (pStr.includes('800')) palletSpecId = 'EUR';
  } else if (width + length > 1100 && width + length <= 1200) {
    // 예: 750 + 410 = 1160mm 처럼 1100 파레트에서는 돌출되나 1200x1000 파레트에 쏙 들어가는 경우 자동 T12 배정
    palletSpecId = 'T12';
  }

  return {
    id: `cargo-${Date.now()}-${idx}`,
    name: String(rawName || `화물 ${idx + 1}`).trim(),
    width,
    length,
    height,
    quantity,
    weight,
    maxLayers: 0,
    maxTopLoad: toNum(rawTopLoad, 0),
    noDoubleStack: Boolean(
      rawNoDouble &&
        (String(rawNoDouble).toLowerCase().includes('y') ||
          String(rawNoDouble) === '1' ||
          String(rawNoDouble).includes('금지') ||
          String(rawNoDouble).includes('true'))
    ),
    color: CARGO_COLORS[idx % CARGO_COLORS.length],
    allowRotate: true,
    palletSpecId,
  };
}

/**
 * 엑셀(.xlsx, .xls) 또는 CSV 파일 업로드 파싱
 */
export async function parseCargoExcelFile(file) {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array' });
  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];
  const rows = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

  const parsed = [];
  rows.forEach((row, idx) => {
    const item = normalizeRowToCargo(row, idx);
    if (item) parsed.push(item);
  });

  return parsed.map((item, i) => ({
    ...item,
    id: `cargo-${i + 1}`,
    color: CARGO_COLORS[i % CARGO_COLORS.length],
  }));
}

/**
 * 엑셀/CSV 텍스트 붙여넣기 파싱 지원
 */
export function parseCargoFromText(text) {
  if (!text || !text.trim()) return [];
  const workbook = XLSX.read(text, { type: 'string' });
  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];
  const rows = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

  const parsed = [];
  rows.forEach((row, idx) => {
    const item = normalizeRowToCargo(row, idx);
    if (item) parsed.push(item);
  });

  return parsed.map((item, i) => ({
    ...item,
    id: `cargo-${i + 1}`,
    color: CARGO_COLORS[i % CARGO_COLORS.length],
  }));
}

/**
 * 표준 입력 양식 엑셀(.xlsx) 다운로드
 */
export function downloadSampleExcelTemplate() {
  const sampleData = DEFAULT_CARGOS.map((c) => ({
    화물명: c.name,
    '가로(mm)': c.width,
    '세로(mm)': c.length,
    '높이(mm)': c.height,
    수량: c.quantity,
    '중량(kg/박스)': c.weight,
    파레트규격: c.palletSpecId === 'T12' ? '1200x1000' : '1100x1100',
  }));

  const ws = XLSX.utils.json_to_sheet(sampleData);
  ws['!cols'] = [
    { wch: 18 },
    { wch: 12 },
    { wch: 12 },
    { wch: 12 },
    { wch: 10 },
    { wch: 15 },
    { wch: 14 },
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, '화물입력양식');
  XLSX.writeFile(wb, 'CBM_화물적재_표준양식.xlsx');
}

/**
 * 시뮬레이션 계산 결과 리포트 엑셀(.xlsx) 내보내기
 */
export function exportSimulationResultExcel(simResult, cargos, palletConfig, options) {
  const wb = XLSX.utils.book_new();

  // Sheet 1: 품목별 파레트 & 중량 요약 (이미지 표 양식과 동일)
  const weightGroupRows = (simResult.palletWeightGroups || []).map((g) => ({
    품목: g.label,
    파레트규격: g.palletDim,
    파레트수: `${g.palletCount}개`,
    파레트당중량: `약 ${g.unitPalletWeight.toFixed(1)}kg`,
    합계: `${g.totalGroupWeight.toLocaleString()}kg`,
  }));
  weightGroupRows.push({
    품목: '총합',
    파레트규격: '-',
    파레트수: `${simResult.summary.totalPallets}개`,
    파레트당중량: '',
    합계: `${simResult.summary.totalWeight.toLocaleString()}kg`,
  });

  const wsWeightGroups = XLSX.utils.json_to_sheet(weightGroupRows);
  wsWeightGroups['!cols'] = [
    { wch: 28 },
    { wch: 16 },
    { wch: 12 },
    { wch: 16 },
    { wch: 16 },
  ];
  XLSX.utils.book_append_sheet(wb, wsWeightGroups, '1_품목별중량요약');

  // Sheet 2: 컨테이너별 적재 및 무게중심(CoG) 분석
  const containerRows = simResult.containerResult.containers.map((c) => ({
    컨테이너번호: `Container #${c.index}`,
    컨테이너종류: c.spec.name,
    총적재파레트수: `${c.placedPallets.length}개`,
    총적재박스수: `${c.boxCount}박스`,
    '총중량(kg)': `${c.totalWeight.toLocaleString()}kg`,
    '용적률(%)': `${c.volumeUtilization}%`,
    '전후무게중심(안쪽:도어)': `${c.cog?.frontRatio}% : ${c.cog?.rearRatio}%`,
    '좌우무게중심(좌:우)': `${c.cog?.leftRatio}% : ${c.cog?.rightRatio}%`,
    '수직무게중심높이(mm)': `${c.cog?.cogY}mm (${c.cog?.heightRatioPct}%)`,
    무게중심판정: c.cog?.statusText || '정상',
  }));
  const wsContainers = XLSX.utils.json_to_sheet(containerRows);
  wsContainers['!cols'] = [
    { wch: 15 },
    { wch: 16 },
    { wch: 15 },
    { wch: 14 },
    { wch: 14 },
    { wch: 12 },
    { wch: 22 },
    { wch: 20 },
    { wch: 20 },
    { wch: 22 },
  ];
  XLSX.utils.book_append_sheet(wb, wsContainers, '2_컨테이너및무게중심');

  // Sheet 3: 파레트별 상세 내역
  const palletRows = simResult.pallets.map((p) => {
    const cargoBreakdowns = cargos
      .map((c) => {
        const cnt = p.cargoCounts[c.id] || 0;
        return cnt > 0 ? `${c.name}: ${cnt}개` : null;
      })
      .filter(Boolean)
      .join(', ');

    return {
      파레트번호: `Pallet #${p.index}`,
      '규격(가로×세로mm)': `${p.width} × ${p.length}`,
      '총높이(mm)': p.totalHeight,
      '화물높이(mm)': p.cargoHeight,
      적재층수: `${p.layers.length}단`,
      총박스수: p.boxes.length,
      적재화물구성: cargoBreakdowns,
      '화물순중량(kg)': p.cargoWeight,
      '파레트포함총중량(kg)': p.totalWeight,
      '화물CBM(m³)': p.cargoCbm,
    };
  });
  const wsPallets = XLSX.utils.json_to_sheet(palletRows);
  wsPallets['!cols'] = [
    { wch: 14 },
    { wch: 18 },
    { wch: 13 },
    { wch: 13 },
    { wch: 10 },
    { wch: 10 },
    { wch: 30 },
    { wch: 15 },
    { wch: 18 },
    { wch: 14 },
  ];
  XLSX.utils.book_append_sheet(wb, wsPallets, '3_파레트별상세');

  XLSX.writeFile(wb, `CBM_적재및무게중심_리포트_${new Date().toISOString().slice(0, 10)}.xlsx`);
}
