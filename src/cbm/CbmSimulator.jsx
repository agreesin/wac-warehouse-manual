import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  CONTAINER_SPECS,
  PALLET_PRESETS,
  CARGO_COLORS,
  DEFAULT_CARGOS,
  runFullSimulation,
  computeBest2DLayer,
  resolvePalletDimsForCargo,
  autoRecommendPalletSpecs,
} from './packingEngine';
import {
  parseCargoExcelFile,
  parseCargoFromText,
  downloadSampleExcelTemplate,
  exportSimulationResultExcel,
} from './excelUtils';
import { ThreeViewport } from './ThreeViewport';
import './cbm.css';

export function CbmSimulator() {
  // =========================================================================
  // STEP 1 STATE: 화물 입력 및 적재 조건 (Rule) 설정
  // =========================================================================
  const [cargos, setCargos] = useState(DEFAULT_CARGOS);
  const [palletConfig, setPalletConfig] = useState({
    width: 1100,
    length: 1100,
    baseHeight: 150,
    maxTotalHeight: 1700,
    maxWeight: 1000,
    tareWeight: 17,
  });

  // stackMode: 'single' (1단 적재) | 'double_auto' (2단 적재 - 높이 자동 맞춤) | 'double_manual' (2단 적재 - 지정 높이 유지)
  const [stackMode, setStackMode] = useState('single');
  const [mixCargos, setMixCargos] = useState(false); // 기본: 품목별 단독 적재
  const [interlockLayers, setInterlockLayers] = useState(true); // 기본: 홀·짝수단 벽돌식 교차 적재(인터로킹)
  const [overhang, setOverhang] = useState(0);
  const [unitMode, setUnitMode] = useState('mm'); // 'mm' | 'cm' 치수 입력/표시 단위 전환

  // =========================================================================
  // STEP 2 STATE: 파레트 사이즈 선택 모드 (단일 규격 vs 여러 파레트 섞어 쓰기)
  // =========================================================================
  // palletSelectionMode: 'T11' | 'T12' | 'EUR' | 'EXPORT_1200' | 'CUSTOM_MIX'
  const [palletSelectionMode, setPalletSelectionMode] = useState('CUSTOM_MIX');
  const [selectedPalletIdx, setSelectedPalletIdx] = useState(0);
  const [palletVisibleStep, setPalletVisibleStep] = useState(100);
  const [isPalletPlaying, setIsPalletPlaying] = useState(false);
  const [explodePalletLayers, setExplodePalletLayers] = useState(false);

  // =========================================================================
  // STEP 3 STATE: 컨테이너 종류 선택 및 컨테이너 적재 시각화
  // =========================================================================
  const [selectedContainerId, setSelectedContainerId] = useState('40FT_HC');
  const [balanceContainers, setBalanceContainers] = useState(true);
  const [fullFloorSpread, setFullFloorSpread] = useState(true); // 기본값: 컨테이너 빈 바닥 100% 풀채움 (단수 분산)
  const [optimizeCoG, setOptimizeCoG] = useState(true);
  const [selectedContainerIdx, setSelectedContainerIdx] = useState(0);
  const [containerVisibleStep, setContainerVisibleStep] = useState(100);
  const [isContainerPlaying, setIsContainerPlaying] = useState(false);
  const [tierFilter, setTierFilter] = useState('all'); // 'all' | 'tier1' | 'tier2'
  const [explodeContainerLayers, setExplodeContainerLayers] = useState(false);
  const [showFullPackingTable, setShowFullPackingTable] = useState(false);

  // =========================================================================
  // WORKFLOW STEP VISIBILITY (방식 B: 상하 스크롤 리포트형)
  // =========================================================================
  const [step2Unlocked, setStep2Unlocked] = useState(false);
  const [step3Unlocked, setStep3Unlocked] = useState(false);
  const [isStep1Dirty, setIsStep1Dirty] = useState(false);

  const step1Ref = useRef(null);
  const step2Ref = useRef(null);
  const step3Ref = useRef(null);
  const fileInputRef = useRef(null);

  // Upload & Paste Modal State
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const [uploadNotice, setUploadNotice] = useState(null);
  const [pasteModalOpen, setPasteModalOpen] = useState(false);
  const [pasteText, setPasteText] = useState('');

  // Effective cargos based on palletSelectionMode (Uniform vs Custom Mix)
  const effectiveCargos = useMemo(() => {
    if (palletSelectionMode === 'CUSTOM_MIX') {
      return cargos;
    }
    // 단일 파레트 규격 선택 시 모든 품목에 해당 규격 일괄 적용
    return cargos.map((c) => ({
      ...c,
      palletSpecId: palletSelectionMode,
    }));
  }, [cargos, palletSelectionMode]);

  // Effective pallet config when 'double_auto' is active
  const effectivePalletConfig = useMemo(() => {
    const preset = PALLET_PRESETS[palletSelectionMode];
    const baseCfg = preset
      ? { ...palletConfig, width: preset.width, length: preset.length }
      : palletConfig;

    if (stackMode === 'double_auto') {
      const cSpec = CONTAINER_SPECS[selectedContainerId] || CONTAINER_SPECS['40FT_HC'];
      const autoMaxH = Math.floor((cSpec.height - 60) / 2);
      return {
        ...baseCfg,
        maxTotalHeight: autoMaxH,
      };
    }
    return baseCfg;
  }, [palletConfig, palletSelectionMode, stackMode, selectedContainerId]);

  // Pre-calculation input summary in Step 1
  const inputSummary = useMemo(() => {
    const totalBoxes = cargos.reduce((acc, c) => acc + (Number(c.quantity) || 0), 0);
    const estCbm = cargos.reduce(
      (acc, c) =>
        acc +
        ((Number(c.width) || 0) *
          (Number(c.length) || 0) *
          (Number(c.height) || 0) *
          (Number(c.quantity) || 0)) /
          1e9,
      0
    );
    const estCargoWeight = cargos.reduce(
      (acc, c) => acc + (Number(c.weight) || 0) * (Number(c.quantity) || 0),
      0
    );
    return {
      skuCount: cargos.length,
      totalBoxes,
      estCbm: Number(estCbm.toFixed(2)),
      estCargoWeight: Number(estCargoWeight.toFixed(1)),
    };
  }, [cargos]);

  // Full Simulation Calculation (computed when Step 2 is unlocked)
  const simResult = useMemo(() => {
    if (!step2Unlocked) return null;
    return runFullSimulation(effectiveCargos, effectivePalletConfig, selectedContainerId, {
      doubleStack: stackMode !== 'single',
      doubleStackAuto: stackMode === 'double_auto',
      mixCargos,
      interlockLayers,
      overhang,
      balanceContainers,
      fullFloorSpread,
      optimizeCoG,
    });
  }, [
    step2Unlocked,
    effectiveCargos,
    effectivePalletConfig,
    selectedContainerId,
    stackMode,
    mixCargos,
    interlockLayers,
    overhang,
    balanceContainers,
    fullFloorSpread,
    optimizeCoG,
  ]);

  // Custom Mix result count for comparison card in Step 2
  const customMixComparison = useMemo(() => {
    if (!step2Unlocked) return null;
    const res = runFullSimulation(cargos, effectivePalletConfig, selectedContainerId, {
      doubleStack: stackMode !== 'single',
      doubleStackAuto: stackMode === 'double_auto',
      mixCargos,
      interlockLayers,
      overhang,
      balanceContainers,
      fullFloorSpread,
      optimizeCoG,
    });
    const usedSpecs = Array.from(
      new Set(res.pallets.map((p) => `${p.width}×${p.length}`))
    ).join(' + ');
    return {
      totalPallets: res.summary.totalPallets,
      usedSpecs: usedSpecs || '복합 규격',
    };
  }, [
    step2Unlocked,
    cargos,
    effectivePalletConfig,
    selectedContainerId,
    stackMode,
    mixCargos,
    interlockLayers,
    overhang,
    balanceContainers,
    fullFloorSpread,
    optimizeCoG,
  ]);

  // Playback timers for Step 2 (Pallet 3D) and Step 3 (Container 3D)
  useEffect(() => {
    if (!isPalletPlaying) return;
    const timer = setInterval(() => {
      setPalletVisibleStep((prev) => {
        if (prev >= 100) {
          setIsPalletPlaying(false);
          return 100;
        }
        return Math.min(100, prev + 5);
      });
    }, 110);
    return () => clearInterval(timer);
  }, [isPalletPlaying]);

  useEffect(() => {
    if (!isContainerPlaying) return;
    const timer = setInterval(() => {
      setContainerVisibleStep((prev) => {
        if (prev >= 100) {
          setIsContainerPlaying(false);
          return 100;
        }
        return Math.min(100, prev + 4);
      });
    }, 120);
    return () => clearInterval(timer);
  }, [isContainerPlaying]);

  // Keep indices in bounds
  useEffect(() => {
    if (simResult && selectedPalletIdx >= simResult.pallets.length) {
      setSelectedPalletIdx(0);
    }
  }, [simResult, selectedPalletIdx]);

  useEffect(() => {
    if (simResult && selectedContainerIdx >= simResult.containerResult.containers.length) {
      setSelectedContainerIdx(0);
    }
  }, [simResult, selectedContainerIdx]);

  // Handlers for Step 1 -> Step 2 -> Step 3 transitions
  const handleRunStep1ToStep2 = () => {
    setStep2Unlocked(true);
    setIsStep1Dirty(false);
    setSelectedPalletIdx(0);
    setPalletVisibleStep(100);
    setTimeout(() => {
      step2Ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 80);
  };

  const handleRunStep2ToStep3 = () => {
    setStep3Unlocked(true);
    setSelectedContainerIdx(0);
    setContainerVisibleStep(100);
    setTimeout(() => {
      step3Ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 80);
  };

  const handleCargoChange = (id, field, value) => {
    setCargos((prev) =>
      prev.map((c) => {
        if (c.id !== id) return c;
        if (
          field === 'name' ||
          field === 'color' ||
          field === 'palletSpecId' ||
          field === 'layerPattern' ||
          field === 'stackingStyle' ||
          field === 'boxPosture'
        ) {
          return { ...c, [field]: value };
        }
        if (field === 'allowRotate') {
          return { ...c, allowRotate: Boolean(value) };
        }
        const num = Math.max(0, Number(value) || 0);
        return { ...c, [field]: num };
      })
    );
    if (
      step2Unlocked &&
      field !== 'palletSpecId' &&
      field !== 'allowedOverhang' &&
      field !== 'layerPattern' &&
      field !== 'stackingStyle' &&
      field !== 'boxPosture'
    ) {
      setIsStep1Dirty(true);
    }
  };

  const handleAddCargo = () => {
    const nextIdx = cargos.length + 1;
    const alphabet = String.fromCharCode(64 + ((nextIdx - 1) % 26) + 1);
    setCargos((prev) => [
      ...prev,
      {
        id: `cargo-${Date.now()}`,
        name: `박스${alphabet}`,
        width: 400,
        length: 300,
        height: 250,
        quantity: 100,
        weight: 5.0,
        color: CARGO_COLORS[(nextIdx - 1) % CARGO_COLORS.length],
        allowRotate: true,
        palletSpecId: 'T11',
      },
    ]);
    if (step2Unlocked) setIsStep1Dirty(true);
  };

  const handleRemoveCargo = (id) => {
    if (cargos.length <= 1) return;
    setCargos((prev) => prev.filter((c) => c.id !== id));
    if (step2Unlocked) setIsStep1Dirty(true);
  };

  const handleResetSample = () => {
    setCargos(DEFAULT_CARGOS);
    setPalletConfig({
      width: 1100,
      length: 1100,
      baseHeight: 150,
      maxTotalHeight: 1700,
      maxWeight: 1000,
      tareWeight: 17,
    });
    setStackMode('single');
    setMixCargos(false);
    setOverhang(0);
    setFullFloorSpread(true);
    setPalletSelectionMode('CUSTOM_MIX');
    setUploadNotice({
      type: 'info',
      message: '기본 데모 화물 데이터(박스A 1,246개 / 박스B 294개 / 박스C 8개)를 불러왔습니다.',
    });
  };

  const handleAutoRecommendPalletMix = () => {
    const recommended = autoRecommendPalletSpecs(cargos, overhang);
    setCargos(recommended);
    setPalletSelectionMode('CUSTOM_MIX');
    setUploadNotice({
      type: 'success',
      message:
        '각 화물의 가로·세로 치수를 분석하여 돌출 없이 가장 효율적인 파레트 사이즈(1100×1100 / 1200×1000)를 품목별로 자동 매칭했습니다.',
    });
  };

  const processUploadedFile = async (file) => {
    if (!file) return;
    try {
      const parsed = await parseCargoExcelFile(file);
      if (parsed.length === 0) {
        setUploadNotice({
          type: 'error',
          message:
            '유효한 화물 데이터를 찾지 못했습니다. 컬럼명(화물명, 가로, 세로, 높이, 수량)을 확인해 주세요.',
        });
        return;
      }
      setCargos(parsed);
      setUploadNotice({
        type: 'success',
        message: `"${file.name}"에서 총 ${parsed.length}개 품목(${parsed
          .reduce((a, b) => a + b.quantity, 0)
          .toLocaleString()}박스)을 불러왔습니다. 아래 [1단계: 파레트 적재 계산하기] 버튼을 눌러주세요.`,
      });
    } catch (err) {
      setUploadNotice({
        type: 'error',
        message: `파일 파싱 중 오류가 발생했습니다: ${err.message}`,
      });
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) processUploadedFile(file);
    e.target.value = '';
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDraggingFile(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processUploadedFile(file);
  };

  const handleApplyPasteText = () => {
    const parsed = parseCargoFromText(pasteText);
    if (parsed.length === 0) {
      setUploadNotice({
        type: 'error',
        message: '붙여넣은 텍스트에서 유효한 화물 행을 찾지 못했습니다.',
      });
      return;
    }
    setCargos(parsed);
    setPasteModalOpen(false);
    setPasteText('');
    setUploadNotice({
      type: 'success',
      message: `붙여넣은 데이터에서 총 ${parsed.length}개 품목을 반영했습니다.`,
    });
  };

  const currentPallet = simResult
    ? simResult.pallets[selectedPalletIdx] || simResult.pallets[0] || null
    : null;

  const currentContainer = simResult
    ? simResult.containerResult.containers[selectedContainerIdx] ||
      simResult.containerResult.containers[0] ||
      null
    : null;

  const handleCopyReportText = () => {
    if (!simResult) return;
    const lines = [];
    lines.push('■ [파레트 & 컨테이너 적재 산출 요약서]');
    lines.push(
      `• 총 화물 수량: ${simResult.summary.totalBoxesPacked.toLocaleString()} CTNS (순수 화물 ${simResult.summary.totalCargoCbm} CBM)`
    );
    lines.push(
      `• 총 파레트 수: ${simResult.summary.totalPallets} PLT (총 중량 ${simResult.summary.totalWeight.toLocaleString()} kg / 파레트 자중 ${effectivePalletConfig.tareWeight}kg 포함)`
    );
    lines.push('');
    lines.push('1. 품목별 파레트 분할 산출 내역');
    simResult.palletWeightGroups.forEach((g) => {
      lines.push(
        `  - ${g.label} [${g.palletDim}]: 1단 ${g.firstLayerBoxCount}박스 × ${g.layerCount}단 (${g.boxesPerPallet} CTNS/PLT, 높이 약 ${(g.totalHeight / 10).toFixed(0)}cm) ➔ ${g.palletCount} PLT (PLT당 약 ${g.unitPalletWeight}kg / 합계 ${g.totalGroupWeight.toLocaleString()}kg)`
      );
    });
    lines.push('');
    lines.push(
      `2. ${simResult.selectedSpec.name} × ${simResult.summary.totalContainers}대 적재 배분 플랜`
    );
    simResult.containerResult.containers.forEach((c) => {
      lines.push(
        `  • 컨테이너 ${c.index}호기 (${c.placedPallets.length} PLT / ${c.boxCount.toLocaleString()} CTNS / ${c.totalWeight.toLocaleString()} kg / 바닥활용 ${c.fieldDiagnostics?.floorUtilizationPct || c.volumeUtilization}%):`
      );
      Object.entries(c.skuBreakdown || {}).forEach(([skuLabel, info]) => {
        lines.push(
          `    - ${skuLabel}: ${info.pallets} PLT (${info.boxes.toLocaleString()} CTNS · ${info.weight.toLocaleString()} kg)`
        );
      });
      if (c.fieldDiagnostics) {
        lines.push(
          `    - 작업성 진단: ${c.fieldDiagnostics.doorStatusText} / ${c.fieldDiagnostics.shoringText}`
        );
      }
    });

    const text = lines.join('\n');
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => {
        setUploadNotice({
          type: 'success',
          message: '📋 화주·현장 공유용 견적 및 작업지시서 요약 문구가 클립보드에 복사되었습니다! (카톡·메일에 바로 붙여넣기 가능)',
        });
      });
    }
  };

  return (
    <div className="cbm-app">
      {/* =====================================================================
          TOP HEADER & STEP PROGRESS NAVIGATION BAR
      ===================================================================== */}
      <header className="cbm-header">
        <div className="cbm-header-left">
          <div className="cbm-logo-badge">3D CBM</div>
          <div>
            <h1 className="cbm-title">
              화물 파레트 & 컨테이너 적재 견적 시뮬레이터
              <span className="cbm-version-tag">ESTIMATOR</span>
            </h1>
            <p className="cbm-subtitle">
              Step 1. 화물·조건 입력 ➔ Step 2. 파레트 사이즈별 산출 및 적재 시각화 ➔ Step 3. 컨테이너 산출 및 적재 시각화
            </p>
          </div>
        </div>

        {/* Step Quick Jump Pills */}
        <nav className="cbm-step-nav">
          <button
            type="button"
            className="cbm-step-pill active"
            onClick={() => step1Ref.current?.scrollIntoView({ behavior: 'smooth' })}
          >
            <span className="step-num">1</span> 화물·조건 입력
          </button>
          <span className="step-arrow">➔</span>
          <button
            type="button"
            className={`cbm-step-pill ${step2Unlocked ? 'active' : 'locked'}`}
            disabled={!step2Unlocked}
            onClick={() => step2Ref.current?.scrollIntoView({ behavior: 'smooth' })}
          >
            <span className="step-num">2</span> 파레트 산출·시각화
            {simResult && <strong>({simResult.summary.totalPallets} PLT)</strong>}
          </button>
          <span className="step-arrow">➔</span>
          <button
            type="button"
            className={`cbm-step-pill ${step3Unlocked ? 'active' : 'locked'}`}
            disabled={!step3Unlocked}
            onClick={() => step3Ref.current?.scrollIntoView({ behavior: 'smooth' })}
          >
            <span className="step-num">3</span> 컨테이너 산출·시각화
            {step3Unlocked && simResult && (
              <strong>({simResult.summary.totalContainers}대)</strong>
            )}
          </button>
        </nav>

        <div className="cbm-header-actions">
          <button
            type="button"
            className="cbm-btn cbm-btn-outline"
            onClick={downloadSampleExcelTemplate}
          >
            📥 엑셀 양식 다운로드
          </button>
          {simResult && (
            <>
              <button
                type="button"
                className="cbm-btn cbm-btn-outline"
                onClick={handleCopyReportText}
                title="카톡이나 메일에 바로 붙여넣을 수 있는 요약 텍스트 복사"
              >
                📋 견적 요약 복사
              </button>
              <button
                type="button"
                className="cbm-btn cbm-btn-outline"
                onClick={() => window.print()}
                title="현재 화면 리포트 인쇄 또는 PDF 저장"
              >
                🖨️ 인쇄/PDF
              </button>
              <button
                type="button"
                className="cbm-btn cbm-btn-emerald"
                onClick={() =>
                  exportSimulationResultExcel(simResult, effectiveCargos, effectivePalletConfig, {
                    doubleStack: stackMode !== 'single',
                  })
                }
              >
                📊 견적 리포트 엑셀 저장
              </button>
            </>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            style={{ display: 'none' }}
            onChange={handleFileChange}
          />
        </div>
      </header>

      {/* Notification Banner */}
      {uploadNotice && (
        <div className={`cbm-notice cbm-notice-${uploadNotice.type}`}>
          <span>{uploadNotice.message}</span>
          <button type="button" onClick={() => setUploadNotice(null)}>
            ✕
          </button>
        </div>
      )}

      {/* =====================================================================
          SECTION 1: STEP 1 — 화물 정보 입력 및 적재 조건 설정
      ===================================================================== */}
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
                <p>컨테이너 바닥에 파레트를 1층으로만 안전하게 적재합니다.</p>
              </button>

              <button
                type="button"
                className={`cbm-stack-btn ${stackMode === 'double_auto' ? 'active' : ''}`}
                onClick={() => setStackMode('double_auto')}
              >
                <div className="cbm-stack-btn-top">
                  <strong>2단 적재 — 파레트 높이 자동 맞춤</strong>
                  <span className="cbm-stack-tag highlight">2단 자동</span>
                </div>
                <p>
                  컨테이너 내부 높이에 파레트 2층이 들어가도록 파레트 최대 높이를{' '}
                  <strong>{effectivePalletConfig.maxTotalHeight}mm</strong>로 자동 제한합니다.
                </p>
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
                <p>
                  지정한 파레트 최대 높이를 유지하되, 합산 높이가 컨테이너 안에 들어가는 파레트만 2단으로 올립니다.
                </p>
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
                <span>🧱 홀·짝수단 벽돌식 교차 적재(인터로킹)</span>
              </label>
            </div>
            <div className="cbm-radio-pair">
              <button
                type="button"
                className={`cbm-radio-card ${!mixCargos ? 'active' : ''}`}
                onClick={() => setMixCargos(false)}
              >
                <strong>품목별 단독 적재 (분리)</strong>
                <span>품목마다 파레트를 섞지 않고 독립 산출 (권장)</span>
              </button>
              <button
                type="button"
                className={`cbm-radio-card ${mixCargos ? 'active' : ''}`}
                onClick={() => setMixCargos(true)}
              >
                <strong>다품종 잔량 혼적 허용 (안전검증)</strong>
                <span>완적 파레트 우선 확정 후, 지지면적·하중이 안전한 잔량만 합포장</span>
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
            <div
              style={{
                marginTop: '10px',
                padding: '8px 12px',
                borderRadius: '8px',
                background: 'rgba(56, 189, 248, 0.08)',
                border: '1px solid rgba(56, 189, 248, 0.25)',
                fontSize: '0.78rem',
                color: '#cbd5e1',
              }}
            >
              💡 <strong>파레트 돌출(Overhang) 자동 진단 안내:</strong> 돌출 여부는 계산 전에 미리 알 수 없으므로,{' '}
              <strong>[1단계 계산하기]</strong>를 누르면 먼저 파레트에 적재해 본 뒤{' '}
              <strong style={{ color: '#38bdf8' }}>
                Step 2에서 품목별로 몇 mm 돌출되는지(예: +60mm / 편측 30mm)와 파레트 절감 효과를 자동으로 보여주고 허용 여부를 선택
              </strong>
              할 수 있습니다.
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

      {/* =====================================================================
          SECTION 2: STEP 2 — 파레트 종류(사이즈)별 산출 & 한 파레트 적재 시각화
      ===================================================================== */}
      {step2Unlocked && simResult && (
        <section ref={step2Ref} className="cbm-step-section">
          <div className="cbm-section-banner step2-banner">
            <div className="cbm-section-banner-left">
              <span className="cbm-step-badge badge-amber">STEP 2</span>
              <div>
                <h2>파레트 종류(사이즈)별 필요 수량 및 한 파레트 적재 시각화</h2>
                <p>
                  파레트 사이즈(단일 규격 통일 또는 품목별 여러 사이즈 섞어 쓰기)를 선택하면 총 몇 파레트가 나오는지, 그리고 한 파레트에 박스를 어떻게 쌓으면 되는지 보여줍니다.
                </p>
              </div>
            </div>
            <div className="cbm-section-summary-pills">
              <div className="cbm-mini-stat highlight-amber">
                <span>총 산출 파레트 수</span>
                <strong>{simResult.summary.totalPallets.toLocaleString()} 파레트 (PLT)</strong>
              </div>
              <div className="cbm-mini-stat">
                <span>파레트 포함 총 중량</span>
                <strong>{simResult.summary.totalWeight.toLocaleString()} kg</strong>
              </div>
              <div className="cbm-mini-stat">
                <span>파레트 외경 총 부피</span>
                <strong>{simResult.summary.totalPalletCbm.toFixed(2)} CBM</strong>
              </div>
            </div>
          </div>

          {/* 2-A: Pallet Size Selection Cards (4 Uniform Presets + 1 Multi-Size Mix Card) */}
          <div className="cbm-card">
            <div className="cbm-card-header">
              <h2>2-A. 파레트 사이즈 선택 (단일 사이즈 통일 vs 여러 사이즈 섞어 쓰기)</h2>
              <span className="cbm-badge">카드를 클릭하면 즉시 적용됩니다</span>
            </div>

            <div className="cbm-pallet-mode-grid">
              {/* Card 0: Multi-Pallet Mix Mode (여러 파레트 사이즈 섞어 쓰기) */}
              <button
                type="button"
                className={`cbm-pallet-mode-card mix-mode-card ${
                  palletSelectionMode === 'CUSTOM_MIX' ? 'active' : ''
                }`}
                onClick={() => setPalletSelectionMode('CUSTOM_MIX')}
              >
                <div className="cbm-pm-top">
                  <span className="cbm-pm-tag mix-tag">여러 사이즈 혼합 (추천)</span>
                  <strong className="cbm-pm-count">
                    총 {customMixComparison?.totalPallets || simResult.summary.totalPallets} PLT
                  </strong>
                </div>
                <div className="cbm-pm-title">🔀 품목별 파레트 섞어 쓰기</div>
                <div className="cbm-pm-sub">
                  화물 치수에 맞춰 1100×1100과 1200×1000 등을 품목별로 조합 ({customMixComparison?.usedSpecs})
                </div>
              </button>

              {/* Cards 1~4: Uniform Pallet Presets */}
              {simResult.palletSpecComparison.map((specItem) => {
                const isSelected = palletSelectionMode === specItem.id;
                return (
                  <button
                    key={specItem.id}
                    type="button"
                    className={`cbm-pallet-mode-card ${isSelected ? 'active' : ''}`}
                    onClick={() => setPalletSelectionMode(specItem.id)}
                  >
                    <div className="cbm-pm-top">
                      <span className="cbm-pm-tag">단일 사이즈 통일</span>
                      <strong className="cbm-pm-count">총 {specItem.totalPallets} PLT</strong>
                    </div>
                    <div className="cbm-pm-title">{specItem.shortLabel}</div>
                    <div className="cbm-pm-sub">
                      모든 화물을 {specItem.width}×{specItem.length}mm 파레트로 통일 | 평균 공간효율{' '}
                      {specItem.avgUtilization}%
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Per-Cargo Pallet Spec Selector Bar when CUSTOM_MIX is active */}
            {palletSelectionMode === 'CUSTOM_MIX' && (
              <div className="cbm-mix-assign-box">
                <div className="cbm-mix-assign-head">
                  <div>
                    <strong>🛠️ 품목별 사용할 파레트 사이즈 지정 (여러 파레트 섞어 쓰기 설정)</strong>
                    <span>
                      각 화물마다 가장 잘 맞는 파레트 규격을 선택하세요. (예: 일반 화물은 1100×1100, 돌출 화물은 1200×1000)
                    </span>
                  </div>
                  <button
                    type="button"
                    className="cbm-btn-xs primary"
                    onClick={handleAutoRecommendPalletMix}
                  >
                    ⚡ 품목별 최적 파레트 자동 매칭
                  </button>
                </div>

                <div className="cbm-mix-assign-list">
                  {cargos.map((cargo) => {
                    const resolved = resolvePalletDimsForCargo(cargo, effectivePalletConfig);
                    const itemOv =
                      cargo.allowedOverhang !== undefined && cargo.allowedOverhang !== null
                        ? Number(cargo.allowedOverhang) || 0
                        : overhang;
                    const layerCnt = computeBest2DLayer(
                      resolved.width + itemOv,
                      resolved.length + itemOv,
                      cargo.width,
                      cargo.length,
                      cargo.allowRotate
                    ).length;
                    return (
                      <div key={cargo.id} className="cbm-mix-assign-item">
                        <div className="cbm-mix-item-info">
                          <span
                            className="cbm-color-dot"
                            style={{ background: cargo.color }}
                          />
                          <strong>{cargo.name}</strong>
                          <small>
                            ({cargo.width}×{cargo.length}×{cargo.height}mm, {cargo.quantity}박스)
                          </small>
                        </div>
                        <div className="cbm-mix-item-control">
                          <select
                            className="cbm-table-select"
                            value={cargo.palletSpecId || 'T11'}
                            onChange={(e) =>
                              handleCargoChange(cargo.id, 'palletSpecId', e.target.value)
                            }
                          >
                            <option value="T11">1100 × 1100 mm (T11 표준)</option>
                            <option value="T12">1200 × 1000 mm (T12 국제/돌출방지)</option>
                            <option value="EUR">1200 × 800 mm (EUR 유럽)</option>
                            <option value="EXPORT_1200">1200 × 1200 mm (수출 대형)</option>
                          </select>
                          <span className="cbm-mix-layer-badge">1단 {layerCnt}박스</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* 2-A-2: 파레트 적재 후 돌출(Overhang) 자동 진단 & 허용 여부 선택 패널 */}
          {simResult.overhangDiagnostics && simResult.overhangDiagnostics.length > 0 && (
            <div
              className="cbm-card"
              style={{
                border: '1px solid rgba(245, 158, 11, 0.45)',
                background: 'linear-gradient(180deg, rgba(30, 41, 59, 0.92), rgba(15, 23, 42, 0.95))',
              }}
            >
              <div className="cbm-card-header" style={{ flexWrap: 'wrap', gap: '10px' }}>
                <div>
                  <h2 style={{ color: '#fbbf24', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    📏 파레트 적재 후 돌출(Overhang) 자동 감지 & 허용 여부 선택
                  </h2>
                  <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: '#cbd5e1' }}>
                    파레트에 정사이즈(0mm)로 먼저 적재한 뒤, 각 품목별로 <strong>몇 mm 돌출되는지</strong>와{' '}
                    <strong>돌출 허용 시 줄어드는 파레트 수</strong>를 자동 분석했습니다. 품목별로 허용 여부를 선택하세요.
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    className="cbm-btn-xs"
                    onClick={() => {
                      setOverhang(0);
                      setCargos((prev) =>
                        prev.map((c) => ({ ...c, allowedOverhang: 0 }))
                      );
                    }}
                  >
                    🔒 전 품목 정사이즈 (돌출 0mm 초기화)
                  </button>
                  <button
                    type="button"
                    className="cbm-btn-xs primary"
                    style={{ background: '#d97706', borderColor: '#f59e0b' }}
                    onClick={() => {
                      const oppMap = new Map(
                        simResult.overhangDiagnostics.map((d) => [
                          d.cargoId,
                          d.opportunity ? d.opportunity.requiredOverhangMm : 0,
                        ])
                      );
                      setCargos((prev) =>
                        prev.map((c) => ({
                          ...c,
                          allowedOverhang: oppMap.get(c.id) || 0,
                        }))
                      );
                    }}
                  >
                    ⚠️ 감지된 돌출 일괄 허용 적용
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '8px' }}>
                {simResult.overhangDiagnostics.map((diag) => {
                  const opp = diag.opportunity;
                  const t12Alt = diag.t12Alternative;
                  const isOvApplied = diag.appliedOverhang > 0 && diag.isOverhangActive;

                  return (
                    <div
                      key={diag.cargoId}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: '12px',
                        padding: '12px 14px',
                        borderRadius: '10px',
                        background: isOvApplied
                          ? 'rgba(245, 158, 11, 0.12)'
                          : 'rgba(15, 23, 42, 0.75)',
                        border: isOvApplied
                          ? '1px solid rgba(245, 158, 11, 0.55)'
                          : '1px solid rgba(148, 163, 184, 0.22)',
                      }}
                    >
                      <div style={{ flex: '1 1 420px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                          <span
                            className="cbm-color-dot"
                            style={{ background: diag.color }}
                          />
                          <strong style={{ fontSize: '0.92rem', color: '#f8fafc' }}>
                            {diag.cargoName}
                          </strong>
                          <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                            ({diag.boxW}×{diag.boxL}×{diag.boxH}mm · {diag.quantity.toLocaleString()}박스)
                          </span>
                          <span className="cbm-spec-chip t11" style={{ fontSize: '0.73rem' }}>
                            현재 파레트: {diag.palletW}×{diag.palletL}mm
                          </span>
                          {isOvApplied ? (
                            <span
                              style={{
                                fontSize: '0.73rem',
                                fontWeight: 700,
                                padding: '2px 8px',
                                borderRadius: '999px',
                                background: 'rgba(245, 158, 11, 0.25)',
                                color: '#fcd34d',
                                border: '1px solid rgba(245, 158, 11, 0.5)',
                              }}
                            >
                              ⚠️ 현재 돌출 허용 적용 중: 총 +{diag.current.maxOverhangMm}mm (편측 {diag.current.eachSideMax}mm)
                            </span>
                          ) : (
                            <span
                              style={{
                                fontSize: '0.73rem',
                                fontWeight: 600,
                                padding: '2px 8px',
                                borderRadius: '999px',
                                background: 'rgba(16, 185, 129, 0.15)',
                                color: '#6ee7b7',
                              }}
                            >
                              ✅ 정사이즈 적재 중 (돌출 0mm)
                            </span>
                          )}
                        </div>

                        <div style={{ marginTop: '6px', fontSize: '0.8rem', color: '#cbd5e1', lineHeight: 1.5 }}>
                          <div>
                            • <strong>정사이즈(돌출 0mm) 적재 시:</strong> 1단{' '}
                            <strong>{diag.strict.layerCount}박스</strong> (적재외곽 {diag.strict.spanW}×
                            {diag.strict.spanL}mm) → 파레트당 {diag.strict.boxesPerPallet}박스 · 총{' '}
                            <strong style={{ color: '#93c5fd' }}>{diag.strict.totalPallets} 파레트</strong>
                          </div>

                          {opp ? (
                            <div style={{ color: '#fde68a', marginTop: '2px' }}>
                              • <strong>💡 돌출 감지 결과:</strong> 파레트 밖으로{' '}
                              <strong style={{ color: '#fbbf24', textDecoration: 'underline' }}>
                                총 +{opp.requiredOverhangMm}mm (양쪽 편측 {opp.eachSideMax}mm, 외곽{' '}
                                {opp.spanW}×{opp.spanL}mm)
                              </strong>{' '}
                              돌출 허용 시 → 1단{' '}
                              <strong>
                                {diag.strict.layerCount}박스 → {opp.layerCount}박스
                              </strong>
                              로 증가 ({diag.strict.totalPallets}PLT →{' '}
                              <strong style={{ color: '#34d399' }}>{opp.totalPallets}PLT</strong>
                              {opp.savedPallets > 0 ? `, ${opp.savedPallets}파레트 절감!` : ''})
                            </div>
                          ) : (
                            <div style={{ color: '#94a3b8', marginTop: '2px' }}>
                              • 150mm 이내 돌출로는 추가 적재 가능한 박스 열이 없습니다 (현재 정사이즈가 최적).
                            </div>
                          )}

                          {t12Alt && (
                            <div style={{ color: '#6ee7b7', marginTop: '2px' }}>
                              • <strong>🔄 무돌출 파레트 변경 대안:</strong> 이 품목만{' '}
                              <strong>1200×1000mm 파레트</strong>로 변경하면{' '}
                              <strong>돌출(0mm) 없이 정사이즈</strong>로 1단{' '}
                              <strong>{t12Alt.layerCount}박스</strong> (적재외곽 {t12Alt.spanW}×
                              {t12Alt.spanL}mm, 총 <strong>{t12Alt.totalPallets}PLT</strong>) 적재가 가능합니다!
                            </div>
                          )}
                        </div>
                      </div>

                      {/* 우측 허용/비허용 선택 컨트롤 */}
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          flexWrap: 'wrap',
                        }}
                      >
                        <button
                          type="button"
                          className={`cbm-btn-xs ${!isOvApplied ? 'primary' : ''}`}
                          onClick={() => handleCargoChange(diag.cargoId, 'allowedOverhang', 0)}
                        >
                          🔒 돌출 불허 (0mm)
                        </button>

                        {opp && (
                          <button
                            type="button"
                            className="cbm-btn-xs"
                            style={{
                              background:
                                diag.appliedOverhang >= opp.requiredOverhangMm
                                  ? '#d97706'
                                  : 'rgba(245, 158, 11, 0.16)',
                              borderColor: '#f59e0b',
                              color:
                                diag.appliedOverhang >= opp.requiredOverhangMm
                                  ? '#ffffff'
                                  : '#fcd34d',
                              fontWeight: 700,
                            }}
                            onClick={() =>
                              handleCargoChange(
                                diag.cargoId,
                                'allowedOverhang',
                                opp.requiredOverhangMm
                              )
                            }
                          >
                            ⚠️ +{opp.requiredOverhangMm}mm (편측 {opp.eachSideMax}mm) 돌출 허용
                          </button>
                        )}

                        {t12Alt && (
                          <button
                            type="button"
                            className="cbm-btn-xs"
                            style={{
                              background: 'rgba(16, 185, 129, 0.18)',
                              borderColor: '#10b981',
                              color: '#6ee7b7',
                              fontWeight: 700,
                            }}
                            onClick={() => {
                              setPalletSelectionMode('CUSTOM_MIX');
                              setCargos((prev) =>
                                prev.map((c) =>
                                  c.id === diag.cargoId
                                    ? { ...c, palletSpecId: 'T12', allowedOverhang: 0 }
                                    : c
                                )
                              );
                            }}
                          >
                            🔄 1200×1000 파레트 사용 (돌출 0mm)
                          </button>
                        )}

                        <label
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontSize: '0.74rem',
                            color: '#94a3b8',
                            marginLeft: '4px',
                          }}
                        >
                          <span>직접입력:</span>
                          <input
                            type="number"
                            min={0}
                            max={150}
                            step={5}
                            value={diag.appliedOverhang}
                            onChange={(e) =>
                              handleCargoChange(
                                diag.cargoId,
                                'allowedOverhang',
                                Math.max(0, Number(e.target.value) || 0)
                              )
                            }
                            style={{
                              width: '54px',
                              padding: '3px 5px',
                              borderRadius: '5px',
                              border: '1px solid #475569',
                              background: '#0f172a',
                              color: '#f8fafc',
                              fontSize: '0.76rem',
                              textAlign: 'right',
                            }}
                          />
                          <span>mm</span>
                        </label>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 2-B: Pallet Breakdown Table & Single Pallet 2D/3D Visualization */}
          <div className="cbm-card">
            <div className="cbm-card-header" style={{ flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <h2>
                  2-B. 품목별 산출 파레트 내역 및 「한 파레트에 어떻게 적재하면 되는지」 시각화
                </h2>
                <span className="cbm-badge" style={{ display: 'inline-block', marginTop: '4px' }}>
                  표의 행을 클릭하면 아래 적재 도면과 3D가 전환됩니다
                </span>
              </div>

              {/* 빈 바닥 채움(기본값) vs 최대한 높게 쌓아 바닥 공간 남김(선택사항) 전환 스위치 */}
              {simResult.floorSpreadInfo &&
                (simResult.floorSpreadInfo.emptyFloorSlotsBeforeSpread > 0 ||
                  simResult.floorSpreadInfo.isSpreadActive) && (
                  <div
                    style={{
                      display: 'inline-flex',
                      background: '#0f172a',
                      border: '1px solid #334155',
                      borderRadius: '9px',
                      padding: '3px',
                      gap: '4px',
                      flexWrap: 'wrap',
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => setFullFloorSpread(true)}
                      style={{
                        border: 'none',
                        borderRadius: '7px',
                        padding: '6px 12px',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        background: fullFloorSpread ? '#059669' : 'transparent',
                        color: fullFloorSpread ? '#ffffff' : '#94a3b8',
                      }}
                    >
                      🛡️ 빈 바닥 채움 (기본 · 총 {simResult.floorSpreadInfo.totalAvailableFloorSlots}PLT)
                    </button>
                    <button
                      type="button"
                      onClick={() => setFullFloorSpread(false)}
                      style={{
                        border: 'none',
                        borderRadius: '7px',
                        padding: '6px 12px',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        background: !fullFloorSpread ? '#2563eb' : 'transparent',
                        color: !fullFloorSpread ? '#ffffff' : '#94a3b8',
                      }}
                    >
                      📦 최대한 높게 쌓아 바닥 공간 만들기 (선택 · 총 {simResult.floorSpreadInfo.basePalletCount}PLT)
                    </button>
                  </div>
                )}
            </div>

            {/* Summary Table by Pallet Group */}
            <div className="cbm-weight-table-wrap" style={{ marginBottom: '18px' }}>
              <table className="cbm-weight-summary-table">
                <thead>
                  <tr>
                    <th>품목 및 파레트당 박스 수</th>
                    <th>사용 파레트 규격</th>
                    <th>한 파레트 1층 배열 방식</th>
                    <th>적재 단수 (높이)</th>
                    <th>파레트 수</th>
                    <th>파레트당 중량</th>
                    <th>합계 중량</th>
                    <th>적재 방법 시각화</th>
                  </tr>
                </thead>
                <tbody>
                  {simResult.palletWeightGroups.map((g, idx) => {
                    const isSelectedGroup =
                      currentPallet && g.palletIndices.includes(currentPallet.index);
                    return (
                      <tr
                        key={idx}
                        className={isSelectedGroup ? 'selected-group-row' : ''}
                        style={{ cursor: 'pointer' }}
                        onClick={() => {
                          setSelectedPalletIdx(g.samplePalletIndex);
                          setPalletVisibleStep(100);
                        }}
                      >
                        <td>
                          <strong>{g.label}</strong>
                        </td>
                        <td>
                          <span
                            className={`cbm-spec-chip ${
                              g.palletDim.includes('1200×1000') ? 't12' : 't11'
                            }`}
                          >
                            {g.palletDim}
                          </span>
                          {g.maxOverhangMm > 0 && (
                            <span
                              style={{
                                marginLeft: '6px',
                                fontSize: '0.7rem',
                                padding: '2px 6px',
                                borderRadius: '999px',
                                background: 'rgba(245, 158, 11, 0.22)',
                                color: '#fcd34d',
                                border: '1px solid rgba(245, 158, 11, 0.45)',
                                fontWeight: 700,
                              }}
                            >
                              ⚠️ 돌출 +{g.maxOverhangMm}mm
                            </span>
                          )}
                        </td>
                        <td>{g.orientDesc}</td>
                        <td>
                          <strong>{g.layerCount}단</strong> ({g.totalHeight}mm)
                        </td>
                        <td>
                          <strong style={{ color: '#38bdf8' }}>{g.palletCount}개</strong>
                        </td>
                        <td>약 {g.unitPalletWeight.toFixed(1)}kg</td>
                        <td>
                          <strong>{g.totalGroupWeight.toLocaleString()}kg</strong>
                        </td>
                        <td>
                          <button
                            type="button"
                            className={`cbm-btn-xs ${isSelectedGroup ? 'primary' : ''}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedPalletIdx(g.samplePalletIndex);
                              setPalletVisibleStep(100);
                            }}
                          >
                            🔍 이 파레트 보기
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr>
                    <td>
                      <strong>총합</strong>
                    </td>
                    <td>-</td>
                    <td>-</td>
                    <td>-</td>
                    <td>
                      <strong style={{ color: '#38bdf8', fontSize: '14.5px' }}>
                        총 {simResult.summary.totalPallets}개 파레트
                      </strong>
                    </td>
                    <td>-</td>
                    <td>
                      <strong style={{ color: '#fbbf24', fontSize: '14.5px' }}>
                        {simResult.summary.totalWeight.toLocaleString()}kg
                      </strong>
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Single Pallet Selector & 2D/3D Split Visualizer */}
            {currentPallet && (
              <div className="cbm-single-pallet-visualizer">
                <div className="cbm-vis-subheader">
                  <div className="cbm-pallet-selector-bar">
                    <label>📦 현재 보고 있는 파레트:</label>
                    <select
                      value={selectedPalletIdx}
                      onChange={(e) => {
                        setSelectedPalletIdx(Number(e.target.value));
                        setPalletVisibleStep(100);
                      }}
                      className="cbm-pallet-select"
                    >
                      {simResult.pallets.map((p, idx) => {
                        const breakdown = effectiveCargos
                          .map((c) =>
                            p.cargoCounts[c.id]
                              ? `${c.name}(${p.cargoCounts[c.id]}박스)`
                              : null
                          )
                          .filter(Boolean)
                          .join(' + ');
                        return (
                          <option key={p.id} value={idx}>
                            Pallet #{p.index} [{p.width}×{p.length}mm] — {breakdown} ({p.layers.length}단 ·{' '}
                            {p.totalHeight}mm · {p.totalWeight}kg)
                          </option>
                        );
                      })}
                    </select>
                    <div className="cbm-pallet-nav-btns">
                      <button
                        type="button"
                        disabled={selectedPalletIdx <= 0}
                        onClick={() => setSelectedPalletIdx((i) => Math.max(0, i - 1))}
                      >
                        ◀ 이전 파레트
                      </button>
                      <button
                        type="button"
                        disabled={selectedPalletIdx >= simResult.pallets.length - 1}
                        onClick={() =>
                          setSelectedPalletIdx((i) =>
                            Math.min(simResult.pallets.length - 1, i + 1)
                          )
                        }
                      >
                        다음 파레트 ▶
                      </button>
                    </div>
                  </div>

                  <label className="cbm-mini-check">
                    <input
                      type="checkbox"
                      checked={explodePalletLayers}
                      onChange={(e) => setExplodePalletLayers(e.target.checked)}
                    />
                    <span>층간 분리뷰(Explode) 켜기</span>
                  </label>
                </div>

                {/* 🧱 상자를 어떻게 쌓을지 선택 (1층 평면 배열 패턴 · 층간 교차 방식 · 상자 세움/눕힘 자세) */}
                {simResult.stackingDiagnostics &&
                  simResult.stackingDiagnostics.length > 0 &&
                  (() => {
                    const activeCargoDiag =
                      simResult.stackingDiagnostics.find(
                        (d) => d.cargoId === currentPallet.primaryCargoId
                      ) || simResult.stackingDiagnostics[0];
                    if (!activeCargoDiag) return null;

                    return (
                      <div
                        style={{
                          marginBottom: '14px',
                          padding: '14px 16px',
                          borderRadius: '11px',
                          background: 'rgba(15, 23, 42, 0.85)',
                          border: '1px solid rgba(56, 189, 248, 0.35)',
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            flexWrap: 'wrap',
                            gap: '10px',
                            marginBottom: '10px',
                            paddingBottom: '8px',
                            borderBottom: '1px solid rgba(148, 163, 184, 0.2)',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                            <span style={{ fontSize: '0.92rem', fontWeight: 800, color: '#38bdf8' }}>
                              🧱 상자를 어떻게 쌓을지 선택 (적재 패턴 · 층간 방식 · 세움/눕힘 자세)
                            </span>
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px',
                                padding: '3px 10px',
                                borderRadius: '999px',
                                background: 'rgba(30, 41, 59, 0.9)',
                                border: '1px solid rgba(148, 163, 184, 0.3)',
                                fontSize: '0.78rem',
                                fontWeight: 700,
                                color: '#f8fafc',
                              }}
                            >
                              <span
                                className="cbm-color-dot"
                                style={{ background: activeCargoDiag.color }}
                              />
                              현재 설정 품목: {activeCargoDiag.cargoName}
                            </span>
                          </div>

                          {/* 품목 빠른 전환 탭 */}
                          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                            {simResult.stackingDiagnostics.map((d) => {
                              const isCurrent = d.cargoId === activeCargoDiag.cargoId;
                              return (
                                <button
                                  key={d.cargoId}
                                  type="button"
                                  className="cbm-btn-xs"
                                  style={{
                                    background: isCurrent ? '#2563eb' : 'rgba(30, 41, 59, 0.7)',
                                    borderColor: isCurrent ? '#3b82f6' : '#475569',
                                    color: isCurrent ? '#ffffff' : '#cbd5e1',
                                    fontWeight: isCurrent ? 700 : 500,
                                  }}
                                  onClick={() => {
                                    const sampleIdx = simResult.pallets.findIndex(
                                      (p) => p.primaryCargoId === d.cargoId
                                    );
                                    if (sampleIdx !== -1) setSelectedPalletIdx(sampleIdx);
                                  }}
                                >
                                  {d.cargoName} 설정 보기
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        <div
                          style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                            gap: '12px',
                          }}
                        >
                          {/* ① 1층 평면 배열 모양 (5종) */}
                          <div
                            style={{
                              background: 'rgba(30, 41, 59, 0.55)',
                              border: '1px solid rgba(148, 163, 184, 0.2)',
                              borderRadius: '9px',
                              padding: '10px 12px',
                            }}
                          >
                            <div
                              style={{
                                fontSize: '0.8rem',
                                fontWeight: 700,
                                color: '#93c5fd',
                                marginBottom: '6px',
                              }}
                            >
                              ① 한 층(1단) 평면 배열 모양 선택
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                              {activeCargoDiag.patternOptions.map((opt) => {
                                const isSel = activeCargoDiag.currentPattern === opt.id;
                                return (
                                  <button
                                    key={opt.id}
                                    type="button"
                                    onClick={() =>
                                      handleCargoChange(
                                        activeCargoDiag.cargoId,
                                        'layerPattern',
                                        opt.id
                                      )
                                    }
                                    style={{
                                      display: 'flex',
                                      justifyContent: 'space-between',
                                      alignItems: 'center',
                                      padding: '6px 9px',
                                      borderRadius: '7px',
                                      border: isSel
                                        ? '1px solid #38bdf8'
                                        : '1px solid rgba(148, 163, 184, 0.18)',
                                      background: isSel
                                        ? 'rgba(56, 189, 248, 0.18)'
                                        : 'rgba(15, 23, 42, 0.65)',
                                      color: '#f8fafc',
                                      cursor: 'pointer',
                                      textAlign: 'left',
                                      fontSize: '0.77rem',
                                    }}
                                  >
                                    <div>
                                      <strong style={{ color: isSel ? '#38bdf8' : '#e2e8f0' }}>
                                        {opt.label}
                                      </strong>
                                      <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
                                        {opt.shortDesc}
                                      </div>
                                    </div>
                                    <span
                                      style={{
                                        fontSize: '0.73rem',
                                        fontWeight: 700,
                                        color: isSel ? '#fde047' : '#cbd5e1',
                                        whiteSpace: 'nowrap',
                                        marginLeft: '8px',
                                      }}
                                    >
                                      1단 {opt.layerBoxCount}박스 · {opt.totalPallets}PLT
                                    </span>
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                          {/* ② 위로 단을 올릴 때 층간 쌓기 방식 (3종) & ③ 상자 세움/눕힘 자세 (3종) */}
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            <div
                              style={{
                                background: 'rgba(30, 41, 59, 0.55)',
                                border: '1px solid rgba(148, 163, 184, 0.2)',
                                borderRadius: '9px',
                                padding: '10px 12px',
                              }}
                            >
                              <div
                                style={{
                                  fontSize: '0.8rem',
                                  fontWeight: 700,
                                  color: '#fcd34d',
                                  marginBottom: '6px',
                                }}
                              >
                                ② 위로 단을 쌓아 올리는 방식 (층간 교차 vs 수직 기둥)
                              </div>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                {activeCargoDiag.stackStyleOptions.map((stOpt) => {
                                  const isSel = activeCargoDiag.currentStackStyle === stOpt.id;
                                  return (
                                    <button
                                      key={stOpt.id}
                                      type="button"
                                      onClick={() =>
                                        handleCargoChange(
                                          activeCargoDiag.cargoId,
                                          'stackingStyle',
                                          stOpt.id
                                        )
                                      }
                                      style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        padding: '6px 9px',
                                        borderRadius: '7px',
                                        border: isSel
                                          ? '1px solid #f59e0b'
                                          : '1px solid rgba(148, 163, 184, 0.18)',
                                        background: isSel
                                          ? 'rgba(245, 158, 11, 0.18)'
                                          : 'rgba(15, 23, 42, 0.65)',
                                        color: '#f8fafc',
                                        cursor: 'pointer',
                                        textAlign: 'left',
                                        fontSize: '0.77rem',
                                      }}
                                    >
                                      <div>
                                        <strong style={{ color: isSel ? '#fbbf24' : '#e2e8f0' }}>
                                          {stOpt.label}
                                        </strong>
                                        <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
                                          {stOpt.shortDesc}
                                        </div>
                                      </div>
                                      <span
                                        style={{
                                          fontSize: '0.72rem',
                                          fontWeight: 700,
                                          color: isSel ? '#fbbf24' : '#64748b',
                                          marginLeft: '8px',
                                        }}
                                      >
                                        {isSel ? '적용 중' : '선택'}
                                      </span>
                                    </button>
                                  );
                                })}
                              </div>
                            </div>

                            <div
                              style={{
                                background: 'rgba(30, 41, 59, 0.55)',
                                border: '1px solid rgba(148, 163, 184, 0.2)',
                                borderRadius: '9px',
                                padding: '10px 12px',
                              }}
                            >
                              <div
                                style={{
                                  fontSize: '0.8rem',
                                  fontWeight: 700,
                                  color: '#6ee7b7',
                                  marginBottom: '6px',
                                }}
                              >
                                ③ 상자 놓는 자세 (세워 쌓기 vs 옆/앞으로 눕혀 쌓기)
                              </div>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                {activeCargoDiag.postureOptions.map((posOpt) => {
                                  const isSel = activeCargoDiag.currentPosture === posOpt.id;
                                  return (
                                    <button
                                      key={posOpt.id}
                                      type="button"
                                      onClick={() =>
                                        handleCargoChange(
                                          activeCargoDiag.cargoId,
                                          'boxPosture',
                                          posOpt.id
                                        )
                                      }
                                      style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        padding: '6px 9px',
                                        borderRadius: '7px',
                                        border: isSel
                                          ? '1px solid #10b981'
                                          : '1px solid rgba(148, 163, 184, 0.18)',
                                        background: isSel
                                          ? 'rgba(16, 185, 129, 0.18)'
                                          : 'rgba(15, 23, 42, 0.65)',
                                        color: '#f8fafc',
                                        cursor: 'pointer',
                                        textAlign: 'left',
                                        fontSize: '0.77rem',
                                      }}
                                    >
                                      <div>
                                        <strong style={{ color: isSel ? '#34d399' : '#e2e8f0' }}>
                                          {posOpt.label}
                                        </strong>
                                        <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
                                          {posOpt.dimText}
                                        </div>
                                      </div>
                                      <span
                                        style={{
                                          fontSize: '0.73rem',
                                          fontWeight: 700,
                                          color: isSel ? '#6ee7b7' : '#cbd5e1',
                                          whiteSpace: 'nowrap',
                                          marginLeft: '8px',
                                        }}
                                      >
                                        1단 {posOpt.layerBoxCount}박스 · {posOpt.maxLayers}단 (
                                        {posOpt.totalPallets}PLT)
                                      </span>
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                <div className="cbm-pallet-split-view">
                  {/* Left: 2D Top-Down Layer Blueprint & Loading Guide */}
                  <div className="cbm-pallet-blueprint-col">
                    <div className="cbm-blueprint-box">
                      <h3>📐 한 파레트 1층 평면 적재 도면 (위에서 본 모습)</h3>
                      <p className="cbm-blueprint-sub">
                        파레트 사이즈: <strong>{currentPallet.width} × {currentPallet.length} mm</strong> | 1층 적재:{' '}
                        <strong>{currentPallet.layers[0]?.boxCount || 0}박스</strong>
                        {currentPallet.maxOverhangMm > 0 ? (
                          <span style={{ color: '#fbbf24', marginLeft: '8px', fontWeight: 700 }}>
                            (⚠️ 돌출 +{currentPallet.maxOverhangMm}mm / 적재외곽{' '}
                            {currentPallet.cargoSpanW}×{currentPallet.cargoSpanL}mm)
                          </span>
                        ) : (
                          <span style={{ color: '#34d399', marginLeft: '8px' }}>
                            (정사이즈 · 돌출 0mm)
                          </span>
                        )}
                      </p>
                      <div className="cbm-blueprint-svg-wrap">
                        <svg
                          viewBox={`-100 -100 ${currentPallet.width + 200} ${
                            currentPallet.length + 200
                          }`}
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
                      <h4>📋 Pallet #{currentPallet.index} 적재 작업 가이드</h4>
                      <div className="cbm-info-row">
                        <span>파레트 규격:</span>
                        <strong>
                          {currentPallet.width} × {currentPallet.length} mm
                        </strong>
                      </div>
                      <div className="cbm-info-row">
                        <span>1층(단) 적재 수량:</span>
                        <strong>{currentPallet.layers[0]?.boxCount || 0} 박스 / 층</strong>
                      </div>
                      <div className="cbm-info-row">
                        <span>총 적재 단수 / 박스수:</span>
                        <strong>
                          {currentPallet.layers.length}단 적재 / 총{' '}
                          {currentPallet.boxes.length.toLocaleString()} 박스
                        </strong>
                      </div>
                      <div className="cbm-info-row">
                        <span>총 높이 (파레트 포함):</span>
                        <strong>
                          {currentPallet.totalHeight} mm (파레트 {currentPallet.baseHeight}mm + 화물{' '}
                          {currentPallet.cargoHeight}mm)
                        </strong>
                      </div>
                      <div className="cbm-info-row">
                        <span>파레트당 총 중량:</span>
                        <strong style={{ color: '#fbbf24' }}>
                          약 {currentPallet.totalWeight.toFixed(1)} kg (화물 {currentPallet.cargoWeight}kg + 자중{' '}
                          {currentPallet.tareWeight}kg)
                        </strong>
                      </div>
                    </div>
                  </div>

                  {/* Right: 3D Single Pallet Viewport */}
                  <div className="cbm-pallet-3d-col">
                    <ThreeViewport
                      mode="pallet"
                      palletInstance={currentPallet}
                      visibleStep={palletVisibleStep}
                      explodeLayers={explodePalletLayers}
                    />
                    <div className="cbm-playback-bar">
                      <button
                        type="button"
                        className="cbm-play-btn"
                        onClick={() => {
                          if (palletVisibleStep >= 100) setPalletVisibleStep(5);
                          setIsPalletPlaying((p) => !p);
                        }}
                      >
                        {isPalletPlaying ? '⏸ 일시정지' : '▶ 박스 적재 순서 재생'}
                      </button>
                      <div className="cbm-slider-wrap">
                        <span>적재 순서 ({palletVisibleStep}%)</span>
                        <input
                          type="range"
                          min={1}
                          max={100}
                          value={palletVisibleStep}
                          onChange={(e) => {
                            setIsPalletPlaying(false);
                            setPalletVisibleStep(Number(e.target.value));
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Step 2 -> Step 3 Action Button Bar */}
          <div className="cbm-step-action-bar">
            <button
              type="button"
              className="cbm-calculate-btn step-cta-btn step3-cta"
              onClick={handleRunStep2ToStep3}
            >
              🚢 [2단계 계산하기] 산출된 {simResult.summary.totalPallets}개 파레트를 컨테이너 종류별로 넣고 시각화 보기 ▼
            </button>
          </div>
        </section>
      )}

      {/* =====================================================================
          SECTION 3: STEP 3 — 컨테이너 종류별 수용량 비교 및 컨테이너 적재 시각화
      ===================================================================== */}
      {step2Unlocked && step3Unlocked && simResult && (
        <section ref={step3Ref} className="cbm-step-section">
          <div className="cbm-section-banner step3-banner">
            <div className="cbm-section-banner-left">
              <span className="cbm-step-badge badge-emerald">STEP 3</span>
              <div>
                <h2>컨테이너 종류별 수용 파레트 수 및 컨테이너 전체 적재 시각화</h2>
                <p>
                  컨테이너 종류(20ft / 40ft / 40ft HC)에 따라 1대당 몇 파레트를 넣을 수 있는지 비교하고, 파레트를 모두 넣었을 때의 3D 컨테이너 내부와 무게중심(CoG)을 확인하세요.
                </p>
              </div>
            </div>
            <div className="cbm-section-summary-pills">
              <div className="cbm-mini-stat highlight-emerald">
                <span>선택 컨테이너 및 필요 대수</span>
                <strong>
                  {simResult.selectedSpec.name} × {simResult.summary.totalContainers}대
                </strong>
              </div>
              <div className="cbm-mini-stat">
                <span>호기별 파레트 배분</span>
                <strong>
                  {simResult.containerResult.containers
                    .map((c) => `${c.index}호기: ${c.placedPallets.length}PLT`)
                    .join(' / ')}
                </strong>
              </div>
              <div className="cbm-mini-stat">
                <span>무게중심(CoG) 안전도</span>
                <strong style={{ color: '#6ee7b7' }}>
                  {currentContainer?.cog?.statusText || '정상'}
                </strong>
              </div>
            </div>
          </div>

          {/* 3-A: Container Type Comparison Cards (20ft Dry / 40ft Dry / 40ft HC) */}
          <div className="cbm-card">
            <div className="cbm-card-header">
              <h2>3-A. 컨테이너 종류별 적재 가능 파레트 수 & 필요 대수 비교</h2>
              <div className="cbm-vis-filters">
                <label className="cbm-mini-check">
                  <input
                    type="checkbox"
                    checked={balanceContainers}
                    onChange={(e) => setBalanceContainers(e.target.checked)}
                  />
                  <span>⚖️ 전 컨테이너 호기별 바닥 균등 배분</span>
                </label>
                <label className="cbm-mini-check">
                  <input
                    type="checkbox"
                    checked={fullFloorSpread}
                    onChange={(e) => setFullFloorSpread(e.target.checked)}
                  />
                  <span style={{ color: '#fbbf24', fontWeight: 700 }}>
                    🛡️ 빈 바닥 제로 (단수 낮춰 바닥 100% 풀채움)
                  </span>
                </label>
                <label className="cbm-mini-check">
                  <input
                    type="checkbox"
                    checked={optimizeCoG}
                    onChange={(e) => setOptimizeCoG(e.target.checked)}
                  />
                  <span>🎯 무게중심(CoG) 밸런싱 배치</span>
                </label>
              </div>
            </div>

            {/* 컨테이너 바닥 공간 100% 활용 (쏠림/고정비용 방지) 안내 및 원클릭 전환 배너 */}
            {simResult.floorSpreadInfo &&
              (simResult.floorSpreadInfo.emptyFloorSlotsBeforeSpread > 0 ||
                simResult.floorSpreadInfo.isSpreadActive) && (
                <div
                  style={{
                    marginBottom: '14px',
                    padding: '12px 14px',
                    borderRadius: '10px',
                    background: simResult.floorSpreadInfo.isSpreadActive
                      ? 'rgba(16, 185, 129, 0.14)'
                      : 'rgba(245, 158, 11, 0.12)',
                    border: simResult.floorSpreadInfo.isSpreadActive
                      ? '1px solid rgba(16, 185, 129, 0.5)'
                      : '1px solid rgba(245, 158, 11, 0.45)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '12px',
                  }}
                >
                  <div style={{ flex: '1 1 500px', fontSize: '0.82rem', lineHeight: 1.5 }}>
                    {simResult.floorSpreadInfo.isSpreadActive ? (
                      <>
                        <div style={{ fontWeight: 700, color: '#34d399', fontSize: '0.88rem' }}>
                          🛡️ 컨테이너 바닥 100% 풀채움 (단수 분산 적재) 적용 완료!
                        </div>
                        <div style={{ color: '#e2e8f0', marginTop: '3px' }}>
                          고단 파레트의 상부 단을 나누어 총 파레트 수를{' '}
                          <strong>
                            {simResult.floorSpreadInfo.basePalletCount}PLT →{' '}
                            {simResult.floorSpreadInfo.spreadPalletCount}PLT
                          </strong>
                          로 분산하여,{' '}
                          <strong style={{ color: '#6ee7b7' }}>
                            모든 컨테이너의 바닥 공간({simResult.floorSpreadInfo.totalAvailableFloorSlots}슬롯)을 빈틈없이 100% 채웠습니다.
                          </strong>{' '}
                          운항 중 화물이 쏠리거나 넘어지지 않으며 추가 고정장치(쇼링) 비용이 발생하지 않습니다.
                        </div>
                      </>
                    ) : (
                      <>
                        <div style={{ fontWeight: 700, color: '#fbbf24', fontSize: '0.88rem' }}>
                          ⚓ 해상 운항 중 화물 쏠림·전도 및 추가 고정장치(쇼링) 비용 방지 안내
                        </div>
                        <div style={{ color: '#cbd5e1', marginTop: '3px' }}>
                          현재 {simResult.summary.totalContainers}대의 컨테이너에 파레트를{' '}
                          <strong>
                            {simResult.containerResult.containers
                              .map((c) => `${c.index}호기 ${c.placedPallets.length}PLT`)
                              .join(' : ')}
                          </strong>
                          로 골고루 나누어 배분했으나, 전체 바닥 정원(
                          {simResult.floorSpreadInfo.totalAvailableFloorSlots}슬롯) 대비{' '}
                          <strong style={{ color: '#fcd34d' }}>
                            {simResult.floorSpreadInfo.emptyFloorSlotsBeforeSpread}칸의 빈 바닥 공간
                          </strong>
                          이 남아 있습니다. 고단 파레트의 단수를 낮춰 빈 바닥까지 파레트를 고르게 깔아주면{' '}
                          <strong style={{ color: '#38bdf8' }}>
                            바닥 공간을 100% 모두 사용하여 고정장치 없이도 흔들림을 완벽히 잡아줍니다.
                          </strong>
                        </div>
                      </>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      className="cbm-btn-xs"
                      style={{
                        background: fullFloorSpread ? '#059669' : 'rgba(15, 23, 42, 0.8)',
                        borderColor: fullFloorSpread ? '#10b981' : '#475569',
                        color: fullFloorSpread ? '#ffffff' : '#cbd5e1',
                        padding: '7px 12px',
                        fontWeight: 700,
                      }}
                      onClick={() => setFullFloorSpread(true)}
                    >
                      🛡️ 빈 바닥 100% 채우기 (기본값 · 총 {simResult.floorSpreadInfo.totalAvailableFloorSlots}PLT)
                    </button>
                    <button
                      type="button"
                      className="cbm-btn-xs"
                      style={{
                        background: !fullFloorSpread ? '#2563eb' : 'rgba(15, 23, 42, 0.8)',
                        borderColor: !fullFloorSpread ? '#3b82f6' : '#475569',
                        color: !fullFloorSpread ? '#ffffff' : '#cbd5e1',
                        padding: '7px 12px',
                        fontWeight: 700,
                      }}
                      onClick={() => setFullFloorSpread(false)}
                    >
                      📦 최대한 높게 쌓아 바닥 여유 공간 만들기 (선택 · 총 {simResult.floorSpreadInfo.basePalletCount}PLT)
                    </button>
                  </div>
                </div>
              )}

            <div className="cbm-container-3col-grid">
              {simResult.containerComparison.map((item) => {
                const isSelected = item.spec.id === selectedContainerId;
                return (
                  <button
                    key={item.spec.id}
                    type="button"
                    className={`cbm-container-cmp-card ${isSelected ? 'selected' : ''}`}
                    onClick={() => {
                      setSelectedContainerId(item.spec.id);
                      setSelectedContainerIdx(0);
                    }}
                  >
                    <div className="cbm-cc-top">
                      <div>
                        <h3>{item.spec.name}</h3>
                        <span>{item.spec.subName}</span>
                      </div>
                      <div className="cbm-cc-needed-badge">{item.containerCount}대 필요</div>
                    </div>

                    <div className="cbm-cc-specs">
                      <div>
                        <span>내부 치수 (길이×폭×높이)</span>
                        <strong>
                          {(item.spec.length / 1000).toFixed(2)}m ×{' '}
                          {(item.spec.width / 1000).toFixed(2)}m ×{' '}
                          {(item.spec.height / 1000).toFixed(2)}m
                        </strong>
                      </div>
                      <div>
                        <span>1대당 최대 수용량</span>
                        <strong>
                          바닥 1단 {item.floorSlots}PLT (최대 {item.maxCapacity}PLT/대)
                        </strong>
                      </div>
                      <div>
                        <span>호기별 적재 내역 (총 {item.palletCount}PLT)</span>
                        <strong>
                          {item.containers
                            .map((c) => `${c.index}호기: ${c.placedPallets.length}PLT`)
                            .join(' / ')}
                        </strong>
                      </div>
                      <div>
                        <span>평균 공간 활용률</span>
                        <strong>{item.avgUtilization}% (공인 {item.spec.nominalCbm} CBM)</strong>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* 최적 혼합 배차 추천 & 컨테이너 호기별 품목(SKU) 적재 명세표 */}
            <div
              style={{
                marginTop: '14px',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
                gap: '12px',
              }}
            >
              {simResult.fleetRecommendations && simResult.fleetRecommendations.length > 0 && (
                <div
                  style={{
                    background: 'rgba(15, 23, 42, 0.75)',
                    border: '1px solid rgba(56, 189, 248, 0.3)',
                    borderRadius: '10px',
                    padding: '12px 14px',
                  }}
                >
                  <div
                    style={{
                      fontSize: '0.84rem',
                      fontWeight: 700,
                      color: '#38bdf8',
                      marginBottom: '8px',
                    }}
                  >
                    🚛 실무 최적 배차 조합 제안 (단독 배차 vs 혼합 배차 비교)
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {simResult.fleetRecommendations.map((rec) => (
                      <div
                        key={rec.id}
                        style={{
                          padding: '8px 10px',
                          borderRadius: '8px',
                          background: rec.badge.includes('추천')
                            ? 'rgba(16, 185, 129, 0.12)'
                            : 'rgba(30, 41, 59, 0.65)',
                          border: rec.badge.includes('추천')
                            ? '1px solid rgba(16, 185, 129, 0.4)'
                            : '1px solid rgba(148, 163, 184, 0.2)',
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            fontSize: '0.82rem',
                            fontWeight: 700,
                            color: '#f8fafc',
                          }}
                        >
                          <span>{rec.title}</span>
                          <span
                            style={{
                              fontSize: '0.72rem',
                              padding: '2px 7px',
                              borderRadius: '999px',
                              background: rec.badge.includes('추천') ? '#059669' : '#334155',
                              color: '#fff',
                            }}
                          >
                            {rec.badge}
                          </span>
                        </div>
                        <div style={{ fontSize: '0.77rem', color: '#cbd5e1', marginTop: '3px' }}>
                          {rec.detail} — <span style={{ color: '#94a3b8' }}>{rec.note}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div
                style={{
                  background: 'rgba(15, 23, 42, 0.75)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  borderRadius: '10px',
                  padding: '12px 14px',
                }}
              >
                <div
                  style={{
                    fontSize: '0.84rem',
                    fontWeight: 700,
                    color: '#34d399',
                    marginBottom: '8px',
                  }}
                >
                  📋 컨테이너 호기별 적재 품목(SKU) 배분 명세표 ({simResult.selectedSpec.name})
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {simResult.containerResult.containers.map((c) => (
                    <div
                      key={`sku-bd-${c.id}`}
                      style={{
                        padding: '7px 10px',
                        borderRadius: '8px',
                        background: 'rgba(30, 41, 59, 0.65)',
                        border: '1px solid rgba(148, 163, 184, 0.18)',
                        fontSize: '0.78rem',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          fontWeight: 700,
                          color: '#f8fafc',
                          marginBottom: '3px',
                        }}
                      >
                        <span>
                          #{c.index}호기 (총 {c.placedPallets.length} PLT /{' '}
                          {c.boxCount.toLocaleString()} 박스)
                        </span>
                        <span style={{ color: '#6ee7b7' }}>
                          총 {c.totalWeight.toLocaleString()} kg
                        </span>
                      </div>
                      <div style={{ color: '#cbd5e1', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                        {(c.skuBreakdown || []).map((s) => (
                          <span key={s.name}>
                            • <strong>{s.name}</strong>: {s.palletCount}PLT (
                            {s.boxes.toLocaleString()}박스, {s.weightKg.toLocaleString()}kg)
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* 3-B: 3D Container Stuffing Visualization & 2D Floor Map with CoG */}
          <div className="cbm-visualizer-card">
            <div className="cbm-vis-subheader">
              <div className="cbm-instance-pills">
                {simResult.containerResult.containers.map((c, idx) => (
                  <button
                    key={c.id}
                    type="button"
                    className={`cbm-instance-pill ${
                      selectedContainerIdx === idx ? 'active' : ''
                    }`}
                    onClick={() => {
                      setSelectedContainerIdx(idx);
                      setContainerVisibleStep(100);
                    }}
                  >
                    <strong>
                      {c.spec.name} #{c.index}호기
                    </strong>
                    <span>
                      {c.placedPallets.length} 파레트 · {c.boxCount.toLocaleString()}박스 ·{' '}
                      {c.totalWeight.toLocaleString()}kg ({c.volumeUtilization}%)
                    </span>
                  </button>
                ))}
              </div>

              <div className="cbm-vis-filters">
                <div className="cbm-segmented-filter">
                  <button
                    type="button"
                    className={tierFilter === 'all' ? 'active' : ''}
                    onClick={() => setTierFilter('all')}
                  >
                    전체 보기
                  </button>
                  <button
                    type="button"
                    className={tierFilter === 'tier1' ? 'active' : ''}
                    onClick={() => setTierFilter('tier1')}
                  >
                    1단만 ({currentContainer?.tier1Count || 0})
                  </button>
                  <button
                    type="button"
                    className={tierFilter === 'tier2' ? 'active' : ''}
                    onClick={() => setTierFilter('tier2')}
                  >
                    2단만 ({currentContainer?.tier2Count || 0})
                  </button>
                </div>

                <label className="cbm-mini-check">
                  <input
                    type="checkbox"
                    checked={explodeContainerLayers}
                    onChange={(e) => setExplodeContainerLayers(e.target.checked)}
                  />
                  <span>층간 분리뷰</span>
                </label>
              </div>
            </div>

            {/* 3D Container Canvas */}
            <ThreeViewport
              mode="container"
              containerInstance={currentContainer}
              containerSpec={simResult.selectedSpec}
              visibleStep={containerVisibleStep}
              tierFilter={tierFilter}
              showWireframeWall={true}
              explodeLayers={explodeContainerLayers}
              onSelectPallet={(pIdx) => {
                setSelectedPalletIdx(pIdx);
                step2Ref.current?.scrollIntoView({ behavior: 'smooth' });
              }}
            />

            {/* Container Step-by-Step Loading Playback Slider */}
            <div className="cbm-playback-bar">
              <button
                type="button"
                className="cbm-play-btn"
                onClick={() => {
                  if (containerVisibleStep >= 100) setContainerVisibleStep(5);
                  setIsContainerPlaying((p) => !p);
                }}
              >
                {isContainerPlaying ? '⏸ 일시정지' : '▶ 컨테이너 파레트 적재 순서 재생'}
              </button>
              <div className="cbm-slider-wrap">
                <span>컨테이너 적재 진행률 ({containerVisibleStep}%)</span>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={containerVisibleStep}
                  onChange={(e) => {
                    setIsContainerPlaying(false);
                    setContainerVisibleStep(Number(e.target.value));
                  }}
                />
              </div>
            </div>

            {/* 2D Container Floor Slot Map & Center of Gravity (CoG) Analysis */}
            {currentContainer && currentContainer.cog && (
              <div className="cbm-container-detail-footer">
                {/* 2D Top-Down Container Floor Layout SVG */}
                <div className="cbm-2d-floor-box">
                  <div className="cbm-2d-floor-title">
                    <span>
                      📐 {currentContainer.spec.name} #{currentContainer.index}호기 평면 배치도 (총{' '}
                      {currentContainer.placedPallets.length} 파레트 — 파레트 클릭 시 Step 2 상세 도면으로 이동)
                    </span>
                    <span>
                      <strong style={{ color: '#60a5fa' }}>■ 1100×1100</strong> |{' '}
                      <strong style={{ color: '#f59e0b' }}>■ 1200×1000</strong> |{' '}
                      <strong style={{ color: '#10b981' }}>■ 잔여/부분 파레트</strong> |{' '}
                      <strong style={{ color: '#facc15' }}>🎯 무게중심(CoG)</strong>
                    </span>
                  </div>
                  <svg
                    viewBox={`-120 -120 ${currentContainer.spec.length + 240} ${
                      currentContainer.spec.width + 240
                    }`}
                    className="cbm-container-floor-svg"
                  >
                    <rect
                      x={0}
                      y={0}
                      width={currentContainer.spec.length}
                      height={currentContainer.spec.width}
                      fill="#0f172a"
                      stroke="#38bdf8"
                      strokeWidth={45}
                      rx={30}
                    />
                    <line
                      x1={currentContainer.spec.length / 2}
                      y1={0}
                      x2={currentContainer.spec.length / 2}
                      y2={currentContainer.spec.width}
                      stroke="#475569"
                      strokeWidth={22}
                      strokeDasharray="80,80"
                    />
                    <line
                      x1={0}
                      y1={currentContainer.spec.width / 2}
                      x2={currentContainer.spec.length}
                      y2={currentContainer.spec.width / 2}
                      stroke="#475569"
                      strokeWidth={22}
                      strokeDasharray="80,80"
                    />
                    <line
                      x1={currentContainer.spec.length}
                      y1={0}
                      x2={currentContainer.spec.length}
                      y2={currentContainer.spec.width}
                      stroke="#f59e0b"
                      strokeWidth={90}
                    />

                    {currentContainer.placedPallets.map((pp) => {
                      if (pp.tier === 2) return null;
                      const isT12 =
                        pp.pallet.width === 1200 || pp.pallet.length === 1200;
                      const fillCol = pp.pallet.isPartial
                        ? '#10b981'
                        : isT12
                        ? '#d97706'
                        : '#2563eb';

                      return (
                        <g
                          key={`slot-${pp.slotIndex}`}
                          className="cbm-svg-pallet-slot"
                          onClick={() => {
                            setSelectedPalletIdx(pp.pallet.index - 1);
                            step2Ref.current?.scrollIntoView({ behavior: 'smooth' });
                          }}
                        >
                          <rect
                            x={pp.x + 15}
                            y={pp.z + 15}
                            width={pp.length - 30}
                            height={pp.width - 30}
                            fill={fillCol}
                            fillOpacity={0.86}
                            stroke="#f8fafc"
                            strokeWidth={24}
                            rx={25}
                          />
                          <text
                            x={pp.x + pp.length / 2}
                            y={pp.z + pp.width / 2 - 190}
                            textAnchor="middle"
                            dominantBaseline="middle"
                            fill="#ffffff"
                            fontSize="185"
                            fontWeight="bold"
                          >
                            P#{pp.pallet.index} ({pp.pallet.primaryCargoName?.split(' ')[0]})
                          </text>
                          <text
                            x={pp.x + pp.length / 2}
                            y={pp.z + pp.width / 2 + 20}
                            textAnchor="middle"
                            dominantBaseline="middle"
                            fill="#fef08a"
                            fontSize="185"
                            fontWeight="bold"
                          >
                            {pp.pallet.totalWeight}kg
                          </text>
                          <text
                            x={pp.x + pp.length / 2}
                            y={pp.z + pp.width / 2 + 220}
                            textAnchor="middle"
                            dominantBaseline="middle"
                            fill="#e2e8f0"
                            fontSize="150"
                          >
                            {pp.length}×{pp.width}
                          </text>
                        </g>
                      );
                    })}

                    <g
                      transform={`translate(${currentContainer.cog.cogX}, ${currentContainer.cog.cogZ})`}
                    >
                      <circle
                        r={230}
                        fill="#facc15"
                        fillOpacity={0.28}
                        stroke="#facc15"
                        strokeWidth={35}
                      />
                      <circle r={85} fill="#ef4444" stroke="#ffffff" strokeWidth={25} />
                      <text
                        x={0}
                        y={-310}
                        textAnchor="middle"
                        fill="#facc15"
                        fontSize="195"
                        fontWeight="bold"
                      >
                        🎯 CoG (무게중심)
                      </text>
                    </g>
                  </svg>
                </div>

                {/* Center of Gravity 4-Metric Dashboard */}
                <div className="cbm-cog-panel">
                  <div className="cbm-cog-header">
                    <strong>
                      🎯 {currentContainer.spec.name} #{currentContainer.index}호기 무게중심 (Center of Gravity) 및 중량 밸런스
                    </strong>
                    <span className="cbm-cog-status-badge">
                      🟢 {currentContainer.cog.statusText}
                    </span>
                  </div>

                  <div className="cbm-cog-metrics-grid">
                    <div className="cbm-cog-metric">
                      <span>전후(길이) 무게중심 (X축)</span>
                      <strong>
                        {(currentContainer.cog.cogX / 1000).toFixed(2)}m 지점 (전체 길이의{' '}
                        {currentContainer.cog.lengthRatioPct}%)
                      </strong>
                      <small>
                        안쪽 절반 {currentContainer.cog.frontRatio}% : 도어쪽 절반{' '}
                        {currentContainer.cog.rearRatio}%
                      </small>
                    </div>

                    <div className="cbm-cog-metric">
                      <span>좌우(폭) 무게중심 (Z축)</span>
                      <strong>
                        중심 편차 {currentContainer.cog.offsetZFromCenter}mm (폭의{' '}
                        {currentContainer.cog.widthRatioPct}%)
                      </strong>
                      <small>
                        좌측열 {currentContainer.cog.leftRatio}% : 우측열{' '}
                        {currentContainer.cog.rightRatio}% (대칭 균형)
                      </small>
                    </div>

                    <div className="cbm-cog-metric">
                      <span>수직(높이) 무게중심 (Y축)</span>
                      <strong>
                        바닥으로부터 {currentContainer.cog.cogY}mm (높이의{' '}
                        {currentContainer.cog.heightRatioPct}%)
                      </strong>
                      <small>컨테이너 절반 이하 저중심 유지로 전도 위험 없음</small>
                    </div>

                    <div className="cbm-cog-metric">
                      <span>컨테이너 호기 총 중량</span>
                      <strong>
                        {currentContainer.totalWeight.toLocaleString()} kg ({currentContainer.placedPallets.length} PLT)
                      </strong>
                      <small>
                        최대 허용 중량({currentContainer.spec.maxWeight.toLocaleString()}kg) 대비{' '}
                        {currentContainer.weightUtilization}%
                      </small>
                    </div>
                  </div>

                  {/* 현장 지게차 도어 통과 · 쇼링(Shoring) · 에어백 정밀 진단 패널 */}
                  {currentContainer.fieldDiagnostics && (
                    <div
                      style={{
                        marginTop: '12px',
                        paddingTop: '12px',
                        borderTop: '1px solid rgba(148, 163, 184, 0.2)',
                      }}
                    >
                      <div
                        style={{
                          fontSize: '0.82rem',
                          fontWeight: 700,
                          color: '#93c5fd',
                          marginBottom: '8px',
                        }}
                      >
                        🚜 현장 컨테이너 적입(Stuffing) · 도어 통과 · 쇼링/에어백 작업성 정밀 진단
                      </div>
                      <div className="cbm-cog-metrics-grid">
                        <div className="cbm-cog-metric">
                          <span>🚪 컨테이너 도어 프레임 통과 여유 (유효고 {currentContainer.spec.doorHeight}mm)</span>
                          <strong
                            style={{
                              color:
                                currentContainer.fieldDiagnostics.doorStatus === 'danger'
                                  ? '#f87171'
                                  : currentContainer.fieldDiagnostics.doorStatus === 'warning'
                                  ? '#fbbf24'
                                  : '#34d399',
                            }}
                          >
                            최고 적재고 {currentContainer.fieldDiagnostics.maxStackHeightMm}mm (도어 여유{' '}
                            {currentContainer.fieldDiagnostics.doorClearanceMm >= 0 ? '+' : ''}
                            {currentContainer.fieldDiagnostics.doorClearanceMm}mm)
                          </strong>
                          <small>{currentContainer.fieldDiagnostics.doorStatusText}</small>
                        </div>

                        <div className="cbm-cog-metric">
                          <span>⚓ 도어측 잔여 길이 & 쇼링(Shoring)/래싱 진단</span>
                          <strong>
                            적재 길이 {(currentContainer.fieldDiagnostics.usedLengthMm / 1000).toFixed(2)}m / 도어 여유{' '}
                            {currentContainer.fieldDiagnostics.rearClearanceMm}mm
                          </strong>
                          <small>{currentContainer.fieldDiagnostics.shoringText}</small>
                        </div>

                        <div className="cbm-cog-metric">
                          <span>🛡️ 좌우 측면 유격 & 에어백(Dunnage Bag) 규격</span>
                          <strong>
                            2열 폭 유격 {currentContainer.fieldDiagnostics.lateralGapMm}mm (바닥 면적 활용률{' '}
                            {currentContainer.fieldDiagnostics.floorUtilizationPct}%)
                          </strong>
                          <small>{currentContainer.fieldDiagnostics.dunnageBagText}</small>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Paste Excel/CSV Text Modal */}
      {pasteModalOpen && (
        <div className="cbm-modal-backdrop" onClick={() => setPasteModalOpen(false)}>
          <div className="cbm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="cbm-modal-head">
              <h3>📋 엑셀 / CSV 데이터 복사 붙여넣기</h3>
              <button type="button" onClick={() => setPasteModalOpen(false)}>
                ✕
              </button>
            </div>
            <p className="cbm-modal-desc">
              엑셀에서 헤더(<code>화물명, 가로(mm), 세로(mm), 높이(mm), 수량, 중량(kg/박스)</code>)를 포함하여 복사한 뒤 아래 창에 붙여넣으세요.
            </p>
            <textarea
              className="cbm-paste-textarea"
              rows={8}
              placeholder={`화물명,가로(mm),세로(mm),높이(mm),수량,중량(kg/박스)\n박스A (Item1),510,240,210,1246,4.26\n박스B (Item2),750,410,220,294,9.60\n박스C (Item3),500,400,350,8,11.00`}
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
            />
            <div className="cbm-modal-actions">
              <button
                type="button"
                className="cbm-btn cbm-btn-outline"
                onClick={() =>
                  setPasteText(
                    `화물명,가로(mm),세로(mm),높이(mm),수량,중량(kg/박스)\n박스A (Item1),510,240,210,1246,4.26\n박스B (Item2),750,410,220,294,9.60\n박스C (Item3),500,400,350,8,11.00`
                  )
                }
              >
                샘플 텍스트 채우기
              </button>
              <button
                type="button"
                className="cbm-btn cbm-btn-primary"
                onClick={handleApplyPasteText}
              >
                데이터 반영하기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
