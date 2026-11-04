import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const distDir = path.join(rootDir, 'dist');

// Target resolution: 'cbm' | 'manual'
const arg = process.argv[2];
let target = arg;

if (!target) {
  if (process.env.VITE_APP_TARGET === 'manual' || process.env.VITE_APP_TARGET === 'cbm') {
    target = process.env.VITE_APP_TARGET;
  } else if (process.env.VERCEL_PROJECT_NAME) {
    target = process.env.VERCEL_PROJECT_NAME === 'wac-warehouse-manual' ? 'manual' : 'cbm';
  } else if (process.env.VERCEL_URL) {
    if (process.env.VERCEL_URL.includes('wac-warehouse-manual')) {
      target = 'manual';
    } else if (process.env.VERCEL_URL.includes('cbm')) {
      target = 'cbm';
    }
  } else {
    // Check local .vercel/project.json if available
    try {
      const pJsonPath = path.join(rootDir, '.vercel/project.json');
      if (fs.existsSync(pJsonPath)) {
        const pJson = JSON.parse(fs.readFileSync(pJsonPath, 'utf8'));
        if (pJson.projectName === 'wac-warehouse-manual') target = 'manual';
        else if (pJson.projectName === 'wac-cbm-simulator') target = 'cbm';
      }
    } catch (e) {}
  }
}

// Default fallback is 'cbm' for this workspace
if (!target) {
  target = 'cbm';
}

console.log(`=======================================================`);
console.log(`[BUILD] Target site resolved: ${target.toUpperCase()}`);
console.log(`=======================================================`);

// 1. Run Vite Build
console.log(`[BUILD] Running Vite build...`);
execSync('npx vite build', { stdio: 'inherit', cwd: rootDir });

// 2. Post-process dist based on target
if (target === 'cbm') {
  console.log(`[BUILD] Finalizing for wac-cbm-simulator (copying dist/cbm.html -> dist/index.html)...`);
  const cbmHtmlPath = path.join(distDir, 'cbm.html');
  const indexHtmlPath = path.join(distDir, 'index.html');

  if (!fs.existsSync(cbmHtmlPath)) {
    console.error(`[BUILD FATAL] dist/cbm.html was not generated!`);
    process.exit(1);
  }

  fs.copyFileSync(cbmHtmlPath, indexHtmlPath);
  console.log(`[BUILD] Overwrote dist/index.html with simulator HTML.`);

  // 3. Strict Verification Check
  console.log(`[BUILD] Running strict verification check...`);
  execSync('node scripts/verify-cbm-build.js', { stdio: 'inherit', cwd: rootDir });
} else {
  console.log(`[BUILD] Finalizing for wac-warehouse-manual (keeping index.html as manual)...`);
  const indexHtmlPath = path.join(distDir, 'index.html');
  const content = fs.readFileSync(indexHtmlPath, 'utf8');

  if (!content.includes('WAC 인턴 매뉴얼')) {
    console.error(`[BUILD FATAL] Manual index.html verification failed! Missing 'WAC 인턴 매뉴얼'.`);
    process.exit(1);
  }
  console.log(`✓ [BUILD] Manual dist/index.html verified successfully.`);
}

console.log(`=======================================================`);
console.log(`✓ [BUILD SUCCESS] ${target.toUpperCase()} build ready for deployment.`);
console.log(`=======================================================`);
