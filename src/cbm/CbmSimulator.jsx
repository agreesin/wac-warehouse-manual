import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  CONTAINER_SPECS,
  PALLET_PRESETS,
  CARGO_COLORS,
  DEFAULT_CARGOS,
  DEFAULT_WRAPPING_CONFIG,
  runFullSimulation,
  packCargosIntoPallets,
  evaluateCompanyPolicy,
  autoRecommendPalletSpecs,
} from './packingEngine';
import {
  parseCargoExcelFile,
  parseCargoFromText,
} from './excelUtils';
import { SimulatorHeaderBar } from './components/SimulatorHeaderBar';
import { Step1CargoInput } from './components/Step1CargoInput';
import { Step2PalletResult } from './components/Step2PalletResult';
import { Step3ContainerResult } from './components/Step3ContainerResult';
import { PasteCargoModal } from './components/PasteCargoModal';
import { ProjectManagerModal } from './components/ProjectManagerModal';
import './cbm.css';

const STORAGE_KEY = 'wac_cbm_sim_saved_state_v4';

function loadSavedState() {
  if (typeof window === 'undefined') return null;
  try {
    // 구버전 캐시(v1, v2, v3) 제거하여 최신 적재 표준 반영
    localStorage.removeItem('wac_cbm_sim_saved_state_v1');
    localStorage.removeItem('wac_cbm_sim_saved_state_v2');
    localStorage.removeItem('wac_cbm_sim_saved_state_v3');

    // 사용자가 브라우저를 처음 열거나 새로 방문했을 때는 항상 기본값 초기화 상태로 시작
    const isExistingSession = sessionStorage.getItem('wac_cbm_active_session_v4');
    if (!isExistingSession) {
      sessionStorage.setItem('wac_cbm_active_session_v4', 'true');
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    // 만약 캐시된 화물 중 구버전 Item3(500x400x350)가 남아있다면 최신 DEFAULT_CARGOS로 자동 교체
    if (
      Array.isArray(parsed?.cargos) &&
      parsed.cargos.some((c) => c.id === 'cargo-3' && Number(c.width) === 500 && Number(c.height) === 350)
    ) {
      parsed.cargos = DEFAULT_CARGOS;
    }
    return parsed;
  } catch (e) {
    console.error('Failed to parse saved state from localStorage:', e);
    return null;
  }
}

export function CbmSimulator() {
  const savedState = useMemo(() => loadSavedState(), []);

  // Theme State: 'dark' (검은바탕, 기본) | 'light' (흰바탕)
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem('wac_cbm_theme') || savedState?.theme || 'dark';
    } catch (e) {
      return 'dark';
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('wac_cbm_theme', theme);
    } catch (e) {}
    if (theme === 'light') {
      document.body.style.background = '#f8fafc';
      document.documentElement.setAttribute('data-theme', 'light');
    } else {
      document.body.style.background = '#0b1120';
      document.documentElement.setAttribute('data-theme', 'dark');
    }
  }, [theme]);

  // =========================================================================
  // STEP 1 STATE: 화물 입력 및 적재 조건 (Rule) 설정
  // =========================================================================
  const [cargos, setCargos] = useState(() => savedState?.cargos || DEFAULT_CARGOS);
  const [palletConfig, setPalletConfig] = useState(() => savedState?.palletConfig || {
    width: 1100,
    length: 1100,
    baseHeight: 150,
    maxTotalHeight: 1700,
    maxWeight: 1000,
    tareWeight: 17,
  });

  // stackMode: 'single' (1단 적재) | 'double_auto' (2단 적재 - 높이 자동 맞춤) | 'double_manual' (2단 적재 - 지정 높이 유지)
  const [stackMode, setStackMode] = useState(() => savedState?.stackMode || 'single');
  const [mixCargos, setMixCargos] = useState(() => savedState?.mixCargos ?? false); // 기본: 품목별 단독 적재
  const [interlockLayers, setInterlockLayers] = useState(() => savedState?.interlockLayers ?? false); // 기본: 수직 기둥 일자 정렬 (비대칭 단차 및 캔틸레버 위험 원천 방지)
  const [overhang, setOverhang] = useState(() => savedState?.overhang ?? 0);
  const [unitMode, setUnitMode] = useState(() => savedState?.unitMode || 'mm'); // 'mm' | 'cm' 치수 입력/표시 단위 전환

  // =========================================================================
  // STEP 2 STATE: 파레트 사이즈 선택 모드 (단일 규격 vs 여러 파레트 섞어 쓰기)
  // =========================================================================
  // palletSelectionMode: 'T11' | 'T12' | 'EUR' | 'EXPORT_1200' | 'CUSTOM_MIX'
  const [palletSelectionMode, setPalletSelectionMode] = useState(() => savedState?.palletSelectionMode || 'CUSTOM_MIX');
  
  // 품목별 파레트 선택 기준 (기본 유지 · 선별 대체)
  const [policyBasePallet, setPolicyBasePallet] = useState(() => savedState?.policyBasePallet || 'T11');
  const [policyAllowedAlternates, setPolicyAllowedAlternates] = useState(() => savedState?.policyAllowedAlternates || ['T12']);
  const [policyOverhang, setPolicyOverhang] = useState(() => savedState?.policyOverhang ?? 0);
  const [policyMinEfficiency, setPolicyMinEfficiency] = useState(() => savedState?.policyMinEfficiency ?? 70);

  // 래핑 공차 및 현장 실무 여유 설정 (배부름, 어긋남, 지게차 여유, 내폭 기준)
  const [wrappingConfig, setWrappingConfig] = useState(() => savedState?.wrappingConfig || DEFAULT_WRAPPING_CONFIG);

  const [selectedPalletIdx, setSelectedPalletIdx] = useState(0);
  const [palletVisibleStep, setPalletVisibleStep] = useState(100);
  const [isPalletPlaying, setIsPalletPlaying] = useState(false);
  const [explodePalletLayers, setExplodePalletLayers] = useState(false);

  // =========================================================================
  // STEP 3 STATE: 컨테이너 종류 선택 및 컨테이너 적재 시각화
  // =========================================================================
  const [selectedContainerId, setSelectedContainerId] = useState(() => savedState?.selectedContainerId || '40FT_HC');
  // stuffingStrategy: 'convenience' (작업 편의성 우선 - 품목별 몰아넣기 · 단일 품목 전용 완적)
  //                   'balance' (균등 밸런스 우선 - 전 호기 품목·무게 균등 배분)
  const [stuffingStrategy, setStuffingStrategy] = useState(() => savedState?.stuffingStrategy || 'convenience');
  const [balanceContainers, setBalanceContainers] = useState(false);
  const [fullFloorSpread, setFullFloorSpread] = useState(() => savedState?.fullFloorSpread ?? true); // 기본값: 컨테이너 빈 바닥 100% 풀채움 (1단 바닥 전체 균등 배치)
  const [optimizeCoG, setOptimizeCoG] = useState(() => savedState?.optimizeCoG ?? true);
  const [maxWeightPerContainerLimit, setMaxWeightPerContainerLimit] = useState(() => savedState?.maxWeightPerContainerLimit || '');
  const [selectedContainerIdx, setSelectedContainerIdx] = useState(0);
  const [containerVisibleStep, setContainerVisibleStep] = useState(100);
  const [isContainerPlaying, setIsContainerPlaying] = useState(false);
  const [tierFilter, setTierFilter] = useState('all'); // 'all' | 'tier1' | 'tier2'
  const [explodeContainerLayers, setExplodeContainerLayers] = useState(false);

  // =========================================================================
  // WORKFLOW STEP VISIBILITY (방식 B: 상하 스크롤 리포트형)
  // =========================================================================
  const [step2Unlocked, setStep2Unlocked] = useState(() => Boolean(savedState?.step2Unlocked));
  const [step3Unlocked, setStep3Unlocked] = useState(() => Boolean(savedState?.step3Unlocked));

  const step1Ref = useRef(null);
  const step2Ref = useRef(null);
  const step3Ref = useRef(null);
  const fileInputRef = useRef(null);

  // Upload & Paste Modal State
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const [uploadNotice, setUploadNotice] = useState(null);
  const [pasteModalOpen, setPasteModalOpen] = useState(false);
  const [pasteText, setPasteText] = useState('');

  // Project Manager State (저장 및 불러오기, JSON 파일 I/O)
  const [projectModalOpen, setProjectModalOpen] = useState(false);
  const [currentProjectName, setCurrentProjectName] = useState(() => savedState?.projectName || '기본 프로젝트');

  const currentProjectData = useMemo(() => ({
    projectName: currentProjectName,
    cargos,
    palletConfig,
    stackMode,
    mixCargos,
    interlockLayers,
    overhang,
    unitMode,
    palletSelectionMode,
    policyBasePallet,
    policyAllowedAlternates,
    policyOverhang,
    policyMinEfficiency,
    wrappingConfig,
    selectedContainerId,
    stuffingStrategy,
    fullFloorSpread,
    optimizeCoG,
    maxWeightPerContainerLimit,
    step2Unlocked,
    step3Unlocked,
  }), [
    currentProjectName,
    cargos,
    palletConfig,
    stackMode,
    mixCargos,
    interlockLayers,
    overhang,
    unitMode,
    palletSelectionMode,
    policyBasePallet,
    policyAllowedAlternates,
    policyOverhang,
    policyMinEfficiency,
    wrappingConfig,
    selectedContainerId,
    stuffingStrategy,
    fullFloorSpread,
    optimizeCoG,
    maxWeightPerContainerLimit,
    step2Unlocked,
    step3Unlocked,
  ]);

  const handleLoadProjectData = (data, name) => {
    if (name) setCurrentProjectName(name);
    if (Array.isArray(data.cargos)) setCargos(data.cargos);
    if (data.palletConfig) setPalletConfig(data.palletConfig);
    if (data.stackMode) setStackMode(data.stackMode);
    if (data.mixCargos !== undefined) setMixCargos(data.mixCargos);
    if (data.interlockLayers !== undefined) setInterlockLayers(data.interlockLayers);
    if (data.overhang !== undefined) setOverhang(data.overhang);
    if (data.unitMode) setUnitMode(data.unitMode);
    if (data.palletSelectionMode) setPalletSelectionMode(data.palletSelectionMode);
    if (data.policyBasePallet) setPolicyBasePallet(data.policyBasePallet);
    if (data.policyAllowedAlternates) setPolicyAllowedAlternates(data.policyAllowedAlternates);
    if (data.policyOverhang !== undefined) setPolicyOverhang(data.policyOverhang);
    if (data.policyMinEfficiency !== undefined) setPolicyMinEfficiency(data.policyMinEfficiency);
    if (data.wrappingConfig) setWrappingConfig(data.wrappingConfig);
    if (data.selectedContainerId) setSelectedContainerId(data.selectedContainerId);
    if (data.stuffingStrategy) setStuffingStrategy(data.stuffingStrategy);
    if (data.fullFloorSpread !== undefined) setFullFloorSpread(data.fullFloorSpread);
    if (data.optimizeCoG !== undefined) setOptimizeCoG(data.optimizeCoG);
    if (data.maxWeightPerContainerLimit !== undefined) setMaxWeightPerContainerLimit(data.maxWeightPerContainerLimit);

    setStep2Unlocked(true);
    setStep3Unlocked(true);

    setUploadNotice({
      type: 'success',
      message: `"${name || '프로젝트'}"를 성공적으로 불러왔습니다. 시뮬레이션 결과가 갱신되었습니다.`,
    });
  };

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
      stuffingStrategy,
      balanceContainers: stuffingStrategy === 'balance',
      fullFloorSpread,
      optimizeCoG,
      wrappingConfig,
      maxWeightPerContainer: maxWeightPerContainerLimit ? Number(maxWeightPerContainerLimit) : 0,
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
    stuffingStrategy,
    fullFloorSpread,
    optimizeCoG,
    wrappingConfig,
    maxWeightPerContainerLimit,
  ]);

  // 품목별 파레트 사용(Custom Mix Policy) 자동 판정 결과
  const companyPolicyResult = useMemo(() => {
    return evaluateCompanyPolicy({
      cargos,
      palletConfig,
      basePalletId: policyBasePallet,
      allowedAlternates: policyAllowedAlternates,
      allowedOverhang: policyOverhang,
      minEfficiency: policyMinEfficiency,
    });
  }, [
    cargos,
    palletConfig,
    policyBasePallet,
    policyAllowedAlternates,
    policyOverhang,
    policyMinEfficiency,
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

  // Save simulator configuration to localStorage on state changes
  useEffect(() => {
    try {
      const stateToSave = {
        theme,
        cargos,
        palletConfig,
        stackMode,
        mixCargos,
        interlockLayers,
        overhang,
        unitMode,
        palletSelectionMode,
        policyBasePallet,
        policyAllowedAlternates,
        policyOverhang,
        policyMinEfficiency,
        wrappingConfig,
        selectedContainerId,
        stuffingStrategy,
        fullFloorSpread,
        optimizeCoG,
        maxWeightPerContainerLimit,
        step2Unlocked,
        step3Unlocked,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
    } catch (e) {
      // Ignore quota errors
    }
  }, [
    theme,
    cargos,
    palletConfig,
    stackMode,
    mixCargos,
    interlockLayers,
    overhang,
    unitMode,
    palletSelectionMode,
    policyBasePallet,
    policyAllowedAlternates,
    policyOverhang,
    policyMinEfficiency,
    wrappingConfig,
    selectedContainerId,
    stuffingStrategy,
    fullFloorSpread,
    optimizeCoG,
    maxWeightPerContainerLimit,
    step2Unlocked,
    step3Unlocked,
  ]);

  // Reset selected indices when mode changes or when out of bounds
  useEffect(() => {
    setSelectedPalletIdx(0);
    setPalletVisibleStep(100);
  }, [palletSelectionMode]);

  useEffect(() => {
    setSelectedContainerIdx(0);
    setContainerVisibleStep(100);
  }, [selectedContainerId]);

  useEffect(() => {
    if (simResult) {
      if (selectedPalletIdx >= simResult.pallets.length || selectedPalletIdx < 0) {
        setSelectedPalletIdx(0);
      }
      if (
        selectedContainerIdx >= simResult.containerResult.containers.length ||
        selectedContainerIdx < 0
      ) {
        setSelectedContainerIdx(0);
      }
    }
  }, [simResult, selectedPalletIdx, selectedContainerIdx]);

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
        maxLayers: 0,
        maxTopLoad: 0,
        noDoubleStack: false,
      },
    ]);
  };

  const handleRemoveCargo = (id) => {
    if (cargos.length <= 1) return;
    setCargos((prev) => prev.filter((c) => c.id !== id));
  };

  const handleResetSample = () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      // ignore
    }
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
    setInterlockLayers(false);
    setOverhang(0);
    setUnitMode('mm');
    setFullFloorSpread(true);
    setPalletSelectionMode('CUSTOM_MIX');
    setPolicyBasePallet('T11');
    setPolicyAllowedAlternates(['T12']);
    setPolicyOverhang(0);
    setPolicyMinEfficiency(70);
    setWrappingConfig(DEFAULT_WRAPPING_CONFIG);
    setSelectedContainerId('40FT_HC');
    setStuffingStrategy('convenience');
    setOptimizeCoG(true);
    setStep2Unlocked(false);
    setStep3Unlocked(false);
    setUploadNotice({
      type: 'info',
      message: '입력 데이터를 기본 샘플(박스A 1,246개 / 박스B 294개 / 박스C 8개)로 초기화했습니다.',
    });
  };

  const handleAutoRecommendPalletMix = () => {
    const policyResult = evaluateCompanyPolicy({
      cargos,
      palletConfig,
      basePalletId: policyBasePallet,
      allowedAlternates: policyAllowedAlternates,
      allowedOverhang: policyOverhang,
      minEfficiency: policyMinEfficiency,
    });
    setCargos(policyResult.assignedCargos);
    setPalletSelectionMode('CUSTOM_MIX');
    setUploadNotice({
      type: 'success',
      message: `품목별 파레트 사용 기준이 적용되었습니다. (기본 규격: ${policyBasePallet}, 전환 기준 효율: ${policyMinEfficiency}%)`,
    });
  };

  const processUploadedFile = async (file) => {
    if (!file) return;
    try {
      const parsed = await parseCargoExcelFile(file, { unitMode });
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
    const parsed = parseCargoFromText(pasteText, { unitMode });
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

  return (
    <div className={`cbm-app ${theme === 'light' ? 'cbm-theme-light' : ''}`}>
      {/* =====================================================================
          TOP HEADER & STEP PROGRESS NAVIGATION BAR
      ===================================================================== */}
      <SimulatorHeaderBar
        theme={theme}
        setTheme={setTheme}
        step1Ref={step1Ref}
        step2Ref={step2Ref}
        step3Ref={step3Ref}
        step2Unlocked={step2Unlocked}
        step3Unlocked={step3Unlocked}
        simResult={simResult}
        effectiveCargos={effectiveCargos}
        effectivePalletConfig={effectivePalletConfig}
        stackMode={stackMode}
        setProjectModalOpen={setProjectModalOpen}
        setUploadNotice={setUploadNotice}
        fileInputRef={fileInputRef}
        handleFileChange={handleFileChange}
      />

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
        theme={theme}
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
        setInterlockLayers={(nextVal) => {
          setInterlockLayers(nextVal);
          // 1단계 전역 교차 적재 체크박스 변경 시, 품목별 개별 적재방식 오버라이드를 초기화하여 즉시 반영
          setCargos((prev) =>
            prev.map((c) => {
              const { stackingStyle, ...rest } = c;
              return rest;
            })
          );
        }}
        mixCargos={mixCargos}
        setMixCargos={setMixCargos}
        handleRunStep1ToStep2={handleRunStep1ToStep2}
      />

      {/* SECTION 2: STEP 2 — 파레트 종류(사이즈)별 산출 & 한 파레트 적재 시각화 */}
      {step2Unlocked && simResult && (
        <Step2PalletResult
          theme={theme}
          step2Ref={step2Ref}
          simResult={simResult}
          palletSelectionMode={palletSelectionMode}
          setPalletSelectionMode={setPalletSelectionMode}
          policyBasePallet={policyBasePallet}
          setPolicyBasePallet={setPolicyBasePallet}
          policyAllowedAlternates={policyAllowedAlternates}
          setPolicyAllowedAlternates={setPolicyAllowedAlternates}
          policyOverhang={policyOverhang}
          setPolicyOverhang={setPolicyOverhang}
          policyMinEfficiency={policyMinEfficiency}
          setPolicyMinEfficiency={setPolicyMinEfficiency}
          companyPolicyResult={companyPolicyResult}
          wrappingConfig={wrappingConfig}
          setWrappingConfig={setWrappingConfig}
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
          theme={theme}
          step3Ref={step3Ref}
          step2Ref={step2Ref}
          simResult={simResult}
          currentContainer={currentContainer}
          selectedContainerId={selectedContainerId}
          setSelectedContainerId={setSelectedContainerId}
          selectedContainerIdx={selectedContainerIdx}
          setSelectedContainerIdx={setSelectedContainerIdx}
          stuffingStrategy={stuffingStrategy}
          setStuffingStrategy={setStuffingStrategy}
          balanceContainers={stuffingStrategy === 'balance'}
          setBalanceContainers={(val) => setStuffingStrategy(val ? 'balance' : 'convenience')}
          fullFloorSpread={fullFloorSpread}
          setFullFloorSpread={setFullFloorSpread}
          optimizeCoG={optimizeCoG}
          setOptimizeCoG={setOptimizeCoG}
          maxWeightPerContainerLimit={maxWeightPerContainerLimit}
          setMaxWeightPerContainerLimit={setMaxWeightPerContainerLimit}
          wrappingConfig={wrappingConfig}
          setWrappingConfig={setWrappingConfig}
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

      {/* Project Manager Modal (저장, 불러오기, JSON 파일 I/O) */}
      <ProjectManagerModal
        isOpen={projectModalOpen}
        onClose={() => setProjectModalOpen(false)}
        theme={theme}
        currentProjectData={currentProjectData}
        onLoadProjectData={handleLoadProjectData}
      />
    </div>
  );
}
