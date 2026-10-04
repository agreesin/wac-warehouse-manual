export default {
  common: {
    hubKicker: "實習生手冊",
    hubTitle: "WAC 實習生手冊",
    hubSubtitle: "一站式業務入職指南",
    hubLead: "請選擇 W MART 或 W Express 的實務指南以立即開始工作。",
    unit1Tag: "Warehouse",
    unit1Title: "W MART 手冊",
    unit1Desc: "倉庫揀貨·包裝 · ECOUNT",
    unit1Cta: "開啟手冊",
    unit2Tag: "Fulfillment",
    unit2Title: "W Express 手冊",
    unit2Desc: "驗貨·存儲·出庫·退貨 · 庫存管理",
    unit2Cta: "開啟 Google Slides",
    wmartBack: "← WAC 實習生手冊",
    wmartKicker: "W MART",
    wmartTitle: "實習生 W MART 手冊",
    wmartLead: "倉庫揀貨·包裝與 ECOUNT 輸入已分開整理。請選擇所需的手冊查看。",
    wmartCardWhTitle: "倉庫手冊",
    wmartCardWhDesc: "揀貨 · 包裝 · 平面圖 · 標籤",
    wmartCardEcTitle: "ECOUNT 手冊",
    wmartCardEcDesc: "銷貨輸入 · 發票 · 裝箱清單",
    openCta: "開啟 →",
    homeBtn: "W MART 首頁",
    prevBtn: "上一頁",
    nextBtn: "下一頁",
    tocTitle: "目錄",
    tocClose: "關閉目錄",
    contents: "Contents",
    tip: "提示",
    warn: "注意",
    key: "核心重點",
    warehouseManualTitle: "倉庫手冊",
    warehouseManualSub: "揀貨·包裝守則與總部倉庫平面圖",
    sidebarWhFoot: "以總部倉庫為準 · 不含 F(冷凍) 區\n與 ECOUNT 手冊分開",
    ecountManualTitle: "ECOUNT 手冊",
    ecountManualSub: "銷貨輸入 · 發票 · 裝箱清單",
    sidebarEcFoot: "與倉庫手冊分開\n依截圖順序逐步操作",
    slidesUrl: "https://docs.google.com/presentation/d/1mSytr6-bSl01gl0j8bExCryC9Bd-9cIj/edit?usp=sharing&ouid=106832286164196570873&rtpof=true&sd=true"
  },
  warehouse: {
    chapters: {
      rules: "倉庫作業守則",
      map: "倉庫平面圖"
    },
    navItems: [
      { id: "rules", title: "倉庫作業守則", desc: "分類 · 揀貨 · 包裝 · 標籤" },
      { id: "map", title: "倉庫平面圖", desc: "整體平面圖 · 貨架照片" }
    ],
    pages: [
      { id: "rules-0", chapter: "rules", rulePage: 0, title: "倉庫作業守則", sub: "01. 裝箱單分類與揀貨順序" },
      { id: "rules-1", chapter: "rules", rulePage: 1, title: "倉庫作業守則", sub: "02. 依裝箱單揀貨與包裝" },
      { id: "rules-2", chapter: "rules", rulePage: 2, title: "倉庫作業守則", sub: "03. 藍色手推車裝載與卸載" },
      { id: "rules-3", chapter: "rules", rulePage: 3, title: "倉庫作業守則", sub: "04. 裝箱打包守則" },
      { id: "rules-4", chapter: "rules", rulePage: 4, title: "倉庫作業守則", sub: "05. 按重量挑選紙箱" },
      { id: "rules-5", chapter: "rules", rulePage: 5, title: "倉庫作業守則", sub: "06. 張貼標籤 — 易碎·HEAVY" },
      { id: "map", chapter: "map", title: "倉庫平面圖", sub: "總部倉庫 · 下方包裝區 · 左側 A / 右側 B" }
    ],
    map: {
      callout1: "此平面圖及守則中的「倉庫」是指 ECOUNT 中的 **總部倉庫(본사창고)**。",
      callout2: "下方為包裝區 · 左側為 **A 區** · 右側為 **B 區** · 中央走道",
      sec1Title: "整體平面圖",
      mapAlt: "倉庫整體平面圖 - A/B 區及包裝作業台",
      sec2Title: "貨架層數 (高度)",
      sec2Sub: "由上至下 · **1/3**(上層) → **1/2**(中層) → **1/1**(底層·棧板)",
      rackAlt: "貨架實體照片 - 上層 1/3, 中層 1/2, 底層 1/1",
      tier1: "**1/3** 上層 — 小箱子 · 輕型貨物",
      tier2: "**1/2** 中層 — 中型尺寸 · 開放式揀貨",
      tier3: "**1/1** 底層 — 地面棧板 · 大型/重型貨物",
      tip: "根據裝箱單上的位置代碼（如：A 5/6），依平面圖的區域、貨架及層數找尋即可。"
    }
  },
  ecount: [
    {
      id: "sales-entry-basics",
      title: "銷貨輸入 — 基礎輸入",
      sub: "選單導覽 · 客戶 · 負責人 · 倉庫 · 備註 · 品目",
      intro: [
        "確認訂單品項後，至 **庫存 I → 銷貨 → 銷貨輸入** 進行輸入。",
        "請依照下方編號順序操作。"
      ],
      steps: [
        {
          no: "01",
          title: "開啟銷貨輸入",
          body: [
            "收到訂單後，在 ECOUNT 中開啟銷貨輸入。",
            "路徑：**庫存 I → 銷貨管理 → 銷貨 → 銷貨輸入**",
            "日期通常保留為 **今日**。"
          ],
          img: "/ecount/01-sales-entry.png?v=2",
          imgCap: "銷貨輸入畫面 (Wmart)"
        },
        {
          no: "02",
          title: "搜尋客戶",
          body: [
            "在客戶欄位中僅需搜尋店名的 **部分關鍵字**。",
            "例如：旺角 Outdark → 僅需輸入「**Outdark**」。",
            "若出現旺角、尖沙咀等多家分店，請選擇符合 **下單分店** 的資料行。"
          ],
          tip: "無需輸入完整全稱，輸入核心關鍵字即可。",
          img: "/ecount/02-customer-search.png?v=2",
          imgCap: "搜尋客戶 — 搜尋「Outdark」範例"
        },
        {
          no: "03",
          title: "負責人(職員) — Online",
          body: [
            "在負責人(職員搜尋)欄位中，實習生請選擇 **Online(온라인)**。",
            "代碼範例：**00005 · 온라인**"
          ],
          tip: "實習生輸入預設全部設定為 Online。",
          img: "/ecount/03-employee-search.png?v=2",
          imgCap: "職員搜尋 — Online (實習生專用)"
        },
        {
          no: "04",
          title: "出庫倉庫 — 總部倉庫",
          body: [
            "出庫倉庫請設為 **總部倉庫(본사창고)**。",
            "我們進行揀貨的地方即為總部倉庫。",
            "倉庫手冊中的平面圖(A/B/R)亦是指 **此總部倉庫**。"
          ],
          warn: "「快閃(팝업)」為辦公室桌面庫存，請勿用於揀貨。",
          tip: "於 Club / 總部倉庫 / 快閃 中 → 揀貨一律選總部倉庫",
          img: "/ecount/04-warehouse-search.png?v=2",
          imgCap: "倉庫搜尋 — 選擇總部倉庫"
        },
        {
          no: "05",
          title: "備註欄（配送用 / 倉庫用）",
          body: [
            "備註欄分為 **配送用 / 倉庫用** 兩種。",
            "這決定了誰能看到該備註資訊。"
          ],
          example: [
            { label: "備註(配送)", text: "司機及其他人可見 · 例：請於下午兩點前送達" },
            { label: "備註(倉庫)", text: "僅倉庫揀貨人員可見 · 例：確認醃黃蘿蔔狀態後再揀貨" }
          ],
          img: "/ecount/05-item-search.png?v=2",
          imgCap: "備註（配送·倉庫）輸入範例"
        },
        {
          no: "06",
          title: "輸入品目與數量",
          body: [
            "在品目代碼欄中輸入 **核心關鍵字** 即可。",
            "例如：泡菜用辣椒粉 → 搜尋「**泡菜**」 → 選擇 粗辣椒粉(泡菜用)",
            "選取後品目與單價會自動帶入，僅需填寫 **數量**。"
          ],
          tip: "無需背誦完整品名，利用關鍵字搜尋後點選即可。",
          img: "/ecount/06-item-filled.png?v=2",
          imgCap: "選取品目後僅填寫數量"
        }
      ],
      summary: [
        "開啟銷貨輸入",
        "客戶 · Online · 總部倉庫 · 備註",
        "搜尋品目後輸入數量"
      ]
    },
    {
      id: "print-invoice-packing",
      title: "發票與裝箱清單列印",
      sub: "銷貨查詢 · 全選 · 底部列印 · packing_new",
      intro: [
        "於銷貨輸入建立的單據可在 **庫存 I → 銷貨 → 銷貨查詢** 中確認。",
        "請依照下方步驟列印 **發票(Invoice)** 與 **裝箱清單(Packing List)**。"
      ],
      steps: [
        {
          no: "01",
          title: "開啟銷貨查詢",
          body: [
            "路徑：**庫存 I → 銷貨管理 → 銷貨 → 銷貨查詢**",
            "先前輸入的銷貨單據將以清單形式顯示。",
            "以今日日期為基準進行查詢即可。"
          ],
          img: "/ecount/07-sales-inquiry.png?v=3",
          imgCap: "銷貨查詢 — 今日輸入的單據清單"
        },
        {
          no: "02",
          title: "點選日期-No.旁的方框全選",
          body: [
            "點擊表格最上方 **日期-No.** 左側的核取方塊，將全選 **當前頁面**。",
            "請勿點擊表格內的橘色列印按鈕，而是點擊螢幕 **最下方的「列印」按鈕**。"
          ],
          warn: "若有 2 頁以上，必須逐頁選取。在第 1 頁全選不會選取到第 2 頁的單據。",
          tip: "早晨列印裝箱單時：選取第 1 頁 → 列印 → 切換至第 2 頁 → 再次選取 → 列印",
          img: "/ecount/08-inquiry-selected.png?v=3",
          imgCap: "日期-No. 左側核取 = 僅全選當前頁面"
        },
        {
          no: "03",
          title: "交易明細表 = 發票(Invoice)",
          body: [
            "點擊底部 **列印** 後會跳出 **交易明細表** 視窗。",
            "預設顯示的格式即為 **發票(Invoice)**（例如：Wmart基本）。"
          ],
          img: "/ecount/09-invoice.png?v=3",
          imgCap: "交易明細表 — WMART INVOICE (發票)"
        },
        {
          no: "04",
          title: "裝箱清單格式為 packing_new",
          body: [
            "在同一個交易明細表視窗左下方的格式清單中，將 **Wmart基本** 切換為 **Packing_new**。",
            "畫面即會顯示 **WMART Packing List (裝箱清單)**。",
            "隨後點擊該視窗內的 **列印** 即可輸出。"
          ],
          tip: "發票與裝箱單只需切換格式即可，無需重新開啟視窗。",
          img: "/ecount/10-template-packing.png?v=3",
          imgCap: "格式選擇 — Packing_new"
        },
        {
          no: "05",
          title: "確認裝箱清單",
          body: [
            "選擇 Packing_new 後，會切換為顯示貨架位置及商品圖片的 **裝箱單** 畫面。",
            "備註(倉庫)亦會一併顯示於此。"
          ],
          img: "/ecount/11-packing-list.png?v=3",
          imgCap: "WMART Packing List 範例"
        }
      ],
      summary: [
        "在銷貨查詢中確認今日單據",
        "勾選日期-No.(逐頁選取) → 點擊底部列印",
        "發票(Wmart基本) / 裝箱單(Packing_new)"
      ]
    }
  ]
};
