// Step 3: 레인 조합 배치 (Lane Combination Packing / Pinwheel Block) 슬롯 생성

/**
 * EUR(1200×800) 등 폭 방향 비대칭 규격용 레인 조합 배치 슬롯 생성
 * - 길이 2,400mm 블록마다 1,200mm 폭 레인에 가로 방향 3개(각 800mm 길이), 800mm 폭 레인에 세로 방향 2개(각 1,200mm 길이)
 * - 블록당 5개, 사용 폭 2,000mm (컨테이너 내폭 2,352mm에 여유 있게 수용)
 * - 블록마다 두 레인의 좌우 위치를 번갈아 반전(Mirroring)시켜 좌우 무게중심 자동 정렬
 * - 블록을 채우고 남는 길이(예: 20ft 1,098mm)에는 들어가는 방향(가로 800mm) 1개 추가 (총 11개)
 */
export function generateLaneBlockSlots(cLength, cWidth, palletW = 1200, palletL = 800, options = {}) {
  const maxDim = Math.max(palletW, palletL); // 1200
  const minDim = Math.min(palletW, palletL); // 800

  const totalLaneWidth = maxDim + minDim; // 2000
  if (totalLaneWidth > cWidth) return [];

  const blockLength = 2400;
  const countInMaxLane = 3; // 2400 / 800 = 3 (가로 방향)
  const countInMinLane = 2; // 2400 / 1200 = 2 (세로 방향)

  const zGap = Math.floor((cWidth - totalLaneWidth) / 3);
  const slots = [];
  const numBlocks = Math.floor(cLength / blockLength);

  const startInverted = Boolean(options.startInverted);

  for (let b = 0; b < numBlocks; b++) {
    const blockX = b * blockLength;
    const isOdd = (b % 2 === 1) !== startInverted;

    // 짝수 블록: 좌측 레인 1200mm (가로 3개), 우측 레인 800mm (세로 2개)
    // 홀수 블록: 좌측 레인 800mm (세로 2개), 우측 레인 1200mm (가로 3개)
    const leftWidth = isOdd ? minDim : maxDim;
    const leftPalletLen = isOdd ? maxDim : minDim;
    const leftCount = isOdd ? countInMinLane : countInMaxLane;
    const leftZ = zGap;

    const rightWidth = isOdd ? maxDim : minDim;
    const rightPalletLen = isOdd ? minDim : maxDim;
    const rightCount = isOdd ? countInMaxLane : countInMinLane;
    const rightZ = cWidth - rightWidth - zGap;

    const blockSlots = [];
    for (let i = 0; i < leftCount; i++) {
      const x = blockX + i * leftPalletLen;
      blockSlots.push({
        x,
        z: leftZ,
        length: leftPalletLen,
        width: leftWidth,
        laneSide: 'left',
        orientation: leftPalletLen === minDim ? '가로' : '세로',
        blockIndex: b,
      });
    }

    for (let j = 0; j < rightCount; j++) {
      const x = blockX + j * rightPalletLen;
      blockSlots.push({
        x,
        z: rightZ,
        length: rightPalletLen,
        width: rightWidth,
        laneSide: 'right',
        orientation: rightPalletLen === minDim ? '가로' : '세로',
        blockIndex: b,
      });
    }

    // 앞벽부터 순차 적재되도록 X축 오름차순, 좌/우 오름차순 정렬
    blockSlots.sort((s1, s2) => s1.x - s2.x || s1.z - s2.z);
    slots.push(...blockSlots);
  }

  // 블록을 채우고 남는 길이(Remnant length) 처리 (예: 20ft 5,898mm -> 4,800mm 채우고 1,098mm 남음)
  const usedBlockLength = numBlocks * blockLength;
  const remLength = cLength - usedBlockLength;

  if (remLength >= minDim) {
    const b = numBlocks;
    const isOdd = (b % 2 === 1) !== startInverted;
    const blockX = usedBlockLength;
    const laneWidth = maxDim; // 1200
    const palletLen = minDim; // 800
    const placeLeft = !isOdd;
    const z = placeLeft ? zGap : cWidth - laneWidth - zGap;

    slots.push({
      x: blockX,
      z,
      length: palletLen,
      width: laneWidth,
      laneSide: placeLeft ? 'left' : 'right',
      orientation: '가로',
      blockIndex: b,
      isRemnant: true,
    });
  }

  return slots;
}
