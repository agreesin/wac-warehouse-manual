export default {
  common: {
    hubKicker: "Intern Manual",
    hubTitle: "WAC 인턴 메뉴얼",
    hubSubtitle: "사업별 온보딩을 한곳에서",
    hubLead: "W MART와 W Express의 실무 가이드를 선택해 바로 시작하세요.",
    unit1Tag: "Warehouse",
    unit1Title: "W MART 메뉴얼",
    unit1Desc: "창고 피킹·패킹 · ECOUNT",
    unit1Cta: "메뉴얼 열기",
    unit2Tag: "Fulfillment",
    unit2Title: "W Express 메뉴얼",
    unit2Desc: "새벽 파레트 입고 · 라벨링 · 합포장 · 랙 정리",
    unit2Cta: "메뉴얼 열기",
    wmartBack: "← WAC 인턴 메뉴얼",
    wmartKicker: "W MART",
    wmartTitle: "인턴 W MART 메뉴얼",
    wmartLead: "창고 피킹·패킹과 ECOUNT 입력을 나눠 두었습니다. 필요한 메뉴얼을 골라 보세요.",
    wmartCardWhTitle: "창고 메뉴얼",
    wmartCardWhDesc: "피킹 · 패킹 · 도면 · 라벨",
    wmartCardEcTitle: "ECOUNT 메뉴얼",
    wmartCardEcDesc: "판매입력 · 인보이스 · 패킹리스트",
    openCta: "열기 →",
    homeBtn: "WAC 홈",
    prevBtn: "이전",
    nextBtn: "다음",
    tocTitle: "목차",
    tocClose: "목차 닫기",
    contents: "Contents",
    tip: "Tip",
    warn: "주의",
    key: "여기까지 핵심",
    warehouseManualTitle: "창고 메뉴얼",
    warehouseManualSub: "피킹·패킹 수칙과 본사창고 도면",
    warehouseSidebarFoot: "본사창고 기준 · F(냉동) 구역 제외\nECOUNT와 별도 메뉴얼",
    ecountManualTitle: "ECOUNT 메뉴얼",
    ecountManualSub: "판매입력 · 인보이스 · 패킹리스트",
    ecountSidebarFoot: "창고 메뉴얼과 별도\n캡처 기준 · 순서대로 따라하기",
    expressManualTitle: "W Express 메뉴얼",
    expressManualSub: "항공 특송 입출고 및 검수·패킹 수칙",
    visualGuideTitle: "시각 가이드 및 현장 사진",
    slidesUrl: "https://docs.google.com/presentation/d/1mSytr6-bSl01gl0j8bExCryC9Bd-9cIj/edit?usp=sharing&ouid=106832286164196570873&rtpof=true&sd=true"
  },
  warehouse: {
    chapters: {
      rules: "창고 작업 수칙",
      map: "창고 도면"
    },
    navItems: [
      { id: "rules", title: "창고 작업 수칙", desc: "분류 · 피킹 · 패킹 · 라벨" },
      { id: "map", title: "창고 도면", desc: "전체 도면 · 렉 사진" }
    ],
    pages: [
      { id: "rules-0", chapter: "rules", rulePage: 0, title: "창고 작업 수칙", sub: "01. 패킹리스트 분류 · 피킹 순서" },
      { id: "rules-1", chapter: "rules", rulePage: 1, title: "창고 작업 수칙", sub: "02. 패킹리스트로 피킹 · 패킹하기" },
      { id: "rules-2", chapter: "rules", rulePage: 2, title: "창고 작업 수칙", sub: "03. 파란 손수레 쌓기 · 내리기" },
      { id: "rules-3", chapter: "rules", rulePage: 3, title: "창고 작업 수칙", sub: "04. 박스에 넣을 때 (패킹)" },
      { id: "rules-4", chapter: "rules", rulePage: 4, title: "창고 작업 수칙", sub: "05. 박스 고르기 — 무게별" },
      { id: "rules-5", chapter: "rules", rulePage: 5, title: "창고 작업 수칙", sub: "06. 라벨 붙이기 — 주의 · HEAVY" },
      { id: "map", chapter: "map", title: "창고 도면", sub: "본사창고 · 아래 패킹하는 곳 · 왼 A / 오 B" }
    ],
    map: {
      callout1: "이 도면·수칙의 「창고」는 ECOUNT의 **본사창고**입니다.",
      callout2: "아래가 패킹하는 곳 · 왼쪽 **A** · 오른쪽 **B** · 가운데 통로",
      sec1Title: "전체 도면",
      mapAlt: "창고 전체 도면 - A/B 구역과 패킹하는 곳",
      sec2Title: "렉 단(높이)",
      sec2Sub: "위→아래 · **1/3**(상단) → **1/2**(중단) → **1/1**(하단·팔레트)",
      rackAlt: "실제 렉 사진 - 상단 1/3, 중단 1/2, 하단 1/1",
      tier1: "**1/3** 상단 — 작은 박스 · 가벼운 짐",
      tier2: "**1/2** 중단 — 중간 크기 · 오픈픽",
      tier3: "**1/1** 하단 — 바닥 팔레트 · 큰/무거운 짐",
      tip: "패킹리스트의 위치(예: A 5/6)는 도면의 구역·렉·단을 따라가면 됩니다."
    }
  },
  ecount: [
    {
      id: "sales-entry-basics",
      title: "판매입력 — 기본 입력",
      sub: "메뉴 이동 · 거래처 · 담당자 · 창고 · 특이사항 · 품목",
      intro: [
        "주문 들어온 품목을 보고 **재고 I → 판매 → 판매입력**에서 입력합니다.",
        "아래 번호 순서대로 따라가면 됩니다."
      ],
      steps: [
        {
          no: "01",
          title: "판매입력 열기",
          body: [
            "주문이 들어오면 ECOUNT에서 판매입력을 엽니다.",
            "경로: **재고 I → 영업관리 → 판매 → 판매입력**",
            "일자는 보통 **금일(오늘)**로 둡니다."
          ],
          img: "/ecount/01-sales-entry.png?v=2",
          imgCap: "판매입력 화면 (Wmart)"
        },
        {
          no: "02",
          title: "거래처 검색",
          body: [
            "거래처 칸에서 상호 **일부**만 검색합니다.",
            "예: 몽콕 아웃닭 → 「**아웃닭**」만 쳐도 됩니다.",
            "몽콕·침사추이처럼 지점이 같이 뜨면, **주문 지점**에 맞는 줄을 고릅니다."
          ],
          tip: "풀네임을 다 칠 필요 없습니다. 핵심 단어만 쳐도 됩니다.",
          img: "/ecount/02-customer-search.png?v=2",
          imgCap: "거래처검색 — 「아웃닭」 검색 예시"
        },
        {
          no: "03",
          title: "담당자(사원) — 온라인",
          body: [
            "담당자(사원검색)에서는 인턴용 **온라인**을 고릅니다.",
            "코드 예: **00005 · 온라인**"
          ],
          tip: "인턴 입력은 기본적으로 온라인으로 맞춥니다.",
          img: "/ecount/03-employee-search.png?v=2",
          imgCap: "사원검색 — 온라인(인턴용)"
        },
        {
          no: "04",
          title: "출하창고 — 본사창고",
          body: [
            "출하창고는 **본사창고**로 둡니다.",
            "우리가 피킹하는 곳이 본사창고입니다.",
            "창고 메뉴얼의 도면(A/B/R)도 **이 본사창고**입니다."
          ],
          warn: "「팝업」은 사무실 데스크 재고입니다. 피킹용으로 쓰지 마세요.",
          tip: "클럽 / 본사창고 / 팝업 중 → 피킹은 본사창고",
          img: "/ecount/04-warehouse-search.png?v=2",
          imgCap: "창고검색 — 본사창고 선택"
        },
        {
          no: "05",
          title: "특이사항 두 칸",
          body: [
            "특이사항은 **배송용 / 창고용**이 따로 있습니다.",
            "누구에게 보이는지가 다릅니다."
          ],
          example: [
            { label: "특이사항(배송)", text: "기사님·다른 사람도 볼 수 있음 · 예: 오후 두시전까지 배송요청" },
            { label: "특이사항(창고)", text: "창고 피킹하는 사람만 · 예: 단무지상태 체크후 피킹하세요" }
          ],
          img: "/ecount/05-item-search.png?v=2",
          imgCap: "특이사항(배송·창고) 입력 예시"
        },
        {
          no: "06",
          title: "품목 넣고 수량만",
          body: [
            "품목코드 칸에 **핵심 단어**만 쳐도 됩니다.",
            "예: 고추가루김치용 → 「**김치**」 검색 → 굵은고추가루(김치용) 선택",
            "선택되면 품목·단가가 들어가고, **수량만** 적으면 됩니다."
          ],
          tip: "정확한 품목명을 전부 외울 필요 없습니다. 키워드로 찾고 클릭하세요.",
          img: "/ecount/06-item-filled.png?v=2",
          imgCap: "품목 선택 후 수량만 입력"
        }
      ],
      summary: [
        "판매입력 열기",
        "거래처 · 온라인 · 본사창고 · 특이사항",
        "품목 검색 후 수량 입력"
      ]
    },
    {
      id: "print-invoice-packing",
      title: "인보이스 · 패킹리스트 출력",
      sub: "판매조회 · 전체선택 · 하단 인쇄 · packing_new",
      intro: [
        "판매입력으로 만든 전표는 **재고 I → 판매 → 판매조회**에서 확인합니다.",
        "아래에서 **인보이스**와 **패킹리스트** 뽑는 순서를 따라가면 됩니다."
      ],
      steps: [
        {
          no: "01",
          title: "판매조회 열기",
          body: [
            "경로: **재고 I → 영업관리 → 판매 → 판매조회**",
            "이전에 판매입력한 전표가 리스트로 보입니다.",
            "일자는 금일(오늘) 기준으로 검색하면 됩니다."
          ],
          img: "/ecount/07-sales-inquiry.png?v=3",
          imgCap: "판매조회 — 오늘 입력한 전표 목록"
        },
        {
          no: "02",
          title: "일자-No. 옆 네모로 전체 선택",
          body: [
            "표 맨 위 **일자-No.** 왼쪽 체크박스를 누르면 **현재 페이지**가 전체 선택됩니다.",
            "표 안 주황색 **인쇄** 버튼이 아니라, 화면 **맨 아래 하단 「인쇄」**를 누릅니다."
          ],
          warn: "페이지가 2장 이상이면 페이지별로 선택해야 합니다. 1페이지에서 전체 선택해도 2페이지는 선택되지 않습니다.",
          tip: "아침 패킹리스트 뽑을 때: 1페이지 선택 → 인쇄 → 2페이지로 이동 → 다시 선택 → 인쇄",
          img: "/ecount/08-inquiry-selected.png?v=3",
          imgCap: "일자-No. 왼쪽 체크 = 현재 페이지만 전체 선택"
        },
        {
          no: "03",
          title: "거래명세서 = 인보이스",
          body: [
            "하단 **인쇄**를 누르면 **거래명세서** 창이 뜹니다.",
            "기본으로 보이는 양식이 **인보이스**(예: Wmart기본)입니다."
          ],
          img: "/ecount/09-invoice.png?v=3",
          imgCap: "거래명세서 — WMART INVOICE(인보이스)"
        },
        {
          no: "04",
          title: "패킹리스트는 packing_new",
          body: [
            "같은 거래명세서 창 왼쪽 아래 양식 목록에서 **Wmart기본** 대신 **Packing_new**를 고릅니다.",
            "그러면 **WMART Packing List**(패킹리스트)가 뜹니다.",
            "그다음 창 안의 **인쇄**로 출력하면 됩니다."
          ],
          tip: "인보이스 ↔ 패킹리스트는 양식만 바꾸면 됩니다. 창을 새로 열 필요 없습니다.",
          img: "/ecount/10-template-packing.png?v=3",
          imgCap: "양식 선택 — Packing_new"
        },
        {
          no: "05",
          title: "패킹리스트 확인",
          body: [
            "Packing_new를 고르면 위치·이미지가 보이는 **패킹리스트** 화면이 됩니다.",
            "특이사항(창고)도 여기에 함께 보입니다."
          ],
          img: "/ecount/11-packing-list.png?v=3",
          imgCap: "WMART Packing List 예시"
        }
      ],
      summary: [
        "판매조회에서 금일 전표 확인",
        "일자-No. 체크(페이지별) → 하단 인쇄",
        "인보이스(Wmart기본) / 패킹리스트(Packing_new)"
      ]
    }
  ],
  express: {
    title: "W Express 메뉴얼",
    sub: "항공 특송 입출고 및 검수·패킹 수칙",
    sidebarFoot: "새벽 항공배송 기준 · 07:00 출근 작업\n입고 → 라벨링 → 합포장 → 랙 정리",
    pages: [
      {
        id: "express-0",
        stepNo: "01",
        timeBadge: "07:00 출근 직후",
        title: "파레트 입고 및 번호별 1차 분류",
        sub: "새벽 도착 파레트 하차 및 운송장 앞자리(0~9) 구역별 분류",
        calloutHead: "입고 및 1차 분류 핵심 규칙",
        calloutLead: "전날 밤 항공배송으로 한국에 도착하여, 출근일 새벽 창고 앞에 파레트 보통 3개 정도가 입고됩니다. 07:00 출근 즉시 파레트를 정리하며, 상자 번호의 앞자리수(0~9)를 기준으로 구역별로 분류합니다.",
        flowTitle: "작업 세부 절차",
        flow: [
          {
            step: "Step 1",
            head: "새벽 파레트 입고 확인 (약 3개)",
            desc: "창고 앞 도착한 항공 특송 파레트 수량(보통 3개) 및 비닐 랩핑 상태를 외관 점검합니다."
          },
          {
            step: "Step 2",
            head: "07:00 출근 직후 파레트 하차 및 반입",
            desc: "핸드 파레트 트럭(자키)을 사용하여 창고 내부 작업장으로 파레트를 안전하게 이동합니다."
          },
          {
            step: "Step 3",
            head: "번호 앞자리(0~9) 기준 구역별 분류",
            desc: "상자에 부착된 번호의 맨 앞자리 숫자(0부터 9까지)를 확인하고 지정된 바닥 구역별로 정렬합니다."
          }
        ],
        checklistTitle: "1차 분류 시 필수 체크리스트",
        checklists: [
          "파레트 비닐(랩) 제거 시 상자가 무너지지 않도록 위쪽부터 안전하게 해체",
          "외관상 파손, 터짐, 젖음 등 이상 화물 발생 시 즉시 별도 분리 후 관리자 보고",
          "0~9번 구역 간 작업 통로를 확보하여 다음 단계 라벨링 동선 유지"
        ],
        placeholder: {
          badge: "사진 및 작업 구역 도면 준비 중",
          title: "파레트 입고 현황 및 번호별(0~9) 바닥 구획 배치 예시",
          desc: "추후 실제 창고 앞 파레트 입고 사진 및 0~9번 구역 분할 배치 사진이 등록될 예정입니다.",
          hint: "촬영 예정: 창고 입구 파레트 하차 컷 & 바닥 번호 구역별 상자 정렬 컷"
        }
      },
      {
        id: "express-1",
        stepNo: "02",
        timeBadge: "검수 및 대조 단계",
        title: "라벨링 작업 및 이중 검수 대조",
        sub: "번호 4자리수 일치 & 화물 ID 일치 2가지 동시 대조 후 라벨 부착",
        calloutHead: "라벨링 이중 대조(Double-Check) 필수 원칙",
        calloutLead: "반드시 ① 번호 4자리수 일치 여부와 ② 화물 ID(Cargo Tracking ID) 일치 여부 2가지를 동시에 대조한 뒤 라벨을 부착해야 합니다. 하나라도 다르면 오부착 및 오배송 사고로 이어집니다.",
        flowTitle: "라벨 부착 절차",
        flow: [
          {
            step: "대조 1",
            head: "번호 4자리수 일치 확인",
            desc: "출력된 라벨지에 적힌 4자리 번호와 상자 송장에 표기된 4자리 번호가 정확히 일치하는지 확인합니다."
          },
          {
            step: "대조 2",
            head: "화물 ID (Cargo ID) 교차 대조",
            desc: "시스템상의 화물 ID 번호와 상자의 송장 바코드/ID 번호를 대조하여 동일 화물임을 재검증합니다."
          },
          {
            step: "부착",
            head: "정위치 라벨 부착",
            desc: "두 가지 항목이 모두 일치할 때, 기존 바코드를 가리지 않는 상단/측면 지정 위치에 밀착 부착합니다."
          }
        ],
        checklistTitle: "라벨링 시 주의사항",
        checklists: [
          "비슷한 번호대의 화물이 많으므로 4자리 끝자리 숫자까지 꼼꼼히 대조",
          "화물 ID 불일치 건은 라벨 부착을 중단하고 즉시 보류 구역으로 이동",
          "라벨이 찢어지거나 구겨지지 않도록 손바닥으로 문질러 확실히 접착"
        ],
        placeholder: {
          badge: "사진 및 라벨 예시 준비 중",
          title: "4자리 번호 및 화물 ID 대조 화면 & 라벨 정위치 부착 예시",
          desc: "추후 실제 송장 라벨과 화물 ID 비교 사진, 올바른 부착 위치 가이드가 등록될 예정입니다.",
          hint: "촬영 예정: 송장 번호 4자리 클로즈업 컷 & 화물 ID 바코드 대조 컷"
        }
      },
      {
        id: "express-2",
        stepNo: "03",
        timeBadge: "출고 패킹 단계",
        title: "당일 배송 건 합포장 작업",
        sub: "오늘 배송 나가는 건 선별 및 동일 수령인 안전 합배송 포장",
        calloutHead: "당일 출고 합포장 수칙",
        calloutLead: "오늘 배송 스케줄로 지정된 건들을 선별하여, 동일 고객/수령지로 묶이는 다수 화물에 대해 안전한 합포장(번들링 및 보강 테이핑)을 실시합니다.",
        flowTitle: "합포장 진행 절차",
        flow: [
          {
            step: "선별",
            head: "당일 배송 출고 대상 선별",
            desc: "라벨링이 끝난 화물 중 오늘 즉시 배송이 나가는 건들을 출고 목록과 대조하여 선별합니다."
          },
          {
            step: "매칭",
            head: "동일 배송지 건 합포장 매칭",
            desc: "한 고객에게 함께 전달되어야 하는 2개 이상의 상자를 하나의 세트로 안전하게 취합합니다."
          },
          {
            step: "포장",
            head: "밴딩/테이핑 및 출고 라벨링",
            desc: "배송 중 상자가 분리되거나 이탈하지 않도록 테이프/밴딩으로 단단히 결속하고 합포장 표기를 부착합니다."
          }
        ],
        checklistTitle: "합포장 체크리스트",
        checklists: [
          "합포장 누락 방지를 위해 출고 명단상의 박스 수량(1/2, 2/2 등) 최종 확인",
          "무거운 박스를 반드시 아래에 두고, 가벼운 박스를 위에 올려 적재 결속",
          "배송 기사님 상차를 위해 출고 대기 구역(도크/라인)으로 정렬 이동"
        ],
        placeholder: {
          badge: "포장 가이드 사진 준비 중",
          title: "당일 합포장 테이핑 기준 및 묶음 포장 완료 예시",
          desc: "추후 실제 합배송 상자 결속 테이핑 방식 및 출고 정렬 사진이 등록될 예정입니다.",
          hint: "촬영 예정: 2개 이상 박스 결속 테이핑 컷 & 합포장 라벨 표기 컷"
        }
      },
      {
        id: "express-3",
        stepNo: "04",
        timeBadge: "창고 보관 단계",
        title: "잔여 상자 창고 랙(Rack) 정리",
        sub: "당일 출고 제외 미출고 화물 지정 랙 번호대별 보관 및 정리",
        calloutHead: "미출고 잔여 화물 랙 보관 수칙",
        calloutLead: "당일 배송 나가는 건들을 출고한 뒤 남은 상자들은 창고 랙(선반)의 정해진 위치에 번호대별로 깔끔하게 적재하여 안전하게 보관합니다.",
        flowTitle: "랙 정리 절차",
        flow: [
          {
            step: "집계",
            head: "남은 상자 수량 및 번호대 분류",
            desc: "당일 미출고 잔여 화물의 번호대(예: 0000번대, 1000번대 등)를 확인하여 랙 구역별로 분류합니다."
          },
          {
            step: "적재",
            head: "지정 랙(Rack) 선반에 안전 적재",
            desc: "해당 번호대가 지정된 랙 선반 칸에 상자 라벨이 바깥쪽을 향하도록 보기 쉽게 차곡차곡 적재합니다."
          },
          {
            step: "정리",
            head: "통로 정리 및 보관 상태 점검",
            desc: "바닥에 잔여물이 남지 않도록 통로를 깨끗이 비우고, 다음 날 출고 시 바로 찾을 수 있도록 정돈합니다."
          }
        ],
        checklistTitle: "랙 정리 안전 수칙",
        checklists: [
          "상단 랙 적재 시 사다리 안전수칙 준수 및 무게 중심 확인 (무거운 짐은 하단)",
          "박스 라벨(번호 및 화물 ID)이 통로에서 한눈에 보이도록 앞면 정렬",
          "다음 날 출고 시 즉시 찾을 수 있도록 순서대로 오와 열을 맞춰 보관"
        ],
        placeholder: {
          badge: "랙 도면 및 보관 사진 준비 중",
          title: "창고 랙 번호별 구역 도면 및 상자 적재 예시",
          desc: "추후 실제 W Express 전용 랙 선반 배치도와 안전 적재 완료 사진이 등록될 예정입니다.",
          hint: "촬영 예정: 번호대별 랙 선반 정면 컷 & 안전 적재 완료 전체 전경 컷"
        }
      }
    ]
  }
};
