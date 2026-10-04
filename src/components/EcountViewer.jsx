import React from 'react';
import { useLanguage } from '../context/LanguageContext';

function renderBold(text) {
  if (!text) return null;
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
    part.startsWith('**') && part.endsWith('**') ? (
      <strong key={i}>{part.slice(2, -2)}</strong>
    ) : (
      <span key={i}>{part}</span>
    )
  );
}

export function EcountViewer({ pageIndex }) {
  const { t } = useLanguage();
  const section = t.ecount[pageIndex];

  if (!section) return null;

  return (
    <div className="ecount-page">
      <div className="rule-callout">
        {section.intro.map((line, idx) => (
          <p key={idx} className={idx > 0 ? "rule-callout-next" : undefined}>
            {renderBold(line)}
          </p>
        ))}
      </div>

      {section.steps.map((step) => (
        <article key={step.no} className="ecount-step">
          <div className="ecount-step-head">
            <span className="ecount-step-no">{step.no}</span>
            <h3>{step.title}</h3>
          </div>

          <ul className="ecount-step-list">
            {step.body.map((item, i) => (
              <li key={i}>{renderBold(item)}</li>
            ))}
          </ul>

          {step.warn && (
            <div className="callout callout-warn">
              <span className="callout-icon">!</span>
              <div className="callout-body">
                <span className="callout-label">{t.common.warn}</span>
                <p>{step.warn}</p>
              </div>
            </div>
          )}

          {step.tip && (
            <div className="callout callout-tip">
              <span className="callout-icon">TIP</span>
              <div className="callout-body">
                <span className="callout-label">{t.common.tip}</span>
                <p>{step.tip}</p>
              </div>
            </div>
          )}

          {step.example && (
            <div className="ecount-examples">
              {step.example.map((ex) => (
                <div key={ex.label} className="ecount-ex">
                  <strong>{ex.label}</strong>
                  <span>{ex.text}</span>
                </div>
              ))}
            </div>
          )}

          {step.img && (
            <div className="label-frame ecount-frame">
              <img src={step.img} alt={step.imgCap || step.title} />
              {step.imgCap && <p className="label-cap">{step.imgCap}</p>}
            </div>
          )}
        </article>
      ))}

      {section.summary && (
        <div className="callout callout-key">
          <span className="callout-icon">✓</span>
          <div className="callout-body">
            <span className="callout-label">{t.common.key}</span>
            <ul>
              {section.summary.map((sumItem, i) => (
                <li key={i}>{sumItem}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
