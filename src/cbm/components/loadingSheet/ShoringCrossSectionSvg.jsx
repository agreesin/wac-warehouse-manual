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

  // 단차가 있는 경우: 바로 앞 열(1620mm) + 낮은 파레트(570mm/850mm) + 합판 + 수평래싱 2줄 단면도
  const lashH1 = 1150;
  const lashH2 = 1450;
  const lowPallets = doorGuide.lowPalletDetails || [];
  const p1 = lowPallets[0] || { label: 'P#23', height: 570 };
  const p2 = lowPallets[1] || { label: 'P#38', height: 850 };

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

        {/* 배경: 바로 앞 완적 열 (1620mm) */}
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
          바로 앞 완적 열 전면 (높이 1,620 mm)
        </text>

        {/* 완충 판재 (합판) */}
        <line x1="75" y1="62" x2="645" y2="62" stroke="#000" strokeWidth="6" />
        <text x="360" y="78" textAnchor="middle" fontSize="16" fill="#000" fontWeight="bold">
          [완충 판재] 합판 12T 지지면
        </text>

        {/* 수평 래싱 2줄 */}
        <line x1="20" y1="52" x2="700" y2="52" stroke="#000" strokeWidth="3" />
        <text x="675" y="46" textAnchor="end" fontSize="15" fontWeight="bold">
          상단 래싱 1,450mm ▶
        </text>

        <line x1="20" y1="92" x2="700" y2="92" stroke="#000" strokeWidth="3" />
        <text x="675" y="86" textAnchor="end" fontSize="15" fontWeight="bold">
          하단 래싱 1,150mm ▶
        </text>

        {/* 전경 좌측: 낮은 파레트 1 (P#23, 570mm) */}
        <rect
          x="90"
          y="115"
          width="230"
          height="55"
          fill="#ffffff"
          stroke="#000000"
          strokeWidth="3"
        />
        <text x="205" y="138" textAnchor="middle" fontSize="17" fontWeight="bold">
          {p1.label} ({p1.height}mm)
        </text>
        <text x="205" y="158" textAnchor="middle" fontSize="14" fill="#111" fontWeight="bold">
          단차 -{1620 - p1.height}mm
        </text>

        {/* 전경 우측: 낮은 파레트 2 (P#38, 850mm) */}
        <rect
          x="400"
          y="100"
          width="230"
          height="70"
          fill="#ffffff"
          stroke="#000000"
          strokeWidth="3"
        />
        <text x="515" y="125" textAnchor="middle" fontSize="17" fontWeight="bold">
          {p2.label} ({p2.height}mm)
        </text>
        <text x="515" y="148" textAnchor="middle" fontSize="14" fill="#111" fontWeight="bold">
          단차 -{1620 - p2.height}mm
        </text>

        {/* 톱오버 래싱 벨트 곡선 */}
        <path
          d="M 70 170 Q 205 90 340 170"
          fill="none"
          stroke="#000"
          strokeWidth="3"
          strokeDasharray="5,3"
        />
        <path
          d="M 380 170 Q 515 70 650 170"
          fill="none"
          stroke="#000"
          strokeWidth="3"
          strokeDasharray="5,3"
        />

        {/* 바닥 래싱 링 마크 */}
        <circle cx="70" cy="165" r="5" fill="#000" />
        <circle cx="340" cy="165" r="5" fill="#000" />
        <circle cx="380" cy="165" r="5" fill="#000" />
        <circle cx="650" cy="165" r="5" fill="#000" />
        <text x="360" y="108" textAnchor="middle" fontSize="15" fontWeight="bold">
          ▲ 톱오버 래싱 벨트 (전도 방지) ▲
        </text>
      </svg>
    </div>
  );
}
