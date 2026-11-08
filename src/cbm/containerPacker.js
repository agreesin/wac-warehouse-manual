// Step 3: 컨테이너 내부 파레트 적재(바닥 전체 균등 배치 vs 2단/고단 밀착 배치) 및 오케스트레이션
// 도메인별 세부 로직은 ./container/ 서브모듈로 분리 관리됩니다.

import { CONTAINER_SPECS } from './constants.js';
import { analyzeContainerCoG } from './container/containerCoG.js';
import {
  orientPalletFor2Rows,
  computeStuffingBadge,
  computeFieldDiagnostics,
} from './container/containerShoring.js';
import {
  distributePalletsForMultiContainer,
  generatePartitions,
  tryConvenienceAlloc,
  tryBalanceAlloc,
} from './container/containerDistribution.js';
import { generateLaneBlockSlots } from './container/containerLaneBlock.js';
import { computeAllocationPlans as rawComputeAllocationPlans } from './container/containerAllocationPlans.js';

// 하위 호환성을 위해 기존 export 함수들을 그대로 re-export
export { analyzeContainerCoG };
export { orientPalletFor2Rows, computeStuffingBadge, computeFieldDiagnostics };
export {
  distributePalletsForMultiContainer,
  generatePartitions,
  tryConvenienceAlloc,
  tryBalanceAlloc,
};
export { generateLaneBlockSlots };

export function computeAllocationPlans(
  pallets,
  containerSpec,
  options,
  primaryContainers,
  meta = {},
  packFn = packPalletsIntoContainers
) {
  return rawComputeAllocationPlans(
    pallets,
    containerSpec,
    options,
    primaryContainers,
    meta,
    packFn || packPalletsIntoContainers
  );
}

/**
 * 생성된 파레트들을 컨테이너에 적재 (다중 파레트 규격 혼합, 전 호기 균등 배분, 바닥 전체 배치 vs 2단/밀착 배치 지원)
 */
export function packPalletsIntoContainers(pallets, containerSpecOrId, options = {}) {
  const containerSpec =
    typeof containerSpecOrId === 'string'
      ? CONTAINER_SPECS[containerSpecOrId] || CONTAINER_SPECS['40FT_HC']
      : containerSpecOrId || CONTAINER_SPECS['40FT_HC'];
  const cLength = Number(containerSpec.length) || 12032;
  const cInnerWidth =
    Number(options.wrappingConfig?.containerInnerWidthOption) ||
    Number(containerSpec.width) ||
    2352;
  const cWidth = cInnerWidth;
  const cHeight = Number(containerSpec.height) || 2698;
  const customWeightLimit = Number(options.maxWeightPerContainer) || 0;
  const specMaxWeight = Number(containerSpec.maxWeight) || 26500;
  const cMaxWeight = customWeightLimit > 0 ? customWeightLimit : specMaxWeight;
  const allowDoubleStack = Boolean(options.doubleStack);
  const fullFloorSpread = options.fullFloorSpread !== false; // 기본값(true): 빈 바닥 채움(1단 바닥 전체 균등 배치) / false: 최대한 높게 쌓아 바닥 공간 만들기
  const effectiveDoubleStack = allowDoubleStack || !fullFloorSpread;
  const optimizeCoG = options.optimizeCoG !== false;

  // stuffingStrategy: 'convenience' (작업 편의성 우선 - 품목별 몰아넣기 · 단일 품목 전용 완적)
  //                   'balance' (균등 밸런스 우선 - 전 호기 품목·무게 균등 배분)
  const stuffingStrategy =
    options.stuffingStrategy ||
    (options.balanceContainers === true && options.stuffingStrategy === undefined
      ? 'balance'
      : 'convenience');
  const isConvenienceMode = stuffingStrategy === 'convenience';

  if (!pallets || pallets.length === 0) {
    return {
      containers: [],
      floorSlotsPerContainer: 0,
      maxPalletsPerContainer: 0,
      unfitPallets: [],
      allocationPlans: [],
    };
  }

  const unfitPallets = [];
  const validPallets = [];
  const cDoorH = Number(containerSpec?.doorHeight) || cHeight - 110;
  const maxPassableHeight = Math.min(cHeight, cDoorH);

  for (const p of pallets) {
    const minSide = Math.min(p.width, p.length);
    if (p.totalHeight > maxPassableHeight || minSide > cWidth) {
      unfitPallets.push({
        palletId: p.id,
        index: p.index,
        reason:
          p.totalHeight > cHeight
            ? `파레트 총 높이(${p.totalHeight}mm)가 컨테이너 내부 천장 높이(${cHeight}mm)를 초과합니다.`
            : p.totalHeight > cDoorH
            ? `파레트 총 높이(${p.totalHeight}mm)가 컨테이너 도어 입구 높이(${cDoorH}mm)를 초과하여 문턱 통과가 불가합니다.`
            : `파레트 규격(${p.width}×${p.length}mm)이 컨테이너 내부 폭(${cWidth}mm)을 초과합니다.`,
      });
    } else {
      validPallets.push(p);
    }
  }

  // 파레트 폭 확인: 2열 적재가 가능한지(최소 변 2개를 나란히 놓았을 때 내부 폭 cWidth를 넘지 않는지) 확인
  const minPalletDim = validPallets.reduce(
    (min, p) => Math.min(min, Math.min(p.width, p.length)),
    Infinity
  );
  const canFit2Rows = isFinite(minPalletDim) && minPalletDim * 2 <= cWidth;
  const rowsPerContainer = canFit2Rows ? 2 : 1;

  const isAllEur =
    validPallets.length > 0 &&
    validPallets.every(
      (p) =>
        (p.width === 1200 && p.length === 800) ||
        (p.width === 800 && p.length === 1200) ||
        p.palletSpecId === 'EUR'
    );

  let useLaneCombination = false;
  let laneSlotsTemplate = [];

  if (isAllEur) {
    const testSlots = generateLaneBlockSlots(cLength, cWidth, 1200, 800);
    // 표준 2열 용량: EUR는 가로 2개가 폭(2352)에 안 들어가므로 세로(폭800) 2개로 놓을 시 40ft 20개, 20ft 8개
    const standard2RowCap = Math.floor(cLength / 1200) * 2;
    if (testSlots.length > standard2RowCap) {
      useLaneCombination = true;
      laneSlotsTemplate = testSlots;
    }
  }

  const avgLength =
    validPallets.reduce((acc, p) => acc + Math.max(p.width, p.length), 0) /
    Math.max(1, validPallets.length);
  const colsPerContainer = Math.max(1, Math.floor(cLength / Math.min(1150, avgLength)));
  const floorSlotsPerContainer = useLaneCombination
    ? (cLength < 7000 ? 11 : 24)
    : colsPerContainer * rowsPerContainer;
  const colCapacity = useLaneCombination ? 5 : (canFit2Rows ? 2 : 1);

  // 2단 적재 최대 높이 한도: 컨테이너 도어 높이(doorHeight) - 지게차 인양 여유(기본 100mm, 설정값)
  const FORKLIFT_LIFT_MARGIN =
    Number(options.wrappingConfig?.forkliftLiftingClearanceMm) || 100;
  const maxDoubleStackTotalHeight = Math.min(cHeight, cDoorH - FORKLIFT_LIFT_MARGIN);

  let orderedContainerBuckets = [];

  const tryPackSingleContainer = (palletList) => {
    let workingList = [...palletList];

    if (optimizeCoG && workingList.length > 2) {
      if (isConvenienceMode) {
        // 작업 편의성 모드: SKU별 블록을 해체하지 않고, 각 SKU 블록 내부에서만 안정 정렬 + 자투리(부분 파레트)는 도어 쪽(끝)으로 유지
        const byCargoInCont = new Map();
        for (const p of workingList) {
          const k = p.primaryCargoId || 'other';
          if (!byCargoInCont.has(k)) byCargoInCont.set(k, []);
          byCargoInCont.get(k).push(p);
        }
        const rebuilt = [];
        const trailingPartials = [];
        // 완적 파레트가 많은 주력 SKU 순서로 정렬하여 앞벽부터 밀착 배치 (예: 박스B 7열 -> 박스A 완적 1열 -> 문쪽 자투리 열)
        const sortedCargoEntries = Array.from(byCargoInCont.entries()).sort((a, b) => {
          const fullsA = a[1].filter((p) => !p.isPartial).length;
          const fullsB = b[1].filter((p) => !p.isPartial).length;
          if (fullsB !== fullsA) return fullsB - fullsA;
          return b[1].length - a[1].length;
        });
        for (const [, list] of sortedCargoEntries) {
          const fulls = list.filter((p) => !p.isPartial);
          const parts = list.filter((p) => p.isPartial);
          fulls.sort((a, b) => b.totalWeight - a.totalWeight);
          rebuilt.push(...fulls);
          trailingPartials.push(...parts);
        }
        workingList = [...rebuilt, ...trailingPartials];
      } else {
        // 균등 밸런스 모드: 전 파레트 중량 기반 전후/좌우 밸런싱 재배치
        workingList.sort((a, b) => {
          if (a.isPartial !== b.isPartial) return a.isPartial ? 1 : -1;
          return b.totalWeight - a.totalWeight;
        });

        const fullHeavy = workingList.filter((p) => !p.isPartial);
        const partials = workingList.filter((p) => p.isPartial);
        if (fullHeavy.length >= 6) {
          const reordered = new Array(fullHeavy.length);
          let leftPtr = 0;
          let rightPtr = fullHeavy.length - 1;
          const asc = [...fullHeavy].sort((a, b) => a.totalWeight - b.totalWeight);
          asc.forEach((item, idx) => {
            if (idx % 2 === 0) {
              reordered[leftPtr++] = item;
            } else {
              reordered[rightPtr--] = item;
            }
          });
          workingList = [...reordered, ...partials];
        }
      }
    }

    // 선택사항('최대한 높게 쌓아 바닥 공간 만들기', fullFloorSpread === false)일 때:
    // 상단 적재 가능한 파레트를 2단(Tier 2)으로 예약하여 1단 바닥 사용 열 수를 줄이고 바닥 여유 공간을 확보
    const reservedForTier2 = [];
    if (!fullFloorSpread && workingList.length > 2) {
      const ascendingByHeight = [...workingList].sort(
        (a, b) => a.totalHeight - b.totalHeight || a.totalWeight - b.totalWeight
      );
      const usedBottomIds = new Set();
      const reservedTopIds = new Set();
      const maxTier2Allowed = Math.min(
        floorSlotsPerContainer,
        Math.floor(workingList.length / 2)
      );

      for (const topCand of ascendingByHeight) {
        if (reservedTopIds.has(topCand.id)) continue;
        if (reservedTopIds.size >= maxTier2Allowed) break;

        const bottomMatch = workingList.find(
          (b) =>
            b.id !== topCand.id &&
            !b.isPartial &&
            !topCand.isPartial &&
            !b.noDoubleStack &&
            !topCand.noDoubleStack &&
            !usedBottomIds.has(b.id) &&
            !reservedTopIds.has(b.id) &&
            ((b.width === topCand.width && b.length === topCand.length) ||
              (b.width === topCand.length && b.length === topCand.width)) &&
            b.totalHeight + topCand.totalHeight <= maxDoubleStackTotalHeight &&
            topCand.totalWeight <= b.totalWeight
        );
        if (bottomMatch) {
          usedBottomIds.add(bottomMatch.id);
          reservedTopIds.add(topCand.id);
          reservedForTier2.push(topCand);
        }
      }

      if (reservedTopIds.size > 0) {
        workingList = workingList.filter((p) => !reservedTopIds.has(p.id));
      }
    }

    const placedPallets = [];
    const overflowPallets = [];
    let currentWeight = 0;
    let cursorX = 0;
    let slotCounter = 0;

    const targetFloorPallets = Math.min(workingList.length, floorSlotsPerContainer);
    const estCols = Math.ceil(targetFloorPallets / 2);
    const rawLengthSum = workingList
      .slice(0, targetFloorPallets)
      .reduce((acc, p, i) => (i % 2 === 0 ? acc + Math.max(p.width, p.length) : acc), 0);
    const needsTightFit =
      !fullFloorSpread || rawLengthSum + Math.max(0, estCols - 1) * 12 > cLength;
    // 실무 기준: 열 사이 간격 없이 앞벽부터 0mm 밀착 배치하여 잔여 길이를 도어 쪽에 집결시킴
    const colGapX = 0;

    let idx = 0;
    const openTopSlots = [];
    const placedColumns = [];

    // PHASE 1: 컨테이너 1단 바닥(Tier 1) 우선 배치
    if (useLaneCombination) {
      // [EUR 등 직사각형 규격 레인 조합 블록 배치 (Lane Combination)]
      // 길이 2,400mm 블록당 폭 1,200mm 레인(가로 3개, 각 길이 800mm) + 폭 800mm 레인(세로 2개, 각 길이 1,200mm) = 총 5개
      // 블록마다 두 레인의 좌우 위치를 반전하여 좌우 무게중심 0mm 수렴
      // 컨테이너 인덱스(호기)별로 시작 위치를 교대하여 다수 호기 전체의 좌우 균형도 최적화
      const contIdx = containers.length;
      const laneSlots = generateLaneBlockSlots(cLength, cWidth, 1200, 800, {
        startInverted: contIdx % 2 === 1,
      });

      for (const slotDef of laneSlots) {
        if (idx >= workingList.length) break;
        const p = workingList[idx];
        if (currentWeight + p.totalWeight > cMaxWeight && placedPallets.length > 0) {
          break;
        }

        const slot = {
          pallet: p,
          slotIndex: slotCounter++,
          tier: 1,
          x: slotDef.x,
          y: 0,
          z: slotDef.z,
          length: slotDef.length,
          width: slotDef.width,
          rotated: slotDef.orientation === '가로',
          orientation: slotDef.orientation, // '가로' | '세로'
          laneSide: slotDef.laneSide,
          blockIndex: slotDef.blockIndex,
        };

        placedPallets.push(slot);
        currentWeight += p.totalWeight;
        cursorX = Math.max(cursorX, slotDef.x + slotDef.length);

        if (p.totalHeight < cHeight - 200) {
          openTopSlots.push({ slotRef: slot, bottomPallet: p });
        }
        idx++;
      }
    } else {
      while (idx < workingList.length) {
        const p1 = workingList[idx];

        if (currentWeight + p1.totalWeight > cMaxWeight && placedPallets.length > 0) {
          break;
        }

        const p2Candidate = idx + 1 < workingList.length ? workingList[idx + 1] : null;

        let o1 = orientPalletFor2Rows(p1, cWidth, false);
        let o2 = p2Candidate ? orientPalletFor2Rows(p2Candidate, cWidth, false) : null;

        if (needsTightFit && p2Candidate) {
          const tryO1 = orientPalletFor2Rows(p1, cWidth, true);
          const tryO2 = orientPalletFor2Rows(p2Candidate, cWidth, true);
          if (tryO1.widthZ + tryO2.widthZ <= cWidth) {
            o1 = tryO1;
            o2 = tryO2;
          } else if (tryO1.widthZ + o2.widthZ <= cWidth) {
            o1 = tryO1;
          } else if (o1.widthZ + tryO2.widthZ <= cWidth) {
            o2 = tryO2;
          }
        } else if (!fullFloorSpread && !p2Candidate) {
          const tryO1 = orientPalletFor2Rows(p1, cWidth, true);
          if (tryO1.widthZ <= cWidth) o1 = tryO1;
        }

        if (cursorX + o1.lengthX > cLength) {
          break;
        }

        const canPlaceP2 =
          Boolean(p2Candidate) &&
          o1.widthZ + o2.widthZ <= cWidth &&
          cursorX + o2.lengthX <= cLength &&
          currentWeight + p1.totalWeight + p2Candidate.totalWeight <= cMaxWeight;

        if (canPlaceP2) {
          const totalZ = o1.widthZ + o2.widthZ;
          const zGap = Math.max(8, Math.floor((cWidth - totalZ) / 3));
          const zLeft = Math.max(0, zGap);
          const zRight = Math.max(zLeft + o1.widthZ + 4, cWidth - o2.widthZ - Math.max(0, zGap));

          const slot1 = {
            pallet: p1,
            slotIndex: slotCounter++,
            tier: 1,
            x: cursorX,
            y: 0,
            z: zLeft,
            length: o1.lengthX,
            width: o1.widthZ,
            rotated: o1.rotated,
          };
          const slot2 = {
            pallet: p2Candidate,
            slotIndex: slotCounter++,
            tier: 1,
            x: cursorX,
            y: 0,
            z: zRight,
            length: o2.lengthX,
            width: o2.widthZ,
            rotated: o2.rotated,
          };

          placedPallets.push(slot1, slot2);
          const colLen = Math.max(o1.lengthX, o2.lengthX);
          placedColumns.push({ slots: [slot1, slot2], colLen });

          currentWeight += p1.totalWeight + p2Candidate.totalWeight;
          cursorX += colLen + colGapX;

          if (p1.totalHeight < cHeight - 200) {
            openTopSlots.push({ slotRef: slot1, bottomPallet: p1 });
          }
          if (p2Candidate.totalHeight < cHeight - 200) {
            openTopSlots.push({ slotRef: slot2, bottomPallet: p2Candidate });
          }

          idx += 2;
        } else {
          const zCentered = Math.max(0, Math.floor((cWidth - o1.widthZ) / 2));
          const slot1 = {
            pallet: p1,
            slotIndex: slotCounter++,
            tier: 1,
            x: cursorX,
            y: 0,
            z: zCentered,
            length: o1.lengthX,
            width: o1.widthZ,
            rotated: o1.rotated,
            isSingleIncompleteCol: canFit2Rows,
            leftGapMm: zCentered,
            rightGapMm: cWidth - (zCentered + o1.widthZ),
          };

          placedPallets.push(slot1);
          placedColumns.push({ slots: [slot1], colLen: o1.lengthX });

          currentWeight += p1.totalWeight;
          cursorX += o1.lengthX + colGapX;

          if (p1.totalHeight < cHeight - 200) {
            openTopSlots.push({ slotRef: slot1, bottomPallet: p1 });
          }

          idx += 1;
        }
      }
    }

    // 기본값('빈 바닥 채움 — 1단 평적')일 때:
    // 실무 기준에 따라 열 사이 간격 없이 앞벽부터 밀착 배치 (남는 길이는 도어 쪽에 모이게 함)
    // 레인 조합 배치는 이미 블록 단위 밀착 배치(0mm)가 완료되었으므로 열 재정렬을 건너뜀
    if (!useLaneCombination && fullFloorSpread && placedColumns.length >= 2) {
      let spreadX = 0;
      for (const col of placedColumns) {
        for (const s of col.slots) {
          s.x = spreadX;
        }
        spreadX += col.colLen; // 간격 없이 앞벽부터 밀착 배치
      }
      cursorX = spreadX;
    }

    // PHASE 2: 2단(Tier 2) 적재 배치
    const tier2Candidates = [...reservedForTier2, ...workingList.slice(idx)];
    if (effectiveDoubleStack && tier2Candidates.length > 0 && openTopSlots.length > 0) {
      const midX = cursorX / 2;
      openTopSlots.sort(
        (a, b) =>
          Math.abs(a.slotRef.x + a.slotRef.length / 2 - midX) -
          Math.abs(b.slotRef.x + b.slotRef.length / 2 - midX)
      );

      for (const cand of tier2Candidates) {
        // 2단 적재 허용 조건 (실무 안전 기준):
        // 1. 하단 및 상단 모두 자투리 파레트(isPartial)가 아닐 것
        // 2. 하단 및 상단 화물 모두 '2단 적재 금지(noDoubleStack)' 옵션이 아닐 것
        // 3. 규격 일치: 상단 파레트와 하단 파레트의 가로·세로 규격이 동일할 것 (T11 위에 T12 적재 금지)
        // 4. 높이 제한: 합산 높이가 도어 높이 - 지게차 인양 여유(100mm) 이내일 것
        // 5. 중량 제한: 컨테이너 최대 적재중량 이하 + 상경하중 원칙(위 파레트가 아래보다 무거우면 안 됨)
        const sIdx = openTopSlots.findIndex(
          (s) =>
            !s.bottomPallet.isPartial &&
            !cand.isPartial &&
            !s.bottomPallet.noDoubleStack &&
            !cand.noDoubleStack &&
            ((s.bottomPallet.width === cand.width && s.bottomPallet.length === cand.length) ||
              (s.bottomPallet.width === cand.length && s.bottomPallet.length === cand.width)) &&
            s.bottomPallet.totalHeight + cand.totalHeight <= maxDoubleStackTotalHeight &&
            currentWeight + cand.totalWeight <= cMaxWeight &&
            cand.totalWeight <= s.bottomPallet.totalWeight
        );
        if (sIdx !== -1) {
          const target = openTopSlots.splice(sIdx, 1)[0];
          const targetSlot = target.slotRef;
          placedPallets.push({
            pallet: cand,
            slotIndex: targetSlot.slotIndex,
            tier: 2,
            stackedOn: target.bottomPallet.id,
            x: targetSlot.x,
            y: target.bottomPallet.totalHeight,
            z: targetSlot.z,
            length: targetSlot.length,
            width: targetSlot.width,
            rotated: targetSlot.rotated,
          });
          currentWeight += cand.totalWeight;
        } else {
          overflowPallets.push(cand);
        }
      }
    } else if (tier2Candidates.length > 0) {
      overflowPallets.push(...tier2Candidates);
    }

    return { placedPallets, overflowPallets };
  };

  // 다수 컨테이너(2대 이상) 생성 시 적재 전략 분기:
  // 1) 'convenience' (작업 편의성 우선): 단일 품목 완적 호기 우선 생성 & 호기별 품목 블록화
  // 2) 'balance' (균등 밸런스 우선): 전 호기에 품목·중량 균등 분산
  const containers = [];

  if (validPallets.length > 0) {
    if (options.forcedDistribution && options.forcedDistribution.length > 0) {
      const forcedK = options.forcedDistribution.length;
      orderedContainerBuckets = distributePalletsForMultiContainer({
        validPallets,
        neededCount: forcedK,
        isConvenienceMode,
        effectiveDoubleStack,
        floorSlotsPerContainer,
        cMaxWeight,
        colCapacity,
        maxWeightPerContainer: customWeightLimit,
        forcedDistribution: options.forcedDistribution,
      });
    } else {
      const totalPalletWeight = validPallets.reduce((s, p) => s + p.totalWeight, 0);
      const minKBySlots = Math.max(
        1,
        Math.ceil(validPallets.length / (effectiveDoubleStack ? floorSlotsPerContainer * 2 : floorSlotsPerContainer))
      );
      const minKByWeight = cMaxWeight > 0 ? Math.max(1, Math.ceil(totalPalletWeight / cMaxWeight)) : 1;
      const minK = Math.max(minKBySlots, minKByWeight);

      let foundValid = false;
      for (let k = minK; k <= minK + 5 && k <= 50; k++) {
        if (k === 1) {
          const testRes = tryPackSingleContainer(validPallets);
          if (testRes.overflowPallets.length === 0) {
            orderedContainerBuckets = [validPallets];
            foundValid = true;
            break;
          }
          continue;
        }

        const candidateBuckets = distributePalletsForMultiContainer({
          validPallets,
          neededCount: k,
          isConvenienceMode,
          effectiveDoubleStack,
          floorSlotsPerContainer,
          cMaxWeight,
          colCapacity,
          maxWeightPerContainer: customWeightLimit,
        });

        if (candidateBuckets && candidateBuckets.length === k) {
          let allFit = true;
          for (const bucket of candidateBuckets) {
            const packCheck = tryPackSingleContainer(bucket);
            if (packCheck.overflowPallets.length > 0) {
              allFit = false;
              break;
            }
          }
          if (allFit) {
            orderedContainerBuckets = candidateBuckets;
            foundValid = true;
            break;
          }
        }
      }

      if (!foundValid) {
        let testRem = [...validPallets];
        let neededCount = 0;
        while (testRem.length > 0 && neededCount < 50) {
          const res = tryPackSingleContainer(testRem);
          if (res.placedPallets.length === 0) break;
          neededCount++;
          testRem = res.overflowPallets;
        }
        if (neededCount >= 2) {
          orderedContainerBuckets = distributePalletsForMultiContainer({
            validPallets,
            neededCount,
            isConvenienceMode,
            effectiveDoubleStack,
            floorSlotsPerContainer,
            cMaxWeight,
            colCapacity,
            maxWeightPerContainer: customWeightLimit,
          });
        }
      }
    }
  }

  if (orderedContainerBuckets.length > 0) {
    let leftover = [];
    orderedContainerBuckets.forEach((bucket) => {
      const combined = [...leftover, ...bucket];
      const res = tryPackSingleContainer(combined);
      if (res.placedPallets.length > 0) {
        containers.push({
          id: `container-${containers.length + 1}`,
          index: containers.length + 1,
          spec: containerSpec,
          placedPallets: res.placedPallets,
        });
      }
      leftover = res.overflowPallets;
    });
    while (leftover.length > 0) {
      const res = tryPackSingleContainer(leftover);
      if (res.placedPallets.length === 0) break;
      containers.push({
        id: `container-${containers.length + 1}`,
        index: containers.length + 1,
        spec: containerSpec,
        placedPallets: res.placedPallets,
      });
      leftover = res.overflowPallets;
    }
  } else {
    let rem = [...validPallets];
    while (rem.length > 0) {
      const res = tryPackSingleContainer(rem);
      if (res.placedPallets.length === 0) break;
      containers.push({
        id: `container-${containers.length + 1}`,
        index: containers.length + 1,
        spec: containerSpec,
        placedPallets: res.placedPallets,
      });
      rem = res.overflowPallets;
    }
  }

  const containerInternalCbm = (cLength * cWidth * cHeight) / 1e9;
  for (const c of containers) {
    let totalW = 0;
    let cargoCbm = 0;
    let envCbm = 0;
    let boxesCnt = 0;
    const skuBreakdown = {};

    for (const pp of c.placedPallets) {
      const p = pp.pallet;
      totalW += p.totalWeight;
      cargoCbm += p.cargoCbm;
      envCbm += p.totalCbm;
      boxesCnt += p.boxes.length;

      const label = `${p.primaryCargoName || '혼적'} (${p.width}×${p.length})`;
      if (!skuBreakdown[label]) {
        skuBreakdown[label] = { pallets: 0, boxes: 0, weight: 0 };
      }
      skuBreakdown[label].pallets += 1;
      skuBreakdown[label].boxes += p.boxes.length;
      skuBreakdown[label].weight = Number(
        (skuBreakdown[label].weight + p.totalWeight).toFixed(1)
      );
    }

    c.totalWeight = Number(totalW.toFixed(1));
    c.cargoCbm = Number(cargoCbm.toFixed(3));
    c.palletEnvelopeCbm = Number(envCbm.toFixed(3));
    c.boxCount = boxesCnt;
    c.skuBreakdown = Object.entries(skuBreakdown).map(([name, info]) => ({
      name,
      palletCount: info.pallets,
      boxes: info.boxes,
      weightKg: Number(info.weight.toFixed(1)),
    }));
    c.internalCbm = Number(containerInternalCbm.toFixed(2));
    c.volumeUtilization = Number(
      Math.min(100, (c.palletEnvelopeCbm / containerInternalCbm) * 100).toFixed(1)
    );
    c.cargoVolumeUtilization = Number(
      Math.min(100, (c.cargoCbm / containerInternalCbm) * 100).toFixed(1)
    );
    c.weightUtilization = Number(
      Math.min(100, (c.totalWeight / cMaxWeight) * 100).toFixed(1)
    );
    c.tier1Count = c.placedPallets.filter((p) => p.tier === 1).length;
    c.tier2Count = c.placedPallets.filter((p) => p.tier === 2).length;
    c.cog = analyzeContainerCoG(c);
    c.stuffingStrategy = stuffingStrategy;

    c.isLaneCombination = useLaneCombination;

    // 실무 적재 유형 뱃지
    c.stuffingBadge = computeStuffingBadge(c, cLength, effectiveDoubleStack, isConvenienceMode);

    // 현장 적재 정밀 진단 (도어 여유고, 쇼링 여유, 유격, 도어측 낙하 방지 쇼링 가이드, BOM)
    c.fieldDiagnostics = computeFieldDiagnostics(c, containerSpec, cLength, cWidth, cHeight, options);
  }

  const allocationPlans = !options.isAlternativeRun
    ? rawComputeAllocationPlans(
        pallets,
        containerSpec,
        options,
        containers,
        {
          canFit2Rows,
          colCapacity,
          useLaneCombination,
          cWidth,
        },
        packPalletsIntoContainers
      )
    : [];

  return {
    containers,
    floorSlotsPerContainer,
    maxPalletsPerContainer: floorSlotsPerContainer * (effectiveDoubleStack ? 2 : 1),
    unfitPallets,
    allocationPlans,
  };
}
