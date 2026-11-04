import React from 'react';

/**
 * 한 파레트 1층 평면 적재 도면 (2D SVG) 및 작업자 적재 가이드 카드 컴포넌트
 */
export function Pallet2DBlueprint({ currentPallet }) {
  if (!currentPallet) return null;

  return (
    <div className="cbm-pallet-blueprint-col">
      <div className="cbm-blueprint-box">
        <h3>한 파레트 1층 평면 적재 도면 (상부 평면도)</h3>
        <p className="cbm-blueprint-sub">
          파레트: <strong>{currentPallet.width} × {currentPallet.length} mm</strong> | 1층:{' '}
          <strong>{currentPallet.layers[0]?.boxCount || 0}박스</strong>
          {currentPallet.maxOverhangMm > 0 ? (
            <span style={{ color: '#fbbf24', marginLeft: '8px', fontWeight: 700 }}>
              (돌출 +{currentPallet.maxOverhangMm}mm / 외곽 {currentPallet.cargoSpanW}×{currentPallet.cargoSpanL}mm)
            </span>
          ) : (
            <span style={{ color: '#34d399', marginLeft: '8px' }}>
              (정사이즈 · 돌출 0mm)
            </span>
          )}
        </p>
        <div className="cbm-blueprint-svg-wrap">
          <svg
            viewBox={`-100 -100 ${currentPallet.width + 200} ${currentPallet.length + 200}`}
            className="cbm-pallet-2d-svg"
          >
            {/* Pallet Base */}
            <rect
              x={0}
              y={0}
              width={currentPallet.width}
              height={currentPallet.length}
              fill="#78350f"
              fillOpacity={0.38}
              stroke="#f59e0b"
              strokeWidth={14}
              rx={14}
            />
            {/* Dimension Labels */}
            <text
              x={currentPallet.width / 2}
              y={-34}
              textAnchor="middle"
              fill="#94a3b8"
              fontSize="42"
              fontWeight="bold"
            >
              가로 {currentPallet.width} mm
            </text>
            {/* Boxes on 1st layer */}
            {currentPallet.boxes
              .filter((b) => (b.layerIndex || 0) === 0)
              .map((b) => (
                <g key={b.id}>
                  <rect
                    x={b.x + 3}
                    y={b.z + 3}
                    width={b.w - 6}
                    height={b.l - 6}
                    fill={b.color}
                    fillOpacity={0.9}
                    stroke="#0f172a"
                    strokeWidth={8}
                    rx={6}
                  />
                  {b.w >= 140 && b.l >= 100 && (
                    <>
                      <text
                        x={b.x + b.w / 2}
                        y={b.z + b.l / 2 - 16}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        fill="#ffffff"
                        fontSize={Math.min(44, Math.min(b.w, b.l) * 0.2)}
                        fontWeight="bold"
                      >
                        {b.name.split(' ')[0]} {b.rotated ? '↻' : ''}
                      </text>
                      <text
                        x={b.x + b.w / 2}
                        y={b.z + b.l / 2 + 26}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        fill="#e2e8f0"
                        fontSize={Math.min(36, Math.min(b.w, b.l) * 0.17)}
                      >
                        {b.w}×{b.l}
                      </text>
                    </>
                  )}
                </g>
              ))}
            {/* Dashed Pallet Boundary Overlay when Overhang is Active */}
            {currentPallet.maxOverhangMm > 0 && (
              <rect
                x={0}
                y={0}
                width={currentPallet.width}
                height={currentPallet.length}
                fill="none"
                stroke="#fbbf24"
                strokeWidth={12}
                strokeDasharray="28,18"
                rx={14}
              />
            )}
          </svg>
        </div>
      </div>

      {/* Worker Loading Guide Box */}
      <div className="cbm-pallet-info-list">
        <h4>Pallet #{currentPallet.index} 적재 가이드</h4>
        <div className="cbm-info-row">
          <span>파레트 규격:</span>
          <strong>
            {currentPallet.width} × {currentPallet.length} mm
          </strong>
        </div>
        <div className="cbm-info-row">
          <span>1층 적재 수량:</span>
          <strong>{currentPallet.layers[0]?.boxCount || 0} 박스 / 층</strong>
        </div>
        <div className="cbm-info-row">
          <span>적재 단수 / 박스수:</span>
          <strong>
            {currentPallet.layers.length}단 적재 / 총{' '}
            {currentPallet.boxes.length.toLocaleString()} 박스
          </strong>
        </div>
        <div className="cbm-info-row">
          <span>총 높이:</span>
          <strong>
            {currentPallet.totalHeight} mm (파레트 {currentPallet.baseHeight}mm + 화물{' '}
            {currentPallet.cargoHeight}mm)
          </strong>
        </div>
        <div className="cbm-info-row">
          <span>파레트 총 중량:</span>
          <strong style={{ color: '#fbbf24' }}>
            약 {currentPallet.totalWeight.toFixed(1)} kg
          </strong>
        </div>
      </div>
    </div>
  );
}
