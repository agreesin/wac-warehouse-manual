import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { DocumentTextIcon, HomeIcon } from './Icons';

export function EcountSidebar({ pageIndex, onSelectPage, onHome, open }) {
  const { t } = useLanguage();

  return (
    <aside className={`sidebar sidebar-ecount ${open ? "open" : ""}`}>
      <div className="brand">
        <p className="brand-kicker">ECOUNT Manual</p>
        <h1>{t.common.ecountManualTitle}</h1>
        <p>{t.common.ecountManualSub}</p>
      </div>

      <button type="button" className="toc-home" onClick={onHome}>
        <HomeIcon className="w-4 h-4" />
        {t.common.homeBtn}
      </button>

      <nav className="toc" aria-label="ECOUNT 목차">
        <p className="toc-label">{t.common.contents}</p>
        {t.ecount.map((item, idx) => (
          <button
            key={item.id}
            type="button"
            className={`toc-btn ${pageIndex === idx ? "active" : ""}`}
            onClick={() => onSelectPage(idx)}
          >
            <DocumentTextIcon className="w-5 h-5 flex-shrink-0" />
            <span>
              <strong>
                {String(idx + 1).padStart(2, "0")}. {item.title}
              </strong>
              <em>{item.sub}</em>
            </span>
          </button>
        ))}
      </nav>

      <div className="sidebar-foot" style={{ whiteSpace: 'pre-line' }}>
        {t.common.ecountSidebarFoot}
      </div>
    </aside>
  );
}
