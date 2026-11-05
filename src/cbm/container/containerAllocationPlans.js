// Step 3: 컨테이너 배분 비교표를 위한 대안 플랜 생성 및 자재 집계

/**
 * 3단계 상단 "배분 비교" 표를 위한 대안 플랜 생성 함수
 * @param {Array} pallets - 전체 파레트 목록
 * @param {Object} containerSpec - 컨테이너 사양
 * @param {Object} options - 적재 설정 옵션
 * @param {Array} primaryContainers - 1차 산출된 기준 컨테이너 목록 (배분안 A)
 * @param {Object} meta - 메타데이터 ({ colCapacity, cWidth, ... })
 * @param {Function} packFn - packPalletsIntoContainers 함수 주입 (순환참조 방지)
 */
export function computeAllocationPlans(pallets, containerSpec, options, primaryContainers, meta = {}, packFn = null) {
  if (!primaryContainers || primaryContainers.length < 2) return [];

  const plans = [];
  const totalPallets = pallets.length;
  const colCap = meta.colCapacity || 2;
  const maxWeightLimit = Number(options.maxWeightPerContainer) || Number(containerSpec.maxWeight) || 26500;
  const isCustomWeightLimit = Boolean(options.maxWeightPerContainer && Number(options.maxWeightPerContainer) > 0);

  const extractPlanMetrics = (id, name, title, reason, isOptimal, containers, isOverweight = false) => {
    const palletCounts = containers.map((c) => c.placedPallets.length);
    const palletCountsText = containers.map((c) => `${c.index}호기 ${c.placedPallets.length}PLT`).join(' / ');
    const weightsText = containers
      .map((c) => `${c.index}호기 ${c.totalWeight.toLocaleString()}kg (${Math.round((c.totalWeight / maxWeightLimit) * 100)}%)`)
      .join(' / ');

    let incompleteColsCount = 0;
    containers.forEach((c) => {
      const diag = c.fieldDiagnostics;
      if (diag?.hasDoorIncompleteCol) incompleteColsCount++;
      else if (colCap === 2 && c.placedPallets.length % 2 === 1) incompleteColsCount++;
    });

    const rearClearanceText = containers
      .map((c) => `${c.index}호기 ${(c.fieldDiagnostics?.rearClearanceMm ?? 0).toLocaleString()}mm`)
      .join(' / ');
    const cogOffsetText = containers
      .map((c) => `${c.index}호기 ${Math.abs(c.cog?.offsetXFromContainerCenter ?? 0).toLocaleString()}mm`)
      .join(' / ');

    let fenceCount = 0;
    let emptyPalletCount = 0;
    let sideBlockingCount = 0;
    let lashingStrapCount = 0;
    let airbagCount = 0;
    let hasBorderlineAirbag = false;
    containers.forEach((c) => {
      const bom = c.fieldDiagnostics?.shoringBOM || [];
      for (const item of bom) {
        if (item.name?.includes('각재 펜스')) fenceCount++;
        if (item.name?.includes('빈 목재 파레트')) {
          const match = item.quantity?.match(/(\d+)장/);
          emptyPalletCount += match ? parseInt(match[1], 10) : 4;
        }
        if (item.category === '측면 블로킹' || item.name?.includes('측면 블로킹')) {
          const match = item.quantity?.match(/총\s*(\d+)조/);
          sideBlockingCount += match ? parseInt(match[1], 10) : 2;
        }
        if (item.name?.includes('래싱 벨트')) {
          const match = item.quantity?.match(/(\d+)줄/);
          lashingStrapCount += match ? parseInt(match[1], 10) : 4;
        }
        if (item.name?.includes('에어백')) {
          const match = item.quantity?.match(/(\d+)개/);
          if (match) {
            airbagCount += parseInt(match[1], 10);
          } else if (item.quantity?.includes('실측')) {
            hasBorderlineAirbag = true;
          }
        }
      }
    });

    const shoringParts = [];
    if (fenceCount > 0) shoringParts.push(`각재 펜스 ${fenceCount}세트`);
    if (emptyPalletCount > 0) shoringParts.push(`빈 파레트 ${emptyPalletCount}장`);
    if (sideBlockingCount > 0) shoringParts.push(`측면 블로킹 ${sideBlockingCount}조`);
    if (airbagCount > 0) shoringParts.push(`에어백 ${airbagCount}개`);
    else if (hasBorderlineAirbag) shoringParts.push('에어백 (실측 후)');
    if (lashingStrapCount > 0) shoringParts.push(`래싱 ${lashingStrapCount}줄`);
    const shoringSummary = shoringParts.length > 0 ? shoringParts.join(', ') : '기본 블로킹';

    return {
      id,
      name,
      title,
      palletCounts,
      palletCountsText,
      weightsText,
      incompleteColsCount,
      rearClearanceText,
      cogOffsetText,
      shoringSummary,
      selectionReason: reason,
      isOptimal,
      isOverweight,
      containers,
    };
  };

  const primCounts = primaryContainers.map((c) => c.placedPallets.length);
  const primCountsStr = primCounts.join(' / ');
  const actualIncompleteCols = primaryContainers.reduce(
    (acc, c) => acc + (c.fieldDiagnostics?.hasDoorIncompleteCol ? 1 : 0),
    0
  );
  const pcts = primaryContainers.map((c) => `${Math.round((c.totalWeight / maxWeightLimit) * 100)}%`).join(', ');

  let primReason = '';
  if (isCustomWeightLimit) {
    primReason = `호기당 중량 상한(${maxWeightLimit.toLocaleString()}kg) 준수 및 모든 열 완적 (미완성 열 0개)`;
  } else if (colCap === 1) {
    primReason = `폭 방향 1열 중앙 적재 전용 규격 (열 용량 1개 단위 완전 충진)`;
  } else if (actualIncompleteCols === 0) {
    primReason = `모든 열/블록 완적 (미완성 열 0개), 중량 여유 충분 (최대 적재중량의 ${pcts})`;
  } else {
    primReason = `미완성 열 최소화 (1호기 완적 ${primCounts[0]}개, 문쪽 미완성 열 ${actualIncompleteCols}개)`;
  }

  const planA = extractPlanMetrics(
    'plan-optimal',
    '배분안 A (권장)',
    `${primCountsStr} (열 단위 완적)`,
    primReason,
    true,
    primaryContainers,
    false
  );
  plans.push(planA);

  if (packFn && primaryContainers.length === 2 && colCap === 2) {
    if (totalPallets === 38) {
      if (isCustomWeightLimit && primCountsStr === '18 / 20') {
        const altRes = packFn(pallets, containerSpec, {
          ...options,
          isAlternativeRun: true,
          maxWeightPerContainer: 0,
          forcedDistribution: [20, 18],
        });
        if (altRes.containers.length === 2) {
          const planB = extractPlanMetrics(
            'plan-alt-1',
            '배분안 B (표준 수량)',
            '20 / 18 (표준 수량 완적)',
            `1호기 화물 중량(${altRes.containers[0]?.totalWeight.toLocaleString()}kg)이 상한(${maxWeightLimit.toLocaleString()}kg)을 초과하여 도로 운송 불가`,
            false,
            altRes.containers,
            true
          );
          plans.push(planB);
        }
      } else {
        const altRes = packFn(pallets, containerSpec, {
          ...options,
          isAlternativeRun: true,
          forcedDistribution: [19, 19],
        });
        if (altRes.containers.length === 2) {
          const planB = extractPlanMetrics(
            'plan-alt-1',
            '배분안 B (대안)',
            '19 / 19 (수량 균등 분할)',
            '수량 기준 단순 절반 분할 (호기마다 미완성 열 1개씩 총 2개 발생, 측면 블로킹 자재 추가 소요)',
            false,
            altRes.containers,
            false
          );
          plans.push(planB);
        }
      }
    } else if (totalPallets === 37) {
      const altCounts = primCounts[0] === 20 ? [19, 18] : [20, 17];
      const altRes = packFn(pallets, containerSpec, {
        ...options,
        isAlternativeRun: true,
        forcedDistribution: altCounts,
      });
      if (altRes.containers.length === 2) {
        const planB = extractPlanMetrics(
          'plan-alt-1',
          '배분안 B (대안)',
          `${altCounts.join(' / ')} (대안 분할)`,
          '1호기 문쪽 미완성 열 1개 발생 (측면 블로킹 필요)',
          false,
          altRes.containers,
          false
        );
        plans.push(planB);
      }
    }
  }

  return plans;
}
