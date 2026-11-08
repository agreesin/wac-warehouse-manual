import React from 'react';

/**
 * 쇼링 단면도 SVG 컴포넌트 (도어에서 안쪽을 바라본 단면 모습)
 */
export function ShoringCrossSectionSvg({ container }) {
  const doorGuide = container.fieldDiagnostics?.doorShoringGuide;
  const hasHeightGap = doorGuide?.hasHeightGapRisk;

  if (!hasHeightGap) {
    // 단차가 없는 경우: 문 앞 목재 각재 펜스 + 버팀목 개략도
    return (
      <div
        style={{
          width: '100%',
          border: '1px solid #000',
          padding: '2px 5px',
          background: '#fff',
          boxSizing: 'border-box',
        }}
      >
        <div style={{ fontSize: '11.5px', fontWeight: 'bold', marginBottom: '2px' }}>
          [ 문 앞 펜스·버팀목 시공 단면 안내 ]
        </div>
        <svg viewBox="0 0 600 130" style={{ width: '100%', height: '56px', display: 'block' }}>
          <rect x="20" y="10" width="560" height="110" fill="#fff" stroke="#000" strokeWidth="4" />
          <line x1="20" y1="46" x2="580" y2="46" stroke="#000" strokeWidth="5" />
          <line x1="20" y1="84" x2="580" y2="84" stroke="#000" strokeWidth="5" />
          <text x="300" y="30" textAnchor="middle" fontSize="19" fontWeight="bold">
            상단 각재 (내폭 맞춤 Chock)
          </text>
          <text x="300" y="68" textAnchor="middle" fontSize="19" fontWeight="bold">
            중단 각재 (내폭 맞춤 Chock)
          </text>
          <text x="300" y="106" textAnchor="middle" fontSize="19" fontWeight="bold">
            하단 각재 + 코너포스트 대각 버팀목 결속
          </text>
        </svg>
      </div>
    );
  }

  // 단차가 있는 경우: 바로 앞 열(frontH) + 도어 열 파레트(1개 또는 2개 동적 반영) + 합판 + 수평래싱 2줄 단면도
  const frontH = Number(doorGuide?.maxHeightMm) || 1620;
  const lashH1 = Number(doorGuide?.lowerLashH) || Math.floor((frontH * 0.68) / 50) * 50;
  const lashH2 = Number(doorGuide?.upperLashH) || Math.floor((frontH - 150) / 50) * 50;
  const doorRowPallets =
    doorGuide?.doorRowPallets && doorGuide.doorRowPallets.length > 0
      ? doorGuide.doorRowPallets
      : doorGuide?.lowPalletDetails || [];

  const isSingleDoorPallet = doorRowPallets.length === 1;
  const p1 = doorRowPallets[0] || { label: 'P#1', height: Math.round(frontH * 0.5), diff: Math.round(frontH * 0.5), isLow: true };
  const p2 = !isSingleDoorPallet ? doorRowPallets[1] : null;

  const p1Diff = p1.diff !== undefined ? p1.diff : Math.max(0, frontH - p1.height);
  const p2Diff = p2 ? (p2.diff !== undefined ? p2.diff : Math.max(0, frontH - p2.height)) : 0;

  // SVG 내 파레트 박스 높이 스케일 계산 (전체 145px 기준 비율)
  const calcRectBox = (h) => {
    const ratio = Math.min(1, Math.max(0.32, h / Math.max(1, frontH)));
    const boxH = Math.round(140 * ratio);
    const boxY = 170 - boxH;
    return { boxY, boxH };
  };
  const r1 = calcRectBox(p1.height);
  const r2 = p2 ? calcRectBox(p2.height) : null;

  return (
    <div
      style={{
        width: '100%',
        border: '1px solid #000',
        padding: '2px 5px',
        background: '#fff',
        boxSizing: 'border-box',
      }}
    >
      <div
        style={{
          fontSize: '11.5px',
          fontWeight: 'bold',
          marginBottom: '2px',
          display: 'flex',
          justifyContent: 'space-between',
        }}
      >
        <span>[ 도어측 단차 결속 단면도 (문에서 안쪽을 볼 때) ]</span>
        <span style={{ fontSize: '11.5px', fontWeight: 'bold' }}>
          수평 래싱 2줄: 높이 {lashH1.toLocaleString()}mm / {lashH2.toLocaleString()}mm
        </span>
      </div>

      <svg viewBox="0 0 720 180" style={{ width: '100%', height: '72px', display: 'block' }}>
        {/* 컨테이너 내벽 윤곽 */}
        <rect
          x="20"
          y="10"
          width="680"
          height="160"
          fill="#ffffff"
          stroke="#000000"
          strokeWidth="4"
        />
        <text x="30" y="32" fontSize="16" fill="#333" fontWeight="bold">
          내벽
        </text>
        <text x="690" y="32" textAnchor="end" fontSize="16" fill="#333" fontWeight="bold">
          내벽
        </text>

        {/* 배경: 바로 앞 완적 열 (frontH) */}
        <rect
          x="65"
          y="25"
          width="590"
          height="145"
          fill="#f1f5f9"
          stroke="#000000"
          strokeWidth="2"
          strokeDasharray="6,4"
        />
        <text
          x="360"
          y="46"
          textAnchor="middle"
          fontSize="18"
          fontWeight="bold"
          fill="#000"
        >
          바로 앞 완적 열 전면 (높이 {frontH.toLocaleString()} mm)
        </text>

        {/* 완충 판재 (합판) */}
        <line x1="75" y1="62" x2="645" y2="62" stroke="#000" strokeWidth="6" />
        <text x="360" y="78" textAnchor="middle" fontSize="16" fill="#000" fontWeight="bold">
          [완충 판재] 합판 12T 지지면
        </text>

        {/* 수평 래싱 2줄 */}
        <line x1="20" y1="52" x2="700" y2="52" stroke="#000" strokeWidth="3" />
        <text x="675" y="46" textAnchor="end" fontSize="15" fontWeight="bold">
          상단 래싱 {lashH2.toLocaleString()}mm ▶
        </text>

        <line x1="20" y1="92" x2="700" y2="92" stroke="#000" strokeWidth="3" />
        <text x="675" y="86" textAnchor="end" fontSize="15" fontWeight="bold">
          하단 래싱 {lashH1.toLocaleString()}mm ▶
        </text>

        {isSingleDoorPallet ? (
          /* 도어 열에 파레트가 1개뿐인 경우: 중앙 단일 파레트 렌더링 */
          <>
            <rect
              x="245"
              y={r1.boxY}
              width="230"
              height={r1.boxH}
              fill="#ffffff"
              stroke="#000000"
              strokeWidth="3"
            />
            <text x="360" y={r1.boxY + Math.min(24, r1.boxH / 2)} textAnchor="middle" fontSize="17" fontWeight="bold">
              {p1.label} ({p1.height.toLocaleString()}mm)
            </text>
            <text x="360" y={r1.boxY + Math.min(44, r1.boxH - 8)} textAnchor="middle" fontSize="14" fill="#111" fontWeight="bold">
              {p1Diff > 0 ? `단차 -${p1Diff.toLocaleString()}mm` : '단차 없음'}
            </text>
            <path
              d={`M 220 170 Q 360 ${Math.max(40, r1.boxY - 22)} 500 170`}
              fill="none"
              stroke="#000"
              strokeWidth="3"
              strokeDasharray="5,3"
            />
            <circle cx="220" cy="165" r="5" fill="#000" />
            <circle cx="500" cy="165" r="5" fill="#000" />
          </>
        ) : (
          /* 도어 열에 파레트가 2개인 경우: 좌/우 각각 실제 높이와 단차 동적 렌더링 */
          <>
            <rect
              x="90"
              y={r1.boxY}
              width="230"
              height={r1.boxH}
              fill="#ffffff"
              stroke="#000000"
              strokeWidth="3"
            />
            <text x="205" y={r1.boxY + Math.min(24, r1.boxH / 2)} textAnchor="middle" fontSize="17" fontWeight="bold">
              {p1.label} ({p1.height.toLocaleString()}mm)
            </text>
            <text x="205" y={r1.boxY + Math.min(44, r1.boxH - 8)} textAnchor="middle" fontSize="14" fill="#111" fontWeight="bold">
              {p1Diff > 0 ? `단차 -${p1Diff.toLocaleString()}mm` : '완적 높이'}
            </text>

            <rect
              x="400"
              y={r2.boxY}
              width="230"
              height={r2.boxH}
              fill="#ffffff"
              stroke="#000000"
              strokeWidth="3"
            />
            <text x="515" y={r2.boxY + Math.min(24, r2.boxH / 2)} textAnchor="middle" fontSize="17" fontWeight="bold">
              {p2.label} ({p2.height.toLocaleString()}mm)
            </text>
            <text x="515" y={r2.boxY + Math.min(44, r2.boxH - 8)} textAnchor="middle" fontSize="14" fill="#111" fontWeight="bold">
              {p2Diff > 0 ? `단차 -${p2Diff.toLocaleString()}mm` : '완적 높이'}
            </text>

            {/* 낮은 파레트에만 톱오버 래싱 벨트 곡선 표시 */}
            {p1.isLow !== false && p1Diff > 0 && (
              <>
                <path
                  d={`M 70 170 Q 205 ${Math.max(40, r1.boxY - 22)} 340 170`}
                  fill="none"
                  stroke="#000"
                  strokeWidth="3"
                  strokeDasharray="5,3"
                />
                <circle cx="70" cy="165" r="5" fill="#000" />
                <circle cx="340" cy="165" r="5" fill="#000" />
              </>
            )}
            {p2.isLow !== false && p2Diff > 0 && (
              <>
                <path
                  d={`M 380 170 Q 515 ${Math.max(40, r2.boxY - 22)} 650 170`}
                  fill="none"
                  stroke="#000"
                  strokeWidth="3"
                  strokeDasharray="5,3"
                />
                <circle cx="380" cy="165" r="5" fill="#000" />
                <circle cx="650" cy="165" r="5" fill="#000" />
              </>
            )}
          </>
        )}

        <text x="360" y="108" textAnchor="middle" fontSize="15" fontWeight="bold">
          ▲ 톱오버 래싱 벨트 (전도 방지) ▲
        </text>
      </svg>
    </div>
  );
}
