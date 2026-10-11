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
    sidebarWhFoot: "以總部倉庫為準 · 不含 F(冷凍) 區\n與 ECOUNT 手冊分開",
    ecountManualTitle: "ECOUNT 手冊",
    ecountManualSub: "銷貨輸入 · 發票 · 執貨單",
    sidebarEcFoot: "與倉庫手冊分開\n依截圖順序逐步操作",
    expressManualTitle: "W Express 手冊",
    expressManualSub: "空運特快到貨出庫及檢驗·打包守則",
    visualGuideTitle: "視覺導引及現場照片",
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
    sidebarFoot: "清晨空運到港標準 · 07:00 上班作業\n到貨 → 貼標籤 → 合箱打包 → 貨架整理",
    pages: [
      {
        id: "express-0",
        stepNo: "01",
        timeBadge: "07:00 上班即刻",
        title: "卡板到貨及依編號初次分類 (0~9)",
        sub: "清晨到港卡板卸貨及依運單首位數字(0~9)區域分類",
        calloutHead: "到貨及初次分類核心守則",
        calloutLead: "貨物於前一晚乘空運抵達，上班日清晨通常會有約 3 塊卡板送達倉庫門口。07:00 上班即刻整理卡板，並依紙箱運單編號首位數字(0至9)分區整理。",
        flowTitle: "作業詳細流程",
        flow: [
          {
            step: "步驟 1",
            head: "清晨卡板到貨檢查 (約 3 塊卡板)",
            desc: "確認倉庫門口抵達的空運特快卡板數量 (通常為 3 塊)，並外觀檢查保鮮膠膜封箱完整度。"
          },
          {
            step: "步驟 2",
            head: "07:00 上班卸貨與移入室內",
            desc: "使用手動油壓叉車 (叉車仔) 將卡板安全平穩地移入室內作業分類區。"
          },
          {
            step: "步驟 3",
            head: "依編號首位數 (0~9) 劃區整理",
            desc: "確認箱上運單/管理編號的首位數字 (0 至 9)，並整齊排放在指定的地面分區。"
          }
        ],
        checklistTitle: "初次分類必備檢查清單",
        checklists: [
          "割開卡板封膜時由上至下小心拆除，嚴防箱子傾倒滑落",
          "若發現破損、滲漏、潮濕等異常貨件，必須立即單獨隔開並向主管匯報",
          "保持 0~9 號分區之間通道暢通，確保下一步貼標籤時動線順暢"
        ],
        placeholder: {
          badge: "照片及作業圖面準備中",
          title: "卡板到貨現況及 0~9 號地面劃區配置範例",
          desc: "後續將更新倉庫門口卡板到貨照片及現場 0~9 分區擺放配置照片。",
          hint: "預計拍攝: 倉庫門口卡板卸貨畫面 & 地面按數字分區排列畫面"
        }
      },
      {
        id: "express-1",
        stepNo: "02",
        timeBadge: "檢驗與核對階段",
        title: "貼標籤作業及雙重核對",
        sub: "四位數編號一致 & 貨物 ID 一致，兩項同時核對後張貼標籤",
        calloutHead: "標籤雙重核對 (Double-Check) 必遵原則",
        calloutLead: "必須嚴格核對 ① 四位數編號是否一致 及 ② 貨物 ID (Cargo Tracking ID) 是否一致，兩者完全相符後方可貼上標籤。若有任何一項不符，將導致貼錯標籤及送錯貨事故。",
        flowTitle: "貼標籤操作步驟",
        flow: [
          {
            step: "核對 1",
            head: "四位數編號核對",
            desc: "確認已列印的標籤貼紙上之四位數字與紙箱運單上的四位數字完全相符。"
          },
          {
            step: "核對 2",
            head: "貨物 ID (Cargo ID) 交叉校對",
            desc: "將系統內的貨物 ID 與實物箱上的條形碼/ID 編號相互對照，再次確認為同一貨件。"
          },
          {
            step: "張貼",
            head: "指定位置端正張貼",
            desc: "兩項均確認相符後，將標籤平整黏貼於箱頂或側面指定位置，切勿遮擋原有條形碼。"
          }
        ],
        checklistTitle: "貼標籤注意事項",
        checklists: [
          "由於同批次數字容易混淆，必須仔細核對至最後一位數字",
          "若貨物 ID 不符，嚴禁張貼標籤，應立即移至暫存待查區",
          "用手掌撫平標籤，確保平整服貼，無翹起或皺摺"
        ],
        placeholder: {
          badge: "照片及標籤範例準備中",
          title: "四位數編號與貨物 ID 核對畫面及標籤標準位置範例",
          desc: "後續將更新實際運單標籤與貨物 ID 對照照片及標準張貼位置指南。",
          hint: "預計拍攝: 運單四位數字特寫畫面 & 貨物 ID 條碼比對特寫"
        }
      },
      {
        id: "express-2",
        stepNo: "03",
        timeBadge: "出庫打包階段",
        title: "當日送貨合箱打包作業",
        sub: "篩選當日派送訂單，同一收件人多箱安全合箱綑紮打包",
        calloutHead: "當日出庫合箱打包守則",
        calloutLead: "從出庫名單中篩選今日即將派送之貨件，針對同一客戶/地址之多個紙箱進行安全合箱 (綑紮綑綁及加固封箱膠帶) 作業。",
        flowTitle: "合箱打包流程",
        flow: [
          {
            step: "篩選",
            head: "挑選當日派送貨件",
            desc: "從已貼標籤的貨件中，核對當日出貨清單，挑選今天必須派送之紙箱。"
          },
          {
            step: "配對",
            head: "同一收件地址合箱配對",
            desc: "將屬於同一客戶之 2 個或以上紙箱歸攏集中為一組套件。"
          },
          {
            step: "打包",
            head: "封箱膠帶加固與合箱標記",
            desc: "使用打包膠帶或捆紮帶牢固固定，確保運送途中不脫落分開，並註明合箱標記。"
          }
        ],
        checklistTitle: "合箱打包檢查要點",
        checklists: [
          "嚴防合箱遺漏，核對出庫清單上的總箱數 (如 1/2, 2/2)",
          "綑紮時重箱必須置於底部，輕箱置於上方，防止壓壞",
          "將打包完成之貨件整齊移至出庫待發區，方便司機裝車"
        ],
        placeholder: {
          badge: "打包指南照片準備中",
          title: "當日合箱打包膠帶加固標準與成捆包裝完成範例",
          desc: "後續將更新實際合箱綑綁打包技巧及出庫待發排列照片。",
          hint: "預計拍攝: 多箱綑紮加固膠帶畫面 & 合箱標籤標記畫面"
        }
      },
      {
        id: "express-3",
        stepNo: "04",
        timeBadge: "倉庫存放階段",
        title: "剩餘紙箱貨架 (Rack) 整理與存放",
        sub: "非當日出庫之剩餘貨件，按指定貨架編號區域整齊存放",
        calloutHead: "未出庫剩餘貨件貨架存放守則",
        calloutLead: "當日送貨貨件全部出庫後，剩餘未出庫的紙箱須整齊搬運至倉庫貨架 (Rack) 的指定層格，按編號順序安全碼放存放。",
        flowTitle: "貨架整理流程",
        flow: [
          {
            step: "統計",
            head: "統計剩餘箱數及編號分區",
            desc: "統計當日未出庫貨件的編號段 (如 0000 系列、1000 系列等) 並按貨架區域分配。"
          },
          {
            step: "存放",
            head: "安全碼放至指定貨架格",
            desc: "將紙箱安全平穩放上指定貨架，箱面標籤必須朝外，以便通道一目了然。"
          },
          {
            step: "清理",
            head: "清空走道及確認庫存狀態",
            desc: "徹底清空地面走道雜物，按序整齊排妥，方便翌日出庫時隨時取用。"
          }
        ],
        checklistTitle: "貨架存放安全守則",
        checklists: [
          "高層貨架操作遵守梯具安全規範，重物置於下層以維持重心穩固",
          "所有箱面標籤 (編號與貨物 ID) 一律面向走道正面對齊",
          "嚴格依照編號流水順序存放，避免混淆影響次日快速出庫"
        ],
        placeholder: {
          badge: "貨架圖面及存放照片準備中",
          title: "倉庫貨架編號分區圖及紙箱碼放範例",
          desc: "後續將更新實際 W Express 專用貨架佈局圖及標準擺放完成全景照片。",
          hint: "預計拍攝: 按編號碼放的貨架正面特寫 & 整理完畢全景遠景"
        }
      }
    ]
  }
};
