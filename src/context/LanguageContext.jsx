import React, { createContext, useContext, useState, useEffect } from 'react';
import { locales, defaultLang } from '../locales';

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => {
    return localStorage.getItem('wac_manual_lang') || defaultLang;
  });

  useEffect(() => {
    localStorage.setItem('wac_manual_lang', lang);
    document.documentElement.lang = lang === 'zh-HK' ? 'zh-Hant' : lang;
  }, [lang]);

  const currentLocale = locales[lang] || locales[defaultLang];

  return (
    <LanguageContext.Provider value={{ lang, setLang, t: currentLocale.data }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
