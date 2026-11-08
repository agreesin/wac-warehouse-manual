import React from 'react';
import {
  downloadSampleExcelTemplate,
  exportSimulationResultExcel,
} from '../excelUtils';

/**
 * 시뮬레이터 상단 네비게이션 헤더 및 리포트 액션 바
 */
export function SimulatorHeaderBar({
  theme,
  setTheme,
  step1Ref,
  step2Ref,
  step3Ref,
  step2Unlocked,
  step3Unlocked,
  simResult,
  effectiveCargos,
  effectivePalletConfig,
  stackMode,
  setProjectModalOpen,
  setUploadNotice,
  fileInputRef,
  handleFileChange,
}) {
  const handleCopyReportText = () => {
    if (!simResult) return;
    const lines = [];
    lines.push('■ [WAC 로딩플래너 적재 견적 산출 요약서]');
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
        `  - ${g.label} [${g.palletDim}]: 1단 ${g.firstLayerBoxCount}박스 × ${g.layerCount}단 (${g.boxesPerPallet} CTNS/PLT, 높이 약 ${(g.totalHeight / 10).toFixed(0)}cm) → ${g.palletCount} PLT (PLT당 약 ${g.unitPalletWeight}kg / 합계 ${g.totalGroupWeight.toLocaleString()}kg)`
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
          message: '화주·현장 공유용 견적 및 작업지시서 요약 문구가 클립보드에 복사되었습니다.',
        });
      });
    }
  };

  return (
    <header className="cbm-header">
      <div className="cbm-header-left">
        <div className="cbm-logo-badge">WAC LP</div>
        <div>
          <h1 className="cbm-title">
            WAC 로딩플래너
            <span className="cbm-version-tag">3D 시뮬레이터</span>
          </h1>
          <p className="cbm-subtitle">
            파레트 및 컨테이너 3D 적재 시뮬레이터
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
          <span className="step-num">1</span> 화물 입력
        </button>
        <span className="step-arrow">→</span>
        <button
          type="button"
          className={`cbm-step-pill ${step2Unlocked ? 'active' : 'locked'}`}
          disabled={!step2Unlocked}
          onClick={() => step2Ref.current?.scrollIntoView({ behavior: 'smooth' })}
        >
          <span className="step-num">2</span> 파레트 적재
          {simResult && <strong>({simResult.summary.totalPallets} PLT)</strong>}
        </button>
        <span className="step-arrow">→</span>
        <button
          type="button"
          className={`cbm-step-pill ${step3Unlocked ? 'active' : 'locked'}`}
          disabled={!step3Unlocked}
          onClick={() => step3Ref.current?.scrollIntoView({ behavior: 'smooth' })}
        >
          <span className="step-num">3</span> 컨테이너 적재
          {step3Unlocked && simResult && (
            <strong>({simResult.summary.totalContainers}대)</strong>
          )}
        </button>
      </nav>

      <div className="cbm-header-actions">
        {/* Theme Mode Toggle (검은바탕 vs 흰바탕) */}
        <div className="cbm-theme-toggle" role="group" aria-label="화면 테마 설정">
          <button
            type="button"
            className={`cbm-theme-btn ${theme === 'dark' ? 'active' : ''}`}
            onClick={() => setTheme('dark')}
            title="검은바탕 모드 (다크 테마)"
          >
            <span className="cbm-theme-text">검은바탕</span>
          </button>
          <button
            type="button"
            className={`cbm-theme-btn ${theme === 'light' ? 'active' : ''}`}
            onClick={() => setTheme('light')}
            title="흰바탕 모드 (라이트 테마)"
          >
            <span className="cbm-theme-text">흰바탕</span>
          </button>
        </div>

        <button
          type="button"
          className="cbm-btn cbm-btn-outline"
          onClick={downloadSampleExcelTemplate}
          title="화물 입력 엑셀 양식 다운로드"
        >
          <span className="cbm-btn-label-desktop">엑셀 양식 다운로드</span>
          <span className="cbm-btn-label-mobile">양식</span>
        </button>
        <button
          type="button"
          className="cbm-btn cbm-btn-outline cbm-project-mgr-btn"
          onClick={() => setProjectModalOpen(true)}
          title="프로젝트 전체 입력값 저장/불러오기 및 JSON 파일 내보내기/가져오기"
        >
          <span className="cbm-btn-label-desktop">프로젝트 저장/불러오기</span>
          <span className="cbm-btn-label-mobile">프로젝트</span>
        </button>
        {simResult && (
          <>
            <button
              type="button"
              className="cbm-btn cbm-btn-outline"
              onClick={handleCopyReportText}
              title="카톡이나 메일에 바로 붙여넣을 수 있는 요약 텍스트 복사"
            >
              <span className="cbm-btn-label-desktop">견적 요약 복사</span>
              <span className="cbm-btn-label-mobile">복사</span>
            </button>
            <button
              type="button"
              className="cbm-btn cbm-btn-outline"
              onClick={() => window.print()}
              title="현재 화면 리포트 인쇄 또는 PDF 저장"
            >
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
  );
}
