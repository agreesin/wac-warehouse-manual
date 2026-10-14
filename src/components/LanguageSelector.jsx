import React from 'react';
import { useLanguage } from '../context/LanguageContext';

export function LanguageSelector({ className = '' }) {
  const { lang, setLang } = useLanguage();

  const options = [
    { code: 'ko', label: '한국어', short: 'KO' },
    { code: 'en', label: 'English', short: 'EN' },
    { code: 'zh-HK', label: '繁體中文', short: '中文' }
  ];

  return (
    <div className={`lang-selector-group ${className}`.trim()}>
      {options.map((opt) => (
        <button
          key={opt.code}
          type="button"
          className={`lang-btn ${lang === opt.code ? 'active' : ''}`}
          onClick={() => setLang(opt.code)}
          aria-label={`Switch to ${opt.label}`}
        >
          <span className="lang-label-full">{opt.label}</span>
          <span className="lang-label-short">{opt.short}</span>
        </button>
      ))}
    </div>
  );
}
