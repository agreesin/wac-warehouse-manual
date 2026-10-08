import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { XMarkIcon } from './Icons';

export function QuickSearchModal({ isOpen, onClose, onNavigate }) {
  const { lang, t } = useLanguage();
  const [query, setQuery] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      document.body.style.overflow = 'hidden';
    } else {
      setQuery('');
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
      } else if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Search index covering all manuals in KO, EN, ZH-HK
  const searchIndex = useMemo(() => [
    {
      id: 'rule-0',
      manual: 'warehouse',
      page: 0,
      badge: lang === 'en' ? 'Warehouse 01' : lang === 'zh-HK' ? '倉庫 01' : '창고 수칙 01',
      title: lang === 'en' ? '01. Packing List Sorting & Picking Sequence' : lang === 'zh-HK' ? '01. 執貨單分類與執貨順序' : '01. 패킹리스트 분류 · 피킹 순서',
      desc: lang === 'en' ? 'Sort by delivery area code (K / N / H) and customer name. Tsim Sha Tsui first.' : lang === 'zh-HK' ? '依送貨區域代碼 (K / N / H) 及客戶名稱分類，尖沙咀最優先執貨。' : '배송 지역 코드(K/N/H)와 거래처명을 보고 분류. K 침사추이 맨 먼저 피킹.',
      keywords: '패킹리스트 執貨單 packing list 분류 sorting 피킹 執貨 picking 순서 k n h kowloon 구룡 九龍 new territories 신계 新界 hong kong island 홍콩섬 香港島 침사추이 tsim sha tsui 尖沙咀'
    },
    {
      id: 'rule-1',
      manual: 'warehouse',
      page: 1,
      badge: lang === 'en' ? 'Warehouse 02' : lang === 'zh-HK' ? '倉庫 02' : '창고 수칙 02',
      title: lang === 'en' ? '02. Picking & Packing with Packing List' : lang === 'zh-HK' ? '02. 依執貨單執貨與包裝' : '02. 패킹리스트로 피킹 · 패킹하기',
      desc: lang === 'en' ? 'Initials (Picked by) → Location (Rack) → Quantity → Packing station → Box count & Customer code label' : lang === 'zh-HK' ? '英文縮寫 (Picked by) → 貨架位置 → 數量 → 包裝區 → 箱數與客戶代碼標籤' : '영어 이니셜(Picked by) → 렉 위치 → 수량 → 패킹하는 곳 → 박스수량 및 거래처코드 라벨',
      keywords: '이니셜 initials 縮寫 picked by 위치 렉 rack location 貨架 수량 quantity 數量 패킹하는 곳 包裝區 박스수량 box count 箱數 거래처코드 customer code 客戶代碼 ok 옥현서 222-02'
    },
    {
      id: 'rule-2',
      manual: 'warehouse',
      page: 2,
      badge: lang === 'en' ? 'Warehouse 03' : lang === 'zh-HK' ? '倉庫 03' : '창고 수칙 03',
      title: lang === 'en' ? '03. Blue Trolley Cart Loading & Unloading' : lang === 'zh-HK' ? '03. 藍色手推車裝載與卸載' : '03. 파란 손수레 쌓기 · 내리기',
      desc: lang === 'en' ? 'Stacking: Front first (far from handle). Unloading: Back first (near handle).' : lang === 'zh-HK' ? '執貨(裝貨上車): 從前方開始裝貨。卸貨(車仔落貨): 從後方開始卸貨。' : '피킹(쌓기): 앞쪽부터 싣기. 패킹(내리기): 손잡이 쪽 뒤쪽부터 내리기.',
      keywords: '손수레 cart trolley 車仔 파란 손수레 손잡이 handle 把手 앞 front 前方 뒤 back 後方 쌓기 상차 loading 裝貨 내리기 하차 unloading 落貨'
    },
    {
      id: 'rule-3',
      manual: 'warehouse',
      page: 3,
      badge: lang === 'en' ? 'Warehouse 04' : lang === 'zh-HK' ? '倉庫 04' : '창고 수칙 04',
      title: lang === 'en' ? '04. Packing into Boxes (Rules)' : lang === 'zh-HK' ? '04. 裝箱打包守則' : '04. 박스에 넣을 때 (패킹 수칙)',
      desc: lang === 'en' ? 'Verify Checked by initials. Temperature separation. Dividers for mixed boxes. Solo seal for powders. NEVER mix perilla/peppers with chilled/frozen.' : lang === 'zh-HK' ? '確認 Checked by 複核縮寫。溫層分開。混裝加隔板。粉末單獨密封。芝麻葉與青陽辣椒嚴禁混裝冷藏冷凍。' : 'Checked by 더블체크 확인. 상온/냉장냉동 온도 분리. 혼재 시 종이 칸막이. 분말류 단독 밀봉. 깻잎/청양고추 냉장냉동 혼합 금지.',
      keywords: '패킹 packing 包裝 더블체크 double check 複核 checked by 상온 냉장 냉동 온도 분리 temperature 칸막이 divider 隔板 파티션 분말 powder 粉末 깻잎 perilla 芝麻葉 청양고추 chili pepper 辣椒 혼합금지'
    },
    {
      id: 'rule-4',
      manual: 'warehouse',
      page: 4,
      badge: lang === 'en' ? 'Warehouse 05' : lang === 'zh-HK' ? '倉庫 05' : '창고 수칙 05',
      title: lang === 'en' ? '05. Choosing Box Types by Weight' : lang === 'zh-HK' ? '05. 按重量挑選紙箱' : '05. 박스 고르기 — 무게별',
      desc: lang === 'en' ? 'Heavy cargo (> 10kg): Double-wall fluting (two wave layers). Light cargo: Single-wall fluting (one layer).' : lang === 'zh-HK' ? '重件 (> 10kg): 雙層瓦楞 (兩層波浪紙箱)。輕件: 單層瓦楞 (一層波浪紙箱)。' : '무거운 짐 (10kg 초과): 물결 두 줄(두면) 박스. 가벼운 짐: 물결 한 줄(한면) 박스.',
      keywords: '박스 box 紙箱 무게 weight 重量 두면 double wall 雙層 兩層 2줄 물결 두 줄 한면 single wall 單層 一層 1줄 10kg 삼계탕 치킨파우더 김가루 떡볶이'
    },
    {
      id: 'rule-5',
      manual: 'warehouse',
      page: 5,
      badge: lang === 'en' ? 'Warehouse 06' : lang === 'zh-HK' ? '倉庫 06' : '창고 수칙 06',
      title: lang === 'en' ? '06. Applying Labels — Fragile & HEAVY' : lang === 'zh-HK' ? '06. 張貼標籤 — 易碎·HEAVY' : '06. 라벨 붙이기 — 주의 · HEAVY',
      desc: lang === 'en' ? 'Fragile/Burst risk items (radish, mayonnaise, quail eggs, ketchup): Wrap in plastic + FRAGILE label. Over 10kg: Affix HEAVY label.' : lang === 'zh-HK' ? '易碎破裂物 (醃黃蘿蔔、蛋黃醬、鵪鶉蛋、番茄醬): 塑膠袋包覆 + 注意(FRAGILE)標籤。超過 10kg: 張貼 HEAVY 標籤。' : '터질 위험(단무지, 마요네즈, 메추리알, 케찹): 비닐 포장 + 주의(FRAGILE) 라벨. 10kg 초과: HEAVY 라벨 부착.',
      keywords: '라벨 label 標籤 주의 fragile 易碎 파손주의 heavy 重物 10kg 단무지 pickled radish 醃黃蘿蔔 마요네즈 mayonnaise 蛋黃醬 美乃滋 메추리알 quail eggs 鵪鶉蛋 케찹 ketchup 番茄醬'
    },
    {
      id: 'map',
      manual: 'warehouse',
      page: 6,
      badge: lang === 'en' ? 'Warehouse Map' : lang === 'zh-HK' ? '倉庫平面圖' : '창고 도면',
      title: lang === 'en' ? 'Warehouse Floor Map & Rack Levels' : lang === 'zh-HK' ? '總部倉庫平面圖與貨架層數' : '창고 전체 도면 · 렉 단(높이)',
      desc: lang === 'en' ? 'Zone A (Left), Zone B (Right), Packing station in front. 1/3 Top tier, 1/2 Middle tier, 1/1 Bottom floor pallet.' : lang === 'zh-HK' ? 'A 區(左側), B 區(右側), 下方包裝區。1/3 上層, 1/2 中層, 1/1 底層地面卡板。' : '본사창고 도면. 왼쪽 A구역, 오른쪽 B구역, 아래 패킹하는 곳. 렉 높이 1/3 상단, 1/2 중단, 1/1 하단 팔레트.',
      keywords: '도면 map 平面圖 렉 rack 貨架 a구역 zone a a區 b구역 zone b b區 패킹하는 곳 packing station 包裝區 1/3 상단 top tier 上層 1/2 중단 mid tier 中層 1/1 하단 bottom tier 底層 팔레트 pallet 卡板'
    },
    {
      id: 'ecount-0',
      manual: 'ecount',
      page: 0,
      badge: lang === 'en' ? 'ECOUNT 01' : lang === 'zh-HK' ? 'ECOUNT 01' : 'ECOUNT 01',
      title: lang === 'en' ? 'Sales Entry — Basic Order Input' : lang === 'zh-HK' ? '銷貨輸入 — 基礎訂單輸入' : '판매입력 — 기본 입력',
      desc: lang === 'en' ? 'Inventory I → Sales → Sales Entry. Customer search keyword, Person in charge: Online (00005), Warehouse: HQ Warehouse (Never Pop-up), Remarks (Delivery / Warehouse).' : lang === 'zh-HK' ? '庫存 I → 銷貨 → 銷貨輸入。客戶關鍵字搜尋、職員選 Online (00005)、出庫倉庫選總部倉庫 (嚴禁選快閃)、備註 (配送/倉庫)。' : '재고 I → 판매입력. 거래처 핵심단어 검색(몽콕 아웃닭), 사원 온라인(00005), 출하창고 본사창고(팝업 금지), 특이사항(배송용/창고용), 품목 및 수량.',
      keywords: '판매입력 sales entry 銷貨輸入 거래처 customer 客戶 아웃닭 outdark 온라인 online 담당자 사원 employee 출하창고 warehouse 總部倉庫 본사창고 팝업 pop-up 快閃 특이사항 remarks 備註 배송용 창고용 품목 item'
    },
    {
      id: 'ecount-1',
      manual: 'ecount',
      page: 1,
      badge: lang === 'en' ? 'ECOUNT 02' : lang === 'zh-HK' ? 'ECOUNT 02' : 'ECOUNT 02',
      title: lang === 'en' ? 'Print Invoice & Packing List' : lang === 'zh-HK' ? '發票與執貨單列印' : '인보이스 · 패킹리스트 출력',
      desc: lang === 'en' ? 'Sales Inquiry → Check Date-No. box (page by page) → Bottom Print → Transaction Statement (Invoice) → Template switch to Packing_new.' : lang === 'zh-HK' ? '銷貨查詢 → 勾選日期-No. (逐頁全選) → 底部列印 → 交易明細表 (發票) → 格式切換為 Packing_new (執貨單)。' : '재고 I → 판매조회. 일자-No 옆 체크박스로 현재페이지 전체선택 → 하단 인쇄 → 거래명세서(인보이스) → 양식 packing_new 선택(패킹리스트).',
      keywords: '판매조회 sales inquiry 銷貨查詢 인쇄 print 列印 전체선택 select all 인보이스 invoice 發票 거래명세서 transaction statement 패킹리스트 執貨單 packing list packing_new 양식 template 格式'
    }
  ], [lang]);

  // Filter results based on search query
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    const qWords = q.split(/\s+/).filter(Boolean);
    return searchIndex.filter((item) => {
      const target = (item.title + ' ' + item.desc + ' ' + item.keywords + ' ' + item.badge).toLowerCase();
      return qWords.every((word) => target.includes(word));
    });
  }, [query, searchIndex]);

  const handleSelect = (item) => {
    document.body.style.overflow = '';
    onClose();
    onNavigate(item.manual, item.page);
  };

  const displayItems = query.trim() ? filtered : searchIndex;

  const handleInputKeyDown = (e) => {
    if (e.key === 'Enter' && displayItems.length > 0) {
      e.preventDefault();
      handleSelect(displayItems[0]);
    }
  };

  const sampleKeywords = [
    { label: '깻잎 (Perilla)', term: '깻잎' },
    { label: '10kg (HEAVY)', term: '10kg' },
    { label: lang === 'zh-HK' ? '蛋黃醬' : '마요네즈', term: lang === 'zh-HK' ? '蛋黃醬' : '마요네즈' },
    { label: lang === 'zh-HK' ? '執貨單' : 'packing_new', term: lang === 'zh-HK' ? '執貨單' : 'packing_new' },
    { label: 'Kowloon (구룡)', term: 'Kowloon' },
    { label: lang === 'zh-HK' ? '車仔 (카트)' : '손수레', term: lang === 'zh-HK' ? '車仔' : '손수레' },
    { label: lang === 'zh-HK' ? '總部倉庫' : '본사창고', term: lang === 'zh-HK' ? '總部倉庫' : '본사창고' }
  ];

  if (!isOpen) return null;

  return (
    <div className="search-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="search-modal" onClick={(e) => e.stopPropagation()}>
        <div className="search-input-wrap">
          <span className="search-icon">🔍</span>
          <input
            ref={inputRef}
            type="text"
            className="search-input"
            placeholder={
              lang === 'en'
                ? 'Search keywords (e.g. 10kg, perilla, packing_new, carton)...'
                : lang === 'zh-HK'
                ? '搜尋關鍵字 (例: 10kg, 芝麻葉, 蛋黃醬, 車仔, 執貨單)...'
                : '검색어 입력 (예: 깻잎, 10kg, 마요네즈, packing_new, 카트)...'
            }
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleInputKeyDown}
          />
          {query && (
            <button
              type="button"
              className="search-clear-btn"
              onClick={() => setQuery('')}
              aria-label="지우기"
            >
              ✕
            </button>
          )}
          <button
            type="button"
            className="search-close-btn"
            onClick={onClose}
            aria-label="닫기"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Suggestion pills if query is empty */}
        {!query && (
          <div className="search-suggestions">
            <span className="search-sugg-label">
              {lang === 'en' ? 'Quick keywords:' : lang === 'zh-HK' ? '常用關鍵字:' : '추천 키워드:'}
            </span>
            <div className="search-pills">
              {sampleKeywords.map((sk) => (
                <button
                  key={sk.term}
                  type="button"
                  className="search-pill"
                  onClick={() => setQuery(sk.term)}
                >
                  {sk.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Section title when browsing all chapters */}
        {!query && (
          <div className="search-section-header">
            <span>
              {lang === 'en'
                ? 'All Manual Chapters'
                : lang === 'zh-HK'
                ? '全部手冊章節'
                : '전체 수칙 및 매뉴얼 목록'}
            </span>
            <span className="search-count-badge">{searchIndex.length}</span>
          </div>
        )}

        {/* Results List */}
        <div className="search-results">
          {query && filtered.length === 0 && (
            <div className="search-empty">
              <p>
                {lang === 'en'
                  ? `No results found for "${query}".`
                  : lang === 'zh-HK'
                  ? `找不到與 "${query}" 相關的內容。`
                  : `"${query}"에 대한 검색 결과가 없습니다.`}
              </p>
            </div>
          )}

          {displayItems.map((item) => (
            <button
              key={item.id}
              type="button"
              className="search-item"
              onClick={() => handleSelect(item)}
            >
              <div className="search-item-top">
                <span className="search-item-badge">{item.badge}</span>
                <strong className="search-item-title">{item.title}</strong>
              </div>
              <p className="search-item-desc">{item.desc}</p>
            </button>
          ))}
        </div>

        <div className="search-footer">
          <span>ESC: {lang === 'en' ? 'Close' : lang === 'zh-HK' ? '關閉' : '닫기'}</span>
          <span>Enter: {lang === 'en' ? 'Select' : lang === 'zh-HK' ? '前往' : '이동'}</span>
        </div>
      </div>
    </div>
  );
}
