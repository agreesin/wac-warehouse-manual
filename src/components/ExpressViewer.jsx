import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { PlaceholderFrame } from './PlaceholderFrame';

export function ExpressViewer({ pageIndex, onOpenImage }) {
  const { t } = useLanguage();
  const pages = t.express?.pages || [];
  const currentPage = pages[pageIndex] || pages[0];

  if (!currentPage) {
    return <div className="empty">매뉴얼 내용을 불러올 수 없습니다.</div>;
  }

  return (
    <div className="express-viewer">
      {/* 1. Time & Status Badge */}
      <div className="express-meta-bar">
        <span className="express-time-badge">{currentPage.timeBadge}</span>
        <span className="express-step-badge">STEP {currentPage.stepNo}</span>
      </div>

      {/* 2. Core Callout Box */}
      <section className="rule-callout">
        <p>
          <strong>{currentPage.calloutHead}</strong>
        </p>
        <p className="rule-callout-next">{currentPage.calloutLead}</p>
      </section>

      {/* 3. Detailed Step Breakdown */}
      <section className="wh-section">
        <h3 className="wh-section-title">{currentPage.flowTitle || '작업 세부 절차'}</h3>
        <div className="express-flow-grid">
          {currentPage.flow?.map((f, idx) => (
            <div key={idx} className="express-flow-card">
              <div className="express-flow-header">
                <span className="express-flow-step">{f.step}</span>
                <strong className="express-flow-head">{f.head}</strong>
              </div>
              <p className="express-flow-desc">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 4. Visual Evidence / Photo Slot (Placeholder) */}
      <section className="wh-section">
        <h3 className="wh-section-title">
          {t.common.visualGuideTitle || '시각 가이드 및 현장 사진'}
        </h3>
        {currentPage.img ? (
          <div
            className="clickable-img-frame"
            onClick={() => onOpenImage?.(currentPage.img, currentPage.placeholder?.title, currentPage.imgCap)}
          >
            <img src={currentPage.img} alt={currentPage.placeholder?.title} />
            {currentPage.imgCap && <p className="label-cap">{currentPage.imgCap}</p>}
          </div>
        ) : (
          <PlaceholderFrame
            badge={currentPage.placeholder?.badge}
            title={currentPage.placeholder?.title}
            desc={currentPage.placeholder?.desc}
            hint={currentPage.placeholder?.hint}
          />
        )}
      </section>

      {/* 5. Key Checklist Box */}
      {currentPage.checklists && currentPage.checklists.length > 0 && (
        <section className="callout callout-key">
          <div className="callout-icon">✓</div>
          <div className="callout-body">
            <span className="callout-label">{currentPage.checklistTitle || '필수 확인 사항'}</span>
            <ul>
              {currentPage.checklists.map((chk, i) => (
                <li key={i}>{chk}</li>
              ))}
            </ul>
          </div>
        </section>
      )}
    </div>
  );
}
