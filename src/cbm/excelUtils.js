import * as XLSX from 'xlsx';
import { CARGO_COLORS, DEFAULT_CARGOS } from './packingEngine.js';
import { computeBest2DLayer } from './layerLayout.js';

/**
 * 컬럼 헤더 문자열 정규화 후 매칭
 */
function normalizeRowToCargo(row, idx, options = {}) {
  const keys = Object.keys(row);
  const findEntry = (patterns) => {
    for (const pat of patterns) {
      const matchKey = keys.find((k) =>
        k.toLowerCase().replace(/\s+/g, '').includes(pat.toLowerCase())
      );
      if (matchKey !== undefined && row[matchKey] !== undefined && row[matchKey] !== '') {
        return { key: matchKey, val: row[matchKey] };
      }
    }
    return { key: '', val: undefined };
  };
  const findVal = (patterns) => findEntry(patterns).val;

  const rawName = findVal(['화물명', '품목', '품명', '이름', '박스', 'name', 'item', 'cargo', 'part']);
  const wEntry = findEntry(['가로', '폭', 'width', 'w(mm)', 'w(cm)']);
  const lEntry = findEntry(['세로', '길이', '깊이', 'length', 'depth', 'l(mm)', 'l(cm)']);
  const hEntry = findEntry(['높이', 'height', 'h(mm)', 'h(cm)']);
  const dimEntry = findEntry([
    '규격',
    '치수',
    '사이즈',
    'dimension',
    'boxdimensions',
    'boxsize',
    'size',
    'cbm규격',
  ]);
  const rawQty = findVal(['수량', '개수', '박스수', 'qty', 'quantity', 'count', 'ctns', 'carton']);
  const rawWeight = findVal(['중량', '무게', '단중', 'weight', 'kg', 'g.w']);
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

  let width = toNum(wEntry.val, 0);
  let length = toNum(lEntry.val, 0);
  let height = toNum(hEntry.val, 0);
  let combinedRawStr = '';

  // 통합 치수 문자열 파싱 지원 (예: "51X24X21CM", "75 x 41 x 22 cm", "60 × 40 × 30")
  if ((width <= 0 || length <= 0 || height <= 0) && dimEntry.val !== undefined) {
    combinedRawStr = String(dimEntry.val);
    const m = combinedRawStr.match(
      /(\d+(?:\.\d+)?)\s*[xX×*]\s*(\d+(?:\.\d+)?)\s*[xX×*]\s*(\d+(?:\.\d+)?)/
    );
    if (m) {
      width = parseFloat(m[1]);
      length = parseFloat(m[2]);
      height = parseFloat(m[3]);
    }
  }

  // 단위(cm vs mm) 자동 감지 및 변환
  const headerOrCellStr = `${wEntry.key} ${lEntry.key} ${hEntry.key} ${dimEntry.key} ${wEntry.val ?? ''} ${lEntry.val ?? ''} ${hEntry.val ?? ''} ${combinedRawStr}`.toLowerCase();
  const hasExplicitMm = headerOrCellStr.includes('mm');
  const hasExplicitCm = headerOrCellStr.includes('cm');
  const isLikelyCmByValue =
    !hasExplicitMm &&
    width > 0 &&
    length > 0 &&
    height > 0 &&
    width <= 150 &&
    length <= 150 &&
    height <= 150;

  if (
    hasExplicitCm ||
    (!hasExplicitMm && (options.unitMode === 'cm' || isLikelyCmByValue))
  ) {
    width = Math.round(width * 10);
    length = Math.round(length * 10);
    height = Math.round(height * 10);
  } else {
    width = Math.round(width);
    length = Math.round(length);
    height = Math.round(height);
  }

  const quantity = Math.round(toNum(rawQty, 0));
  const weight = toNum(rawWeight, 1);

  if (width <= 0 || length <= 0 || height <= 0 || quantity <= 0) {
    return null;
  }

  // Determine palletSpecId from Excel or general 2D layer efficiency/overhang comparison (T11 vs T12)
  let palletSpecId = 'T11';
  if (rawPallet) {
    const pStr = String(rawPallet).toLowerCase();
    if (
      (pStr.includes('1200') && pStr.includes('1000')) ||
      (pStr.includes('120') && pStr.includes('100')) ||
      pStr.includes('t12')
    ) {
      palletSpecId = 'T12';
    } else if (
      pStr.includes('1100') ||
      pStr.includes('110') ||
      pStr.includes('t11')
    ) {
      palletSpecId = 'T11';
    } else if (pStr.includes('800') || pStr.includes('eur')) {
      palletSpecId = 'EUR';
    }
  } else {
    // 회사 파레트 배정 기준(evaluateCompanyPolicy) + 현장 혼적 규격 정합:
    // 1) T11에 아예 안 들어가거나, 2) T11 바닥 적재 효율이 기준(70%) 미만이면서 T12 전환 시 단당 박스 수가 늘어나거나,
    // 3) T11과 T12 단당 적재 수는 같지만 T12에서 여백 없이 딱 맞아(효율 78% 이상 & 5%p 이상 상승) 현장 결속에 유리한 경우(예: 600×400mm) T12 배정
    const fitT11NoOverhang = computeBest2DLayer(1100, 1100, width, length, true);
    const fitT12 = computeBest2DLayer(1200, 1000, width, length, true);
    const effT11 = (fitT11NoOverhang.length * width * length) / (1100 * 1100);
    const effT12 = (fitT12.length * width * length) / (1200 * 1000);

    if (fitT11NoOverhang.length === 0 && fitT12.length > 0) {
      palletSpecId = 'T12';
    } else if (effT11 < 0.7 && fitT12.length > fitT11NoOverhang.length) {
      palletSpecId = 'T12';
    }
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
export async function parseCargoExcelFile(file, options = {}) {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array' });
  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];
  const rows = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

  const parsed = [];
  rows.forEach((row, idx) => {
    const item = normalizeRowToCargo(row, idx, options);
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
export function parseCargoFromText(text, options = {}) {
  if (!text || !text.trim()) return [];
  const workbook = XLSX.read(text, { type: 'string' });
  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];
  const rows = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

  const parsed = [];
  rows.forEach((row, idx) => {
    const item = normalizeRowToCargo(row, idx, options);
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
