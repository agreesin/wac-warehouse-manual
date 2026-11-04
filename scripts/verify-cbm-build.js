import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distIndexPath = path.resolve(__dirname, '../dist/index.html');

console.log('[VERIFY-CBM] Checking dist/index.html for wac-cbm-simulator requirements...');

if (!fs.existsSync(distIndexPath)) {
  console.error('[VERIFY-CBM ERROR] dist/index.html does not exist!');
  process.exit(1);
}

const html = fs.readFileSync(distIndexPath, 'utf8');

// 1. Forbidden terms check
const forbiddenPatterns = [
  { term: '인턴 매뉴얼', desc: 'Intern Manual title/text' },
  { term: 'wac-warehouse-manual', desc: 'Manual project url/slug' },
];

let hasError = false;
for (const item of forbiddenPatterns) {
  if (html.includes(item.term)) {
    console.error(`[VERIFY-CBM ERROR] dist/index.html contains forbidden text: "${item.term}" (${item.desc})`);
    hasError = true;
  }
}

// 2. Required title and meta checks
const expectedTitle = 'WAC 로딩플래너 - 3D 화물 파레트 & 컨테이너 적재 시뮬레이터';
const expectedOgUrl = 'https://wac-cbm-simulator.vercel.app/';
const expectedOgTitle = 'WAC 로딩플래너 (3D 화물 파레트 & 컨테이너 적재 시뮬레이터)';
const expectedDesc = '화물 치수/수량 입력으로 파레트 수량 계산부터 40HC 컨테이너 3D 적재 시뮬레이션 및 무게중심(CoG) 진단까지 실시간 자동 계산 솔루션';

if (!html.includes(`<title>${expectedTitle}</title>`)) {
  console.error(`[VERIFY-CBM ERROR] Title does not match expected "${expectedTitle}"`);
  hasError = true;
}

if (!html.includes(`content="${expectedOgUrl}"`)) {
  console.error(`[VERIFY-CBM ERROR] og:url does not match expected "${expectedOgUrl}"`);
  hasError = true;
}

if (!html.includes(`content="${expectedOgTitle}"`)) {
  console.error(`[VERIFY-CBM ERROR] og:title does not match expected "${expectedOgTitle}"`);
  hasError = true;
}

if (!html.includes(`content="${expectedDesc}"`)) {
  console.error(`[VERIFY-CBM ERROR] description does not match expected "${expectedDesc}"`);
  hasError = true;
}

// 3. Entry script check
if (!html.includes('assets/cbm-') && !html.includes('src="/src/cbm/main-cbm.jsx"')) {
  console.error('[VERIFY-CBM ERROR] dist/index.html must load the CBM Simulator entry (cbm-*.js), not main entry!');
  hasError = true;
}

if (html.includes('assets/main-') || html.includes('src="/src/main.jsx"')) {
  console.error('[VERIFY-CBM ERROR] dist/index.html erroneously references manual entry (main-*.js)!');
  hasError = true;
}

// 4. Root container check
if (!html.includes('id="cbm-root"')) {
  console.error('[VERIFY-CBM ERROR] dist/index.html must contain #cbm-root container element!');
  hasError = true;
}

if (hasError) {
  console.error('[VERIFY-CBM FAILED] Build output verification failed. Deployment blocked.');
  process.exit(1);
}

console.log('✓ [VERIFY-CBM SUCCESS] dist/index.html strictly verified! Meta, scripts, and content are 100% CBM Simulator.');
