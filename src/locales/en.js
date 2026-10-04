export default {
  common: {
    hubKicker: "Intern Manual",
    hubTitle: "WAC Intern Manual",
    hubSubtitle: "Business Onboarding All in One Place",
    hubLead: "Select an operational guide from W MART or W Express to get started immediately.",
    unit1Tag: "Warehouse",
    unit1Title: "W MART Manual",
    unit1Desc: "Warehouse Picking & Packing · ECOUNT",
    unit1Cta: "Open Manual",
    unit2Tag: "Fulfillment",
    unit2Title: "W Express Manual",
    unit2Desc: "Inspection · Storage · Outbound · Returns · Inventory",
    unit2Cta: "Open Google Slides",
    wmartBack: "← WAC Intern Manual",
    wmartKicker: "W MART",
    wmartTitle: "Intern W MART Manual",
    wmartLead: "Warehouse picking/packing and ECOUNT data entry are organized separately. Choose the manual you need.",
    wmartCardWhTitle: "Warehouse Manual",
    wmartCardWhDesc: "Picking · Packing · Floor Map · Labels",
    wmartCardEcTitle: "ECOUNT Manual",
    wmartCardEcDesc: "Sales Entry · Invoice · Packing List",
    openCta: "Open →",
    homeBtn: "W MART Home",
    prevBtn: "Previous",
    nextBtn: "Next",
    tocTitle: "Table of Contents",
    tocClose: "Close TOC",
    contents: "Contents",
    tip: "Tip",
    warn: "Caution",
    key: "Key Takeaway",
    warehouseManualTitle: "Warehouse Manual",
    warehouseManualSub: "Picking & Packing Rules & Main Warehouse Map",
    warehouseSidebarFoot: "HQ Warehouse Standard · Exc. Zone F (Freezer)\nSeparate from ECOUNT Manual",
    ecountManualTitle: "ECOUNT Manual",
    ecountManualSub: "Sales Entry · Invoice · Packing List",
    ecountSidebarFoot: "Separate from Warehouse Manual\nScreenshot-based · Follow step by step",
    slidesUrl: "https://docs.google.com/presentation/d/1mSytr6-bSl01gl0j8bExCryC9Bd-9cIj/edit?usp=sharing&ouid=106832286164196570873&rtpof=true&sd=true"
  },
  warehouse: {
    chapters: {
      rules: "Warehouse Work Rules",
      map: "Warehouse Floor Map"
    },
    navItems: [
      { id: "rules", title: "Warehouse Rules", desc: "Sorting · Picking · Packing · Labels" },
      { id: "map", title: "Warehouse Map", desc: "Overall Floor Plan · Rack Photos" }
    ],
    pages: [
      { id: "rules-0", chapter: "rules", rulePage: 0, title: "Warehouse Work Rules", sub: "01. Packing List Sorting & Picking Order" },
      { id: "rules-1", chapter: "rules", rulePage: 1, title: "Warehouse Work Rules", sub: "02. Picking & Packing with Packing List" },
      { id: "rules-2", chapter: "rules", rulePage: 2, title: "Warehouse Work Rules", sub: "03. Blue Trolley Cart Loading & Unloading" },
      { id: "rules-3", chapter: "rules", rulePage: 3, title: "Warehouse Work Rules", sub: "04. Packing into Boxes" },
      { id: "rules-4", chapter: "rules", rulePage: 4, title: "Warehouse Work Rules", sub: "05. Choosing Box Types by Weight" },
      { id: "rules-5", chapter: "rules", rulePage: 5, title: "Warehouse Work Rules", sub: "06. Applying Labels — Fragile & HEAVY" },
      { id: "map", chapter: "map", title: "Warehouse Map", sub: "HQ Warehouse · Packing Area Below · Left A / Right B" }
    ],
    map: {
      callout1: "The 'Warehouse' referenced in this map/rules is **HQ Warehouse** in ECOUNT.",
      callout2: "Bottom is Packing Area · Left is **A** · Right is **B** · Center Aisle",
      sec1Title: "Overall Floor Map",
      mapAlt: "Warehouse Overall Map - Areas A/B and Packing Station",
      sec2Title: "Rack Tiers (Levels)",
      sec2Sub: "Top to Bottom: **1/3** (Top) → **1/2** (Middle) → **1/1** (Bottom / Pallet)",
      rackAlt: "Actual rack photo - Top 1/3, Middle 1/2, Bottom 1/1",
      tier1: "**1/3** Top Tier — Small boxes · Lightweight cargo",
      tier2: "**1/2** Middle Tier — Medium size · Open pick",
      tier3: "**1/1** Bottom Tier — Floor pallet · Large / Heavy cargo",
      tip: "Follow the zone, rack, and tier on the floor map according to the location code on your packing list (e.g., A 5/6)."
    }
  },
  ecount: [
    {
      id: "sales-entry-basics",
      title: "Sales Entry — Basic Entry",
      sub: "Menu Navigation · Customer · Person in Charge · Warehouse · Remarks · Items",
      intro: [
        "Check ordered items and enter them in **Inventory I → Sales → Sales Entry**.",
        "Follow the numbered steps below."
      ],
      steps: [
        {
          no: "01",
          title: "Open Sales Entry",
          body: [
            "When an order arrives, open Sales Entry in ECOUNT.",
            "Path: **Inventory I → Sales Management → Sales → Sales Entry**",
            "Set the Date usually to **Today**."
          ],
          img: "/ecount/01-sales-entry.png?v=2",
          imgCap: "Sales Entry Screen (Wmart)"
        },
        {
          no: "02",
          title: "Search Customer",
          body: [
            "Search for a **part** of the customer's business name in the Customer field.",
            "Example: For Mong Kok Outdark → just typing '**Outdark**' is sufficient.",
            "If branches like Mong Kok / Tsim Sha Tsui appear, pick the one matching the **order branch**."
          ],
          tip: "You don't need to type the full name. Just search key keywords.",
          img: "/ecount/02-customer-search.png?v=2",
          imgCap: "Customer Search — 'Outdark' search example"
        },
        {
          no: "03",
          title: "Person in Charge — Online",
          body: [
            "In Person in Charge (Employee Search), select **Online** for interns.",
            "Code example: **00005 · Online**"
          ],
          tip: "Intern entries are set to Online by default.",
          img: "/ecount/03-employee-search.png?v=2",
          imgCap: "Employee Search — Online (For Interns)"
        },
        {
          no: "04",
          title: "Shipment Warehouse — HQ Warehouse",
          body: [
            "Set the Outbound Warehouse to **HQ Warehouse (본사창고)**.",
            "The place where we pick goods is the HQ Warehouse.",
            "The warehouse floor plan (A/B/R) in the manual also refers to **this HQ Warehouse**."
          ],
          warn: "'Pop-up' is office desk inventory. Do NOT use it for picking.",
          tip: "Among Club / HQ Warehouse / Pop-up → Always pick HQ Warehouse",
          img: "/ecount/04-warehouse-search.png?v=2",
          imgCap: "Warehouse Search — Select HQ Warehouse"
        },
        {
          no: "05",
          title: "Two Remark Fields",
          body: [
            "Remarks are split into **For Delivery / For Warehouse**.",
            "Who can see them differs depending on the field."
          ],
          example: [
            { label: "Remarks (Delivery)", text: "Visible to driver & others · e.g., Request delivery before 2 PM" },
            { label: "Remarks (Warehouse)", text: "Only visible to warehouse picker · e.g., Check pickled radish condition before picking" }
          ],
          img: "/ecount/05-item-search.png?v=2",
          imgCap: "Remarks (Delivery / Warehouse) Input Example"
        },
        {
          no: "06",
          title: "Enter Items and Quantities",
          body: [
            "In the Item Code field, typing **keywords** is sufficient.",
            "Example: For chili powder for kimchi → Search '**Kimchi**' → Select Coarse Chili Powder (Kimchi)",
            "Once selected, Item and Unit Price auto-fill; you only need to enter the **Quantity**."
          ],
          tip: "No need to memorize exact item names. Search with keywords and click.",
          img: "/ecount/06-item-filled.png?v=2",
          imgCap: "Input quantity after item selection"
        }
      ],
      summary: [
        "Open Sales Entry",
        "Customer · Online · HQ Warehouse · Remarks",
        "Search Item and enter Quantity"
      ]
    },
    {
      id: "print-invoice-packing",
      title: "Print Invoice & Packing List",
      sub: "Sales Inquiry · Select All · Bottom Print · packing_new",
      intro: [
        "Vouchers created in Sales Entry can be viewed in **Inventory I → Sales → Sales Inquiry**.",
        "Follow the steps below to print the **Invoice** and **Packing List**."
      ],
      steps: [
        {
          no: "01",
          title: "Open Sales Inquiry",
          body: [
            "Path: **Inventory I → Sales Management → Sales → Sales Inquiry**",
            "Previously entered sales vouchers will appear as a list.",
            "Search based on today's date."
          ],
          img: "/ecount/07-sales-inquiry.png?v=3",
          imgCap: "Sales Inquiry — List of today's vouchers"
        },
        {
          no: "02",
          title: "Select All via checkbox next to Date-No.",
          body: [
            "Clicking the checkbox to the left of **Date-No.** at the top selects the **current page**.",
            "Do NOT click the orange Print button in the table; click **'Print' at the very bottom** of the screen."
          ],
          warn: "If there are 2 or more pages, you must select page by page. Selecting all on Page 1 will NOT select Page 2.",
          tip: "When printing morning packing lists: Select Page 1 → Print → Go to Page 2 → Select → Print",
          img: "/ecount/08-inquiry-selected.png?v=3",
          imgCap: "Date-No. left checkbox = Select all on current page only"
        },
        {
          no: "03",
          title: "Transaction Statement = Invoice",
          body: [
            "Clicking **Print** at the bottom opens the **Transaction Statement** window.",
            "The default template displayed is the **Invoice** (e.g., Wmart Default)."
          ],
          img: "/ecount/09-invoice.png?v=3",
          imgCap: "Transaction Statement — WMART INVOICE"
        },
        {
          no: "04",
          title: "Packing List template is packing_new",
          body: [
            "In the bottom-left template list of the same window, switch from **Wmart Default** to **Packing_new**.",
            "This displays the **WMART Packing List**.",
            "Then click **Print** inside that window to print it out."
          ],
          tip: "Invoice ↔ Packing List just requires switching templates. No need to reopen the window.",
          img: "/ecount/10-template-packing.png?v=3",
          imgCap: "Select Template — Packing_new"
        },
        {
          no: "05",
          title: "Review Packing List",
          body: [
            "Selecting Packing_new displays the **Packing List** with location codes and product images.",
            "Warehouse Remarks are also displayed here."
          ],
          img: "/ecount/11-packing-list.png?v=3",
          imgCap: "WMART Packing List Example"
        }
      ],
      summary: [
        "Check today's vouchers in Sales Inquiry",
        "Check Date-No. (page by page) → Bottom Print",
        "Invoice (Wmart Default) / Packing List (Packing_new)"
      ]
    }
  ]
};
