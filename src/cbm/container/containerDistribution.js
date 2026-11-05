// Step 3: 다수 컨테이너 호기별 파레트 배분 최적화 알고리즘

/**
 * 파레트 총 수량 N을 K대 컨테이너에 배분 가능한 정수 파티션 생성
 */
export function generatePartitions(N, K, cap, colCap) {
  const results = [];
  function helper(remN, remK, current) {
    if (remK === 1) {
      if (remN <= cap && remN >= 1) {
        const full = [...current, remN];
        const incompleteCount = full.reduce((sum, n) => sum + (n % colCap), 0);
        results.push({ counts: full, incompleteCount });
      }
      return;
    }
    for (let count = Math.min(cap, remN - remK + 1); count >= 1; count--) {
      helper(remN - count, remK - 1, [...current, count]);
    }
  }
  helper(N, K, []);
  return results;
}

/**
 * 작업 편의성 우선: SKU 블록 응집도 우선 배분
 */
export function tryConvenienceAlloc(pallets, counts, maxWeight) {
  const K = counts.length;
  const buckets = Array.from({ length: K }, () => []);
  const bucketWeights = new Array(K).fill(0);

  const byCargo = new Map();
  for (const p of pallets) {
    const k = p.primaryCargoId || 'other';
    if (!byCargo.has(k)) byCargo.set(k, []);
    byCargo.get(k).push(p);
  }
  for (const [, list] of byCargo.entries()) {
    list.sort((a, b) => (a.isPartial !== b.isPartial ? (a.isPartial ? 1 : -1) : b.totalWeight - a.totalWeight));
  }
  const sortedGroups = Array.from(byCargo.values()).sort((a, b) => b.length - a.length);
  const remaining = sortedGroups.flat();

  for (let bIdx = 0; bIdx < K; bIdx++) {
    const target = counts[bIdx];
    while (buckets[bIdx].length < target && remaining.length > 0) {
      let foundIdx = -1;
      for (let i = 0; i < remaining.length; i++) {
        if (bucketWeights[bIdx] + remaining[i].totalWeight <= maxWeight) {
          foundIdx = i;
          break;
        }
      }
      if (foundIdx === -1) return null;
      const [p] = remaining.splice(foundIdx, 1);
      buckets[bIdx].push(p);
      bucketWeights[bIdx] += p.totalWeight;
    }
  }
  if (remaining.length > 0) return null;
  return { buckets, bucketWeights };
}

/**
 * 균등 밸런스 우선: 열 용량(colCap) 단위로 파레트를 묶어 호기간 중량 차이 최소화
 */
export function tryBalanceAlloc(pallets, counts, maxWeight, colCap) {
  const K = counts.length;
  const buckets = Array.from({ length: K }, () => []);
  const bucketWeights = new Array(K).fill(0);

  const byCargo = new Map();
  for (const p of pallets) {
    const k = p.primaryCargoId || 'other';
    if (!byCargo.has(k)) byCargo.set(k, []);
    byCargo.get(k).push(p);
  }
  for (const [, list] of byCargo.entries()) {
    list.sort((a, b) => (a.isPartial !== b.isPartial ? (a.isPartial ? 1 : -1) : b.totalWeight - a.totalWeight));
  }

  const units = [];
  const singles = [];

  for (const [, list] of byCargo.entries()) {
    while (list.length >= colCap) {
      units.push(list.splice(0, colCap));
    }
    if (list.length > 0) {
      singles.push(...list.splice(0, list.length));
    }
  }
  while (singles.length >= colCap) {
    units.push(singles.splice(0, colCap));
  }

  units.sort((u1, u2) => {
    const w1 = u1.reduce((s, p) => s + p.totalWeight, 0);
    const w2 = u2.reduce((s, p) => s + p.totalWeight, 0);
    return w2 - w1;
  });

  for (const u of units) {
    const uW = u.reduce((s, p) => s + p.totalWeight, 0);
    let bestIdx = -1;
    let minW = Infinity;
    for (let i = 0; i < K; i++) {
      if (buckets[i].length + colCap <= counts[i] && bucketWeights[i] + uW <= maxWeight) {
        if (bucketWeights[i] < minW) {
          minW = bucketWeights[i];
          bestIdx = i;
        }
      }
    }
    if (bestIdx === -1) return null;
    buckets[bestIdx].push(...u);
    bucketWeights[bestIdx] += uW;
  }

  for (const s of singles) {
    let bestIdx = -1;
    let minW = Infinity;
    for (let i = 0; i < K; i++) {
      if (buckets[i].length < counts[i] && bucketWeights[i] + s.totalWeight <= maxWeight) {
        if (bucketWeights[i] < minW) {
          minW = bucketWeights[i];
          bestIdx = i;
        }
      }
    }
    if (bestIdx === -1) return null;
    buckets[bestIdx].push(s);
    bucketWeights[bestIdx] += s.totalWeight;
  }

  return { buckets, bucketWeights };
}

/**
 * 2대 이상 다수 컨테이너 생성 시 파레트 배분 헬퍼 (결정 우선순위 1~6 적용)
 */
export function distributePalletsForMultiContainer({
  validPallets,
  neededCount,
  isConvenienceMode,
  effectiveDoubleStack,
  floorSlotsPerContainer,
  cMaxWeight,
  colCapacity = 2,
  maxWeightPerContainer = 0,
  forcedDistribution = null,
}) {
  const maxWeight = maxWeightPerContainer > 0 ? maxWeightPerContainer : cMaxWeight;
  const contCap = effectiveDoubleStack ? floorSlotsPerContainer * 2 : floorSlotsPerContainer;
  const N = validPallets.length;
  const K = neededCount;

  if (K <= 1) return [validPallets];

  // 1. 후보 파티션 목록 생성
  let partitions = [];
  if (forcedDistribution && forcedDistribution.length === K) {
    partitions = [
      {
        counts: forcedDistribution,
        incompleteCount: forcedDistribution.reduce((s, n) => s + (n % colCapacity), 0),
      },
    ];
  } else {
    const raw = generatePartitions(N, K, contCap, colCapacity);
    // 우선순위 정렬: 1) 미완성 열 수 최소, 2) 선택 전략에 따른 정렬
    raw.sort((a, b) => {
      if (a.incompleteCount !== b.incompleteCount) return a.incompleteCount - b.incompleteCount;
      if (isConvenienceMode) {
        // 앞선 호기에 최대한 완적
        for (let i = 0; i < K; i++) {
          if (b.counts[i] !== a.counts[i]) return b.counts[i] - a.counts[i];
        }
        return 0;
      } else {
        // 분산 균등 (분산 최소화)
        const mean = N / K;
        const varA = a.counts.reduce((s, c) => s + (c - mean) ** 2, 0);
        const varB = b.counts.reduce((s, c) => s + (c - mean) ** 2, 0);
        return varA - varB;
      }
    });
    partitions = raw;
  }

  // 2. 파티션별 배분 시도
  let bestResult = null;
  for (const part of partitions) {
    const counts = part.counts;
    let alloc = null;
    if (isConvenienceMode) {
      alloc = tryConvenienceAlloc(validPallets, counts, maxWeight);
    } else {
      alloc = tryBalanceAlloc(validPallets, counts, maxWeight, colCapacity);
    }
    if (alloc) {
      bestResult = alloc;
      break;
    }
  }

  // 중량 상한으로 인해 정상 파티션이 불가능한 경우 완화 폴백
  if (!bestResult && partitions.length > 0) {
    bestResult = tryConvenienceAlloc(validPallets, partitions[0].counts, Infinity);
  }

  if (!bestResult) {
    // 안전 폴백: 기본 균등 슬라이스
    const chunkSize = Math.ceil(N / K);
    const fallbackBuckets = [];
    for (let i = 0; i < K; i++) {
      fallbackBuckets.push(validPallets.slice(i * chunkSize, (i + 1) * chunkSize));
    }
    return fallbackBuckets;
  }

  // 각 호기 내부 정렬: 주력 SKU 앞벽 배치 + 부분 파레트/홀수 파레트 도어측 배치
  bestResult.buckets.forEach((b) => {
    const skuCounts = new Map();
    for (const p of b) {
      const k = p.primaryCargoId || 'other';
      skuCounts.set(k, (skuCounts.get(k) || 0) + 1);
    }
    b.sort((p1, p2) => {
      if (p1.isPartial !== p2.isPartial) return p1.isPartial ? 1 : -1;
      const k1 = p1.primaryCargoId || 'other';
      const k2 = p2.primaryCargoId || 'other';
      const c1 = skuCounts.get(k1) || 0;
      const c2 = skuCounts.get(k2) || 0;
      if (c1 !== c2) return c2 - c1;
      return p2.totalWeight - p1.totalWeight;
    });

    // 만약 호기 파레트 수가 홀수(미완성 열)라면, 1개의 낱개 파레트를 반드시 맨 마지막(문쪽)으로 보장
    if (colCapacity === 2 && b.length % 2 === 1) {
      const partialIdx = b.findIndex((p) => p.isPartial);
      if (partialIdx !== -1 && partialIdx !== b.length - 1) {
        const [part] = b.splice(partialIdx, 1);
        b.push(part);
      }
    }
  });

  return bestResult.buckets;
}
