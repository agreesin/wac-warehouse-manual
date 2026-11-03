import React from 'react';

export function Step1CargoInput({
  step1Ref,
  inputSummary,
  cargos,
  unitMode,
  setUnitMode,
  isDraggingFile,
  setIsDraggingFile,
  handleDrop,
  fileInputRef,
  setPasteModalOpen,
  handleResetSample,
  handleAddCargo,
  handleCargoChange,
  handleRemoveCargo,
  stackMode,
  setStackMode,
  effectivePalletConfig,
  palletConfig,
  setPalletConfig,
  interlockLayers,
  setInterlockLayers,
  mixCargos,
  setMixCargos,
  handleRunStep1ToStep2,
}) {
  return (
    <section ref={step1Ref} className="cbm-step-section">
      <div className="cbm-section-banner step1-banner">
        <div className="cbm-section-banner-left">
          <span className="cbm-step-badge">STEP 1</span>
          <div>
            <h2>화물 정보 입력 및 적재 조건 설정</h2>
            <p>
              견적을 산출할 화물 치수·수량·무게를 입력(또는 엑셀 업로드)하고, 1단/2단 적재 여부와 혼적 허용 여부, 최대 적재 높이를 설정하세요.
            </p>
          </div>
        </div>
        <div className="cbm-section-summary-pills">
          <div className="cbm-mini-stat">
            <span>품목 / 총 수량</span>
            <strong>
              {inputSummary.skuCount}종 · {inputSummary.totalBoxes.toLocaleString()}박스
            </strong>
          </div>
          <div className="cbm-mini-stat">
            <span>단순 화물 부피</span>
            <strong>{inputSummary.estCbm} CBM</strong>
          </div>
          <div className="cbm-mini-stat">
            <span>순수 화물 중량</span>
            <strong>{inputSummary.estCargoWeight.toLocaleString()} kg</strong>
          </div>
        </div>
      </div>

      <div className="cbm-step1-grid">
        {/* Left Column: Cargo Input Table & Excel Upload */}
        <div
          className={`cbm-card cbm-cargo-card ${isDraggingFile ? 'dragging' : ''}`}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDraggingFile(true);
          }}
          onDragLeave={() => setIsDraggingFile(false)}
          onDrop={handleDrop}
        >
          <div className="cbm-card-header">
            <h2>1-A. 화물(박스) 리스트 입력</h2>
            <div className="cbm-card-header-btns">
              <div
                style={{
                  display: 'inline-flex',
                  background: '#0f172a',
                  borderRadius: '6px',
                  border: '1px solid #334155',
                  overflow: 'hidden',
                  marginRight: '4px',
                }}
                title="화물 치수 입력 및 표시 단위 전환"
              >
                <button
                  type="button"
                  onClick={() => setUnitMode('mm')}
                  style={{
                    background: unitMode === 'mm' ? '#2563eb' : 'transparent',
                    color: unitMode === 'mm' ? '#fff' : '#94a3b8',
                    border: 'none',
                    padding: '4px 9px',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  mm 단위
                </button>
                <button
                  type="button"
                  onClick={() => setUnitMode('cm')}
                  style={{
                    background: unitMode === 'cm' ? '#2563eb' : 'transparent',
                    color: unitMode === 'cm' ? '#fff' : '#94a3b8',
                    border: 'none',
                    padding: '4px 9px',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  cm 단위
                </button>
              </div>
              <button
                type="button"
                className="cbm-btn-xs"
                onClick={() => fileInputRef.current?.click()}
              >
                📂 엑셀 파일 열기
              </button>
              <button
                type="button"
                className="cbm-btn-xs"
                onClick={() => setPasteModalOpen(true)}
              >
                📋 복사/붙여넣기
              </button>
              <button
                type="button"
                className="cbm-btn-xs"
                onClick={handleResetSample}
              >
                🔄 기본 샘플 복원
              </button>
              <button type="button" className="cbm-btn-xs primary" onClick={handleAddCargo}>
                + 화물 행 추가
              </button>
            </div>
          </div>

          <div
            className="cbm-dropzone"
            onClick={() => fileInputRef.current?.click()}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') fileInputRef.current?.click();
            }}
          >
            <span>
              📄 여기에 <strong>엑셀 파일(.xlsx, .csv)</strong>을 드래그 앤 드롭하거나 클릭하여 업로드하세요
            </span>
            <small>컬럼 양식: 화물명 | 가로(mm) | 세로(mm) | 높이(mm) | 수량 | 중량(kg/박스)</small>
          </div>

          <div className="cbm-cargo-table-wrap">
            <div className="cbm-table-scroll-hint">
              <span>👉 표를 좌우로 밀어서(스크롤) 치수·단수·회전 설정을 확인하세요</span>
            </div>
            <table className="cbm-cargo-table">
              <thead>
                <tr>
                  <th>색상</th>
                  <th>화물명 (품목명)</th>
                  <th>가로 ({unitMode})</th>
                  <th>세로 ({unitMode})</th>
                  <th>높이 ({unitMode})</th>
                  <th>수량 (박스)</th>
                  <th>박스단중 (kg)</th>
                  <th>단수제한</th>
                  <th>회전허용</th>
                  <th>삭제</th>
                </tr>
              </thead>
              <tbody>
                {cargos.map((cargo) => {
                  const dispW =
                    unitMode === 'cm' ? Number((cargo.width / 10).toFixed(1)) : cargo.width;
                  const dispL =
                    unitMode === 'cm' ? Number((cargo.length / 10).toFixed(1)) : cargo.length;
                  const dispH =
                    unitMode === 'cm' ? Number((cargo.height / 10).toFixed(1)) : cargo.height;
                  const factor = unitMode === 'cm' ? 10 : 1;

                  return (
                    <tr key={cargo.id}>
                      <td>
                        <input
                          type="color"
                          value={cargo.color}
                          onChange={(e) =>
                            handleCargoChange(cargo.id, 'color', e.target.value)
                          }
                          style={{
                            width: '26px',
                            height: '26px',
                            border: 'none',
                            background: 'transparent',
                            cursor: 'pointer',
                          }}
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          className="cbm-table-input name-input"
                          value={cargo.name}
                          onChange={(e) =>
                            handleCargoChange(cargo.id, 'name', e.target.value)
                          }
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          className="cbm-table-input dim-input"
                          value={dispW}
                          min={1}
                          step={unitMode === 'cm' ? 0.5 : 10}
                          onChange={(e) =>
                            handleCargoChange(
                              cargo.id,
                              'width',
                              Math.round((Number(e.target.value) || 0) * factor)
                            )
                          }
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          className="cbm-table-input dim-input"
                          value={dispL}
                          min={1}
                          step={unitMode === 'cm' ? 0.5 : 10}
                          onChange={(e) =>
                            handleCargoChange(
                              cargo.id,
                              'length',
                              Math.round((Number(e.target.value) || 0) * factor)
                            )
                          }
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          className="cbm-table-input dim-input"
                          value={dispH}
                          min={1}
                          step={unitMode === 'cm' ? 0.5 : 10}
                          onChange={(e) =>
                            handleCargoChange(
                              cargo.id,
                              'height',
                              Math.round((Number(e.target.value) || 0) * factor)
                            )
                          }
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          className="cbm-table-input qty-input"
                          value={cargo.quantity}
                          min={1}
                          onChange={(e) =>
                            handleCargoChange(cargo.id, 'quantity', e.target.value)
                          }
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          className="cbm-table-input weight-input"
                          value={cargo.weight}
                          min={0.01}
                          step={0.1}
                          onChange={(e) =>
                            handleCargoChange(cargo.id, 'weight', e.target.value)
                          }
                        />
                      </td>
                      <td>
                        <select
                          className="cbm-table-input"
                          style={{ width: '78px', padding: '4px 4px', fontSize: '12px' }}
                          value={cargo.maxLayers || 0}
                          onChange={(e) =>
                            handleCargoChange(cargo.id, 'maxLayers', Number(e.target.value) || 0)
                          }
                          title="품목별 최대 적재 단수 제한 (파손 방지 또는 단수 고정)"
                        >
                          <option value={0}>자동(높이)</option>
                          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((lNum) => (
                            <option key={lNum} value={lNum}>
                              최대 {lNum}단
                            </option>
                          ))}
                        </select>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <input
                          type="checkbox"
                          checked={cargo.allowRotate !== false}
                          onChange={(e) =>
                            handleCargoChange(cargo.id, 'allowRotate', e.target.checked)
                          }
                        />
                      </td>
                      <td>
                        <button
                          type="button"
                          className="cbm-row-del-btn"
                          onClick={() => handleRemoveCargo(cargo.id)}
                          disabled={cargos.length <= 1}
                          title="행 삭제"
                        >
                          ✕
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column: Stacking Rules & Height Limits */}
        <div className="cbm-card">
          <div className="cbm-card-header">
            <h2>1-B. 어떻게 적재할지 조건(Rule) 선택</h2>
            <span className="cbm-badge">적재 기준</span>
          </div>

          {/* Option 1: 1단 vs 2단 적재 */}
          <div className="cbm-field-label">① 파레트 단수 방식 선택</div>
          <div className="cbm-stack-mode-selector">
            <button
              type="button"
              className={`cbm-stack-btn ${stackMode === 'single' ? 'active' : ''}`}
              onClick={() => setStackMode('single')}
            >
              <div className="cbm-stack-btn-top">
                <strong>1단 적재 (Single Stack)</strong>
                <span className="cbm-stack-tag">표준</span>
              </div>
              <p>바닥 1층 안전 평적 (실무 권장)</p>
            </button>

            <button
              type="button"
              className={`cbm-stack-btn ${stackMode === 'double_auto' ? 'active' : ''}`}
              onClick={() => setStackMode('double_auto')}
            >
              <div className="cbm-stack-btn-top">
                <strong>2단 적재 — 높이 자동 맞춤</strong>
                <span className="cbm-stack-tag highlight">2단 자동</span>
              </div>
              <p>컨테이너 높이에 맞춰 최대 {effectivePalletConfig.maxTotalHeight}mm로 자동 분할</p>
            </button>

            <button
              type="button"
              className={`cbm-stack-btn ${stackMode === 'double_manual' ? 'active' : ''}`}
              onClick={() => setStackMode('double_manual')}
            >
              <div className="cbm-stack-btn-top">
                <strong>2단 적재 — 지정 높이 유지</strong>
                <span className="cbm-stack-tag">2단 수동</span>
              </div>
              <p>지정 높이 유지, 수용 가능한 파레트만 2단 적재</p>
            </button>
          </div>

          {/* Option 2: 혼적 허용 여부 & 교차 적재 */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginTop: '14px',
              marginBottom: '6px',
            }}
          >
            <div className="cbm-field-label" style={{ margin: 0 }}>
              ② 한 파레트 내 화물 혼적 및 교차 적재(인터로킹)
            </div>
            <label
              className="cbm-mini-check"
              style={{ fontSize: '12px', color: '#93c5fd' }}
              title="짝수 단(2·4·6단)을 180° 대칭 교차시켜 박스 이음선이 엇갈리게 쌓음으로써 파레트 붕괴를 방지합니다."
            >
              <input
                type="checkbox"
                checked={interlockLayers}
                onChange={(e) => setInterlockLayers(e.target.checked)}
              />
              <span>🧱 홀·짝수단 교차 적재(인터로킹)</span>
            </label>
          </div>
          <div className="cbm-radio-pair">
            <button
              type="button"
              className={`cbm-radio-card ${!mixCargos ? 'active' : ''}`}
              onClick={() => setMixCargos(false)}
            >
              <strong>품목별 단독 적재 (권장)</strong>
              <span>품목별 독립 파레트 구성 (오배송 방지)</span>
            </button>
            <button
              type="button"
              className={`cbm-radio-card ${mixCargos ? 'active' : ''}`}
              onClick={() => setMixCargos(true)}
            >
              <strong>다품종 잔량 혼적 허용</strong>
              <span>완적 후 안전한 자투리 파레트만 합포장</span>
            </button>
          </div>

          {/* Option 3: Height & Weight Numeric Inputs */}
          <div className="cbm-field-label" style={{ marginTop: '14px' }}>
            ③ 파레트 높이(mm) 및 중량(kg) 제한 설정
          </div>
          <div
            className="cbm-height-quick-bar"
            style={{ flexDirection: 'column', alignItems: 'stretch', gap: '10px' }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '8px',
              }}
            >
              <span>
                최대 적재높이 드래그 조절 (<strong>10mm 단위</strong> · 파레트 포함):{' '}
                <strong style={{ color: '#60a5fa', fontSize: '14px' }}>
                  {effectivePalletConfig.maxTotalHeight.toLocaleString()}mm
                </strong>{' '}
                <small style={{ color: '#94a3b8' }}>
                  (순수 화물 높이:{' '}
                  {Math.max(
                    0,
                    effectivePalletConfig.maxTotalHeight - palletConfig.baseHeight
                  ).toLocaleString()}
                  mm)
                </small>
              </span>
              <div className="cbm-height-chips">
                {[1620, 1700, 1850, 2000, 2200].map((hVal) => (
                  <button
                    key={hVal}
                    type="button"
                    disabled={stackMode === 'double_auto'}
                    className={`cbm-height-chip ${
                      effectivePalletConfig.maxTotalHeight === hVal ? 'active' : ''
                    }`}
                    onClick={() =>
                      setPalletConfig((p) => ({ ...p, maxTotalHeight: hVal }))
                    }
                  >
                    {hVal.toLocaleString()}mm
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <button
                type="button"
                className="cbm-height-chip"
                disabled={stackMode === 'double_auto'}
                onClick={() =>
                  setPalletConfig((p) => ({
                    ...p,
                    maxTotalHeight: Math.max(500, (Number(p.maxTotalHeight) || 1700) - 10),
                  }))
                }
                title="10mm 낮추기"
              >
                -10mm
              </button>
              <input
                type="range"
                min={500}
                max={2550}
                step={10}
                disabled={stackMode === 'double_auto'}
                value={effectivePalletConfig.maxTotalHeight}
                onChange={(e) =>
                  setPalletConfig((p) => ({
                    ...p,
                    maxTotalHeight: Math.round(Number(e.target.value) / 10) * 10,
                  }))
                }
                style={{
                  flex: 1,
                  accentColor: '#3b82f6',
                  cursor: stackMode === 'double_auto' ? 'not-allowed' : 'grab',
                  height: '6px',
                }}
              />
              <button
                type="button"
                className="cbm-height-chip"
                disabled={stackMode === 'double_auto'}
                onClick={() =>
                  setPalletConfig((p) => ({
                    ...p,
                    maxTotalHeight: Math.min(2550, (Number(p.maxTotalHeight) || 1700) + 10),
                  }))
                }
                title="10mm 높이기"
              >
                +10mm
              </button>
            </div>
          </div>

          <div className="cbm-input-grid-4" style={{ marginTop: '8px' }}>
            <label className="cbm-input-group">
              <span>최대 적재높이(mm)</span>
              <input
                type="number"
                value={effectivePalletConfig.maxTotalHeight}
                disabled={stackMode === 'double_auto'}
                min={500}
                max={2650}
                step={10}
                onChange={(e) =>
                  setPalletConfig((p) => ({
                    ...p,
                    maxTotalHeight: Number(e.target.value) || 1700,
                  }))
                }
              />
            </label>
            <label className="cbm-input-group">
              <span>파레트 자체높이(mm)</span>
              <input
                type="number"
                value={palletConfig.baseHeight}
                min={50}
                max={300}
                step={10}
                onChange={(e) =>
                  setPalletConfig((p) => ({
                    ...p,
                    baseHeight: Number(e.target.value) || 150,
                  }))
                }
              />
              <input
                type="range"
                min={50}
                max={250}
                step={10}
                value={palletConfig.baseHeight}
                onChange={(e) =>
                  setPalletConfig((p) => ({
                    ...p,
                    baseHeight: Math.round(Number(e.target.value) / 10) * 10,
                  }))
                }
                style={{
                  width: '100%',
                  marginTop: '4px',
                  accentColor: '#3b82f6',
                  cursor: 'grab',
                }}
              />
            </label>
            <label className="cbm-input-group">
              <span>파레트 자중(kg)</span>
              <input
                type="number"
                value={palletConfig.tareWeight}
                min={0}
                max={100}
                step={0.5}
                onChange={(e) =>
                  setPalletConfig((p) => ({
                    ...p,
                    tareWeight: Number(e.target.value) || 0,
                  }))
                }
              />
            </label>
            <label className="cbm-input-group">
              <span>파레트 최대하중(kg)</span>
              <input
                type="number"
                value={palletConfig.maxWeight}
                min={100}
                max={3000}
                step={50}
                onChange={(e) =>
                  setPalletConfig((p) => ({
                    ...p,
                    maxWeight: Math.max(100, Number(e.target.value) || 1000),
                  }))
                }
              />
            </label>
          </div>
        </div>
      </div>

      {/* Step 1 Action Button Bar */}
      <div className="cbm-step-action-bar">
        <button
          type="button"
          className="cbm-calculate-btn step-cta-btn"
          onClick={handleRunStep1ToStep2}
        >
          🚀 [1단계 계산하기] 파레트 종류별 산출 수량 및 한 파레트 적재 시각화 보기 ▼
        </button>
      </div>
    </section>
  );
}
