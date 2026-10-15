import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { PlaceholderFrame } from './PlaceholderFrame';

/**
 * Reusable Photo Card with keyboard accessibility and zoom click
 */
function PhotoCard({ photo, className = '', variant = 'step', onOpenImage, zoomLabel }) {
  if (!photo) return null;

  if (photo.placeholder || !photo.src) {
    return (
      <div className={`step-photo-card placeholder-photo-card ${className}`.trim()}>
        <div className="step-photo-img-wrap placeholder-img-wrap">
          <div className="placeholder-card-inner">
            <span className="placeholder-card-icon">📷</span>
            <span className="placeholder-card-badge">{photo.badge || '사진 첨부 예정'}</span>
          </div>
        </div>
        <div className="step-photo-info">
          <strong className="step-photo-title">{photo.title}</strong>
          <p className="step-photo-desc">{photo.desc || '실제 현장 사진이 추후 첨부될 예정입니다.'}</p>
        </div>
      </div>
    );
  }

  const isExpressVariant = variant === 'express';
  const baseCardClass = isExpressVariant ? 'express-photo-card' : 'step-photo-card';
  const imgWrapClass = isExpressVariant ? 'express-photo-img-wrap' : 'step-photo-img-wrap';
  const badgeClass = isExpressVariant ? 'express-photo-zoom-badge' : 'step-photo-zoom-badge';
  const infoClass = isExpressVariant ? 'express-photo-info' : 'step-photo-info';
  const titleClass = isExpressVariant ? 'express-photo-title' : 'step-photo-title';
  const descClass = isExpressVariant ? 'express-photo-desc' : 'step-photo-desc';

  const defaultZoom = zoomLabel || '🔍 크게 보기';

  const handleClick = () => onOpenImage?.(photo.src, photo.title, photo.desc);
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  };

  return (
    <div
      className={`${baseCardClass} ${className}`.trim()}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      aria-label={`${photo.title || '사진'} 확대`}
      onKeyDown={handleKeyDown}
    >
      <div className={imgWrapClass}>
        <img src={photo.src} alt={photo.title || ''} loading="lazy" />
        <span className={badgeClass}>{defaultZoom}</span>
      </div>
      {(photo.title || photo.desc) && (
        <div className={infoClass}>
          {photo.title && <strong className={titleClass}>{photo.title}</strong>}
          {photo.desc && <p className={descClass}>{photo.desc}</p>}
        </div>
      )}
    </div>
  );
}

/**
 * Food Box Highlight Card (placed prominently before address sorting)
 */
function FoodBoxCard({ card, onOpenImage, zoomLabel }) {
  if (!card) return null;
  return (
    <div className="express-foodbox-card">
      <div className="foodbox-head">
        <span className="foodbox-badge">{card.badge || '식품 박스'}</span>
        <strong className="foodbox-title">{card.title}</strong>
      </div>
      <div className="foodbox-content-row">
        <div className="foodbox-text-col">
          {card.desc && <p className="foodbox-desc">{card.desc}</p>}
          {card.bullets && (
            <ul className="foodbox-bullets">
              {card.bullets.map((b, idx) => (
                <li key={idx}>{b}</li>
              ))}
            </ul>
          )}
        </div>
        {card.photo && (
          <PhotoCard
            photo={card.photo}
            className="foodbox-photo-card"
            onOpenImage={onOpenImage}
            zoomLabel={zoomLabel}
          />
        )}
      </div>
    </div>
  );
}

/**
 * Notice / Alert Box (Warning, Info, Danger)
 */
function StepNotice({ notice }) {
  if (!notice) return null;
  return (
    <div className={`express-step-notice ${notice.type || 'info'}`}>
      <span className="notice-icon">{notice.icon || '💡'}</span>
      <div className="notice-content">
        {notice.title && <strong>{notice.title}</strong>}
        {notice.text && <p style={{ whiteSpace: 'pre-line' }}>{notice.text}</p>}
      </div>
    </div>
  );
}

/**
 * Address Specification Mini Card
 */
function AddressCard({ card }) {
  if (!card) return null;
  return (
    <div className="express-address-mini-card">
      <div className="mini-card-head">
        <span className="mini-tag">{card.tag || '입고 주소 규격'}</span>
        <strong>{card.title}</strong>
      </div>
      <div className="mini-address-lines">
        {card.recipient && (
          <div className="mini-address-row">
            <span className="mono">{card.recipient}</span>
          </div>
        )}
        {card.address && (
          <div className="mini-address-row highlight">
            <span className="mono">{card.address}</span>
          </div>
        )}
        {card.note && <p className="mini-address-note">💡 {card.note}</p>}
      </div>
    </div>
  );
}

/**
 * Exception Handling Mini Card
 */
function ExceptionCard({ card, onOpenImage, zoomLabel }) {
  if (!card) return null;
  return (
    <div className="express-exception-neutral-box">
      <div className="exception-head">
        <span className="exception-badge">{card.badge || '예외 보관'}</span>
        <strong className="exception-title">{card.title}</strong>
      </div>
      {card.desc && <p className="exception-desc">{card.desc}</p>}
      {(card.items || card.cases) && (
        <div className="exception-chips">
          {(card.items || card.cases).map((item, idx) => (
            <span key={idx} className="exception-chip">
              {typeof item === 'string' ? item : item.label || item.type}
            </span>
          ))}
        </div>
      )}
      {card.note && <p className="exception-note">👉 {card.note}</p>}
      {card.photos && card.photos.length > 0 ? (
        <div className="exception-photos-grid">
          {card.photos.map((p, idx) => (
            <PhotoCard
              key={idx}
              photo={p}
              className="exception-photo-card"
              onOpenImage={onOpenImage}
              zoomLabel={zoomLabel}
            />
          ))}
        </div>
      ) : card.photo ? (
        <div className="exception-photo-wrap">
          <PhotoCard
            photo={card.photo}
            className="exception-photo-card"
            onOpenImage={onOpenImage}
            zoomLabel={zoomLabel}
          />
        </div>
      ) : null}
    </div>
  );
}

function WarehouseLayoutMap({ layout, onOpenImage, zoomLabel }) {
  if (!layout) return null;
  const { photo, zones, conclusion } = layout;
  const hasZones = zones && zones.length > 0;

  return (
    <div className={`warehouse-layout-container ${!hasZones ? 'single-layout' : ''}`.trim()}>
      <div className={`warehouse-layout-grid ${!hasZones ? 'single-col' : ''}`.trim()}>
        {photo && (
          <div className="warehouse-layout-map-col">
            <PhotoCard
              photo={photo}
              className="warehouse-map-photo-card"
              onOpenImage={onOpenImage}
              zoomLabel={zoomLabel}
            />
          </div>
        )}
        {hasZones && (
          <div className="warehouse-layout-zones-col">
            <div className="warehouse-zones-list">
              {zones.map((zone, zIdx) => (
                <div key={zIdx} className={`warehouse-zone-item zone-${zone.color || 'blue'}`}>
                  <div className="warehouse-zone-header">
                    <span className="warehouse-zone-badge">{zone.badge}</span>
                    <strong className="warehouse-zone-title">{zone.title}</strong>
                  </div>
                  <p className="warehouse-zone-desc">{zone.desc}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      {conclusion && (
        <div className="warehouse-layout-conclusion">
          <p>{conclusion}</p>
        </div>
      )}
    </div>
  );
}

export function ExpressViewer({ pageIndex, onOpenImage }) {
  const { t } = useLanguage();
  const pages = t.express?.pages || [];
  const currentPage = pages[pageIndex] || pages[0];

  if (!currentPage) {
    return <div className="empty">매뉴얼 내용을 불러올 수 없습니다.</div>;
  }

  const zoomLabel = t.common?.zoomIn || '🔍 크게 보기';

  return (
    <div className="express-viewer">
      {/* 1. Time & Status Badge */}
      {currentPage.timeBadge && (
        <div className="express-meta-bar">
          <span className="express-time-badge">{currentPage.timeBadge}</span>
        </div>
      )}

      {/* 2. Core Callout Box */}
      <section className="rule-callout">
        <p>
          <strong>{currentPage.calloutHead}</strong>
        </p>
        <p className="rule-callout-next">{currentPage.calloutLead}</p>
      </section>

      {/* 3. Integrated Steps with Photos (e.g. Chapter 1) OR Legacy Breakdown */}
      {currentPage.stepsWithPhotos && currentPage.stepsWithPhotos.length > 0 ? (
        <div className={`express-steps-container ${currentPage.stepsWithPhotos.every(s => !s.stepNo) ? 'express-overview-container' : ''}`.trim()}>
          {currentPage.stepsWithPhotos.map((step, sIdx) => {
            const isOverview = !step.stepNo;
            return (
              <section
                key={sIdx}
                className={isOverview ? 'express-overview-section' : 'express-step-block'}
              >
                <div className={isOverview ? 'express-overview-header' : 'express-step-header'}>
                  {!isOverview && step.stepNo && (
                    <span className="express-step-num-badge">STEP {step.stepNo}</span>
                  )}
                  <h3 className={isOverview ? 'express-overview-title' : 'express-step-title'}>
                    {step.title}
                  </h3>
                </div>

              {step.desc && <p className="express-step-desc" style={{ whiteSpace: 'pre-line' }}>{step.desc}</p>}

              {/* Food Box Highlight Card (Placed at the FRONT of sorting workflow) */}
              {step.foodBoxCard && (
                <FoodBoxCard
                  card={step.foodBoxCard}
                  onOpenImage={onOpenImage}
                  zoomLabel={zoomLabel}
                />
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

              {/* Address Card (Positioned immediately after address ID text) */}
              {(step.addressCard || step.addressInfo) && (
                <AddressCard card={step.addressCard || step.addressInfo} />
              )}

              {/* Sorting Calculation & Rule Paragraphs */}
              {step.ruleParagraphs && step.ruleParagraphs.length > 0 && (
                <div className="express-step-narrative">
                  {step.ruleParagraphs.map((para, pIdx) => (
                    <p key={pIdx} className="express-step-p">
                      {para}
                    </p>
                  ))}
                </div>
              )}

              {/* Guide Photo (Placed immediately after explanation text) */}
              {step.guidePhoto && (
                <div className="step-photos-strip hero-strip">
                  <PhotoCard
                    photo={step.guidePhoto}
                    onOpenImage={onOpenImage}
                    zoomLabel={zoomLabel}
                  />
                </div>
              )}

              {/* Highlight Notice / Warning Alert (Top placement by default) */}
              {step.notice && step.notice.position !== 'bottom' && step.noticePosition !== 'bottom' && (
                <StepNotice notice={step.notice} />
              )}

              {/* Exception Card */}
              {(step.exceptionCard || step.exceptionBox) && (
                <ExceptionCard
                  card={step.exceptionCard || step.exceptionBox}
                  onOpenImage={onOpenImage}
                  zoomLabel={zoomLabel}
                />
              )}

              {/* Classification / Type Cards Grid (e.g. Label Marking Types) */}
              {step.cargoTypes && step.cargoTypes.length > 0 && (
                <div className={`cargo-types-grid ${step.cargoTypes.length === 2 ? 'cols-2' : step.cargoTypes.length === 4 ? 'cols-4' : ''}`.trim()}>
                  {step.cargoTypes.map((c, idx) => (
                    <div key={idx} className="cargo-type-card">
                      <div className="cargo-type-top">
                        <div className="cargo-type-header">
                          <span className="cargo-type-tag">{c.tag}</span>
                          <span className="cargo-type-badge">{c.badge}</span>
                        </div>
                        {c.head && <strong className="cargo-type-head">{c.head}</strong>}
                      </div>
                      {c.photo && (
                        <PhotoCard
                          photo={c.photo}
                          className="cargo-type-photo-card"
                          onOpenImage={onOpenImage}
                          zoomLabel={zoomLabel}
                        />
                      )}
                      <p className="cargo-type-desc" style={{ whiteSpace: 'pre-line' }}>{c.desc}</p>
                      {c.tip && (
                        <div className="cargo-type-tip">
                          <span className="tip-icon">💡</span>
                          <span style={{ whiteSpace: 'pre-line' }}>{c.tip}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Outro Paragraphs (Displayed after cargo cards) */}
              {step.outroParagraphs && step.outroParagraphs.length > 0 && (
                <div className="express-step-narrative" style={{ marginTop: '12px' }}>
                  {step.outroParagraphs.map((para, pIdx) => (
                    <p key={pIdx} className="express-step-p highlight-lead">
                      {para}
                    </p>
                  ))}
                </div>
              )}

              {/* Warehouse Layout Map (e.g. Chapter 0 concluding blueprint) */}
              {step.layoutMap && (
                <WarehouseLayoutMap
                  layout={step.layoutMap}
                  onOpenImage={onOpenImage}
                  zoomLabel={zoomLabel}
                />
              )}

              {/* Step Bullets */}
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

              {/* Rule Formula Banner (Fallback) */}
              {step.ruleFormula && (
                <div className="express-rule-mini-card">
                  <div className="formula-line mono">{step.ruleFormula}</div>
                  {step.ruleExample && <div className="example-line">{step.ruleExample}</div>}
                </div>
              )}

              {/* Photos directly inside this step */}
              {step.photos && step.photos.length > 0 && (
                <div className="step-photos-strip">
                  {step.photos.map((photo, pIdx) => (
                    <PhotoCard
                      key={pIdx}
                      photo={photo}
                      onOpenImage={onOpenImage}
                      zoomLabel={zoomLabel}
                    />
                  ))}
                </div>
              )}

              {/* Highlight Notice / Warning Alert (Bottom placement after photos) */}
              {(step.noticeBottom || (step.notice && (step.notice.position === 'bottom' || step.noticePosition === 'bottom'))) && (
                <StepNotice notice={step.noticeBottom || step.notice} />
              )}
            </section>
            );
          })}
        </div>
      ) : (
        <>
          {/* Legacy Fallback Rendering for other chapters / drafts */}
          {currentPage.idRuleSection && (
            <section className="wh-section express-id-rule-section">
              <h3 className="wh-section-title">{currentPage.idRuleSection.title}</h3>

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

          {currentPage.notice && (
            <div style={{ marginBottom: '20px' }}>
              <StepNotice notice={currentPage.notice} />
            </div>
          )}

          {/* Detailed Step Breakdown */}
          {currentPage.flow && currentPage.flow.length > 0 && (
            <section className="wh-section">
              <h3 className="wh-section-title">{currentPage.flowTitle || '작업 세부 절차'}</h3>
              <div className="express-flow-grid">
                {currentPage.flow.map((f, idx) => (
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
          )}

          {/* Inbound Cargo Types Breakdown */}
          {currentPage.cargoTypes && currentPage.cargoTypes.length > 0 && (
            <section className="wh-section">
              <h3 className="wh-section-title">{currentPage.cargoTypesTitle || '입고 화물 종류 구분'}</h3>
              {currentPage.cargoTypesLead && (
                <p className="wh-section-lead">{currentPage.cargoTypesLead}</p>
              )}
              <div className="cargo-types-grid">
                {currentPage.cargoTypes.map((c, idx) => (
                  <div key={idx} className="cargo-type-card">
                    <div className="cargo-type-top">
                      <div className="cargo-type-header">
                        <span className="cargo-type-tag">{c.tag}</span>
                        <span className="cargo-type-badge">{c.badge}</span>
                      </div>
                      {c.head && <strong className="cargo-type-head">{c.head}</strong>}
                    </div>
                    {c.photo && (
                      <PhotoCard
                        photo={c.photo}
                        className="cargo-type-photo-card"
                        onOpenImage={onOpenImage}
                        zoomLabel={zoomLabel}
                      />
                    )}
                    <p className="cargo-type-desc" style={{ whiteSpace: 'pre-line' }}>{c.desc}</p>
                    {c.tip && (
                      <div className="cargo-type-tip">
                        <span className="tip-icon">💡</span>
                        <span style={{ whiteSpace: 'pre-line' }}>{c.tip}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Visual Evidence & Real Operational Photos */}
          <section className="wh-section">
            <h3 className="wh-section-title">
              {t.common?.visualGuideTitle || '시각 가이드 및 현장 사진'}
            </h3>
            {currentPage.photos && currentPage.photos.length > 0 ? (
              <div className="express-photos-grid">
                {currentPage.photos.map((photo, pIdx) => (
                  <PhotoCard
                    key={pIdx}
                    photo={photo}
                    variant="express"
                    onOpenImage={onOpenImage}
                    zoomLabel={zoomLabel}
                  />
                ))}
              </div>
            ) : currentPage.img ? (
              <div
                className="clickable-img-frame"
                onClick={() => onOpenImage?.(currentPage.img, currentPage.placeholder?.title, currentPage.imgCap)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onOpenImage?.(currentPage.img, currentPage.placeholder?.title, currentPage.imgCap);
                  }
                }}
              >
                <img src={currentPage.img} alt={currentPage.placeholder?.title || ''} />
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

      {/* 4. Key Checklist Box */}
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
