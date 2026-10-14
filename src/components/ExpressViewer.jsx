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

      {/* 2-1. [CORE] Customer ID (W01*-****) & Rack Matching Section */}
      {currentPage.idRuleSection && (
        <section className="wh-section express-id-rule-section">
          <h3 className="wh-section-title">{currentPage.idRuleSection.title}</h3>

          {/* Address Guide Box */}
          {currentPage.idRuleSection.addressGuide && (
            <div className="express-address-card">
              <div className="express-address-header">
                <span className="express-address-badge">
                  {currentPage.idRuleSection.addressGuide.badge || '주소 안내 규격'}
                </span>
                <strong className="express-address-title">
                  {currentPage.idRuleSection.addressGuide.title}
                </strong>
              </div>
              <div className="express-address-body">
                <div className="express-address-row">
                  <span className="express-address-lbl">
                    {currentPage.idRuleSection.addressGuide.recipientLabel}
                  </span>
                  <span className="express-address-val mono">
                    {currentPage.idRuleSection.addressGuide.recipientVal}
                  </span>
                </div>
                <div className="express-address-row highlight-row">
                  <span className="express-address-lbl">
                    {currentPage.idRuleSection.addressGuide.addressLabel}
                  </span>
                  <span className="express-address-val mono">
                    {currentPage.idRuleSection.addressGuide.addressVal}
                  </span>
                </div>
              </div>
              <p className="express-address-desc">
                💡 {currentPage.idRuleSection.addressGuide.desc}
              </p>
            </div>
          )}

          {/* Rack Formula & Examples Grid */}
          {currentPage.idRuleSection.rackRule && (
            <div className="express-rack-card">
              <div className="express-rack-header">
                <span className="express-rack-tag">분류 공식</span>
                <strong>{currentPage.idRuleSection.rackRule.title}</strong>
              </div>
              <div className="express-formula-banner mono">
                {currentPage.idRuleSection.rackRule.formula}
              </div>
              <div className="express-examples-grid">
                {currentPage.idRuleSection.rackRule.examples?.map((ex, i) => (
                  <div key={i} className={`express-ex-item ${ex.firstDigit === '0' ? 'featured' : ''}`}>
                    <div className="express-ex-code mono">
                      <span className="prefix">W010-</span>
                      <strong className="first-digit">[{ex.firstDigit}]</strong>
                      <span className="rest">{ex.code.slice(6)}</span>
                    </div>
                    <div className="express-ex-arrow">➔</div>
                    <div className="express-ex-target">
                      <strong>{ex.target}</strong>
                    </div>
                    {ex.note && <p className="express-ex-note">{ex.note}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Exception Handling Box (첸 담당자 구역 모아두기) */}
          {currentPage.idRuleSection.exceptionRule && (
            <div className="express-exception-box">
              <div className="express-exception-header">
                <span className="express-exception-badge">
                  {currentPage.idRuleSection.exceptionRule.badge}
                </span>
                <strong>{currentPage.idRuleSection.exceptionRule.title}</strong>
              </div>
              <p className="express-exception-desc">
                {currentPage.idRuleSection.exceptionRule.desc}
              </p>
              <div className="express-exception-cases">
                {currentPage.idRuleSection.exceptionRule.cases?.map((c, i) => (
                  <div key={i} className="express-case-chip">
                    <span className="chip-badge mono">{c.type}</span>
                    <span className="chip-label">{c.label}</span>
                  </div>
                ))}
              </div>
              <div className="express-exception-alert">
                <span className="alert-icon">🚨</span>
                <span className="alert-text">
                  {currentPage.idRuleSection.exceptionRule.actionNotice}
                </span>
              </div>
            </div>
          )}
        </section>
      )}

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

      {/* 4. Inbound Cargo Types Breakdown (마대, 콘솔 박스, 일반 박스) */}
      {currentPage.cargoTypes && currentPage.cargoTypes.length > 0 && (
        <section className="wh-section">
          <h3 className="wh-section-title">{currentPage.cargoTypesTitle || '입고 화물 종류 구분'}</h3>
          {currentPage.cargoTypesLead && (
            <p className="wh-section-lead">{currentPage.cargoTypesLead}</p>
          )}
          <div className="cargo-types-grid">
            {currentPage.cargoTypes.map((c, idx) => (
              <div key={idx} className="cargo-type-card">
                <div className="cargo-type-header">
                  <span className="cargo-type-tag">{c.tag}</span>
                  <span className="cargo-type-badge">{c.badge}</span>
                </div>
                <strong className="cargo-type-head">{c.head}</strong>
                <p className="cargo-type-desc">{c.desc}</p>
                {c.tip && (
                  <div className="cargo-type-tip">
                    <span className="tip-icon">💡</span>
                    <span>{c.tip}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 5. Visual Evidence & Real Operational Photos */}
      <section className="wh-section">
        <h3 className="wh-section-title">
          {t.common.visualGuideTitle || '시각 가이드 및 현장 사진'}
        </h3>
        {currentPage.photos && currentPage.photos.length > 0 ? (
          <div className="express-photos-grid">
            {currentPage.photos.map((photo, pIdx) => (
              <div
                key={pIdx}
                className="express-photo-card"
                onClick={() => onOpenImage?.(photo.src, photo.title, photo.desc)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onOpenImage?.(photo.src, photo.title, photo.desc);
                  }
                }}
              >
                <div className="express-photo-img-wrap">
                  <img src={photo.src} alt={photo.title} loading="lazy" />
                  <span className="express-photo-zoom-badge">🔍 크게 보기</span>
                </div>
                <div className="express-photo-info">
                  <strong className="express-photo-title">{photo.title}</strong>
                  <p className="express-photo-desc">{photo.desc}</p>
                </div>
              </div>
            ))}
          </div>
        ) : currentPage.img ? (
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
