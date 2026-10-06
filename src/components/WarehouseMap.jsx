import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { WarehouseMapLegend, RackLevelsLegend } from './VisualLegends';

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

export function WarehouseMap({ onOpenImage }) {
  const { lang, t } = useLanguage();
  const mapData = t.warehouse.map;

  const zoomText = lang === 'en' ? 'Click to enlarge' : lang === 'zh-HK' ? '點擊放大圖片' : '클릭하여 확대';

  return (
    <div className="ecount-page warehouse-page">
      <div className="rule-callout">
        <p>{renderBold(mapData.callout1)}</p>
        <p className="rule-callout-next">{renderBold(mapData.callout2)}</p>
      </div>

      <section className="wh-section map-visual">
        <h3 className="wh-section-title">{mapData.sec1Title}</h3>
        <div
          className="map-photo-frame clickable-img-frame"
          onClick={() => onOpenImage?.('/labels/warehouse-map.png', mapData.mapAlt, mapData.sec1Title)}
          title={zoomText}
        >
          <img src="/labels/warehouse-map.png" alt={mapData.mapAlt} />
          <span className="img-zoom-hint">🔍 {zoomText}</span>
        </div>
        <WarehouseMapLegend />
      </section>

      <section className="wh-section map-visual">
        <h3 className="wh-section-title">{mapData.sec2Title}</h3>
        <ul className="ecount-step-list">
          <li>{renderBold(mapData.sec2Sub)}</li>
        </ul>
        <div
          className="map-photo-frame map-photo-rack clickable-img-frame"
          onClick={() => onOpenImage?.('/labels/rack-levels-annotated.png', mapData.rackAlt, mapData.sec2Title)}
          title={zoomText}
        >
          <img src="/labels/rack-levels-annotated.png" alt={mapData.rackAlt} />
          <span className="img-zoom-hint">🔍 {zoomText}</span>
        </div>
        <RackLevelsLegend />
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
