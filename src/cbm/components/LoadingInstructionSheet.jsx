import React, { useState } from 'react';
import { SingleLoadingSheetPage } from './loadingSheet/LoadingInstructionSheetPage';

export { SingleLoadingSheetPage };

/**
 * 3단계 현장 로딩 지시서 출력 모달 컴포넌트
 */
export function LoadingInstructionSheetModal({
  containers = [],
  initialContainerIdx = 0,
  onClose,
}) {
  const [selectedTarget, setSelectedTarget] = useState('all'); // 'all' or container index number

  const targetContainers =
    selectedTarget === 'all'
      ? containers
      : [containers[Number(selectedTarget)]].filter(Boolean);

  const handlePrint = () => {
    // 인쇄 전용 모드 클래스 추가 후 브라우저 인쇄 다이얼로그 호출
    document.body.classList.add('printing-loading-sheet');
    window.print();
    // 인쇄 다이얼로그 닫힌 후 복원
    setTimeout(() => {
      document.body.classList.remove('printing-loading-sheet');
    }, 1000);
  };

  return (
    <div className="cbm-modal-backdrop" onClick={onClose} style={{ zIndex: 9999 }}>
      <div
        className="cbm-modal-content cbm-loading-sheet-modal"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '95vw',
          maxWidth: '1240px',
          maxHeight: '94vh',
          display: 'flex',
          flexDirection: 'column',
          padding: '16px 20px',
          background: '#0f172a',
          color: '#f8fafc',
          border: '1px solid #334155',
          borderRadius: '12px',
        }}
      >
        {/* 모달 상단 컨트롤 툴바 */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingBottom: '12px',
            borderBottom: '1px solid #334155',
            gap: '12px',
            flexWrap: 'wrap',
          }}
        >
          <div>
            <h2 style={{ margin: 0, fontSize: '1.15rem', color: '#f8fafc' }}>
              현장 로딩 지시서 출력 (창고 지게차 작업용 · A4 가로)
            </h2>
            <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: '#94a3b8' }}>
              호기당 A4 가로 1장 완결 | 흑백 인쇄 기준 | 실무 지게차 적재 순서·도어측 쇼링 지침서
            </p>
          </div>

          {/* 호기 선택 버튼 그룹 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.8rem', color: '#cbd5e1' }}>인쇄 대상:</span>
            <div className="cbm-ribbon-btn-group">
              <button
                type="button"
                className={`cbm-ribbon-btn ${selectedTarget === 'all' ? 'active emerald' : ''}`}
                onClick={() => setSelectedTarget('all')}
              >
                전체 호기 (총 {containers.length}대 / {containers.length}장)
              </button>
              {containers.map((c, i) => (
                <button
                  key={c.id || i}
                  type="button"
                  className={`cbm-ribbon-btn ${selectedTarget === i ? 'active' : ''}`}
                  onClick={() => setSelectedTarget(i)}
                >
                  #{c.index}호기만
                </button>
              ))}
            </div>

            {/* 인쇄 버튼 */}
            <button
              type="button"
              className="cbm-btn cbm-btn-primary"
              onClick={handlePrint}
              style={{
                padding: '8px 18px',
                fontSize: '0.88rem',
                fontWeight: 700,
                background: '#10b981',
                borderColor: '#059669',
              }}
            >
              인쇄 / PDF 저장 (A4 가로)
            </button>

            <button
              type="button"
              className="cbm-btn cbm-btn-outline"
              onClick={onClose}
              style={{ padding: '8px 14px', fontSize: '0.85rem' }}
            >
              닫기
            </button>
          </div>
        </div>

        {/* 인쇄 미리보기 영역 (화면 스크롤 가능) */}
        <div
          className="cbm-ls-preview-container"
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '16px 0',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '24px',
            background: '#1e293b',
            borderRadius: '8px',
            marginTop: '12px',
          }}
        >
          {targetContainers.map((c) => (
            <div key={c.id || c.index} className="cbm-ls-page-wrapper">
              <SingleLoadingSheetPage container={c} totalContainers={containers.length} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * 인쇄 시에만 DOM에 마운트되어 종이로 출력되는 루트 렌더러
 */
export function LoadingInstructionPrintRoot({ containers = [] }) {
  if (!containers || containers.length === 0) return null;

  return (
    <div id="cbm-loading-sheet-print-root">
      {containers.map((c) => (
        <SingleLoadingSheetPage key={c.id || c.index} container={c} totalContainers={containers.length} />
      ))}
    </div>
  );
}
