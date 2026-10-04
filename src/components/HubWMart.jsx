import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { LanguageSelector } from './LanguageSelector';

export function HubWMart({ onBack, onOpenWarehouse, onOpenEcount }) {
  const { t } = useLanguage();

  return (
    <div className="hub-shell hub-shell-light">
      <div className="hub-top-bar">
        <LanguageSelector />
      </div>
      <div className="hub">
        <header className="hub-hero">
          <button
            type="button"
            className="hub-back hub-animate hub-animate-1"
            onClick={onBack}
          >
            {t.common.wmartBack}
          </button>
          <div className="hub-title-row hub-animate hub-animate-1">
            <img
              className="hub-logo"
              src="/wmart-logo.png"
              alt="W MART — A Member of WAC"
            />
            <div className="hub-title-text">
              <p className="hub-kicker">{t.common.wmartKicker}</p>
              <h1>{t.common.wmartTitle}</h1>
            </div>
          </div>
          <p className="hub-lead hub-animate hub-animate-2">
            {t.common.wmartLead}
          </p>
        </header>

        <div className="hub-cards">
          <button
            type="button"
            className="hub-card hub-animate hub-animate-3"
            onClick={onOpenWarehouse}
          >
            <span className="hub-card-no">01</span>
            <strong>{t.common.wmartCardWhTitle}</strong>
            <em>{t.common.wmartCardWhDesc}</em>
            <span className="hub-card-cta">{t.common.openCta}</span>
          </button>

          <button
            type="button"
            className="hub-card hub-card-ecount hub-animate hub-animate-4"
            onClick={onOpenEcount}
          >
            <span className="hub-card-no">02</span>
            <strong>{t.common.wmartCardEcTitle}</strong>
            <em>{t.common.wmartCardEcDesc}</em>
            <span className="hub-card-cta">{t.common.openCta}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
