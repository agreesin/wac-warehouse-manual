// Step 2: 파레트 내부 3D 무게중심(Local CoG), 자투리 층 밀집 블록(Connected Subset) 탐색 및 캔틸레버(허공 걸침) 진단 유틸리티
import { computeBest2DLayer } from '../layerLayout.js';

/**
 * AUTO_MAX 모드에서 단일 파레트 소량 화물(예: 8박스) 적재 시,
 * 혼합 배열(예: 5+3=8, 상부 계단 단차 발생)과 정방향/회전 균일 바둑판(예: 4+4=8, 100% 평탄 완적)의
 * 소요 파레트 수(1PLT)와 소요 단수(2단)가 완전히 동일하다면, 상부 단차 없이 100% 평탄하게 떨어지는 균일 격자를 우선 선택합니다.
 */
export function resolveFlatTopLayerIfSameHeight(
  effW,
  effL,
  boxW,
  boxL,
  allowRotate,
  patternMode,
  quantity,
  maxLayersByH
) {
  const baseTpl = computeBest2DLayer(effW, effL, boxW, boxL, allowRotate, patternMode);
  if (
    patternMode !== 'AUTO_MAX' ||
    !baseTpl ||
    baseTpl.length === 0 ||
    quantity <= 0 ||
    quantity % baseTpl.length === 0
  ) {
    return baseTpl;
  }

  const neededLayers = Math.ceil(quantity / baseTpl.length);
  if (neededLayers < 2 || neededLayers > maxLayersByH) {
    return baseTpl;
  }

  const candidates = ['GRID_NORMAL'];
  if (allowRotate) candidates.push('GRID_ROTATED');

  for (const candPattern of candidates) {
    const gridTpl = computeBest2DLayer(effW, effL, boxW, boxL, allowRotate, candPattern);
    if (
      gridTpl.length > 0 &&
      Math.ceil(quantity / gridTpl.length) === neededLayers &&
      quantity % gridTpl.length === 0
    ) {
      return gridTpl;
    }
  }

  return baseTpl;
}

/**
 * 파레트 내부 3D 무게중심(Local CoG) 계산
 */
export function computePalletLocalCoG(pallet) {
  let momentX = 0;
  let momentY = 0;
  let momentZ = 0;
  let totalMass = 0;

  const baseMass = pallet.tareWeight || 0;
  if (baseMass > 0) {
    momentX += baseMass * (pallet.width / 2);
    momentY += baseMass * (pallet.baseHeight / 2);
    momentZ += baseMass * (pallet.length / 2);
    totalMass += baseMass;
  }

  for (const b of pallet.boxes) {
    const m = b.weight || 0;
    const cx = b.x + b.w / 2;
    const cy = b.y + b.h / 2;
    const cz = b.z + b.l / 2;
    momentX += m * cx;
    momentY += m * cy;
    momentZ += m * cz;
    totalMass += m;
  }

  if (totalMass <= 0) {
    return {
      x: pallet.width / 2,
      y: pallet.totalHeight / 2,
      z: pallet.length / 2,
    };
  }

  return {
    x: Number((momentX / totalMass).toFixed(1)),
    y: Number((momentY / totalMass).toFixed(1)),
    z: Number((momentZ / totalMass).toFixed(1)),
  };
}

/**
 * 두 박스가 서로 인접(Edge-sharing 또는 Corner-touching)하는지 기하학적 검사
 * - inter-box 간극 허용오차(eps=12mm)를 반영하여 실제 포장 시 밀착된 상태 판정
 */
function areBoxesAdjacent(a, b) {
  const eps = 12;
  const aMaxX = a.x + a.w;
  const aMaxZ = a.z + a.l;
  const bMaxX = b.x + b.w;
  const bMaxZ = b.z + b.l;

  const xOverlap = Math.min(aMaxX, bMaxX) - Math.max(a.x, b.x);
  const zOverlap = Math.min(aMaxZ, bMaxZ) - Math.max(a.z, b.z);

  // 모서리 맞닿음(한 축은 실질적 겹침 >= 15mm, 다른 축은 접촉 |gap| <= eps)
  if (xOverlap >= 15 && Math.abs(zOverlap) <= eps) return true;
  if (zOverlap >= 15 && Math.abs(xOverlap) <= eps) return true;
  // 코너 접촉
  if (xOverlap >= -eps && zOverlap >= -eps && (xOverlap >= 0 || zOverlap >= 0)) return true;

  return false;
}

/**
 * 선택된 박스 인덱스 집합이 그래프 상에서 단일 연결 컴포넌트(Connected Component)를 이루는지 검사
 */
function isSubsetConnected(indices, adjList) {
  if (indices.length <= 1) return true;
  const set = new Set(indices);
  const visited = new Set();
  const queue = [indices[0]];
  visited.add(indices[0]);

  while (queue.length > 0) {
    const curr = queue.shift();
    for (const neighbor of adjList[curr]) {
      if (set.has(neighbor) && !visited.has(neighbor)) {
        visited.add(neighbor);
        queue.push(neighbor);
      }
    }
  }
  return visited.size === indices.length;
}

/**
 * 자투리 블록 후보 평가 및 비용(Cost) 산출
 */
function scoreCandidate(indices, template, targetMidX, targetMidZ, adjList) {
  const k = indices.length;
  let minX = Infinity,
    maxX = -Infinity;
  let minZ = Infinity,
    maxZ = -Infinity;
  let sumCx = 0,
    sumCz = 0;
  let totalBoxArea = 0;

  for (const idx of indices) {
    const b = template[idx];
    if (b.x < minX) minX = b.x;
    if (b.x + b.w > maxX) maxX = b.x + b.w;
    if (b.z < minZ) minZ = b.z;
    if (b.z + b.l > maxZ) maxZ = b.z + b.l;
    sumCx += b.x + b.w / 2;
    sumCz += b.z + b.l / 2;
    totalBoxArea += b.w * b.l;
  }

  const spanW = maxX - minX;
  const spanL = maxZ - minZ;
  const bboxArea = spanW * spanL;

  const density = bboxArea > 0 ? Math.min(1.0, totalBoxArea / bboxArea) : 1.0;
  const perimeter = spanW + spanL;
  const cogX = sumCx / k;
  const cogZ = sumCz / k;
  const distToCenter = Math.hypot(cogX - targetMidX, cogZ - targetMidZ);

  let contacts = 0;
  const set = new Set(indices);
  for (const idx of indices) {
    for (const neighbor of adjList[idx]) {
      if (neighbor > idx && set.has(neighbor)) {
        contacts++;
      }
    }
  }

  const densityPenalty = (1.0 - density) * 6000;
  const perimeterPenalty = perimeter * 1.5;
  const centerDistPenalty = distToCenter * 1.0;
  const contactBonus = contacts * 40;

  const cost = densityPenalty + perimeterPenalty + centerDistPenalty - contactBonus;

  return { cost, indices };
}

/**
 * 자투리 잔여 층(Partial Layer) 박스 밀집 직사각형 블록(Adjacent Compact Block) 배치 헬퍼
 */
export function pickBalancedSubset(template, takeCount, palletW, palletL) {
  if (!template || template.length === 0 || takeCount <= 0) return [];
  if (takeCount >= template.length) return template;

  const midX = palletW / 2;
  const midZ = palletL / 2;

  if (takeCount === 1) {
    let best = template[0];
    let bestD = Infinity;
    for (const b of template) {
      const d = Math.hypot(b.x + b.w / 2 - midX, b.z + b.l / 2 - midZ);
      if (d < bestD) {
        bestD = d;
        best = b;
      }
    }
    return [best];
  }

  const N = template.length;

  const adjList = Array.from({ length: N }, () => []);
  for (let i = 0; i < N; i++) {
    for (let j = i + 1; j < N; j++) {
      if (areBoxesAdjacent(template[i], template[j])) {
        adjList[i].push(j);
        adjList[j].push(i);
      }
    }
  }

  const boxDistances = template.map((b, idx) => ({
    idx,
    dist: Math.hypot(b.x + b.w / 2 - midX, b.z + b.l / 2 - midZ),
  }));
  boxDistances.sort((a, b) => a.dist - b.dist);

  if (N > 36) {
    const sorted = [...boxDistances];
    const chosenIndices = [];
    const used = new Set();

    for (let i = 0; i < sorted.length; i++) {
      const idxA = sorted[i].idx;
      if (used.has(idxA)) continue;
      const bA = template[idxA];
      const targetX = 2 * midX - (bA.x + bA.w / 2);
      const targetZ = 2 * midZ - (bA.z + bA.l / 2);

      let bestPartner = -1;
      let minPartnerDist = Infinity;
      for (let j = i + 1; j < sorted.length; j++) {
        const idxB = sorted[j].idx;
        if (used.has(idxB)) continue;
        const bB = template[idxB];
        const d = Math.hypot(bB.x + bB.w / 2 - targetX, bB.z + bB.l / 2 - targetZ);
        if (d < minPartnerDist) {
          minPartnerDist = d;
          bestPartner = idxB;
        }
      }

      if (chosenIndices.length + 2 <= takeCount && bestPartner !== -1 && minPartnerDist < Math.max(bA.w, bA.l) * 2) {
        used.add(idxA);
        used.add(bestPartner);
        chosenIndices.push(idxA, bestPartner);
      } else if (chosenIndices.length + 1 <= takeCount) {
        used.add(idxA);
        chosenIndices.push(idxA);
      }
      if (chosenIndices.length >= takeCount) break;
    }

    for (const item of sorted) {
      if (chosenIndices.length >= takeCount) break;
      if (!used.has(item.idx)) {
        used.add(item.idx);
        chosenIndices.push(item.idx);
      }
    }
    return chosenIndices.map((idx) => template[idx]);
  }

  const candidateMap = new Map();
  const registerCandidate = (indices) => {
    if (indices.length !== takeCount) return;
    if (!isSubsetConnected(indices, adjList)) return;
    const sortedKey = indices
      .slice()
      .sort((a, b) => a - b)
      .join(',');
    if (candidateMap.has(sortedKey)) return;
    const scored = scoreCandidate(indices, template, midX, midZ, adjList);
    candidateMap.set(sortedKey, scored);
  };

  const sampleLimit = Math.min(N, 20);
  for (let i = 0; i < sampleLimit; i++) {
    const idxA = boxDistances[i].idx;
    const a = template[idxA];
    for (let j = i; j < sampleLimit; j++) {
      const idxB = boxDistances[j].idx;
      const b = template[idxB];

      const winMinX = Math.min(a.x, b.x) - 5;
      const winMaxX = Math.max(a.x + a.w, b.x + b.w) + 5;
      const winMinZ = Math.min(a.z, b.z) - 5;
      const winMaxZ = Math.max(a.z + a.l, b.z + b.l) + 5;

      const inside = [];
      for (let m = 0; m < N; m++) {
        const box = template[m];
        const cx = box.x + box.w / 2;
        const cz = box.z + box.l / 2;
        if (cx >= winMinX && cx <= winMaxX && cz >= winMinZ && cz <= winMaxZ) {
          inside.push(m);
        }
      }

      if (inside.length === takeCount) {
        registerCandidate(inside);
      } else if (inside.length === takeCount + 1 && inside.length <= N) {
        for (let dropIdx = 0; dropIdx < inside.length; dropIdx++) {
          const sub = inside.filter((_, k) => k !== dropIdx);
          registerCandidate(sub);
        }
      }
    }
  }

  const seedCount = Math.min(N, 10);
  for (let s = 0; s < seedCount; s++) {
    const seedIdx = boxDistances[s].idx;

    {
      const cluster = [seedIdx];
      const visited = new Set([seedIdx]);
      let minX = template[seedIdx].x;
      let maxX = template[seedIdx].x + template[seedIdx].w;
      let minZ = template[seedIdx].z;
      let maxZ = template[seedIdx].z + template[seedIdx].l;

      while (cluster.length < takeCount) {
        const frontier = new Set();
        for (const cIdx of cluster) {
          for (const neighbor of adjList[cIdx]) {
            if (!visited.has(neighbor)) {
              frontier.add(neighbor);
            }
          }
        }
        if (frontier.size === 0) break;

        let bestNext = -1;
        let bestCost = Infinity;

        for (const fIdx of frontier) {
          const b = template[fIdx];
          const newMinX = Math.min(minX, b.x);
          const newMaxX = Math.max(maxX, b.x + b.w);
          const newMinZ = Math.min(minZ, b.z);
          const newMaxZ = Math.max(maxZ, b.z + b.l);
          const perimeter = newMaxX - newMinX + (newMaxZ - newMinZ);
          const dCenter = Math.hypot(b.x + b.w / 2 - midX, b.z + b.l / 2 - midZ);
          const cost = perimeter * 2 + dCenter;
          if (cost < bestCost) {
            bestCost = cost;
            bestNext = fIdx;
          }
        }

        if (bestNext === -1) break;
        visited.add(bestNext);
        cluster.push(bestNext);
        const b = template[bestNext];
        minX = Math.min(minX, b.x);
        maxX = Math.max(maxX, b.x + b.w);
        minZ = Math.min(minZ, b.z);
        maxZ = Math.max(maxZ, b.z + b.l);
      }
      if (cluster.length === takeCount) {
        registerCandidate(cluster);
      }
    }

    {
      const cluster = [seedIdx];
      const visited = new Set([seedIdx]);
      let sumCx = template[seedIdx].x + template[seedIdx].w / 2;
      let sumCz = template[seedIdx].z + template[seedIdx].l / 2;

      while (cluster.length < takeCount) {
        const frontier = new Set();
        for (const cIdx of cluster) {
          for (const neighbor of adjList[cIdx]) {
            if (!visited.has(neighbor)) {
              frontier.add(neighbor);
            }
          }
        }
        if (frontier.size === 0) break;

        let bestNext = -1;
        let bestDist = Infinity;

        for (const fIdx of frontier) {
          const b = template[fIdx];
          const nextCx = (sumCx + b.x + b.w / 2) / (cluster.length + 1);
          const nextCz = (sumCz + b.z + b.l / 2) / (cluster.length + 1);
          const dCenter = Math.hypot(nextCx - midX, nextCz - midZ);
          if (dCenter < bestDist) {
            bestDist = dCenter;
            bestNext = fIdx;
          }
        }

        if (bestNext === -1) break;
        visited.add(bestNext);
        cluster.push(bestNext);
        sumCx += template[bestNext].x + template[bestNext].w / 2;
        sumCz += template[bestNext].z + template[bestNext].l / 2;
      }
      if (cluster.length === takeCount) {
        registerCandidate(cluster);
      }
    }
  }

  if (candidateMap.size > 0) {
    let bestCandidate = null;
    let minCost = Infinity;
    for (const c of candidateMap.values()) {
      if (c.cost < minCost) {
        minCost = c.cost;
        bestCandidate = c;
      }
    }
    if (bestCandidate) {
      return bestCandidate.indices.map((idx) => template[idx]);
    }
  }

  return boxDistances.slice(0, takeCount).map((item) => template[item.idx]);
}

/**
 * 1단 평면 레이어(template)가 비대칭이어서 짝수 층에서 180° 대칭 교차(INTERLOCK) 시
 * 아래층 지지 없이 허공에 걸치는(Cantilever Overhang) 박스가 발생하는지 검사
 */
export function checkLayerCantileverRisk(template, bounds, palletW, palletL) {
  if (!template || template.length <= 1) {
    return { hasRisk: false, minSupportRatio: 1.0, unsupportedCount: 0, maxOverhangMm: 0, reason: '단일 박스이므로 안전' };
  }

  const offsetX = Math.floor((palletW - bounds.spanW) / 2) - bounds.minX;
  const offsetZ = Math.floor((palletL - bounds.spanL) / 2) - bounds.minZ;
  const bMinX = bounds.minX + offsetX;
  const bMaxX = bounds.maxX + offsetX;
  const bMinZ = bounds.minZ + offsetZ;
  const bMaxZ = bounds.maxZ + offsetZ;

  const tier1Boxes = template.map((p) => {
    const x1 = p.x + offsetX;
    const z1 = p.z + offsetZ;
    return {
      x1,
      z1,
      x2: x1 + p.w,
      z2: z1 + p.l,
      w: p.w,
      l: p.l,
      area: p.w * p.l,
    };
  });

  const tier2Boxes = template.map((p) => {
    const rawX = p.x + offsetX;
    const rawZ = p.z + offsetZ;
    const x1 = bMinX + bMaxX - (rawX + p.w);
    const z1 = bMinZ + bMaxZ - (rawZ + p.l);
    return {
      x1,
      z1,
      x2: x1 + p.w,
      z2: z1 + p.l,
      w: p.w,
      l: p.l,
      area: p.w * p.l,
    };
  });

  let minSupportRatio = 1.0;
  let unsupportedCount = 0;
  let maxOverhangMm = 0;

  for (const b2 of tier2Boxes) {
    let supportedArea = 0;
    let supMinX = Infinity,
      supMaxX = -Infinity,
      supMinZ = Infinity,
      supMaxZ = -Infinity;

    for (const b1 of tier1Boxes) {
      const ox = Math.max(0, Math.min(b2.x2, b1.x2) - Math.max(b2.x1, b1.x1));
      const oz = Math.max(0, Math.min(b2.z2, b1.z2) - Math.max(b2.z1, b1.z1));
      if (ox > 0 && oz > 0) {
        supportedArea += ox * oz;
        supMinX = Math.min(supMinX, Math.max(b2.x1, b1.x1));
        supMaxX = Math.max(supMaxX, Math.min(b2.x2, b1.x2));
        supMinZ = Math.min(supMinZ, Math.max(b2.z1, b1.z1));
        supMaxZ = Math.max(supMaxZ, Math.min(b2.z2, b1.z2));
      }
    }
    const ratio = b2.area > 0 ? supportedArea / b2.area : 0;
    if (ratio < minSupportRatio) {
      minSupportRatio = ratio;
    }
    if (supportedArea > 0) {
      let boxOverhang = Math.max(0, supMinX - b2.x1, b2.x2 - supMaxX, supMinZ - b2.z1, b2.z2 - supMaxZ);
      // L자형 부분 결손(예: 절반은 820mm까지 지지되고 절반은 750mm까지만 지지되어 모서리 70mm가 허공에 뜨는 경우) 정밀 산출
      if (ratio < 0.99 && boxOverhang <= 0) {
        const unsupportedArea = Math.max(0, b2.area - supportedArea);
        boxOverhang = Math.round(unsupportedArea / Math.max(1, Math.min(b2.w, b2.l)));
      }
      maxOverhangMm = Math.max(maxOverhangMm, boxOverhang);
    } else {
      maxOverhangMm = Math.max(maxOverhangMm, b2.w, b2.l);
    }
    if (ratio < 0.99 || maxOverhangMm > 5) {
      unsupportedCount++;
    }
  }

  const hasRisk = unsupportedCount > 0 || minSupportRatio < 0.99 || maxOverhangMm > 5;

  return {
    hasRisk,
    minSupportRatio: Number(minSupportRatio.toFixed(2)),
    unsupportedCount,
    maxOverhangMm: Math.round(maxOverhangMm),
    reason: hasRisk
      ? `1단 배열이 비대칭이어서 짝수단 교차 시 상자 모서리가 약 ${Math.round(maxOverhangMm)}mm 허공에 돌출됨 (지지율 ${(minSupportRatio * 100).toFixed(0)}% — 수직 일자 정렬 권장)`
      : '대칭 배열로 층간 100% 완벽 지지됨',
  };
}
