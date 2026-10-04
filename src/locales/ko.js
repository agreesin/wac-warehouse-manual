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
    unit2Desc: "검수·보관·출고·반품 · 재고관리",
    unit2Cta: "Google Slides 열기",
    wmartBack: "← WAC 인턴 메뉴얼",
    wmartKicker: "W MART",
    wmartTitle: "인턴 W MART 메뉴얼",
    wmartLead: "창고 피킹·패킹과 ECOUNT 입력을 나눠 두었습니다. 필요한 메뉴얼을 골라 보세요.",
    wmartCardWhTitle: "창고 메뉴얼",
    wmartCardWhDesc: "피킹 · 패킹 · 도면 · 라벨",
    wmartCardEcTitle: "ECOUNT 메뉴얼",
    wmartCardEcDesc: "판매입력 · 인보이스 · 패킹리스트",
    openCta: "열기 →",
    homeBtn: "W MART 홈",
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
  ]
};
