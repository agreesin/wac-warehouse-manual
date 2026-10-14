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

      {/* 3. Integrated Steps with Photos (e.g. Chapter 1) OR Legacy Breakdown */}
      {currentPage.stepsWithPhotos && currentPage.stepsWithPhotos.length > 0 ? (
        <div className="express-steps-container">
          {currentPage.stepsWithPhotos.map((step, sIdx) => (
            <section key={sIdx} className="express-step-block">
              <div className="express-step-header">
                <span className="express-step-num-badge">STEP {step.stepNo}</span>
                <h3 className="express-step-title">{step.title}</h3>
              </div>

              {step.desc && <p className="express-step-desc">{step.desc}</p>}

              {/* Top / Hero Photos (Shown early in the step for immediate visual understanding) */}
              {step.topPhotos && step.topPhotos.length > 0 && (
                <div className={`step-photos-strip ${step.topPhotos.length === 1 ? 'hero-strip' : ''}`}>
                  {step.topPhotos.map((photo, pIdx) => (
                    <div
                      key={pIdx}
                      className="step-photo-card"
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
                      <div className="step-photo-img-wrap">
                        <img src={photo.src} alt={photo.title} loading="lazy" />
                        <span className="step-photo-zoom-badge">🔍 크게 보기</span>
                      </div>
                      <div className="step-photo-info">
                        <strong className="step-photo-title">{photo.title}</strong>
                        <p className="step-photo-desc">{photo.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Inbound Cargo 3 Forms Grid (High Scannability) */}
              {step.cargoForms && step.cargoForms.length > 0 && (
                <div className="express-cargo-forms-grid">
                  {step.cargoForms.map((item, cIdx) => (
                    <div key={cIdx} className="cargo-form-chip">
                      <div className="cargo-form-icon-wrap">
                        <span className="cargo-form-icon">{item.icon || '📦'}</span>
                      </div>
                      <div className="cargo-form-text">
                        <strong className="cargo-form-name">{item.name}</strong>
                        <p className="cargo-form-desc">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Narrative Paragraphs */}
              {step.paragraphs && step.paragraphs.length > 0 && (
                <div className="express-step-narrative">
                  {step.paragraphs.map((para, pIdx) => (
                    <p key={pIdx} className="express-step-p">
                      {para}
                    </p>
                  ))}
                </div>
              )}

              {/* Highlight Notice / Warning Alert */}
              {step.notice && (
                <div className={`express-step-notice ${step.notice.type || 'info'}`}>
                  <span className="notice-icon">{step.notice.icon || '💡'}</span>
                  <div className="notice-content">
                    {step.notice.title && <strong>{step.notice.title}</strong>}
                    <p>{step.notice.text}</p>
                  </div>
                </div>
              )}

              {/* Food Box Highlight Card (Compact) */}
              {step.foodBoxCard && (
                <div className="express-foodbox-card">
                  <div className="foodbox-head">
                    <span className="foodbox-badge">식품 박스</span>
                    <strong className="foodbox-title">{step.foodBoxCard.title}</strong>
                  </div>
                  <div className="foodbox-content-row">
                    <div className="foodbox-text-col">
                      <p className="foodbox-desc">{step.foodBoxCard.desc}</p>
                      {step.foodBoxCard.bullets && (
                        <ul className="foodbox-bullets">
                          {step.foodBoxCard.bullets.map((b, bIdx) => (
                            <li key={bIdx}>{b}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                    {step.foodBoxCard.photo && (
                      <div
                        className="step-photo-card foodbox-photo-card"
                        onClick={() => onOpenImage?.(step.foodBoxCard.photo.src, step.foodBoxCard.photo.title, step.foodBoxCard.photo.desc)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            onOpenImage?.(step.foodBoxCard.photo.src, step.foodBoxCard.photo.title, step.foodBoxCard.photo.desc);
                          }
                        }}
                      >
                        <div className="step-photo-img-wrap">
                          <img src={step.foodBoxCard.photo.src} alt={step.foodBoxCard.photo.title} loading="lazy" />
                          <span className="step-photo-zoom-badge">🔍 크게 보기</span>
                        </div>
                        <div className="step-photo-info">
                          <strong className="step-photo-title">{step.foodBoxCard.photo.title}</strong>
                          <p className="step-photo-desc">{step.foodBoxCard.photo.desc}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Address Card */}
              {step.addressCard && (
                <div className="express-address-mini-card">
                  <div className="mini-card-head">
                    <span className="mini-tag">입고 주소 규격</span>
                    <strong>{step.addressCard.title}</strong>
                  </div>
                  <div className="mini-address-lines">
                    <div className="mini-address-row highlight">
                      <span className="mono">{step.addressCard.address}</span>
                    </div>
                    {step.addressCard.note && (
                      <p className="mini-address-note">💡 {step.addressCard.note}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Exception Card */}
              {step.exceptionCard && (
                <div className="express-exception-neutral-box">
                  <div className="exception-head">
                    <span className="exception-badge">예외 보관</span>
                    <strong className="exception-title">{step.exceptionCard.title}</strong>
                  </div>
                  {step.exceptionCard.desc && (
                    <p className="exception-desc">{step.exceptionCard.desc}</p>
                  )}
                  <div className="exception-chips">
                    {step.exceptionCard.items?.map((item, iIdx) => (
                      <span key={iIdx} className="exception-chip">
                        {item}
                      </span>
                    ))}
                  </div>
                  {step.exceptionCard.note && (
                    <p className="exception-note">👉 {step.exceptionCard.note}</p>
                  )}
                </div>
              )}

              {step.bullets && step.bullets.length > 0 && (
                <ul className="express-step-bullets">
                  {step.bullets.map((b, bIdx) => (
                    <li key={bIdx}>{b}</li>
                  ))}
                </ul>
              )}

              {/* Warning DO / DONT (Fallback) */}
              {step.warningDoDont && (
                <div className="express-dodont-mini-grid">
                  <div className="express-dodont-card do">
                    <span className="dodont-pill do-pill">확인 필수 (DO)</span>
                    <p className="dodont-text">{step.warningDoDont.doText}</p>
                  </div>
                  <div className="express-dodont-card dont">
                    <span className="dodont-pill dont-pill">분류 금지 (DON'T)</span>
                    <p className="dodont-text">{step.warningDoDont.dontText}</p>
                  </div>
                </div>
              )}

              {/* Address Info Mini Card (Fallback) */}
              {step.addressInfo && (
                <div className="express-address-mini-card">
                  <div className="mini-card-head">
                    <span className="mini-tag">입고 주소 규격</span>
                    <strong>{step.addressInfo.title}</strong>
                  </div>
                  <div className="mini-address-lines">
                    <div className="mini-address-row">
                      <span className="mono">{step.addressInfo.recipient}</span>
                    </div>
                    <div className="mini-address-row highlight">
                      <span className="mono">{step.addressInfo.address}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Rule Formula Banner (Fallback) */}
              {step.ruleFormula && (
                <div className="express-rule-mini-card">
                  <div className="formula-line mono">{step.ruleFormula}</div>
                  {step.ruleExample && <div className="example-line">{step.ruleExample}</div>}
                </div>
              )}

              {/* Exception Box (Fallback) */}
              {step.exceptionBox && (
                <div className="express-exception-neutral-box">
                  <div className="exception-head">
                    <span className="exception-badge">{step.exceptionBox.badge}</span>
                    <strong className="exception-title">{step.exceptionBox.title}</strong>
                  </div>
                  <p className="exception-desc">{step.exceptionBox.desc}</p>
                  <div className="exception-chips">
                    {step.exceptionBox.cases?.map((c, cIdx) => (
                      <span key={cIdx} className="exception-chip">{c}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Photos directly inside this step */}
              {step.photos && step.photos.length > 0 && (
                <div className="step-photos-strip">
                  {step.photos.map((photo, pIdx) => (
                    <div
                      key={pIdx}
                      className="step-photo-card"
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
                      <div className="step-photo-img-wrap">
                        <img src={photo.src} alt={photo.title} loading="lazy" />
                        <span className="step-photo-zoom-badge">🔍 크게 보기</span>
                      </div>
                      <div className="step-photo-info">
                        <strong className="step-photo-title">{photo.title}</strong>
                        <p className="step-photo-desc">{photo.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          ))}
        </div>
      ) : (
        <>
          {/* 2-1. [CORE] Customer ID (W01*-****) & Rack Matching Section */}
          {currentPage.idRuleSection && (
            <section className="wh-section express-id-rule-section">
              <h3 className="wh-section-title">{currentPage.idRuleSection.title}</h3>

              {/* Mistake Prevention Warning (DO NOT use 화물 ID vs DO use 고객 ID) */}
              {currentPage.idRuleSection.mistakeWarning && (
                <div className="express-mistake-card">
                  <div className="express-mistake-header">
                    <span className="express-mistake-badge">치명적 주의</span>
                    <strong className="express-mistake-title">
                      {currentPage.idRuleSection.mistakeWarning.title}
                    </strong>
                  </div>
                  <p className="express-mistake-desc">
                    {currentPage.idRuleSection.mistakeWarning.desc}
                  </p>
                  <div className="express-mistake-grid">
                    {/* DO Box */}
                    <div className="express-do-box">
                      <div className="do-header">
                        <span className="do-badge">
                          {currentPage.idRuleSection.mistakeWarning.doBox.badge}
                        </span>
                        <strong>{currentPage.idRuleSection.mistakeWarning.doBox.title}</strong>
                      </div>
                      <div className="do-code mono">
                        {currentPage.idRuleSection.mistakeWarning.doBox.example}
                      </div>
                      <p className="do-detail">
                        {currentPage.idRuleSection.mistakeWarning.doBox.detail}
                      </p>
                    </div>
                    {/* DONT Box */}
                    <div className="express-dont-box">
                      <div className="dont-header">
                        <span className="dont-badge">
                          {currentPage.idRuleSection.mistakeWarning.dontBox.badge}
                        </span>
                        <strong>{currentPage.idRuleSection.mistakeWarning.dontBox.title}</strong>
                      </div>
                      <div className="dont-code mono">
                        {currentPage.idRuleSection.mistakeWarning.dontBox.example}
                      </div>
                      <p className="dont-detail">
                        {currentPage.idRuleSection.mistakeWarning.dontBox.detail}
                      </p>
                    </div>
                  </div>
                </div>
              )}

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

              {/* Exception Handling Box */}
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
        </>
      )}

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
