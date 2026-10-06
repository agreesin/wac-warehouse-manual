import React from 'react';
import { useLanguage } from '../context/LanguageContext';

function renderBold(text) {
  if (!text) return null;
  return text.split(/(\\*\\*[^*]+\\*\\*)/g).map((part, i) =>
    part.startsWith('**') && part.endsWith('**') ? (
      <strong key={i}>{part.slice(2, -2)}</strong>
    ) : (
      <span key={i}>{part}</span>
    )
  );
}

export function WarehouseRuleViewer({ pageIndex }) {
  const { lang, t } = useLanguage();

  switch (pageIndex) {
    case 0:
      return <Rule01 lang={lang} t={t} />;
    case 1:
      return <Rule02 lang={lang} t={t} />;
    case 2:
      return <Rule03 lang={lang} t={t} />;
    case 3:
      return <Rule04 lang={lang} t={t} />;
    case 4:
      return <Rule05 lang={lang} t={t} />;
    case 5:
      return <Rule06 lang={lang} t={t} />;
    default:
      return <Rule01 lang={lang} t={t} />;
  }
}

// ==================== Rule 01: Sorting & Picking Order ====================
function Rule01({ lang, t }) {
  const texts = {
    ko: {
      calloutHead: "패킹리스트 출력 후, 인턴이 할 일",
      calloutNext: <>거래처코드 맨 앞 글자(<strong>K / N / H</strong>)와 거래처명을 보고 아래 순서로 분류합니다.</>,
      knhTitle: "K · N · H가 뭔가요?",
      knhSub: <>거래처코드 맨 앞 글자는 <strong>배송 지역</strong>입니다.</>,
      kArea: "Kowloon · 구룡",
      nArea: "New Territories · 신계",
      hArea: "Hong Kong Island · 홍콩섬",
      howtoTitle: "보는 법",
      howto1Step: "보는 법 1",
      howto1Head: "거래처코드 맨 앞",
      howto1Desc: <><em>K</em> / <em>N</em> / <em>H</em> 중 하나</>,
      howto2Step: "보는 법 2",
      howto2Head: "K이면 거래처명 확인",
      howto2Desc: <><em>침사추이</em>가 있으면 따로 빼기</>,
      ex1Title: "예시 ① — K + 침사추이",
      ex1Desc: <>코드가 K이고 거래처명에 침사추이가 있으면 → <strong>맨 먼저 분류</strong></>,
      ex1Cap: "실제 예시 · ①K + ①침사추이",
      ex2Title: "예시 ② — N",
      ex2Desc: <>맨 앞이 N이면 → <strong>N으로 분류</strong> (H는 H로 분류)</>,
      ex2Cap: "N 예시 · 거래처코드 맨 앞 글자만 보면 됨",
      orderTitle: "피킹 시작 순서",
      order1Sub: "위 예시 ①",
      order2Sub: "K인데 침사추이 아님",
      order3Sub: "위 예시 ②",
      order4Sub: "끝나면 패킹",
      keyHead: "여기까지 핵심",
      keyDesc: <strong>K 침사추이 → K → N → H → 패킹</strong>
    },
    en: {
      calloutHead: "Intern's Tasks After Printing Packing Lists",
      calloutNext: <>Check the first letter of customer code (<strong>K / N / H</strong>) and customer name, then sort in the order below.</>,
      knhTitle: "What are K · N · H?",
      knhSub: <>The first letter of the customer code represents the <strong>Delivery Area</strong>.</>,
      kArea: "Kowloon (九龍)",
      nArea: "New Territories (新界)",
      hArea: "Hong Kong Island (香港島)",
      howtoTitle: "How to Read",
      howto1Step: "Step 1",
      howto1Head: "First letter of Customer Code",
      howto1Desc: <>One of <em>K</em> / <em>N</em> / <em>H</em></>,
      howto2Step: "Step 2",
      howto2Head: "If K, check Customer Name",
      howto2Desc: <>Separate if name includes <em>Tsim Sha Tsui</em></>,
      ex1Title: "Example ① — K + Tsim Sha Tsui",
      ex1Desc: <>If code is K and name has Tsim Sha Tsui → <strong>Sort first</strong></>,
      ex1Cap: "Actual example · ①K + ①Tsim Sha Tsui",
      ex2Title: "Example ② — N",
      ex2Desc: <>If starting with N → <strong>Sort into N</strong> (H into H)</>,
      ex2Cap: "N example · Simply check the first letter of customer code",
      orderTitle: "Picking Sequence",
      order1Sub: "See Example ①",
      order2Sub: "Starts with K but not TST",
      order3Sub: "See Example ②",
      order4Sub: "Pack once finished",
      keyHead: "Key Takeaway",
      keyDesc: <strong>K Tsim Sha Tsui → K → N → H → Packing</strong>
    },
    'zh-HK': {
      calloutHead: "執貨單列印後，實習生工作步驟",
      calloutNext: <>確認客戶代碼首字母(<strong>K / N / H</strong>)及客戶名稱，並按以下順序分類。</>,
      knhTitle: "什麼是 K · N · H？",
      knhSub: <>客戶代碼的首字母代表 <strong>送貨區域</strong>。</>,
      kArea: "Kowloon · 九龍",
      nArea: "New Territories · 新界",
      hArea: "Hong Kong Island · 香港島",
      howtoTitle: "查閱方法",
      howto1Step: "查閱步驟 1",
      howto1Head: "客戶代碼首字母",
      howto1Desc: <><em>K</em> / <em>N</em> / <em>H</em> 之一</>,
      howto2Step: "查閱步驟 2",
      howto2Head: "若為 K，確認客戶名稱",
      howto2Desc: <>若含 <em>尖沙咀</em> 則單獨分出</>,
      ex1Title: "範例 ① — K + 尖沙咀",
      ex1Desc: <>代碼為 K 且客戶名稱含尖沙咀 → <strong>最優先分類</strong></>,
      ex1Cap: "實際範例 · ①K + ①尖沙咀",
      ex2Title: "範例 ② — N",
      ex2Desc: <>首字母為 N → <strong>分類為 N</strong> (H 則分類為 H)</>,
      ex2Cap: "N 範例 · 僅需確認客戶代碼首字母",
      orderTitle: "執貨開始順序",
      order1Sub: "見上方範例 ①",
      order2Sub: "為 K 但非尖沙咀",
      order3Sub: "見上方範例 ②",
      order4Sub: "完成後進行包裝",
      keyHead: "核心重點",
      keyDesc: <strong>K 尖沙咀 → K → N → H → 包裝</strong>
    }
  };

  const c = texts[lang] || texts.ko;

  return (
    <>
      <div className="rule-callout">
        <p><strong>{c.calloutHead}</strong></p>
        <p className="rule-callout-next">{c.calloutNext}</p>
      </div>

      <section className="wh-section">
        <h3 className="wh-section-title">{c.knhTitle}</h3>
        <ul className="ecount-step-list">
          <li>{c.knhSub}</li>
        </ul>
        <div className="knh-meaning">
          <div className="knh-card">
            <strong>K</strong>
            <span>{c.kArea}</span>
          </div>
          <div className="knh-card">
            <strong>N</strong>
            <span>{c.nArea}</span>
          </div>
          <div className="knh-card">
            <strong>H</strong>
            <span>{c.hArea}</span>
          </div>
        </div>
      </section>

      <section className="wh-section">
        <h3 className="wh-section-title">{c.howtoTitle}</h3>
        <div className="howto-grid">
          <div className="howto-card">
            <span className="howto-step">{c.howto1Step}</span>
            <strong>{c.howto1Head}</strong>
            <p>{c.howto1Desc}</p>
          </div>
          <div className="howto-card">
            <span className="howto-step">{c.howto2Step}</span>
            <strong>{c.howto2Head}</strong>
            <p>{c.howto2Desc}</p>
          </div>
        </div>
      </section>

      <section className="wh-section">
        <h3 className="wh-section-title">{c.ex1Title}</h3>
        <ul className="ecount-step-list">
          <li>{c.ex1Desc}</li>
        </ul>
        <div className="label-frame example-hero">
          <img src="/labels/example-K-chimsa.png" alt="K TST Packing List Example" />
          <p className="label-cap">{c.ex1Cap}</p>
        </div>
      </section>

      <section className="wh-section">
        <h3 className="wh-section-title">{c.ex2Title}</h3>
        <ul className="ecount-step-list">
          <li>{c.ex2Desc}</li>
        </ul>
        <div className="label-frame example-side">
          <img src="/labels/example-N.png" alt="N Packing List Example" />
          <p className="label-cap">{c.ex2Cap}</p>
        </div>
      </section>

      <section className="wh-section">
        <h3 className="wh-section-title">{c.orderTitle}</h3>
        <ol className="pick-order pick-order-row">
          <li>
            <span className="pick-badge">1</span>
            <div>
              <strong>K · {lang === 'en' ? 'Tsim Sha Tsui' : lang === 'zh-HK' ? '尖沙咀' : '침사추이'}</strong>
              <em>{c.order1Sub}</em>
            </div>
          </li>
          <li>
            <span className="pick-badge">2</span>
            <div>
              <strong>K ({lang === 'en' ? 'Others' : lang === 'zh-HK' ? '其餘' : '나머지'})</strong>
              <em>{c.order2Sub}</em>
            </div>
          </li>
          <li>
            <span className="pick-badge">3</span>
            <div>
              <strong>N</strong>
              <em>{c.order3Sub}</em>
            </div>
          </li>
          <li>
            <span className="pick-badge">4</span>
            <div>
              <strong>H</strong>
              <em>{c.order4Sub}</em>
            </div>
          </li>
        </ol>
      </section>

      <div className="callout callout-key">
        <span className="callout-icon">✓</span>
        <div className="callout-body">
          <span className="callout-label">{c.keyHead}</span>
          <p>{c.keyDesc}</p>
        </div>
      </div>
    </>
  );
}

// ==================== Rule 02: Picking & Packing with Packing List ====================
function Rule02({ lang, t }) {
  const texts = {
    ko: {
      callout: "분류한 리스트를 들고 창고로 가서, 빨간 번호 순서대로 하면 됩니다.",
      cap: "예시 · 빨간 원 = 작업 포인트",
      s1Title: "① Picked by",
      s1Desc: <>영어 이니셜 (예: 옥현서 → <em>OK</em>)</>,
      s2Title: "② 위치",
      s2Desc: <>렉에서 찾기 (예: <em>A 5/6</em>)</>,
      s3Title: "③ 수량",
      s3Desc: <>적힌 수량만큼 피킹 (예: <em>10PK</em>)</>,
      sMidTitle: "패킹하는 곳",
      sMidDesc: "손수레로 가져와 바닥에 내려놓고 패킹",
      s4Title: "④ 박스수량",
      s4Desc: <>실제 개수 기입 (예: <em>3</em>)</>,
      s5Title: "⑤ 거래처코드",
      s5Desc: <>숫자로 라벨 — 예: <em>222-02×3</em></>,
      tip: <>이니셜은 영어 이름 약자로 적습니다. 예: 옥현서 → <strong>OK</strong></>,
      keyHead: "여기까지 핵심",
      keyItem1: "이니셜 → 위치 → 수량 피킹",
      keyItem2: "패킹하는 곳에서 박스수량 · 거래처코드 라벨"
    },
    en: {
      callout: "Take the sorted list into the warehouse and follow the red numbers in order.",
      cap: "Example · Red circles = Action points",
      s1Title: "① Picked by",
      s1Desc: <>English initials (e.g., Hyunseo Ok → <em>OK</em>)</>,
      s2Title: "② Location",
      s2Desc: <>Find on rack (e.g., <em>A 5/6</em>)</>,
      s3Title: "③ Quantity",
      s3Desc: <>Pick specified quantity (e.g., <em>10PK</em>)</>,
      sMidTitle: "Packing Station",
      sMidDesc: "Bring items by cart, place on floor, and pack",
      s4Title: "④ Box Count",
      s4Desc: <>Enter actual box quantity (e.g., <em>3</em>)</>,
      s5Title: "⑤ Customer Code",
      s5Desc: <>Label with numbers — e.g., <em>222-02×3</em></>,
      tip: <>Write abbreviations of your English name for initials. e.g., Hyunseo Ok → <strong>OK</strong></>,
      keyHead: "Key Takeaway",
      keyItem1: "Initials → Location → Quantity picking",
      keyItem2: "Label box count & customer code at packing station"
    },
    'zh-HK': {
      callout: "攜帶分類好的清單至倉庫，依照紅色編號順序操作即可。",
      cap: "範例 · 紅色圓圈 = 作業要點",
      s1Title: "① Picked by",
      s1Desc: <>英文姓名縮寫 (例: 옥현서 → <em>OK</em>)</>,
      s2Title: "② 貨架位置",
      s2Desc: <>於貨架尋找 (例: <em>A 5/6</em>)</>,
      s3Title: "③ 數量",
      s3Desc: <>按標註數量執貨 (例: <em>10PK</em>)</>,
      sMidTitle: "包裝區",
      sMidDesc: "用推車運至包裝區放置於地面後進行包裝",
      s4Title: "④ 箱數",
      s4Desc: <>填寫實際箱數 (例: <em>3</em>)</>,
      s5Title: "⑤ 客戶代碼",
      s5Desc: <>數字標籤註記 — 例: <em>222-02×3</em></>,
      tip: <>縮寫請使用英文姓名首字母縮寫。例: 옥현서 → <strong>OK</strong></>,
      keyHead: "核心重點",
      keyItem1: "縮寫 → 位置 → 數量執貨",
      keyItem2: "於包裝區標示箱數與客戶代碼標籤"
    }
  };

  const c = texts[lang] || texts.ko;

  return (
    <>
      <div className="rule-callout">
        <p>{c.callout}</p>
      </div>
      <div className="plist-layout">
        <div className="label-frame plist-frame">
          <img src="/labels/packing-list-annotated.png" alt="Packing list annotated" />
          <p className="label-cap">{c.cap}</p>
        </div>
        <ol className="plist-steps">
          <li>
            <strong>{c.s1Title}</strong>
            <span>{c.s1Desc}</span>
          </li>
          <li>
            <strong>{c.s2Title}</strong>
            <span>{c.s2Desc}</span>
          </li>
          <li>
            <strong>{c.s3Title}</strong>
            <span>{c.s3Desc}</span>
          </li>
          <li>
            <strong>{c.sMidTitle}</strong>
            <span>{c.sMidDesc}</span>
          </li>
          <li>
            <strong>{c.s4Title}</strong>
            <span>{c.s4Desc}</span>
          </li>
          <li>
            <strong>{c.s5Title}</strong>
            <span>{c.s5Desc}</span>
          </li>
        </ol>
      </div>

      <div className="callout callout-tip">
        <span className="callout-icon">TIP</span>
        <div className="callout-body">
          <span className="callout-label">{t.common.tip}</span>
          <p>{c.tip}</p>
        </div>
      </div>

      <div className="callout callout-key">
        <span className="callout-icon">✓</span>
        <div className="callout-body">
          <span className="callout-label">{c.keyHead}</span>
          <ul>
            <li>{c.keyItem1}</li>
            <li>{c.keyItem2}</li>
          </ul>
        </div>
      </div>
    </>
  );
}

// ==================== Rule 03: Blue Trolley Stacking & Unloading ====================
function Rule03({ lang, t }) {
  const texts = {
    ko: {
      callout: <>손잡이 기준으로 <strong>앞/뒤가 반대</strong>입니다.</>,
      step1Head: "피킹(쌓기)",
      step1Desc: <> — 손잡이에서 먼 <strong>앞쪽</strong>부터</>,
      step2Head: "패킹 전(내리기)",
      step2Desc: <> — 손잡이 쪽 <strong>뒤쪽</strong>부터</>,
      cap: "①뒤(손잡이) / ②앞",
      warn: "쌓을 때와 내릴 때 방향이 다릅니다. 앞부터 쌓고, 뒤부터 내리세요."
    },
    en: {
      callout: <>Front and back are <strong>opposite</strong> based on the cart handle.</>,
      step1Head: "Picking (Stacking)",
      step1Desc: <> — Start from the <strong>FRONT</strong>, furthest from the handle</>,
      step2Head: "Before Packing (Unloading)",
      step2Desc: <> — Start from the <strong>BACK</strong>, nearest to the handle</>,
      cap: "① Back (Handle) / ② Front",
      warn: "Stacking and unloading directions are reversed. Stack from the front, unload from the back."
    },
    'zh-HK': {
      callout: <>以把手為基準，<strong>前後方向相反</strong>。</>,
      step1Head: "執貨 (裝貨上車)",
      step1Desc: <> — 從遠離把手的 <strong>前方</strong> 開始裝貨</>,
      step2Head: "卸貨 (車仔落貨)",
      step2Desc: <> — 從靠近把手的 <strong>後方</strong> 開始卸貨</>,
      cap: "① 後方 (把手) / ② 前方",
      warn: "堆放與卸貨的方向不同。請由前向後堆放，由後向前卸下。"
    }
  };

  const c = texts[lang] || texts.ko;

  return (
    <>
      <div className="rule-callout">
        <p>{c.callout}</p>
      </div>
      <ul className="ecount-step-list">
        <li>
          <strong>{c.step1Head}</strong>
          {c.step1Desc}
        </li>
        <li>
          <strong>{c.step2Head}</strong>
          {c.step2Desc}
        </li>
      </ul>
      <div className="label-frame cart-frame">
        <img src="/labels/cart-annotated.png" alt="Blue cart annotated" />
        <p className="label-cap">{c.cap}</p>
      </div>
      <div className="callout callout-warn">
        <span className="callout-icon">!</span>
        <div className="callout-body">
          <span className="callout-label">{t.common.warn}</span>
          <p>{c.warn}</p>
        </div>
      </div>
    </>
  );
}

// ==================== Rule 04: Box Packing Rules ====================
function Rule04({ lang, t }) {
  const texts = {
    ko: {
      callout1: <>피킹이 끝나면 <strong>패킹하는 곳</strong>에서 박스에 담습니다.</>,
      callout2: <>단, <strong>Checked by</strong>에 영어 이니셜이 있는 리스트만 패킹합니다. (더블체크 완료)</>,
      sec1Title: "더블체크 확인 (패킹 전에 꼭)",
      sec1Sub: <><strong>Picked by</strong> 옆 <strong>Checked by</strong>에 이니셜이 있으면 → 더블체크된 리스트 → 패킹 가능</>,
      sec1Cap: "예시 · Checked by에 HS처럼 이니셜이 있으면 패킹",
      sec2Title: "박스에 넣는 규칙",
      r1Title: "온도대별 분리 포장",
      r1Desc: <><em>상온</em>과 <em>냉장·냉동</em>은 원칙적으로 <strong>다른 박스</strong>에 넣습니다.</>,
      r2Title: "합포장(혼재)할 때",
      r2Desc: <>어쩔 수 없이 한 박스에 섞어야 하면 <strong>종이 칸막이(파티션)</strong>을 넣어 제품이 서로 닿지 않게 합니다.</>,
      r3Title: "분말류 방습",
      r3Desc: <>분말형 제품은 습기·결로를 막기 위해 <strong>가급적 단독으로 밀봉</strong> 포장합니다.</>,
      r4Title: "깻잎 · 청양고추 — 혼합 금지",
      r4Desc: <><em>깻잎</em>, <em>청양고추</em>는 냉장·냉동 제품과 <strong>같은 박스에 넣지 않습니다.</strong></>,
      warn: "깻잎·청양고추는 냉장·냉동과 합치면 안 됩니다. 따로 포장하세요.",
      keyHead: "여기까지 핵심",
      k1: "더블체크 확인",
      k2: "온도 분리 → (섞으면) 칸막이",
      k3: "분말은 단독 · 깻잎/청양고추는 냉장·냉동과 금지"
    },
    en: {
      callout1: <>After picking, pack items into boxes at the <strong>Packing Station</strong>.</>,
      callout2: <>Note: Only pack lists with initials in <strong>Checked by</strong> (Double-check completed).</>,
      sec1Title: "Verify Double-check (Mandatory before packing)",
      sec1Sub: <>Initials in <strong>Checked by</strong> next to <strong>Picked by</strong> → Verified list → Ready to pack</>,
      sec1Cap: "Example · Pack if Checked by has initials like HS",
      sec2Title: "Box Packing Rules",
      r1Title: "Separate Packing by Temperature",
      r1Desc: <><em>Room temperature</em> and <em>Chilled/Frozen</em> must fundamentally go into <strong>different boxes</strong>.</>,
      r2Title: "When Consolidating (Mixed Packing)",
      r2Desc: <>If items must be combined in one box, insert a <strong>cardboard divider</strong> so products do not touch.</>,
      r3Title: "Moisture Protection for Powders",
      r3Desc: <>Powder products should be <strong>sealed individually</strong> to prevent moisture and condensation.</>,
      r4Title: "Perilla Leaves · Hot Peppers — DO NOT MIX",
      r4Desc: <><em>Perilla leaves</em> and <em>Cheongyang peppers</em> <strong>must NOT be packed in the same box</strong> with chilled/frozen items.</>,
      warn: "Never mix perilla leaves and hot peppers with chilled or frozen items. Pack separately.",
      keyHead: "Key Takeaway",
      k1: "Confirm double-check initials",
      k2: "Separate temperatures → Use dividers if consolidated",
      k3: "Powders solo · Never mix perilla/peppers with chilled/frozen"
    },
    'zh-HK': {
      callout1: <>執貨完成後，於 <strong>包裝區</strong> 進行裝箱打包。</>,
      callout2: <>注意：僅能包裝 <strong>Checked by</strong> 欄位填有英文縮寫的清單（代表已完成雙重核對）。</>,
      sec1Title: "雙重核對確認 (包裝前必做)",
      sec1Sub: <><strong>Picked by</strong> 旁的 <strong>Checked by</strong> 若有縮寫 → 經複核清單 → 方可包裝</>,
      sec1Cap: "範例 · Checked by 填有如 HS 縮寫時方可包裝",
      sec2Title: "裝箱打包守則",
      r1Title: "依溫層分開包裝",
      r1Desc: <><em>常溫</em> 與 <em>冷藏·冷凍</em> 原則上必須裝入 <strong>不同紙箱</strong>。</>,
      r2Title: "併箱 (混裝) 時",
      r2Desc: <>若不得不混合裝入同一箱，須插入 <strong>紙板隔板</strong> 避免商品互相接觸。</>,
      r3Title: "粉末類防潮",
      r3Desc: <>粉末狀產品為防止受潮及結露，應 <strong>盡量單獨密封</strong> 包裝。</>,
      r4Title: "芝麻葉 · 青陽辣椒 — 嚴禁混裝",
      r4Desc: <><em>芝麻葉</em> 與 <em>青陽辣椒</em> <strong>嚴禁與冷藏/冷凍商品混裝</strong> 於同一紙箱。</>,
      warn: "芝麻葉與青陽辣椒不可與冷藏冷凍品混裝，請單獨包裝。",
      keyHead: "核心重點",
      k1: "確認雙重核對",
      k2: "溫層分離 → (混裝時) 務必加隔板",
      k3: "粉末單獨密封 · 芝麻葉/辣椒嚴禁與冷藏冷凍混裝"
    }
  };

  const c = texts[lang] || texts.ko;

  return (
    <>
      <div className="rule-callout">
        <p>{c.callout1}</p>
        <p className="rule-callout-next">{c.callout2}</p>
      </div>

      <section className="wh-section">
        <h3 className="wh-section-title">{c.sec1Title}</h3>
        <ul className="ecount-step-list">
          <li>{c.sec1Sub}</li>
        </ul>
        <div className="label-frame example-side">
          <img src="/labels/packing-list-doublecheck.png" alt="Double check sample" />
          <p className="label-cap">{c.sec1Cap}</p>
        </div>
      </section>

      <section className="wh-section">
        <h3 className="wh-section-title">{c.sec2Title}</h3>
        <div className="pack-rules">
          <article className="pack-rule">
            <span className="pack-rule-no">1</span>
            <div>
              <span className="pack-rule-title">{c.r1Title}</span>
              <p>{c.r1Desc}</p>
            </div>
          </article>
          <article className="pack-rule">
            <span className="pack-rule-no">2</span>
            <div>
              <span className="pack-rule-title">{c.r2Title}</span>
              <p>{c.r2Desc}</p>
            </div>
          </article>
          <article className="pack-rule">
            <span className="pack-rule-no">3</span>
            <div>
              <span className="pack-rule-title">{c.r3Title}</span>
              <p>{c.r3Desc}</p>
            </div>
          </article>
          <article className="pack-rule pack-rule-warn">
            <span className="pack-rule-no">4</span>
            <div>
              <span className="pack-rule-title">{c.r4Title}</span>
              <p>{c.r4Desc}</p>
            </div>
          </article>
        </div>
      </section>

      <div className="callout callout-warn">
        <span className="callout-icon">!</span>
        <div className="callout-body">
          <span className="callout-label">{t.common.warn}</span>
          <p>{c.warn}</p>
        </div>
      </div>

      <div className="callout callout-key">
        <span className="callout-icon">✓</span>
        <div className="callout-body">
          <span className="callout-label">{c.keyHead}</span>
          <ul>
            <li>{c.k1}</li>
            <li>{c.k2}</li>
            <li>{c.k3}</li>
          </ul>
        </div>
      </div>
    </>
  );
}

// ==================== Rule 05: Choosing Box by Weight ====================
function Rule05({ lang, t }) {
  const texts = {
    ko: {
      callout1: <>패킹할 때 박스가 <strong>무거워질 것 같으면</strong> 단면이 <strong>물결 두 줄(두면)</strong>인 박스를 씁니다.</>,
      callout2: <>가벼운 짐이면 단면이 <strong>물결 한 줄(한면)</strong>인 박스면 됩니다.</>,
      tip: "박스 모서리 단면을 보고 물결이 한 줄인지 두 줄인지 확인하세요.",
      c1Title: "무거운 짐 → 두면 (두 줄)",
      c1Desc: <>박스가 무거워질 것 같으면 (대략 <strong>10kg 초과</strong>) 단면이 물결 <strong>두 줄</strong>인 박스를 씁니다.</>,
      c1ExLabel: "이런 박스 쓰기",
      c1Ex: ["삼계탕 박스", "물결가루(치킨파우더) 박스", "W 자체 박스"],
      c1Cap: "빨간 원 = 단면 물결이 두 줄",
      c2Title: "가벼운 짐 → 한면 (한 줄)",
      c2Desc: <>가벼운 짐이면 단면이 물결 <strong>한 줄</strong>인 박스면 됩니다.</>,
      c2ExLabel: "이런 박스 쓰기",
      c2Ex: ["김가루 박스 (예: 해농 넘버원)", "떡볶이(떡) 박스"],
      c2Cap: "빨간 원 = 단면 물결이 한 줄",
      keyHead: "여기까지 핵심",
      keyDesc: <><strong>무거우면 두면 · 가벼우면 한면</strong> (모서리 단면 확인)</>
    },
    en: {
      callout1: <>When packing, if the cargo is likely to be <strong>heavy</strong>, use a box with <strong>double-wall fluting (two layers)</strong> on the edge cross-section.</>,
      callout2: <>For light cargo, a <strong>single-wall fluting (one layer)</strong> box is sufficient.</>,
      tip: "Check the box edge cross-section to see whether it has one or two fluting wave layers.",
      c1Title: "Heavy Cargo → Double-wall (2 layers)",
      c1Desc: <>If the box is expected to be heavy (approx. <strong>over 10kg</strong>), use a box with <strong>two fluting layers</strong>.</>,
      c1ExLabel: "Recommended Boxes",
      c1Ex: ["Samgyetang (Ginseng chicken) box", "Chicken fry powder box", "W branded custom box"],
      c1Cap: "Red circle = Two wave fluting layers",
      c2Title: "Light Cargo → Single-wall (1 layer)",
      c2Desc: <>For lightweight goods, a box with <strong>one wave fluting layer</strong> is fine.</>,
      c2ExLabel: "Recommended Boxes",
      c2Ex: ["Seaweed flakes box (e.g., Haenong No.1)", "Tteokbokki (rice cake) box"],
      c2Cap: "Red circle = Single wave fluting layer",
      keyHead: "Key Takeaway",
      keyDesc: <><strong>Double-wall if heavy · Single-wall if light</strong> (Inspect cross-section)</>
    },
    'zh-HK': {
      callout1: <>裝箱時若紙箱可能 <strong>較重</strong>，請使用切面為 <strong>雙層瓦楞 (兩層波浪)</strong> 的紙箱。</>,
      callout2: <>若為輕質貨物，使用切面為 <strong>單層瓦楞 (一層波浪)</strong> 的紙箱即可。</>,
      tip: "請檢查紙箱邊緣切面確認波浪為一層還是兩層。",
      c1Title: "重型貨物 → 雙層瓦楞 (兩層波浪)",
      c1Desc: <>若紙箱可能偏重（約 <strong>超過 10kg</strong>），使用切面為 <strong>兩層波浪</strong> 的紙箱。</>,
      c1ExLabel: "建議使用此類紙箱",
      c1Ex: ["蔘雞湯紙箱", "炸雞粉紙箱", "W 自有品牌紙箱"],
      c1Cap: "紅色圓圈 = 切面為兩層瓦楞波浪",
      c2Title: "輕型貨物 → 單層瓦楞 (一層波浪)",
      c2Desc: <>若為輕量物品，使用切面為 <strong>單層波浪</strong> 的紙箱即可。</>,
      c2ExLabel: "建議使用此類紙箱",
      c2Ex: ["海苔碎紙箱 (例: 海農 No.1)", "辣炒年糕(年糕條)紙箱"],
      c2Cap: "紅色圓圈 = 切面為單層瓦楞波浪",
      keyHead: "核心重點",
      keyDesc: <><strong>貨重選雙層 · 貨輕選單層</strong> (檢查邊緣切面)</>
    }
  };

  const c = texts[lang] || texts.ko;

  return (
    <>
      <div className="rule-callout">
        <p>{c.callout1}</p>
        <p className="rule-callout-next">{c.callout2}</p>
      </div>

      <div className="callout callout-tip">
        <span className="callout-icon">TIP</span>
        <div className="callout-body">
          <span className="callout-label">{t.common.tip}</span>
          <p>{c.tip}</p>
        </div>
      </div>

      <div className="box-type-grid">
        <div className="box-type-card">
          <h4>{c.c1Title}</h4>
          <p>{c.c1Desc}</p>
          <div className="box-ex">
            <span className="box-ex-label">{c.c1ExLabel}</span>
            <ul>
              {c.c1Ex.map((ex, i) => <li key={i}>{ex}</li>)}
            </ul>
          </div>
          <div className="label-frame">
            <img src="/labels/box-double-wall.png" alt="Double wall box" />
            <p className="label-cap">{c.c1Cap}</p>
          </div>
        </div>

        <div className="box-type-card">
          <h4>{c.c2Title}</h4>
          <p>{c.c2Desc}</p>
          <div className="box-ex">
            <span className="box-ex-label">{c.c2ExLabel}</span>
            <ul>
              {c.c2Ex.map((ex, i) => <li key={i}>{ex}</li>)}
            </ul>
          </div>
          <div className="label-frame">
            <img src="/labels/box-single-wall.png" alt="Single wall box" />
            <p className="label-cap">{c.c2Cap}</p>
          </div>
        </div>
      </div>

      <div className="callout callout-key">
        <span className="callout-icon">✓</span>
        <div className="callout-body">
          <span className="callout-label">{c.keyHead}</span>
          <p>{c.keyDesc}</p>
        </div>
      </div>
    </>
  );
}

// ==================== Rule 06: Labels — Fragile & HEAVY ====================
function Rule06({ lang, t }) {
  const texts = {
    ko: {
      callout: "박스에 담은 뒤, 필요한 라벨을 붙입니다.",
      c1Title: "주의 (FRAGILE)",
      c1Desc: <>단무지, 마요네즈, 깐메추리알, 케찹팩 등 터질 수 있는 물품은 비닐로 감싼 뒤 <strong>주의</strong> 라벨을 붙입니다.</>,
      c2Title: "HEAVY",
      c2Desc: <>패킹 후 박스가 무거우면 <strong>HEAVY</strong> 라벨을 붙입니다. (대략 <strong>10kg 초과</strong>)</>,
      keyHead: "여기까지 핵심",
      k1: "깨지기 쉬운 것 → 비닐 + 주의 라벨",
      k2: "10kg 초과 → HEAVY 라벨"
    },
    en: {
      callout: "After packaging into the box, affix the required warning labels.",
      c1Title: "Caution (FRAGILE)",
      c1Desc: <>Items susceptible to bursting like pickled radish, mayonnaise, peeled quail eggs, ketchup pouches must be wrapped in plastic then affixed with a <strong>FRAGILE</strong> label.</>,
      c2Title: "HEAVY",
      c2Desc: <>If the box is heavy after packing, affix a <strong>HEAVY</strong> label (approx. <strong>over 10kg</strong>).</>,
      keyHead: "Key Takeaway",
      k1: "Burst-prone / fragile items → Plastic wrap + FRAGILE label",
      k2: "Over 10kg → HEAVY label"
    },
    'zh-HK': {
      callout: "裝箱打包後，請張貼相應的標籤。",
      c1Title: "注意 (FRAGILE / 易碎)",
      c1Desc: <>醃黃蘿蔔、蛋黃醬、去殼鵪鶉蛋、番茄醬等易破裂產品，請先以塑膠袋包覆後張貼 <strong>注意 (FRAGILE)</strong> 標籤。</>,
      c2Title: "HEAVY (重物)",
      c2Desc: <>裝箱後紙箱若偏重，請張貼 <strong>HEAVY</strong> 標籤（約 <strong>超過 10kg</strong>）。</>,
      keyHead: "核心重點",
      k1: "易破裂物品 → 塑膠包覆 + 注意標籤",
      k2: "超過 10kg → HEAVY 標籤"
    }
  };

  const c = texts[lang] || texts.ko;

  return (
    <>
      <div className="rule-callout">
        <p>{c.callout}</p>
      </div>

      <div className="label-duo">
        <div className="label-duo-card">
          <h4>{c.c1Title}</h4>
          <p>{c.c1Desc}</p>
          <div className="label-frame">
            <img src="/labels/caution.png" alt="Caution FRAGILE label" />
          </div>
        </div>

        <div className="label-duo-card">
          <h4>{c.c2Title}</h4>
          <p>{c.c2Desc}</p>
          <div className="label-frame">
            <img src="/labels/heavy.png" alt="HEAVY label" />
          </div>
        </div>
      </div>

      <div className="callout callout-key">
        <span className="callout-icon">✓</span>
        <div className="callout-body">
          <span className="callout-label">{c.keyHead}</span>
          <ul>
            <li>{c.k1}</li>
            <li>{c.k2}</li>
          </ul>
        </div>
      </div>
    </>
  );
}
