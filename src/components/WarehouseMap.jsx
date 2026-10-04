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

export function WarehouseMap() {
  const { t } = useLanguage();
  const mapData = t.warehouse.map;

  return (
    <div className="ecount-page warehouse-page">
      <div className="rule-callout">
        <p>{renderBold(mapData.callout1)}</p>
        <p className="rule-callout-next">{renderBold(mapData.callout2)}</p>
      </div>

      <section className="wh-section map-visual">
        <h3 className="wh-section-title">{mapData.sec1Title}</h3>
        <div className="map-photo-frame">
          <img src="/labels/warehouse-map.png" alt={mapData.mapAlt} />
        </div>
      </section>

      <section className="wh-section map-visual">
        <h3 className="wh-section-title">{mapData.sec2Title}</h3>
        <ul className="ecount-step-list">
          <li>{renderBold(mapData.sec2Sub)}</li>
        </ul>
        <div className="map-photo-frame map-photo-rack">
          <img src="/labels/rack-levels-annotated.png" alt={mapData.rackAlt} />
        </div>
        <ul className="map-tier-list">
          <li>{renderBold(mapData.tier1)}</li>
          <li>{renderBold(mapData.tier2)}</li>
          <li>{renderBold(mapData.tier3)}</li>
        </ul>
      </section>

      <div className="callout callout-tip">
        <span className="callout-icon">TIP</span>
        <div className="callout-body">
          <span className="callout-label">{t.common.tip}</span>
          <p>{mapData.tip}</p>
        </div>
      </div>
    </div>
  );
}
