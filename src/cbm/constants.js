// 컨테이너 규격, 파레트 프리셋, 화물 기본 색상 및 적재 옵션 상수 정의

export const CONTAINER_SPECS = {
  '20FT_DRY': {
    id: '20FT_DRY',
    name: '20ft Dry',
    subName: '표준 20피트 드라이 컨테이너',
    length: 5898,
    width: 2352,
    height: 2393,
    doorHeight: 2280,
    maxWeight: 21700,
    nominalCbm: 33.2,
  },
  '40FT_DRY': {
    id: '40FT_DRY',
    name: '40ft Dry',
    subName: '표준 40피트 드라이 컨테이너',
    length: 12032,
    width: 2352,
    height: 2393,
    doorHeight: 2280,
    maxWeight: 26700,
    nominalCbm: 67.7,
  },
  '40FT_HC': {
    id: '40FT_HC',
    name: '40ft High Cube',
    subName: '40피트 하이큐브(HC) 컨테이너',
    length: 12032,
    width: 2352,
    height: 2698,
    doorHeight: 2585,
    maxWeight: 26500,
    nominalCbm: 76.4,
  },
};

export const PALLET_PRESETS = {
  T11: {
    id: 'T11',
    name: 'T11 표준 (1100 × 1100)',
    shortLabel: '1100×1100 (T11)',
    width: 1100,
    length: 1100,
    baseHeight: 150,
    maxTotalHeight: 1700,
    maxWeight: 1000,
    tareWeight: 17,
  },
  T12: {
    id: 'T12',
    name: 'T12 국제규격 (1200 × 1000)',
    shortLabel: '1200×1000 (T12)',
    width: 1200,
    length: 1000,
    baseHeight: 150,
    maxTotalHeight: 1700,
    maxWeight: 1000,
    tareWeight: 17,
  },
  EUR: {
    id: 'EUR',
    name: 'EUR 유럽규격 (1200 × 800)',
    shortLabel: '1200×800 (EUR)',
    width: 1200,
    length: 800,
    baseHeight: 150,
    maxTotalHeight: 1700,
    maxWeight: 1000,
    tareWeight: 17,
  },
  EXPORT_1200: {
    id: 'EXPORT_1200',
    name: '수출 대형 (1200 × 1200)',
    shortLabel: '1200×1200 (대형)',
    width: 1200,
    length: 1200,
    baseHeight: 150,
    maxTotalHeight: 1700,
    maxWeight: 1200,
    tareWeight: 20,
  },
};

export const CARGO_COLORS = [
  '#3b82f6', // Blue
  '#f59e0b', // Amber
  '#10b981', // Emerald
  '#ec4899', // Pink
  '#8b5cf6', // Violet
  '#06b6d4', // Cyan
  '#f97316', // Orange
  '#84cc16', // Lime
];

/**
 * 기본 데모 데이터:
 * - 박스A (Item 1): 510×240×210, 1246박스, 개당 4.26kg, 1100×1100 파레트
 *   -> 56박스 완적 22PLT (파레트당 255.6kg, 합 5,623.2kg) + 14박스 부분 1PLT (76.6kg)
 * - 박스B (Item 2, 돌출건): 750×410×220, 294박스, 개당 9.60kg, 1200×1000 파레트 적용 (돌출 해결!)
 *   -> 21박스 완적 14PLT (파레트당 218.6kg, 합 3,060.4kg)
 * - 박스C (Item 3): 500×400×350, 8박스, 개당 11.00kg, 1100×1100 파레트
 *   -> 8박스 1PLT (파레트당 105.0kg, 합 105.0kg)
 * - 파레트 자중(tareWeight): 17.0kg 기준 총합 38개 파레트, 8,865.2kg
 */
export const DEFAULT_CARGOS = [
  {
    id: 'cargo-1',
    name: '박스A (Item1)',
    width: 510,
    length: 240,
    height: 210,
    quantity: 1246,
    weight: 4.26,
    color: CARGO_COLORS[0],
    allowRotate: true,
    palletSpecId: 'T11', // 1100 x 1100
  },
  {
    id: 'cargo-2',
    name: '박스B (Item2)',
    width: 750,
    length: 410,
    height: 220,
    quantity: 294,
    weight: 9.6,
    color: CARGO_COLORS[1],
    allowRotate: true,
    palletSpecId: 'T12', // 돌출 방지를 위해 1200 x 1000 파레트 지정
  },
  {
    id: 'cargo-3',
    name: '박스C (Item3)',
    width: 500,
    length: 400,
    height: 350,
    quantity: 8,
    weight: 11.0,
    color: CARGO_COLORS[2],
    allowRotate: true,
    palletSpecId: 'T11', // 1100 x 1100
  },
];

export const PATTERN_DEFS = [
  {
    id: 'AUTO_MAX',
    label: '⚡ 자동 최대 혼합',
    shortDesc: '가장 많이 들어가는 최적 배열 자동 선택',
  },
  {
    id: 'PINWHEEL',
    label: '🌀 핀휠 (풍차형 맞물림)',
    shortDesc: '4면을 풍차처럼 돌려 맞물리게 배치 (흔들림에 강함)',
  },
  {
    id: 'SPLIT_MIX',
    label: '🧩 블록 혼합 (정방향+회전)',
    shortDesc: '정방향 열과 90° 회전 열을 조합하여 빈 공간 최소화',
  },
  {
    id: 'GRID_NORMAL',
    label: '⬆️ 일자 정방향 바둑판',
    shortDesc: '모든 상자를 회전 없이 같은 방향으로 줄 맞춰 정렬',
  },
  {
    id: 'GRID_ROTATED',
    label: '↪️ 일자 90°회전 바둑판',
    shortDesc: '모든 상자를 90° 회전 방향으로 통일하여 줄 맞춰 정렬',
  },
];

export const STACK_STYLE_DEFS = [
  {
    id: 'INTERLOCK',
    label: '🧱 벽돌식 홀·짝수단 대칭 교차',
    shortDesc: '홀수단과 짝수단을 180° 대칭 교차하여 층간 무너짐 방지',
  },
  {
    id: 'CROSS_TIER',
    label: '🔄 홀·짝수단 90° 직교 교차',
    shortDesc: '홀수단 가로열 ↔ 짝수단 세로열로 층마다 결을 90° 직교 배치',
  },
  {
    id: 'COLUMN',
    label: '🏛️ 기둥식 수직 일자 정렬',
    shortDesc: '1단~끝단까지 동일 위치로 수직 기둥 정렬 (박스 모서리 강도 최고)',
  },
];

export const POSTURE_DEFS = [
  { id: 'UPRIGHT', label: '⬆️ 기본 세워 쌓기' },
  { id: 'FLAT_W_H', label: '📐 앞으로 눕혀 쌓기 (세로=높이)' },
  { id: 'FLAT_H_L', label: '📐 옆으로 눕혀 쌓기 (가로=높이)' },
];
