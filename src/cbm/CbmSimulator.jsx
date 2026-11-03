import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  CONTAINER_SPECS,
  PALLET_PRESETS,
  CARGO_COLORS,
  DEFAULT_CARGOS,
  runFullSimulation,
  packCargosIntoPallets,
  autoRecommendPalletSpecs,
} from './packingEngine';
import {
  parseCargoExcelFile,
  parseCargoFromText,
  downloadSampleExcelTemplate,
  exportSimulationResultExcel,
} from './excelUtils';
import { Step1CargoInput } from './components/Step1CargoInput';
import { Step2PalletResult } from './components/Step2PalletResult';
import { Step3ContainerResult } from './components/Step3ContainerResult';
import { PasteCargoModal } from './components/PasteCargoModal';
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
  const [fullFloorSpread, setFullFloorSpread] = useState(true); // 기본값: 컨테이너 빈 바닥 100% 풀채움 (1단 바닥 전체 균등 배치)
  const [optimizeCoG, setOptimizeCoG] = useState(true);
  const [selectedContainerIdx, setSelectedContainerIdx] = useState(0);
  const [containerVisibleStep, setContainerVisibleStep] = useState(100);
  const [isContainerPlaying, setIsContainerPlaying] = useState(false);
  const [tierFilter, setTierFilter] = useState('all'); // 'all' | 'tier1' | 'tier2'
  const [explodeContainerLayers, setExplodeContainerLayers] = useState(false);

  // =========================================================================
  // WORKFLOW STEP VISIBILITY (방식 B: 상하 스크롤 리포트형)
  // =========================================================================
  const [step2Unlocked, setStep2Unlocked] = useState(false);
  const [step3Unlocked, setStep3Unlocked] = useState(false);

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

  // Custom Mix result count for comparison card in Step 2 (reuses simResult when CUSTOM_MIX is active)
  const customMixComparison = useMemo(() => {
    if (!step2Unlocked || !simResult) return null;
    const mixPallets =
      palletSelectionMode === 'CUSTOM_MIX'
        ? simResult.pallets
        : packCargosIntoPallets(cargos, effectivePalletConfig, {
            doubleStack: stackMode !== 'single',
            doubleStackAuto: stackMode === 'double_auto',
            mixCargos,
            interlockLayers,
            overhang,
          }).pallets;
    const usedSpecs = Array.from(
      new Set(mixPallets.map((p) => `${p.width}×${p.length}`))
    ).join(' + ');
    return {
      totalPallets: mixPallets.length,
      usedSpecs: usedSpecs || '복합 규격',
    };
  }, [
    step2Unlocked,
    simResult,
    palletSelectionMode,
    cargos,
    effectivePalletConfig,
    stackMode,
    mixCargos,
    interlockLayers,
    overhang,
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
  };

  const handleRemoveCargo = (id) => {
    if (cargos.length <= 1) return;
    setCargos((prev) => prev.filter((c) => c.id !== id));
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
      (Array.isArray(c.skuBreakdown) ? c.skuBreakdown : []).forEach((s) => {
        lines.push(
          `    - ${s.name}: ${s.palletCount} PLT (${s.boxes.toLocaleString()} CTNS · ${s.weightKg.toLocaleString()} kg)`
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
            title="화물 입력 엑셀 양식 다운로드"
          >
            <span>📥</span>
            <span className="cbm-btn-label-desktop">엑셀 양식 다운로드</span>
            <span className="cbm-btn-label-mobile">양식</span>
          </button>
          {simResult && (
            <>
              <button
                type="button"
                className="cbm-btn cbm-btn-outline"
                onClick={handleCopyReportText}
                title="카톡이나 메일에 바로 붙여넣을 수 있는 요약 텍스트 복사"
              >
                <span>📋</span>
                <span className="cbm-btn-label-desktop">견적 요약 복사</span>
                <span className="cbm-btn-label-mobile">복사</span>
              </button>
              <button
                type="button"
                className="cbm-btn cbm-btn-outline"
                onClick={() => window.print()}
                title="현재 화면 리포트 인쇄 또는 PDF 저장"
              >
                <span>🖨️</span>
                <span className="cbm-btn-label-desktop">인쇄/PDF</span>
                <span className="cbm-btn-label-mobile">PDF</span>
              </button>
              <button
                type="button"
                className="cbm-btn cbm-btn-emerald"
                onClick={() =>
                  exportSimulationResultExcel(simResult, effectiveCargos, effectivePalletConfig, {
                    doubleStack: stackMode !== 'single',
                  })
                }
                title="시뮬레이션 견적 결과 엑셀 파일 저장"
              >
                <span>📊</span>
                <span className="cbm-btn-label-desktop">견적 리포트 엑셀 저장</span>
                <span className="cbm-btn-label-mobile">엑셀저장</span>
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

      {/* SECTION 1: STEP 1 — 화물 정보 입력 및 적재 조건 설정 */}
      <Step1CargoInput
        step1Ref={step1Ref}
        inputSummary={inputSummary}
        cargos={cargos}
        unitMode={unitMode}
        setUnitMode={setUnitMode}
        isDraggingFile={isDraggingFile}
        setIsDraggingFile={setIsDraggingFile}
        handleDrop={handleDrop}
        fileInputRef={fileInputRef}
        setPasteModalOpen={setPasteModalOpen}
        handleResetSample={handleResetSample}
        handleAddCargo={handleAddCargo}
        handleCargoChange={handleCargoChange}
        handleRemoveCargo={handleRemoveCargo}
        stackMode={stackMode}
        setStackMode={setStackMode}
        effectivePalletConfig={effectivePalletConfig}
        palletConfig={palletConfig}
        setPalletConfig={setPalletConfig}
        interlockLayers={interlockLayers}
        setInterlockLayers={setInterlockLayers}
        mixCargos={mixCargos}
        setMixCargos={setMixCargos}
        handleRunStep1ToStep2={handleRunStep1ToStep2}
      />

      {/* SECTION 2: STEP 2 — 파레트 종류(사이즈)별 산출 & 한 파레트 적재 시각화 */}
      {step2Unlocked && simResult && (
        <Step2PalletResult
          step2Ref={step2Ref}
          simResult={simResult}
          palletSelectionMode={palletSelectionMode}
          setPalletSelectionMode={setPalletSelectionMode}
          customMixComparison={customMixComparison}
          cargos={cargos}
          setCargos={setCargos}
          effectiveCargos={effectiveCargos}
          effectivePalletConfig={effectivePalletConfig}
          overhang={overhang}
          setOverhang={setOverhang}
          handleAutoRecommendPalletMix={handleAutoRecommendPalletMix}
          handleCargoChange={handleCargoChange}
          currentPallet={currentPallet}
          selectedPalletIdx={selectedPalletIdx}
          setSelectedPalletIdx={setSelectedPalletIdx}
          palletVisibleStep={palletVisibleStep}
          setPalletVisibleStep={setPalletVisibleStep}
          isPalletPlaying={isPalletPlaying}
          setIsPalletPlaying={setIsPalletPlaying}
          explodePalletLayers={explodePalletLayers}
          setExplodePalletLayers={setExplodePalletLayers}
          handleRunStep2ToStep3={handleRunStep2ToStep3}
        />
      )}

      {/* SECTION 3: STEP 3 — 컨테이너 종류별 수용량 비교 및 컨테이너 적재 시각화 */}
      {step2Unlocked && step3Unlocked && simResult && (
        <Step3ContainerResult
          step3Ref={step3Ref}
          step2Ref={step2Ref}
          simResult={simResult}
          currentContainer={currentContainer}
          selectedContainerId={selectedContainerId}
          setSelectedContainerId={setSelectedContainerId}
          selectedContainerIdx={selectedContainerIdx}
          setSelectedContainerIdx={setSelectedContainerIdx}
          balanceContainers={balanceContainers}
          setBalanceContainers={setBalanceContainers}
          fullFloorSpread={fullFloorSpread}
          setFullFloorSpread={setFullFloorSpread}
          optimizeCoG={optimizeCoG}
          setOptimizeCoG={setOptimizeCoG}
          containerVisibleStep={containerVisibleStep}
          setContainerVisibleStep={setContainerVisibleStep}
          isContainerPlaying={isContainerPlaying}
          setIsContainerPlaying={setIsContainerPlaying}
          tierFilter={tierFilter}
          setTierFilter={setTierFilter}
          explodeContainerLayers={explodeContainerLayers}
          setExplodeContainerLayers={setExplodeContainerLayers}
          setSelectedPalletIdx={setSelectedPalletIdx}
        />
      )}

      {/* Paste Excel/CSV Text Modal */}
      <PasteCargoModal
        pasteModalOpen={pasteModalOpen}
        setPasteModalOpen={setPasteModalOpen}
        pasteText={pasteText}
        setPasteText={setPasteText}
        handleApplyPasteText={handleApplyPasteText}
      />
    </div>
  );
}
