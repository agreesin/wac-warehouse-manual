import React from 'react';
import { useLanguage } from '../context/LanguageContext';

export function WarehouseMapLegend() {
  const { lang } = useLanguage();

  const data = {
    ko: {
      title: "도면 한글 안내",
      items: [
        { badge: "A 구역", desc: "도면 왼쪽 렉 (A 1 ~ A 10)" },
        { badge: "B 구역", desc: "도면 오른쪽 렉 (B 1 ~ B 10)" },
        { badge: "패킹하는 곳", desc: "출구 바로 앞 작업 테이블 (바닥 패킹)" },
        { badge: "가운데 통로", desc: "손수레 이동 통로 (통행 방해 금지)" }
      ]
    },
    en: {
      title: "Map Visual Guide",
      items: [
        { badge: "Zone A (A구역)", desc: "Left racks (A 1 to A 10)" },
        { badge: "Zone B (B구역)", desc: "Right racks (B 1 to B 10)" },
        { badge: "Packing Station (패킹하는 곳)", desc: "Work tables in front of exit" },
        { badge: "Center Aisle (가운데 통로)", desc: "Main trolley cart passageway" }
      ]
    },
    'zh-HK': {
      title: "平面圖標識對照",
      items: [
        { badge: "A 區 (A구역)", desc: "左側貨架 (A 1 至 A 10)" },
        { badge: "B 區 (B구역)", desc: "右側貨架 (B 1 至 B 10)" },
        { badge: "包裝區 (패킹하는 곳)", desc: "近出口之打包作業台" },
        { badge: "中央通道 (가운데 통로)", desc: "手推車行進主要走道" }
      ]
    }
  };

  const curr = data[lang] || data.ko;

  return (
    <div className="visual-legend-box">
      <div className="visual-legend-head">
        <span className="visual-legend-icon">📍</span>
        <strong>{curr.title}</strong>
      </div>
      <div className="visual-legend-grid">
        {curr.items.map((it, idx) => (
          <div key={idx} className="visual-legend-item">
            <span className="visual-legend-tag">{it.badge}</span>
            <span className="visual-legend-desc">{it.desc}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function RackLevelsLegend() {
  const { lang } = useLanguage();

  const data = {
    ko: {
      title: "렉 높이(단) 실제 사진 표기",
      items: [
        { badge: "1/3 상단", desc: "가장 높은 선반 · 작은 박스 / 가벼운 짐" },
        { badge: "1/2 중단", desc: "가운데 선반 · 중간 크기 박스 / 오픈픽 제품" },
        { badge: "1/1 하단", desc: "바닥 팔레트(파렛트) · 큰 박스 / 무거운 짐" }
      ]
    },
    en: {
      title: "Rack Levels (Tiers) Guide",
      items: [
        { badge: "1/3 Top (상단)", desc: "Highest tier · Small boxes & lightweight cargo" },
        { badge: "1/2 Middle (중단)", desc: "Middle tier · Medium boxes & open-pick items" },
        { badge: "1/1 Bottom (하단)", desc: "Floor pallet · Large boxes & heavy cargo" }
      ]
    },
    'zh-HK': {
      title: "貨架層數照片標註對照",
      items: [
        { badge: "1/3 上層 (상단)", desc: "最高層貨架 · 細紙箱 / 輕件貨物" },
        { badge: "1/2 中層 (중단)", desc: "中層貨架 · 中型紙箱 / 開放式執貨商品" },
        { badge: "1/1 底層 (하단)", desc: "地面卡板 · 大件紙箱 / 重件貨物" }
      ]
    }
  };

  const curr = data[lang] || data.ko;

  return (
    <div className="visual-legend-box">
      <div className="visual-legend-head">
        <span className="visual-legend-icon">🏷️</span>
        <strong>{curr.title}</strong>
      </div>
      <div className="visual-legend-grid">
        {curr.items.map((it, idx) => (
          <div key={idx} className="visual-legend-item">
            <span className="visual-legend-tag tag-rack">{it.badge}</span>
            <span className="visual-legend-desc">{it.desc}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function CartLegend() {
  const { lang } = useLanguage();

  const data = {
    ko: {
      title: "파란 손수레 사진 표기",
      items: [
        { badge: "① 뒤 (손잡이)", desc: "손잡이가 있는 쪽 · 패킹할 때(하차) 뒤부터 먼저 내림" },
        { badge: "② 앞", desc: "손잡이 반대편 앞쪽 · 피킹할 때(상차) 앞부터 먼저 쌓음" }
      ]
    },
    en: {
      title: "Trolley Cart Annotations Guide",
      items: [
        { badge: "① Back (뒤/손잡이)", desc: "Handle end · Unload first when packing" },
        { badge: "② Front (앞)", desc: "Far front end · Load first when picking" }
      ]
    },
    'zh-HK': {
      title: "藍色手推車照片標註對照",
      items: [
        { badge: "① 後方 (뒤/손잡이)", desc: "把手位置 · 包裝卸貨(落貨)時由後方先出" },
        { badge: "② 前方 (앞)", desc: "車身前端 · 執貨上車(裝貨)時由前方先入" }
      ]
    }
  };

  const curr = data[lang] || data.ko;

  return (
    <div className="visual-legend-box">
      <div className="visual-legend-head">
        <span className="visual-legend-icon">🛒</span>
        <strong>{curr.title}</strong>
      </div>
      <div className="visual-legend-grid">
        {curr.items.map((it, idx) => (
          <div key={idx} className="visual-legend-item">
            <span className="visual-legend-tag tag-cart">{it.badge}</span>
            <span className="visual-legend-desc">{it.desc}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
