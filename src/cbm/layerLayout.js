// 2D 파레트 평면 레이아웃 알고리즘 및 상자 자세/파레트 치수 변환 헬퍼
import { PALLET_PRESETS } from './constants.js';

/**
 * 상자 놓는 자세(Posture: 세워 쌓기 vs 앞으로 눕혀 쌓기 vs 옆으로 눕혀 쌓기)에 따른 유효 바닥(W×L) 및 높이(H) 계산
 */
export function resolveCargoBoxDimsByPosture(cargo, postureOverride) {
  const rawW = Math.max(1, Number(cargo.width) || 1);
  const rawL = Math.max(1, Number(cargo.length) || 1);
  const rawH = Math.max(1, Number(cargo.height) || 1);
  const posture = postureOverride || cargo.boxPosture || 'UPRIGHT';

  if (posture === 'FLAT_W_H') {
    return {
      posture: 'FLAT_W_H',
      postureLabel: '📐 앞으로 눕혀 쌓기 (가로×높이 바닥)',
      width: rawW,
      length: rawH,
      height: rawL,
    };
  }
  if (posture === 'FLAT_H_L') {
    return {
      posture: 'FLAT_H_L',
      postureLabel: '📐 옆으로 눕혀 쌓기 (높이×세로 바닥)',
      width: rawH,
      length: rawL,
      height: rawW,
    };
  }
  return {
    posture: 'UPRIGHT',
    postureLabel: '⬆️ 기본 세워 쌓기 (가로×세로 바닥)',
    width: rawW,
    length: rawL,
    height: rawH,
  };
}

/**
 * 화물의 파레트 설정 결정 헬퍼 (개별 지정 규격 우선, 없으면 기본 파레트 규격)
 */
export function resolvePalletDimsForCargo(cargo, defaultPalletConfig) {
  const specId = cargo?.palletSpecId;
  if (specId && specId !== 'DEFAULT' && PALLET_PRESETS[specId]) {
    const preset = PALLET_PRESETS[specId];
    return {
      specId: preset.id,
      specName: preset.shortLabel || preset.name,
      width: preset.width,
      length: preset.length,
    };
  }
  return {
    specId: 'DEFAULT',
    specName: `${defaultPalletConfig.width}×${defaultPalletConfig.length}`,
    width: Math.max(100, Number(defaultPalletConfig.width) || 1100),
    length: Math.max(100, Number(defaultPalletConfig.length) || 1100),
  };
}

/**
 * 2D 평면(W x L) 위에 단일 규격 박스(bw x bl)를 지정된 패턴 모드(patternMode)에 따라 배치하는 레이아웃 계산
 */
export function computeBest2DLayer(
  surfaceW,
  surfaceL,
  boxW,
  boxL,
  allowRotate = true,
  patternMode = 'AUTO_MAX'
) {
  const bw = Math.max(1, Number(boxW) || 1);
  const bl = Math.max(1, Number(boxL) || 1);
  if (bw > surfaceW && bw > surfaceL) return [];
  if (bl > surfaceW && bl > surfaceL) return [];

  const fillGrid = (ox, oz, rw, rl, uw, ul, rotated) => {
    const nx = Math.floor(rw / uw);
    const nz = Math.floor(rl / ul);
    const placements = [];
    for (let iz = 0; iz < nz; iz++) {
      for (let ix = 0; ix < nx; ix++) {
        placements.push({
          x: ox + ix * uw,
          z: oz + iz * ul,
          w: uw,
          l: ul,
          rotated,
        });
      }
    }
    return placements;
  };

  const gridNormal =
    bw <= surfaceW && bl <= surfaceL
      ? fillGrid(0, 0, surfaceW, surfaceL, bw, bl, false)
      : [];
  const gridRotated =
    allowRotate && bl <= surfaceW && bw <= surfaceL
      ? fillGrid(0, 0, surfaceW, surfaceL, bl, bw, true)
      : [];

  if (patternMode === 'GRID_NORMAL') {
    return gridNormal.length > 0 ? gridNormal : gridRotated;
  }
  if (patternMode === 'GRID_ROTATED') {
    return gridRotated.length > 0 ? gridRotated : gridNormal;
  }

  // Generate 4-Quadrant Pinwheel (풍차형 맞물림) candidates
  const pinwheelCandidates = [];
  if (allowRotate && bw !== bl) {
    const maxNx1 = Math.floor(surfaceW / bw);
    const maxNz1 = Math.floor(surfaceL / bl);
    const maxNx2 = Math.floor(surfaceW / bl);
    const maxNz2 = Math.floor(surfaceL / bw);

    for (let nx1 = 1; nx1 <= maxNx1; nx1++) {
      for (let nz1 = 1; nz1 <= maxNz1; nz1++) {
        const W1 = nx1 * bw;
        const L1 = nz1 * bl;
        for (let nx2 = 1; nx2 <= maxNx2; nx2++) {
          const W2 = nx2 * bl;
          if (W1 + W2 > surfaceW) break;
          for (let nz2 = 1; nz2 <= maxNz2; nz2++) {
            const L2 = nz2 * bw;
            if (L1 + L2 > surfaceL) break;

            if ((W1 >= W2 && L2 >= L1) || (W1 <= W2 && L2 <= L1)) {
              const q1 = fillGrid(0, 0, W1, L1, bw, bl, false);
              const q2 = fillGrid(W1, 0, W2, L2, bl, bw, true);
              const q3 = fillGrid(W2, L2, W1, L1, bw, bl, false);
              const q4 = fillGrid(0, L1, W2, L2, bl, bw, true);
              pinwheelCandidates.push([...q1, ...q2, ...q3, ...q4]);
            }
          }
        }
      }
    }
  }

  // Generate Split-Block Mixed candidates (정방향 + 90°회전 블록 조합)
  const splitMixCandidates = [];
  if (allowRotate && bw !== bl) {
    const maxKx = Math.floor(surfaceW / bw);
    for (let k = 1; k <= maxKx; k++) {
      const usedW = k * bw;
      const remW = surfaceW - usedW;
      const part1 = fillGrid(0, 0, usedW, surfaceL, bw, bl, false);
      const part2 = fillGrid(usedW, 0, remW, surfaceL, bl, bw, true);
      if (part1.length > 0 && part2.length > 0) {
        splitMixCandidates.push([...part1, ...part2]);
      }
    }

    const maxKxRot = Math.floor(surfaceW / bl);
    for (let k = 1; k <= maxKxRot; k++) {
      const usedW = k * bl;
      const remW = surfaceW - usedW;
      const part1 = fillGrid(0, 0, usedW, surfaceL, bl, bw, true);
      const part2 = fillGrid(usedW, 0, remW, surfaceL, bw, bl, false);
      if (part1.length > 0 && part2.length > 0) {
        splitMixCandidates.push([...part1, ...part2]);
      }
    }

    const maxMz = Math.floor(surfaceL / bl);
    for (let m = 1; m <= maxMz; m++) {
      const usedL = m * bl;
      const remL = surfaceL - usedL;
      const part1 = fillGrid(0, 0, surfaceW, usedL, bw, bl, false);
      const part2 = fillGrid(0, usedL, surfaceW, remL, bl, bw, true);
      if (part1.length > 0 && part2.length > 0) {
        splitMixCandidates.push([...part1, ...part2]);
      }
    }

    const maxMzRot = Math.floor(surfaceL / bw);
    for (let m = 1; m <= maxMzRot; m++) {
      const usedL = m * bw;
      const remL = surfaceL - usedL;
      const part1 = fillGrid(0, 0, surfaceW, usedL, bl, bw, true);
      const part2 = fillGrid(0, usedL, surfaceW, remL, bw, bl, false);
      if (part1.length > 0 && part2.length > 0) {
        splitMixCandidates.push([...part1, ...part2]);
      }
    }
  }

  if (patternMode === 'PINWHEEL') {
    let bestPin = [];
    for (const cand of pinwheelCandidates) {
      if (cand.length > bestPin.length) bestPin = cand;
    }
    if (bestPin.length > 0) return bestPin;
    for (const cand of splitMixCandidates) {
      if (cand.length > bestPin.length) bestPin = cand;
    }
    if (bestPin.length > 0) return bestPin;
  }

  if (patternMode === 'SPLIT_MIX') {
    let bestMix = [];
    for (const cand of splitMixCandidates) {
      if (cand.length > bestMix.length) bestMix = cand;
    }
    if (bestMix.length > 0) return bestMix;
  }

  const allCandidates = [
    gridNormal,
    gridRotated,
    ...splitMixCandidates,
    ...pinwheelCandidates,
  ];

  let best = [];
  for (const cand of allCandidates) {
    if (cand.length > best.length) {
      best = cand;
    }
  }

  return best;
}

/**
 * 1층 레이어 외곽 바운딩 박스 측정 헬퍼
 */
export function measureLayerBounds(tpl) {
  if (!tpl || tpl.length === 0) return { count: 0, minX: 0, maxX: 0, minZ: 0, maxZ: 0, spanW: 0, spanL: 0 };
  let minX = Infinity,
    maxX = -Infinity,
    minZ = Infinity,
    maxZ = -Infinity;
  for (const b of tpl) {
    if (b.x < minX) minX = b.x;
    if (b.x + b.w > maxX) maxX = b.x + b.w;
    if (b.z < minZ) minZ = b.z;
    if (b.z + b.l > maxZ) maxZ = b.z + b.l;
  }
  return {
    count: tpl.length,
    minX,
    maxX,
    minZ,
    maxZ,
    spanW: Math.round(maxX - minX),
    spanL: Math.round(maxZ - minZ),
  };
}

/**
 * 1단 박스 정방향/회전 수량 요약 텍스트 생성 헬퍼
 */
export function describeLayerOrientation(layer0Boxes) {
  const normalCnt = layer0Boxes.filter((b) => !b.rotated).length;
  const rotCnt = layer0Boxes.filter((b) => b.rotated).length;
  if (normalCnt > 0 && rotCnt > 0) {
    return `정방향 ${normalCnt}개 + 90°회전 ${rotCnt}개 (1단 ${layer0Boxes.length}박스)`;
  }
  if (rotCnt > 0) {
    return `90°회전 ${rotCnt}개 (1단 ${layer0Boxes.length}박스)`;
  }
  return `정방향 ${normalCnt}개 (1단 ${layer0Boxes.length}박스)`;
}
