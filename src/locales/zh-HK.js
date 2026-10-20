export default {
  common: {
    hubKicker: "實習生手冊",
    hubTitle: "WAC 實習生手冊",
    hubSubtitle: "一站式業務入職指南",
    hubLead: "請選擇 W MART 或 W Express 的實務指南以立即開始工作。",
    unit1Tag: "Warehouse",
    unit1Title: "W MART 手冊",
    unit1Desc: "倉庫執貨·包裝 · ECOUNT",
    unit1Cta: "開啟手冊",
    unit2Tag: "Fulfillment",
    unit2Title: "W Express 手冊",
    unit2Desc: "清晨卡板到貨 · 貼標籤 · 合箱打包 · 貨架整理",
    unit2Cta: "開啟手冊",
    wmartBack: "← WAC 實習生手冊",
    wmartKicker: "W MART",
    wmartTitle: "實習生 W MART 手冊",
    wmartLead: "倉庫執貨·包裝與 ECOUNT 輸入已分開整理。請選擇所需的手冊查看。",
    wmartCardWhTitle: "倉庫手冊",
    wmartCardWhDesc: "執貨 · 包裝 · 平面圖 · 標籤",
    wmartCardEcTitle: "ECOUNT 手冊",
    wmartCardEcDesc: "銷貨輸入 · 發票 · 執貨單",
    openCta: "開啟 →",
    homeBtn: "WAC 首頁",
    prevBtn: "上一頁",
    nextBtn: "下一頁",
    tocTitle: "目錄",
    tocClose: "關閉目錄",
    contents: "Contents",
    tip: "提示",
    warn: "注意",
    key: "核心重點",
    warehouseManualTitle: "倉庫手冊",
    warehouseManualSub: "執貨·包裝守則與總部倉庫平面圖",
    warehouseSidebarFoot: "以總部倉庫為準 · 不含 F(冷凍) 區\n與 ECOUNT 手冊分開",
    sidebarWhFoot: "以總部倉庫為準 · 不含 F(冷凍) 區\n與 ECOUNT 手冊分開",
    ecountManualTitle: "ECOUNT 手冊",
    ecountManualSub: "銷貨輸入 · 發票 · 執貨單",
    ecountSidebarFoot: "與倉庫手冊分開\n依截圖順序逐步操作",
    sidebarEcFoot: "與倉庫手冊分開\n依截圖順序逐步操作",
    expressManualTitle: "W Express 手冊",
    expressManualSub: "空運特快到貨出庫及檢驗·打包守則",
    visualGuideTitle: "視覺導引及現場照片",
    zoomIn: "🔍 點擊放大",
    slidesUrl: "https://docs.google.com/presentation/d/1mSytr6-bSl01gl0j8bExCryC9Bd-9cIj/edit?usp=sharing&ouid=106832286164196570873&rtpof=true&sd=true"
  },
  warehouse: {
    chapters: {
      rules: "倉庫作業守則",
      map: "倉庫平面圖"
    },
    navItems: [
      { id: "rules", title: "倉庫作業守則", desc: "分類 · 執貨 · 包裝 · 標籤" },
      { id: "map", title: "倉庫平面圖", desc: "整體平面圖 · 貨架照片" }
    ],
    pages: [
      { id: "rules-0", chapter: "rules", rulePage: 0, title: "倉庫作業守則", sub: "01. 執貨單分類與執貨順序" },
      { id: "rules-1", chapter: "rules", rulePage: 1, title: "倉庫作業守則", sub: "02. 依執貨單執貨與包裝" },
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
      tier2: "**1/2** 中層 — 中型尺寸 · 開放式執貨",
      tier3: "**1/1** 底層 — 地面棧板 · 大型/重型貨物",
      tip: "根據執貨單上的位置代碼（如：A 5/6），依平面圖的區域、貨架及層數找尋即可。"
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
            "若出現旺角、尖沙咀等多家分店，請選擇符合 **下單分店** 的資料行。",
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
            "我們進行執貨的地方即為總部倉庫。",
            "倉庫手冊中的平面圖(A/B/R)亦是指 **此總部倉庫**。"
          ],
          warn: "「快閃(팝업)」為辦公室桌面庫存，請勿用於執貨。",
          tip: "於 Club / 總部倉庫 / 快閃 中 → 執貨一律選總部倉庫",
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
            { label: "備註(倉庫)", text: "僅倉庫執貨人員可見 · 例：確認醃黃蘿蔔狀態後再執貨" }
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
      title: "發票與執貨單列印",
      sub: "銷貨查詢 · 全選 · 底部列印 · packing_new",
      intro: [
        "於銷貨輸入建立的單據可在 **庫存 I → 銷貨 → 銷貨查詢** 中確認。",
        "請依照下方步驟列印 **發票(Invoice)** 與 **執貨單(Packing List)**。"
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
          tip: "早晨列印執貨單時：選取第 1 頁 → 列印 → 切換至第 2 頁 → 再次選取 → 列印",
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
          title: "執貨單格式為 packing_new",
          body: [
            "在同一個交易明細表視窗左下方的格式清單中，將 **Wmart基本** 切換為 **Packing_new**。",
            "畫面即會顯示 **WMART Packing List (執貨單)**。",
            "隨後點擊該視窗內的 **列印** 即可輸出。"
          ],
          tip: "發票與執貨單只需切換格式即可，無需重新開啟視窗。",
          img: "/ecount/10-template-packing.png?v=3",
          imgCap: "格式選擇 — Packing_new"
        },
        {
          no: "05",
          title: "確認執貨單",
          body: [
            "選擇 Packing_new 後，會切換為顯示貨架位置及商品圖片的 **執貨單** 畫面。",
            "備註(倉庫)亦會一併顯示於此。"
          ],
          img: "/ecount/11-packing-list.png?v=3",
          imgCap: "WMART Packing List 範例"
        }
      ],
      summary: [
        "在銷貨查詢中確認今日單據",
        "勾選日期-No.(逐頁選取) → 點擊底部列印",
        "發票(Wmart基本) / 執貨單(Packing_new)"
      ]
    }
  ],
  express: {
    title: "W Express 手冊",
    sub: "空運特快到貨出庫及檢驗·打包守則",
    pages: [
      {
        id: "express-0",
        stepNo: "00",
        timeBadge: "W-EXPRESS 概覽",
        title: "W-EXPRESS 業務介紹",
        sub: "航空特快核心業務流程",
        calloutHead: "W-EXPRESS 業務手冊指引",
        calloutLead: "歡迎參閱 W-EXPRESS 業務手冊。本手冊旨在讓您掌握整體作業流程，投入工作前現場負責人亦會進行培訓，請無需過分擔憂。本手冊有助於快速吸收培訓內容，培訓後遇有疑問時可隨時查閱參考。",
        stepsWithPhotos: [
          {
            stepNo: "1",
            title: "韓國 → 香港航空特快及清晨 07:00 抵達倉庫",
            desc: "前晚由韓國仁川出發的貨物於凌晨抵港，並於清晨 07:00 擺放於我們倉庫門口。",
            paragraphs: [
              "W-EXPRESS 專營韓國至香港航空特快業務。",
              "前一晚 22:00 由仁川起飛的貨物於翌日凌晨 01:00 抵達香港，該批貨物會於清晨送達我們倉庫。",
              "07:00 上班時，便會看到打板包膠（纏繞膜封裝）的貨物已整齊擺放在倉庫大門前。"
            ],
            photos: [
              {
                src: "/express/02-pallet-arrival.jpg",
                title: "01. 今晨到港貨物 (倉庫門口實物)",
                desc: "今晨到港貨物（如圖整齊打板並以塑膠膜包裝擺放於倉庫門前）"
              }
            ]
          },
          {
            stepNo: "2",
            title: "將卡板移入倉庫室內",
            desc: "利用油壓拖板車（唧車）將倉庫門前的卡板安全移入倉庫室內作業區。",
            paragraphs: [
              "07:00 上班確認門前卡板貨物後，員工會操作搬運工具（電動或手動唧車）將卡板拉入倉庫室內。",
              "安全移入室內作業區後，割開拆除塑膠纏繞膜，正式開展到貨分類作業。"
            ],
            photos: [
              {
                src: "/express/01-pallet-jack.jpg",
                title: "02. 唧車移入卡板實物",
                desc: "員工操作拖板車（唧車）將門前卡板安全拉入倉庫內的情景"
              }
            ]
          },
          {
            stepNo: "3",
            title: "我們的核心工作（大致分為兩大類）",
            desc: "我們專注處理入庫後的貨物。整體工作大致可歸納為兩大核心：",
            cargoTypes: [
              {
                tag: "核心作業 1",
                badge: "到港貨物整理",
                head: "1. 將清晨抵港的貨物整理至指定位置！",
                desc: "拆解入庫卡板，按運單地址客戶 ID（0~9號）於貨架前進行初次分類，再核對貨物 ID 貼上標籤（二次分類），最後整齊存放於指定貨架。",
                tip: "相關章節：01. 卡板到貨初次分類 ➔ 02. 貼標籤作業 ➔ 04. 剩餘貨物貨架存放"
              },
              {
                tag: "核心作業 2",
                badge: "當日派送出庫",
                head: "2. 今日需要派送的貨物進行合箱打包！",
                desc: "核對當日出庫清單，採集相關客戶所有貨物，逐件核對貨物編號（Double-check 雙重核對），兩人一組以 W CLUB 膠帶綑紮合箱並標記出庫。",
                tip: "相關章節：03. 當日送貨合箱與標記 (清單核對、W CLUB 綑紮、箱頂標記)"
              }
            ],
            paragraphs: [
              "我們的工作圍繞「清晨貨物整理上架」與「當日送貨合箱出庫」兩大主線展開。詳細步驟請參閱後續章節（01~04）。"
            ]
          }
        ],
        checklistTitle: "W-EXPRESS 基本須知事項",
        checklists: [
          "是否理解韓國仁川至香港清晨特快空運業務模式？",
          "07:00 上班時是否確認了倉庫門前的打板貨物？",
          "是否掌握使用唧車將卡板拉入倉庫作業區的流程？",
          "是否理解「清晨到貨整理」與「當日派送合箱」這兩大核心流程？"
        ]
      },
      {
        id: "express-1",
        stepNo: "01",
        timeBadge: "到貨及初次分類",
        title: "卡板到貨及貨架前 (0~9號) 初次分類",
        sub: "卡板移入 · 拆箱解包 · 運單地址欄客戶 ID 核對 · 0~9號貨架前地面擺放",
        calloutHead: "何謂初次分類作業？",
        calloutLead: "將移入倉庫內的卡板貨物拆解拆箱後，核對運單地址欄末端的客戶 ID (0~9號)，並按對應數字分派擺放至 0~9號貨架前地面通道的作業。",
        stepsWithPhotos: [
          {
            stepNo: "1",
            title: "卡板移入室內及貨物開箱（合箱 · 編織袋）",
            desc: "使用油壓叉車（電動或手動叉車仔）將倉庫門口的卡板移入室內作業區，並剝除卡板纏繞膜（保鮮膠膜）。",
            paragraphs: [
              "卡板上的貨物主要以 3 種形態到貨：獨立散箱、合箱（大紙箱內含多個小包裹）、編織袋（大麻袋）。",
              "合箱與編織袋只需用美工刀輕輕劃開膠紙或袋子外層，取出內部包裹時即可立即展開分類作業。"
            ],
            notice: {
              type: "warning",
              icon: "⚠️",
              title: "使用美工刀安全警示（嚴防割傷內部商品）",
              text: "使用美工刀拆開合箱或編織袋時，若刀片刺入過深，極易割損內部商品（膠袋包裝衣物、食品、手袋等），務必僅輕劃表面膠紙或袋子外層。"
            },
            photos: [
              {
                src: "/express/01-pallet-jack.jpg",
                title: "01. 卡板移入室內",
                desc: "使用油壓叉車移至室內作業區並拆除纏繞膜"
              },
              {
                src: "/express/05-consol-box.jpg",
                title: "02. 合箱大紙箱",
                desc: "大型紙箱內含多個小包裹（以美工刀輕劃膠紙拆箱）"
              },
              {
                src: "/express/04-midae-inside.jpg",
                title: "03. 編織袋（麻袋）",
                desc: "大麻袋內裝多件貨物（輕劃袋子外層開口）"
              }
            ]
          },
          {
            stepNo: "2",
            title: "實物運單分類指引（食品箱分流 & 客戶 ID 貨架分配）",
            desc: "拆開貨物後即刻展開分類作業。凡封有藍色膠紙之食品箱一律移至中央工作台，一般貨物則核對快遞運單地址欄末端之客戶 ID 分派至 0~9號貨架前地面。",
            foodBoxCard: {
              title: "食品箱（藍色膠紙，F代碼）➔ 移至 [中央工作台]",
              desc: "在分類過程中，凡發現封有「藍色膠紙」的紙箱（無論是一般瓦楞紙箱還是發泡膠箱皆屬此類），切勿放在貨架前，請優先放置於 [中央工作台]。",
              bullets: [
                "封有藍色膠紙之箱件 = 食品貨物（貨物代碼以 F 開頭）",
                "移放至 [中央工作台]，而非 0~9號貨架前",
                "食品（F箱）主要由其他專門人員負責後續處理，我們專注於一般產品分類"
              ],
              photo: {
                src: "/express/01-food-box.jpg",
                title: "食品箱實物（藍色膠紙）",
                desc: "封有藍色膠紙之箱件（F代碼）➔ 中央工作台"
              }
            },
            paragraphs: [
              "一般貨物運單地址欄客戶 ID 核對：將食品箱分流至中央工作台後，一般貨物請查找快遞運單地址欄末端的「客戶 ID」，並分派至 0~9號貨架前地面。",
              "🔍 於運單地址欄中尋找客戶 ID (W01*-****)：在快遞運單收件地址最末端，印有「W01*-****」格式之客戶 ID。"
            ],
            addressCard: {
              title: "客戶填寫到貨地址標準格式",
              address: "서울시 강서구 하늘길 210 4번게이트 , W01*-****",
              note: "地址末端附加的 W01*-**** 編號即為分類基準之客戶 ID。"
            },
            ruleParagraphs: [
              "🎯 分類標準與實物範例：以客戶 ID 後四位數字中的 [第一位數字] 為基準，擺放至 0~9號貨架前。參考下方實物照片中的運單地址顯示為「W010-0161」，後四位 (0161) 的首位數字為「0」，因此直接放置於 [ 0號貨架前 ] 地面即可。"
            ],
            guidePhoto: {
              src: "/express/06-customer-id-guide.jpg",
              title: "實物運單比對指引（點擊放大）",
              desc: "請核對快遞運單地址欄末端的客戶 ID (W01*-****) 擺放至貨架前，切勿按外箱上的 QR 標籤（貨物 ID）編號分類（範例：W010-0161 ➔ 0號貨架）"
            },
            notice: {
              type: "warning",
              icon: "⛔",
              title: "切勿誤認 QR 標籤（貨物 ID）編號",
              text: "貨物外箱上張貼的 QR 標籤編號僅為倉庫內部管理專用的「貨物 ID」，初次分類時請完全忽略！現場作業中最常發生的錯誤，就是誤看 QR 標籤上的數字並將貨物錯送至對應貨架。初次分類時切勿查看 QR 標籤，務必核對快遞運單地址欄末端的「客戶 ID (W01*-****)」並分派至相應貨架前。"
            },
            exceptionCard: {
              title: "集中於打包膠紙箱前方的例外貨物",
              desc: "分類作業中若發現符合下列條件之貨物，請勿放在 0~9號貨架前，請單獨集中擺放於「打包膠紙箱前方」。",
              items: [
                "包含「0001-WB...」等英文字母之長代碼非標準格式（例：W011-0001-WB167689）",
                "運單地址欄無 W01*-**** 客戶 ID 之貨物",
                "運單損壞或編號模糊難以辨識之貨物"
              ],
              note: "集中放置後，負責主管將會進行核對並作後續專項處理。",
              photos: [
                {
                  src: "/express/01-exception-english-prefix.jpg",
                  title: "例外貨物實物 ①：0001-WB 等包含英文之非標準長代碼",
                  desc: "運單地址末端非標準客戶 ID，而為「0001-WB...」格式之貨物（實物範例：W011-0001-WB167689）\n💡 現場辨識要領：可確認是否包含「0001」，或觀察是否含有「WB」等英文字母導致代碼長度明顯長於一般運單 ➔ 集中放於指定區域"
                },
                {
                  src: "/express/01-exception-no-id.jpg",
                  title: "例外貨物實物 ②：缺少客戶 ID 之貨物",
                  desc: "運單地址欄完全缺少客戶 ID（切勿依下方 QR 標籤盲目分類）➔ 集中放於指定區域"
                }
              ]
            },
            photos: [
              {
                src: "/express/01-rack-floor-sorting.jpg",
                title: "0~9號貨架前地面排整現場（點擊放大）",
                desc: "工作人員按編號段將一般貨物分類擺放於 0~9號貨架前地面通道之現場（例外件集中於指定區域）"
              }
            ]
          }
        ],
        checklistTitle: "初次分類檢查清單",
        checklists: [
          "❌ 是否避免按外箱上的 QR 標籤（貨物 ID）編號分類，並 ⭕ 確實核對了快遞運單地址欄末端的「W01*-****」客戶 ID？",
          "是否依客戶 ID 後四位中的首位數字，整齊擺放至 0~9號貨架前地面？（例如: W010-0161 ➔ 0號貨架）",
          "🧊 封有藍色膠紙的食品箱（一般紙箱/發泡膠箱，F代碼）是否已移放至「中央工作台」而非貨架前？",
          "包含 0001-WB 等長代碼或缺少客戶 ID 難以辨認的例外貨物，是否已單獨集中在「指定區域」？",
          "使用美工刀拆開編織袋及合箱時，是否留意避免割損內部商品？"
        ]
      },
      {
        id: "express-2",
        stepNo: "02",
        timeBadge: "貼標與二次分貨",
        title: "標籤貼紙張貼及二次分類",
        sub: "客戶與貨物 ID 雙重核對，隔離當日出庫貨件",
        calloutHead: "標籤張貼及二次分類核心摘要",
        calloutLead: "必須同時比對 (1) 客戶 ID 是否相符 及 (2) 貨物 ID 是否相符 後方可貼上標籤，\n張貼同時務必：① 將同一客戶 ID 之貨件歸攏集中 ② 有記號貨件移至外側通道。",
        stepsWithPhotos: [
          {
            stepNo: "1",
            title: "貨架專責分工及準備標籤貼紙",
            desc: "作業員各自專責 0~9 號貨架之一，負責貨架前地面的貨物，\n並準備按客戶 ID 排序之標籤貼紙。",
            paragraphs: [
              "專責貨架分配：作業員各自認領負責 0~9 號其中一個貨架前地面的貨物（例如：作業員 A 負責 0 號貨架，作業員 B 負責 1 號貨架等）。",
              "標籤貼紙排列順序：印製好的標籤貼紙已依［客戶 ID 順序］排列，每張貼紙均包含客戶 ID 與貨物 ID 資料。"
            ],
            photos: [
              {
                src: "/express/02-label-stickers-prepared.jpg",
                title: "按客戶 ID 排序之標籤貼紙實物",
                desc: "當日作業用標籤貼紙實物整頁"
              },
              {
                src: "/express/02-labeling-overview.jpg",
                title: "各貨架貼標作業現場全景",
                desc: "作業員各自專責一組貨架，檢查貨物並張貼標籤之全景"
              }
            ]
          },
          {
            stepNo: "2",
            title: "同時比對客戶 ID 與貨物 ID 完全相符後貼標",
            desc: "確認紙箱運單上的客戶 ID 與外箱上的貨物代碼，\n找出兩項資料完全相符的標籤貼紙進行張貼。",
            notice: {
              type: "warning",
              icon: "⚠️",
              title: "貨物 ID 核對至關重要",
              text: "最關鍵的步驟是核對貨物 ID！\n同一位客戶若訂購多件商品，一個客戶 ID 會對應多個貨物編號。\n這些貨物的客戶 ID 相同但貨物 ID 各異，切勿僅看客戶 ID 便張貼標籤。"
            },
            paragraphs: [
              "第 1 步 - 確認客戶 ID：查看快遞運單地址末端的客戶 ID（W01*-****），並在標籤紙上找到該客戶編號段落。",
              "第 2 步 - 交叉核對貨物 ID 並張貼：在同一客戶的標籤貼紙中，找到與箱面外包裝已印有之貨物代碼（CTN 編號）完全相符的貼紙，平整貼於箱面空白處。"
            ],
            photos: [
              {
                src: "/express/02-label-before.jpg",
                title: "貼標前：客戶 ID (W010-4777) 與貨物 ID (W1014-5038) 雙重核對",
                desc: "• 黃色標記：確認為同一客戶 ID (W010-4777)。\n• 紅色標記：同一客戶項下不同貨件之 CTN 編號（貨物代碼）各自不同。\n➔ 找出與外包裝 QR 標籤貨物 ID (W1014-5038) 完全相符的中間貼紙貼上。"
              },
              {
                src: "/express/02-label-after.jpg",
                title: "貼標後：貨物 ID 相符標籤貼紙完成黏貼",
                desc: "客戶 ID 與 CTN 編號完全吻合之標籤平整黏貼於包裝空白處實況"
              }
            ]
          },
          {
            stepNo: "3",
            title: "［二次分類 ①］同一客戶 ID 貨件歸攏集中",
            desc: "張貼標籤的同時，\n將屬於相同客戶 ID 之所有紙箱與包裹集中排列於同一處。",
            notice: {
              type: "info",
              icon: "💡",
              title: "為何需要將同一客戶 ID 歸攏？",
              text: "同一客戶有多件貨物時先行集中，後續進行併箱打包或整理上架時便無需四處搜尋，大幅提升作業效率。"
            },
            photos: [
              {
                src: "/express/02-customer-id-grouping.jpg",
                title: "同一客戶 ID 集中整理實況",
                desc: "一邊張貼標籤、一邊將相同客戶 ID 貨物集中放置之現場實景"
              }
            ]
          },
          {
            stepNo: "4",
            title: "［二次分類 ②］有記號貨物（當日派送·自取）單獨挑出",
            desc: "標籤上有劃記符號之紙箱為今日即將出庫之貨件，\n切勿推入貨架側，應單獨移至「走道外側」。",
            notice: {
              type: "warning",
              icon: "🚨",
              title: "擺放位置核心口訣：有記號放［通道側］，無記號放［貨架側］！",
              text: "• 有記號（斜線 / 或 叉號 X）➔ 今日立即出庫！擺放於通道側（外側），方便後續併箱提取。\n• 無記號（空白）➔ 一般貨物！稍後上架儲存，整齊推入貨架側（內側）。"
            },
            cargoTypes: [
              {
                tag: "當日派送",
                badge: "斜線記號 ( / , — )",
                head: "今日立即送貨出庫之貨物",
                desc: "標籤貼紙上劃有斜線或橫線記號之貨物。\n今日即刻出庫。",
                tip: "擺放位置：\n為方便下一步併箱打包時隨時取出，集中移至［通道側（外側）］。",
                photo: {
                  src: "/express/02-mark-delivery.jpg",
                  title: "斜線記號（當日派送貨物）",
                  desc: "標籤有斜線記號 ➔ 今日即派（移至外側通道方便打包取用）"
                }
              },
              {
                tag: "當日自取",
                badge: "叉號記號 (X)",
                head: "今日客戶自取提貨之貨物",
                desc: "標籤貼紙上劃有 X 記號之產品。\n今日自取提貨。",
                tip: "擺放位置：\n今日自取出庫，單獨集中放置於［通道側（外側）］。",
                photo: {
                  src: "/express/02-mark-pickup.jpg",
                  title: "X 記號（當日自取貨物）",
                  desc: "標籤有 X 記號 ➔ 今日自取提貨（放置於通道外側）"
                }
              },
              {
                tag: "一般貨物",
                badge: "無標記 (空白)",
                head: "打包後整理至貨架存放之貨物",
                desc: "標籤貼紙上無任何劃記之一般貨物。\n待併箱完成後整理上架儲存。",
                tip: "擺放位置：\n稍後需整理上架，整齊排列於［貨架側（內側）］。",
                photo: {
                  src: "/express/02-mark-general.jpg",
                  title: "無標記（一般貨物）",
                  desc: "標籤無任何記號 ➔ 待併箱結束後上架（排於貨架內側）"
                }
              }
            ]
          }
        ],
        checklistTitle: "貼標及二次分貨檢查清單",
        checklists: [
          "⚠️ 同一客戶之貨物代碼均不相同，是否已核對運單客戶 ID 與紙箱貨物 ID 雙重吻合後方黏貼？",
          "📦 ［分類 ①］是否已將相同客戶 ID 之紙箱集中放置，以便後續併箱與上架？",
          "🚀 ［分類 ②］劃有斜線 (/) 或 X 記號之當日出庫紙箱，是否已單獨移至走道外側？"
        ]
      },
      {
        id: "express-3",
        stepNo: "03",
        timeBadge: "當日送貨併箱",
        title: "當日送貨件併箱打包作業",
        sub: "派送清單貨號核對、合箱打包與箱頂標記",
        calloutHead: "當日出庫併箱打包核心摘要",
        calloutLead: "現場作業員依派送清單取貨至工作台，\n由核對員與清單進行貨號雙重核對（Double-Check）後，\n採 2人1組（核對員 ↔ 打包員）即時溝通進行膠帶加固綑紮及箱頂書寫標記。",
        stepsWithPhotos: [
          {
            stepNo: "1",
            title: "依客戶 ID 取貨至工作台（現場作業員）",
            desc: "現場作業員查看派送清單，\n從走道外側當日派送區及貨架上將各客戶貨物提取送至工作台。",
            photos: [
              {
                src: "/express/03-packing-table-02.jpg",
                title: "按客戶 ID 取貨送達工作台",
                desc: "現場作業員對照派送清單收集各客戶貨件並搬送至打包工作台實況"
              }
            ]
          },
          {
            stepNo: "2",
            title: "清單貨號一對一雙重核對（Double-Check）",
            desc: "核對員將搬來貨物之貨物編號（CTN）與派送清單逐一對照，\n確認完全一致方可進行下一步打包。",
            photos: [
              {
                src: "/express/03-packing-table-01.jpg",
                title: "核對貨物與派送清單貨號吻合度",
                desc: "在打包工作台上仔細對照實物貨號與派送清單進行雙重核對"
              }
            ]
          },
          {
            stepNo: "3",
            title: "於派送清單打勾確認並標註總件數",
            desc: "確認無誤之貨物於清單貨號旁打勾確認，\n併箱打包完成後記錄最終整捆組數。",
            photos: [
              {
                src: "/express/03-delivery-list.jpg",
                title: "當日集中派送清單原單（核對前）",
                desc: "列有客戶 ID、入庫日期、貨物 ID、收件人姓名及總件數之原始派送清單"
              },
              {
                src: "/express/03-delivery-list-checked.jpg",
                title: "核對打勾及併箱件數標註完畢清單（核對後）",
                desc: "完成貨號勾選確認並書寫最終包裝組數之實物清單"
              }
            ]
          },
          {
            stepNo: "4",
            title: "2人1組交叉封箱膠帶綑紮及箱頂標記",
            desc: "核對員口頭報出件數與客戶資訊，\n打包員使用厚封箱膠帶牢固綑紮，並於箱頂清楚書寫收件資訊。",
            photos: [
              {
                src: "/express/03-taping-method.jpg",
                title: "十字加固封箱膠帶綑紮標準",
                desc: "作業員使用 OPP 膠帶將多件紙箱緊密綑紮為單一包裹實況"
              },
              {
                src: "/express/03-marking-example.jpg",
                title: "箱頂派送資訊標記範例",
                desc: "箱頂端正清楚書寫之客戶 ID、姓名及件數分數標記（如 1/1, 1/2, 2/2）"
              }
            ]
          },
          {
            stepNo: "5",
            title: "完成件移交 Express 專責人員",
            desc: "打包及標記全部完成後，\n將核對無誤之派送清單直接移交給 Express 專責人員。",
            notice: {
              type: "info",
              icon: "✅",
              title: "交接作業注意事項",
              text: "將清單與貨件直接移交 Express 負責人員。\n（若有缺件未能齊備之訂單，立即與專責人員協調確認後續處理。）"
            },
            photos: [
              {
                src: "/express/03-delivery-driver-handover.jpg",
                title: "交接完成清單給 Express 專責人員",
                desc: "最終核對完成後將派送清單直接轉交 Express 人員之交接實景"
              }
            ]
          }
        ],
        checklistTitle: "併箱打包作業檢查清單",
        checklists: [
          "綑紮前是否已將紙箱 CTN 號與派送清單逐一雙重核對？",
          "清單上是否確實打勾記錄並註明最終整捆總數？",
          "是否已使用十字膠帶加固綑紮，確保運送途中絕不鬆脫？",
          "箱頂是否端正清楚註明客戶 ID、客戶名稱及組數標記（如 1/2, 2/2）？",
          "完成清單是否已當面移交給 Express 專責人員？"
        ]
      },
      {
        id: "express-4",
        stepNo: "04",
        timeBadge: "倉庫存放階段",
        title: "剩餘紙箱貨架 (Rack) 整理與存放",
        sub: "非當日出庫之剩餘貨件，按指定貨架編號區域整齊存放",
        calloutHead: "未出庫剩餘貨件貨架存放守則",
        calloutLead: "當日送貨貨件全部出庫後，剩餘紙箱外表端正書寫大字編號，\n按編號區間整齊碼放於指定貨架層格安全儲存。",
        stepsWithPhotos: [
          {
            stepNo: "1",
            title: "貨架存放守則與安全碼放實物範例",
            desc: "當日送貨出庫完成後，將剩餘紙箱端正書寫大字編號，\n按編號順序整齊碼放於指定貨架層格。",
            guidePhoto: {
              src: "/express/04-rack-organized.jpg",
              title: "貨架整理及紙箱碼放完成實況（標準範例）",
              desc: "箱面大字編號朝向走道整齊擺放，超小型貨件安全收納於藍色收納箱之實景",
              isPortrait: true,
              fit: "contain"
            },
            notices: [
              {
                type: "warning",
                icon: "🚨",
                title: "客戶 ID 區分警示：後四位相同，前綴 (010 vs 011) 亦屬完全不同客戶！",
                text: "整理貨架時，即便運單後四位數字相同，前綴 010 與 011 代表完全不同之客戶！\n（例如：W010-1234 與 W011-1234 為不同客戶之貨物）\n切勿單憑後四位數字誤認為同一客戶而混雜碼放，必須嚴格區分 010 與 011 分開整理。"
              },
              {
                type: "blue",
                icon: "💡",
                title: "貨架上「藍色收納盒（箱）」使用指南",
                text: "專供存放極易被風吹走或自層板縫隙掉落遺失之超小型貨件（塑膠快遞袋、小型配件等）。\n（收納箱外側亦書寫編號區段管理，方便翌日出庫時隨時定位取件。）"
              }
            ],
            bullets: [
              "🏷️ 箱面編號粗筆大字標記 & 正面朝外對齊：\n方便翌日出庫人員自通道一目了然，使用粗油性筆清楚寫下大字編號，並將號碼端正朝向通道正面排列。",
              "⚖️ 貨架存放安全規範（維持重心穩定）：\n重型大箱一律碼放於最底層貨架以降低重心防止傾倒。"
            ]
          },
          {
            stepNo: "2",
            title: "倉庫整理最終全景複查（收工狀態）",
            desc: "當日送貨與自取全部出庫、剩餘貨物安全上架且地面走道清掃完畢之倉庫整體全景。",
            guidePhoto: {
              src: "/express/04-warehouse-completed.jpg",
              title: "倉庫整理最終完成全景（日終收工）",
              desc: "送貨出庫全部完成、剩餘貨件上架整齊、走道徹底清掃完畢之倉庫全景"
            },
            outroParagraphs: [
              "✨ 日終完成狀態確認：\n地面走道完全無障礙物或殘留貨件，確保翌日清晨貨物進場及唧車（油壓拖板車）通行暢通無阻，可立即投入作業。"
            ]
          }
        ],
        checklistTitle: "貨架整理及收工檢查清單",
        checklists: [
          "⚖️ ［安全碼放］確認貨架重心穩固，重物置於最底層以防傾倒？",
          "🚨 ［客戶 ID 區分］後四位相同但確認前綴 010 與 011 為不同客戶並分開整理？",
          "🏷️ ［編號朝外］箱面編號粗筆書寫大字且一律朝向走道端正對齊？",
          "💡 ［超小貨件］易飄落遺失之小件快遞袋是否已整齊收納於「藍色收納盒」內？",
          "🧹 ［走道清空］地面走道是否徹底清掃無雜物，確保翌晨貨物進場動線順暢？"
        ]
      }
    ]
  }
};
