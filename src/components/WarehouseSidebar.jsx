import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { ClipboardCheckIcon, MapIcon, HomeIcon } from './Icons';

export function WarehouseSidebar({ chapter, onSelect, onHome, open }) {
  const { t } = useLanguage();

  const navItems = [
    {
      id: "rules",
      title: t.warehouse.navItems[0].title,
      desc: t.warehouse.navItems[0].desc,
      icon: ClipboardCheckIcon
    },
    {
      id: "map",
      title: t.warehouse.navItems[1].title,
      desc: t.warehouse.navItems[1].desc,
      icon: MapIcon
    }
  ];

  return (
    <aside className={`sidebar ${open ? "open" : ""}`}>
      <div className="brand">
        <p className="brand-kicker">Warehouse Manual</p>
        <h1>{t.common.warehouseManualTitle}</h1>
        <p>{t.common.warehouseManualSub}</p>
      </div>

      <button type="button" className="toc-home" onClick={onHome}>
        <HomeIcon className="w-4 h-4" />
        {t.common.homeBtn}
      </button>

      <nav className="toc" aria-label="목차">
        <p className="toc-label">{t.common.contents}</p>
        {navItems.map((item, idx) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              type="button"
              className={`toc-btn ${chapter === item.id ? "active" : ""}`}
              onClick={() => onSelect(item.id)}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              <span>
                <strong>
                  {String(idx + 1).padStart(2, "0")}. {item.title}
                </strong>
                <em>{item.desc}</em>
              </span>
            </button>
          );
        })}
      </nav>

      <div className="sidebar-foot" style={{ whiteSpace: 'pre-line' }}>
        {t.common.warehouseSidebarFoot}
      </div>
    </aside>
  );
}
