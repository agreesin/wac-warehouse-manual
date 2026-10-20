import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { PlaceholderFrame } from './PlaceholderFrame';

/**
 * Reusable Photo Card with zoom click, keyboard accessibility, and portrait/fit support
 */
export function PhotoCard({ photo, className = '', variant = 'step', onOpenImage, zoomLabel }) {
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

  const portraitClass = (photo.isPortrait || photo.portrait) ? 'portrait-card' : '';
  const fitClass = photo.fit === 'contain' ? 'fit-contain' : '';
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
      className={`${baseCardClass} ${portraitClass} ${fitClass} ${className}`.trim()}
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
          {photo.desc && <p className={descClass} style={{ whiteSpace: 'pre-line' }}>{photo.desc}</p>}
        </div>
      )}
    </div>
  );
}

/**
 * Notice / Alert Box (Warning, Info, Blue)
 */
export function StepNotice({ notice }) {
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
 * Food Box Highlight Card (Cold chain / Blue tape parcels)
 */
export function FoodBoxCard({ card, onOpenImage, zoomLabel }) {
  if (!card) return null;
  return (
    <div className="express-foodbox-card">
      <div className="foodbox-head">
        <span className="foodbox-badge">{card.badge || '식품 박스'}</span>
        <strong className="foodbox-title">{card.title}</strong>
      </div>
      <div className="foodbox-content-row">
        <div className="foodbox-text-col">
          {card.desc && <p className="foodbox-desc" style={{ whiteSpace: 'pre-line' }}>{card.desc}</p>}
          {card.bullets && (
            <ul className="foodbox-bullets">
              {card.bullets.map((b, idx) => (
                <li key={idx} style={{ whiteSpace: 'pre-line' }}>{b}</li>
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
 * Address Specification Mini Card
 */
export function AddressCard({ card }) {
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
export function ExceptionCard({ card, onOpenImage, zoomLabel }) {
  if (!card) return null;
  return (
    <div className="express-exception-neutral-box">
      <div className="exception-head">
        <span className="exception-badge">{card.badge || '예외 보관'}</span>
        <strong className="exception-title">{card.title}</strong>
      </div>
      {card.desc && <p className="exception-desc" style={{ whiteSpace: 'pre-line' }}>{card.desc}</p>}
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

/**
 * Cargo Types Classification Grid
 */
export function CargoTypesGrid({ cargoTypes, onOpenImage, zoomLabel }) {
  if (!cargoTypes || cargoTypes.length === 0) return null;
  const colClass = cargoTypes.length === 2 ? 'cols-2' : cargoTypes.length === 4 ? 'cols-4' : '';
  return (
    <div className={`cargo-types-grid ${colClass}`.trim()}>
      {cargoTypes.map((c, idx) => (
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
  );
}

/**
 * Step Workflow Flow Grid (3-stage / sequential procedure)
 */
export function FlowGrid({ flow }) {
  if (!flow || flow.length === 0) return null;
  return (
    <div className="express-flow-grid" style={{ marginTop: '14px', marginBottom: '14px' }}>
      {flow.map((f, idx) => (
        <div key={idx} className="express-flow-card">
          <div className="express-flow-header">
            <span className="express-flow-step">{f.step}</span>
            <strong className="express-flow-head">{f.head}</strong>
          </div>
          <p className="express-flow-desc" style={{ whiteSpace: 'pre-line' }}>{f.desc}</p>
        </div>
      ))}
    </div>
  );
}

/**
 * Warehouse Layout Blueprint Map
 */
export function WarehouseLayoutMap({ layout, onOpenImage, zoomLabel }) {
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

/**
 * Concluding Key Checklist Callout Card
 */
export function KeyChecklist({ title, checklists }) {
  if (!checklists || checklists.length === 0) return null;
  return (
    <section className="callout callout-key">
      <div className="callout-icon">✓</div>
      <div className="callout-body">
        <span className="callout-label">{title || '필수 확인 사항'}</span>
        <ul>
          {checklists.map((chk, i) => (
            <li key={i} style={{ whiteSpace: 'pre-line' }}>{chk}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/**
 * Individual Step Block inside Express Manual
 */
export function ExpressStep({ step, onOpenImage, zoomLabel }) {
  const isOverview = !step.stepNo;

  return (
    <section className={isOverview ? 'express-overview-section' : 'express-step-block'}>
      <div className={isOverview ? 'express-overview-header' : 'express-step-header'}>
        {!isOverview && step.stepNo && (
          <span className="express-step-num-badge">STEP {step.stepNo}</span>
        )}
        <h3 className={isOverview ? 'express-overview-title' : 'express-step-title'}>
          {step.title}
        </h3>
      </div>

      {step.desc && (
        <p className="express-step-desc" style={{ whiteSpace: 'pre-line' }}>
          {step.desc}
        </p>
      )}

      {/* Special Highlights (Food box, etc.) */}
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
            <p key={pIdx} className="express-step-p" style={{ whiteSpace: 'pre-line' }}>
              {para}
            </p>
          ))}
        </div>
      )}

      {/* Address Specification */}
      {(step.addressCard || step.addressInfo) && (
        <AddressCard card={step.addressCard || step.addressInfo} />
      )}

      {/* Rule Paragraphs */}
      {step.ruleParagraphs && step.ruleParagraphs.length > 0 && (
        <div className="express-step-narrative">
          {step.ruleParagraphs.map((para, pIdx) => (
            <p key={pIdx} className="express-step-p" style={{ whiteSpace: 'pre-line' }}>
              {para}
            </p>
          ))}
        </div>
      )}

      {/* Guide Hero Photo (Placed right after description/rules) */}
      {step.guidePhoto && (
        <div className="step-photos-strip hero-strip">
          <PhotoCard
            photo={step.guidePhoto}
            onOpenImage={onOpenImage}
            zoomLabel={zoomLabel}
          />
        </div>
      )}

      {/* Top Notice */}
      {step.notice && step.notice.position !== 'bottom' && step.noticePosition !== 'bottom' && (
        <StepNotice notice={step.notice} />
      )}

      {/* Multiple Notices Stack */}
      {step.notices && step.notices.length > 0 && (
        <div className="express-notices-stack">
          {step.notices.map((n, nIdx) => (
            <StepNotice key={nIdx} notice={n} />
          ))}
        </div>
      )}

      {/* Exception Card */}
      {(step.exceptionCard || step.exceptionBox) && (
        <ExceptionCard
          card={step.exceptionCard || step.exceptionBox}
          onOpenImage={onOpenImage}
          zoomLabel={zoomLabel}
        />
      )}

      {/* Cargo Types Grid */}
      <CargoTypesGrid
        cargoTypes={step.cargoTypes}
        onOpenImage={onOpenImage}
        zoomLabel={zoomLabel}
      />

      {/* Flow Procedure Grid */}
      <FlowGrid flow={step.flow} />

      {/* Outro Paragraphs */}
      {step.outroParagraphs && step.outroParagraphs.length > 0 && (
        <div className="express-step-narrative" style={{ marginTop: '12px' }}>
          {step.outroParagraphs.map((para, pIdx) => (
            <p key={pIdx} className="express-step-p highlight-lead" style={{ whiteSpace: 'pre-line' }}>
              {para}
            </p>
          ))}
        </div>
      )}

      {/* Layout Blueprint Map */}
      {step.layoutMap && (
        <WarehouseLayoutMap
          layout={step.layoutMap}
          onOpenImage={onOpenImage}
          zoomLabel={zoomLabel}
        />
      )}

      {/* Bullets List */}
      {step.bullets && step.bullets.length > 0 && (
        <ul className="express-step-bullets">
          {step.bullets.map((b, bIdx) => (
            <li key={bIdx} style={{ whiteSpace: 'pre-line' }}>{b}</li>
          ))}
        </ul>
      )}

      {/* Step Photos Strip */}
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

      {/* Bottom Notice */}
      {(step.noticeBottom || (step.notice && (step.notice.position === 'bottom' || step.noticePosition === 'bottom'))) && (
        <StepNotice notice={step.noticeBottom || step.notice} />
      )}
    </section>
  );
}

/**
 * Main W-Express Manual Viewer Component
 */
export function ExpressViewer({ pageIndex, onOpenImage, onOpenWmart }) {
  const { t } = useLanguage();
  const pages = t.express?.pages || [];
  const currentPage = pages[pageIndex] || pages[0];
  const isLastPage = pageIndex >= pages.length - 1;

  if (!currentPage) {
    return <div className="empty">매뉴얼 내용을 불러올 수 없습니다.</div>;
  }

  const zoomLabel = t.common?.zoomIn || '🔍 크게 보기';

  return (
    <div className="express-viewer">
      {/* 1. Time & Status Meta Bar */}
      {currentPage.timeBadge && (
        <div className="express-meta-bar">
          <span className="express-time-badge">{currentPage.timeBadge}</span>
        </div>
      )}

      {/* 2. Header Core Callout Box */}
      {(currentPage.calloutHead || currentPage.calloutLead) && (
        <section className="rule-callout">
          {currentPage.calloutHead && (
            <p>
              <strong>{currentPage.calloutHead}</strong>
            </p>
          )}
          {currentPage.calloutLead && (
            <p className="rule-callout-next" style={{ whiteSpace: 'pre-line' }}>
              {currentPage.calloutLead}
            </p>
          )}
        </section>
      )}

      {/* 3. Steps with Photos (Unified Architecture) */}
      {currentPage.stepsWithPhotos && currentPage.stepsWithPhotos.length > 0 ? (
        <div className={`express-steps-container ${currentPage.stepsWithPhotos.every((s) => !s.stepNo) ? 'express-overview-container' : ''}`.trim()}>
          {currentPage.stepsWithPhotos.map((step, sIdx) => (
            <ExpressStep
              key={sIdx}
              step={step}
              onOpenImage={onOpenImage}
              zoomLabel={zoomLabel}
            />
          ))}
        </div>
      ) : (
        /* Fallback for single-section / legacy content structures */
        <div className="express-steps-container">
          <section className="express-step-block">
            {currentPage.notice && <StepNotice notice={currentPage.notice} />}

            {currentPage.flow && currentPage.flow.length > 0 && (
              <div style={{ marginTop: '12px' }}>
                {currentPage.flowTitle && <h3 className="wh-section-title">{currentPage.flowTitle}</h3>}
                <FlowGrid flow={currentPage.flow} />
              </div>
            )}

            <CargoTypesGrid
              cargoTypes={currentPage.cargoTypes}
              onOpenImage={onOpenImage}
              zoomLabel={zoomLabel}
            />

            {/* Visual Photos Grid / Placeholder */}
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
            ) : currentPage.placeholder ? (
              <PlaceholderFrame
                badge={currentPage.placeholder?.badge}
                title={currentPage.placeholder?.title}
                desc={currentPage.placeholder?.desc}
                hint={currentPage.placeholder?.hint}
              />
            ) : null}

            {/* Photo Tip / Extra Notice */}
            {(currentPage.photoNotice || currentPage.photoTip) && (
              <div style={{ marginTop: '16px' }}>
                <StepNotice notice={currentPage.photoNotice || currentPage.photoTip} />
              </div>
            )}
          </section>
        </div>
      )}

      {/* 4. Concluding Key Checklist */}
      <KeyChecklist
        title={currentPage.checklistTitle}
        checklists={currentPage.checklists}
      />

      {/* 5. Next Operation Transition Banner (on last page) */}
      {isLastPage && onOpenWmart && (
        <section className="express-next-mission-card">
          <div className="next-mission-kicker">
            <span className="next-mission-badge">NEXT STEP · 연계 업무</span>
          </div>
          <h3 className="next-mission-title">
            {t.common.nextToWmartTitle || '🎉 W-EXPRESS 오전 특송 업무 완료!'}
          </h3>
          <p className="next-mission-desc">
            {t.common.nextToWmartDesc || '당일 출고 및 잔여 화물 랙 적재·바닥 정리가 모두 완료되었습니다.\n이제 확보된 작업 공간에서 이어지는 W Mart(창고 피킹·패킹 & ECOUNT) 업무 매뉴얼로 이동합니다.'}
          </p>
          <button
            type="button"
            className="next-mission-btn"
            onClick={onOpenWmart}
          >
            <span>{t.common.nextToWmartCta || 'W Mart 매뉴얼로 이동하기'}</span>
            <span className="next-mission-arrow" aria-hidden="true">→</span>
          </button>
        </section>
      )}
    </div>
  );
}
