import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { TruckIcon, TagIcon, CubeIcon, MapIcon, HomeIcon } from './Icons';

export function ExpressSidebar({ pageIndex, onSelectPage, onHome, open }) {
  const { t } = useLanguage();

  const stepIcons = [TruckIcon, TagIcon, CubeIcon, MapIcon];

  return (
    <aside className={`sidebar sidebar-express ${open ? 'open' : ''}`}>
      <div className="brand">
        <p className="brand-kicker">W Express Manual</p>
        <h1>{t.express?.title || 'W Express 메뉴얼'}</h1>
        <p>{t.express?.sub || '항공 특송 입출고 및 검수·패킹 수칙'}</p>
      </div>

      <button type="button" className="toc-home" onClick={onHome}>
        <HomeIcon className="w-4 h-4" />
        {t.common.homeBtn}
      </button>

      <nav className="toc" aria-label="W Express 목차">
        <p className="toc-label">{t.common.contents}</p>
        {t.express?.pages?.map((item, idx) => {
          const Icon = stepIcons[idx % stepIcons.length] || TruckIcon;
          return (
            <button
              key={item.id}
              type="button"
              className={`toc-btn ${pageIndex === idx ? 'active' : ''}`}
              onClick={() => onSelectPage(idx)}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              <span>
                <strong>
                  {String(idx + 1).padStart(2, '0')}. {item.title}
                </strong>
                <em>{item.sub}</em>
              </span>
            </button>
          );
        })}
      </nav>

      <div className="sidebar-foot" style={{ whiteSpace: 'pre-line' }}>
        {t.express?.sidebarFoot}
      </div>
    </aside>
  );
}
