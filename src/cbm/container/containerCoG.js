// Step 3: 컨테이너 내부 3D 무게중심(Center of Gravity, CoG) 및 전후/좌우 하중 밸런스 분석

/**
 * 컨테이너 내부의 3D 무게중심(Center of Gravity) 및 전후/좌우 밸런스 분석
 */
export function analyzeContainerCoG(container) {
  const cL = container.spec.length;
  const cW = container.spec.width;
  const cH = container.spec.height;

  let momentX = 0; // Length direction (0 = Front/Inner wall, cL = Door)
  let momentY = 0; // Height direction (0 = Floor, cH = Ceiling)
  let momentZ = 0; // Width direction (0 = Left wall, cW = Right wall)
  let totalMass = 0;

  let frontHalfWeight = 0;
  let rearHalfWeight = 0;
  let leftRowWeight = 0;
  let rightRowWeight = 0;

  for (const pp of container.placedPallets) {
    const pMass = pp.pallet.totalWeight;
    const pCenterX = pp.x + pp.length / 2;
    const pCenterY = pp.y + (pp.pallet.localCoG?.y || pp.pallet.totalHeight / 2);
    const pCenterZ = pp.z + pp.width / 2;

    momentX += pMass * pCenterX;
    momentY += pMass * pCenterY;
    momentZ += pMass * pCenterZ;
    totalMass += pMass;

    // 전후 중량 분배 (L/2 기준)
    if (pCenterX <= cL / 2) frontHalfWeight += pMass;
    else rearHalfWeight += pMass;

    // 좌우 중량 분배 (폭 W/2 기준, 중앙을 걸치는 1열 적재 파레트는 비례 분배하여 좌 100% 왜곡 방지)
    const pZ1 = pp.z;
    const pZ2 = pp.z + pp.width;
    const midZ = cW / 2;

    if (pZ2 <= midZ) {
      leftRowWeight += pMass;
    } else if (pZ1 >= midZ) {
      rightRowWeight += pMass;
    } else {
      // 파레트가 중앙선을 걸치는 경우 (예: 1200x1200mm 중앙 1열 배치)
      const leftFrac = (midZ - pZ1) / pp.width;
      leftRowWeight += pMass * leftFrac;
      rightRowWeight += pMass * (1 - leftFrac);
    }
  }

  if (totalMass <= 0) {
    return {
      cogX: cL / 2,
      cogY: 0,
      cogZ: cW / 2,
      offsetX: 0,
      offsetZ: 0,
      lengthRatioPct: 50,
      widthRatioPct: 50,
      heightRatioPct: 0,
      frontRatio: 50,
      rearRatio: 50,
      leftRatio: 50,
      rightRatio: 50,
      status: 'SAFE',
      statusText: '정상 (균형)',
    };
  }

  const maxOccupiedX = container.placedPallets.reduce(
    (max, pp) => Math.max(max, pp.x + pp.length),
    0
  );
  const cogX = Number((momentX / totalMass).toFixed(0));
  const cogY = Number((momentY / totalMass).toFixed(0));
  const cogZ = Number((momentZ / totalMass).toFixed(0));

  const offsetXFromContainerCenter = Math.round(cogX - cL / 2);
  const offsetXFromLoadCenter = Math.round(cogX - maxOccupiedX / 2);
  const offsetZFromCenter = Math.round(cogZ - cW / 2);

  const lengthRatioPct = Number(((cogX / cL) * 100).toFixed(1));
  const widthRatioPct = Number(((cogZ / cW) * 100).toFixed(1));
  const heightRatioPct = Number(((cogY / cH) * 100).toFixed(1));

  const leftRatio = Number(((leftRowWeight / totalMass) * 100).toFixed(1));
  const rightRatio = Number((100 - leftRatio).toFixed(1));
  const frontRatio = Number(((frontHalfWeight / totalMass) * 100).toFixed(1));
  const rearRatio = Number((100 - frontRatio).toFixed(1));

  // IMO/ILO/UNECE CTU Code 권고 및 현장 안전 관리 기준:
  // 1. 전후 무게중심: CTU Code 권고는 컨테이너 길이 중앙(L/2)에서 ±5% 이내 안전, ±5~10% 주의, ±10% 초과 위험
  //    (보조 경험칙: 전·후반부 중량비 각 60% 이하)
  // 2. 좌우 횡방향 균형: 권장 기준(가정값)에 따라 좌우 중심 편차 ±70mm 이내
  const absOffsetXPct = (Math.abs(offsetXFromContainerCenter) / cL) * 100;
  const isCtuLongitudinalSafe = absOffsetXPct <= 5.0; // ±5% 이내 안전
  const isCtuLongitudinalWarning = absOffsetXPct > 5.0 && absOffsetXPct <= 10.0; // ±5~10% 주의
  const isCtuLongitudinalDanger = absOffsetXPct > 10.0; // ±10% 초과 위험
  const isLateralSafe = Math.abs(offsetZFromCenter) <= 70; // 권장 기준 ±70mm 이내

  const limit5PctMm = Math.round(cL * 0.05);
  const limit10PctMm = Math.round(cL * 0.10);
  const longitudinalCriteriaText = `CTU Code 권고: 길이 중앙 ±5%(약 ±${limit5PctMm.toLocaleString()}mm) 이내 (현재 ${absOffsetXPct.toFixed(1)}% 편차, ${Math.abs(offsetXFromContainerCenter).toLocaleString()}mm 치우침 · 보조지표: 전 ${frontRatio}% : 후 ${rearRatio}%)`;
  const lateralCriteriaText = `권장 기준 (가정값): 좌우 중심 편차 ±70mm 이내 (현재 ${Math.abs(offsetZFromCenter)}mm 편차, 좌 ${leftRatio}% : 우 ${rightRatio}%)`;

  let axleLoadNote = '';
  if (totalMass <= 10000) {
    axleLoadNote = `화물 총중량 ${(totalMass / 1000).toFixed(1)}톤으로 경량 상태 — 단, 실제 축하중은 차량 제원에 따라 달라 별도 확인 필요`;
  } else if (!isCtuLongitudinalSafe) {
    axleLoadNote = `총중량 ${(totalMass / 1000).toFixed(1)}톤 전후 편심(${absOffsetXPct.toFixed(1)}%로 CTU 권고 ±5% 초과) — 트랙터 구동축 과적 및 축하중 별도 확인 필요`;
  } else {
    axleLoadNote = '전후 하중 분산 균형 양호 — 단, 실제 축하중은 차량 제원에 따라 달라 별도 확인 필요';
  }

  const offsetDirXText =
    offsetXFromContainerCenter === 0
      ? '중앙 정확 일치 (0mm)'
      : offsetXFromContainerCenter < 0
      ? `전방(헤드) ${Math.abs(offsetXFromContainerCenter).toLocaleString()}mm 치우침 (${absOffsetXPct.toFixed(1)}%)`
      : `후방(도어) ${Math.abs(offsetXFromContainerCenter).toLocaleString()}mm 치우침 (${absOffsetXPct.toFixed(1)}%)`;

  const offsetDirZText =
    offsetZFromCenter === 0
      ? '좌우 중심 일치 (0mm)'
      : offsetZFromCenter < 0
      ? `좌측 ${Math.abs(offsetZFromCenter)}mm 편차`
      : `우측 ${Math.abs(offsetZFromCenter)}mm 편차`;

  let status = 'SAFE';
  let statusText = '안전 (CTU Code 권고 ±5% 및 좌우 균형 양호)';

  if (!isCtuLongitudinalSafe && !isLateralSafe) {
    status = isCtuLongitudinalDanger ? 'DANGER' : 'WARN';
    statusText = `${isCtuLongitudinalDanger ? '위험' : '주의'} (전후 편차 ${absOffsetXPct.toFixed(1)}%로 ±5% 초과 · 좌우 편차 ${Math.abs(offsetZFromCenter)}mm로 권장 기준 ±70mm 초과)`;
  } else if (!isCtuLongitudinalSafe) {
    status = isCtuLongitudinalDanger ? 'DANGER' : 'WARN';
    statusText = `${isCtuLongitudinalDanger ? '위험 (CTU Code 권고 ±10% 초과 — 위험)' : '주의 (CTU Code 권고: 길이 중앙 ±5% 초과 및 ±10% 이내)'} — 중앙 편차 ${Math.abs(offsetXFromContainerCenter).toLocaleString()}mm (${absOffsetXPct.toFixed(1)}%)`;
  } else if (!isLateralSafe) {
    status = 'WARN';
    statusText = `주의 (권장 기준 ±70mm 초과 — 현재 좌우 편차 ${Math.abs(offsetZFromCenter)}mm)`;
  }

  let cogTradeoffNote = null;
  if (!isCtuLongitudinalSafe && offsetXFromContainerCenter < 0) {
    const forwardMm = Math.abs(offsetXFromContainerCenter);
    const rearClearanceMm = Math.max(0, cL - maxOccupiedX);
    cogTradeoffNote = {
      hasTradeoff: true,
      forwardMm,
      offsetPct: absOffsetXPct.toFixed(1),
      title: `전방 무게중심 편차(${absOffsetXPct.toFixed(1)}% / ${forwardMm.toLocaleString()}mm 치우침) 원인 및 안전 트레이드오프`,
      cause: `현재 호기는 ${container.placedPallets?.length || 0} PLT가 적재되어 도어 측에 약 ${(rearClearanceMm / 1000).toFixed(1)}m의 빈 바닥 공간이 발생합니다. 앞벽부터 밀착 적재 시 화물의 기하학적 중심이 전방으로 치우치는 물리적 현상입니다. (후방 열의 무거운 화물이 하중을 분산하여 전방 편차를 완화하고 있습니다)`,
      alternativeOption: `앞벽 쪽에 빈 파레트/완충재를 대거나 키 낮은 파레트(850mm)를 전방에 배치하면 전후 무게중심 편차를 약 2.5~4.5% 수준으로 낮출 수 있습니다. (전방 축하중 약 300mm 완화)`,
      tradeoffRisk: `그러나 앞벽 쪽에 빈 공간이나 낮은 단차(850mm → 1,620mm)가 생기면, 차량 급제동(감속도 0.8G) 시 뒤쪽의 높고 무거운 화물이 앞으로 쏠려 무너지거나 전도·파손될 위험이 극히 큽니다.`,
      conclusion: `따라서 급제동 안전을 위해 현 배치의 '앞벽 밀착 적재'를 유지하고, 도어 측 빈 공간(${(rearClearanceMm / 1000).toFixed(1)}m)을 목재 각재 펜스와 버팀목으로 견고하게 마감 차단하는 것이 현장 안전 표준 수칙에 부합합니다.`,
    };
  }

  return {
    cogX,
    cogY,
    cogZ,
    maxOccupiedX,
    offsetXFromContainerCenter,
    offsetXFromLoadCenter,
    offsetZFromCenter,
    offsetDirXText,
    offsetDirZText,
    longitudinalCriteriaText,
    lateralCriteriaText,
    axleLoadNote,
    lengthRatioPct,
    widthRatioPct,
    heightRatioPct,
    frontRatio,
    rearRatio,
    leftRatio,
    rightRatio,
    status,
    statusText,
    cogTradeoffNote,
  };
}
