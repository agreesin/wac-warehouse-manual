import React from 'react';
import { useLanguage } from '../context/LanguageContext';

export function LanguageSelector({ className = '' }) {
  const { lang, setLang } = useLanguage();

  const options = [
    { code: 'ko', label: '한국어' },
    { code: 'en', label: 'English' },
    { code: 'zh-HK', label: '繁體中文' }
  ];

  return (
    <div className={`lang-selector-group ${className}`}>
      {options.map((opt) => (
        <button
          key={opt.code}
          type="button"
          className={`lang-btn ${lang === opt.code ? 'active' : ''}`}
          onClick={() => setLang(opt.code)}
          aria-label={`Switch to ${opt.label}`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
