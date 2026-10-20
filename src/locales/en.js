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
    unit2Desc: "Dawn Pallet Inbound · Labeling · Bundling · Rack Storage",
    unit2Cta: "Open Manual",
    wmartBack: "← WAC Intern Manual",
    wmartKicker: "W MART",
    wmartTitle: "Intern W MART Manual",
    wmartLead: "Warehouse picking/packing and ECOUNT data entry are organized separately. Choose the manual you need.",
    wmartCardWhTitle: "Warehouse Manual",
    wmartCardWhDesc: "Picking · Packing · Floor Map · Labels",
    wmartCardEcTitle: "ECOUNT Manual",
    wmartCardEcDesc: "Sales Entry · Invoice · Packing List",
    openCta: "Open →",
    homeBtn: "WAC Home",
    prevBtn: "Previous",
    nextBtn: "Next",
    tocTitle: "Table of Contents",
    tocClose: "Close TOC",
    contents: "Contents",
    tip: "Tip",
    warn: "Caution",
    key: "Key Takeaway",
    warehouseManualTitle: "W Mart Manual",
    wmartManualBtn: "W Mart Manual",
    warehouseManualSub: "Picking & Packing Rules & Main Warehouse Map",
    warehouseSidebarFoot: "HQ Warehouse Standard · Exc. Zone F (Freezer)\nSeparate from ECOUNT Manual",
    ecountManualTitle: "ECOUNT Manual",
    ecountManualSub: "Sales Entry · Invoice · Packing List",
    ecountSidebarFoot: "Separate from Warehouse Manual\nScreenshot-based · Follow step by step",
    expressManualTitle: "W Express Manual",
    expressManualSub: "Air Express Inbound/Outbound, Inspection & Packing Rules",
    visualGuideTitle: "Visual Guide & On-site Photos",
    zoomIn: "🔍 Click to Enlarge",
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
  ],
  express: {
    title: "W Express Manual",
    sub: "Air Express Inbound/Outbound, Inspection & Packing Rules",
    pages: [
      {
        id: "express-0",
        stepNo: "00",
        timeBadge: "W-EXPRESS Overview",
        title: "W-EXPRESS Introduction",
        sub: "Air Express Core Workflows",
        calloutHead: "W-EXPRESS Operations Manual Guide",
        calloutLead: "Welcome to the W-EXPRESS manual. This guide is designed to help you understand the overall workflow. You will receive hands-on training before beginning work, so do not worry. Use this manual to absorb the training quickly and refer back whenever you need clarification.",
        stepsWithPhotos: [
          {
            stepNo: "1",
            title: "Korea → HK Air Express & 07:00 Warehouse Arrival",
            desc: "Cargo departs Incheon late at night, arrives in Hong Kong at dawn (01:00), and is delivered to our warehouse entrance at 07:00.",
            paragraphs: [
              "W-EXPRESS operates an air express shipping service between Korea and Hong Kong.",
              "Cargo departing Incheon at 22:00 arrives in Hong Kong at 01:00 the next morning, and arrives at our warehouse by 07:00.",
              "When you arrive at 07:00, you will see palletized cargo wrapped in stretch film placed outside the warehouse entrance."
            ],
            photos: [
              {
                src: "/express/02-pallet-arrival.jpg",
                title: "01. Dawn Cargo Arrival (Warehouse Entrance)",
                desc: "Palletized cargo wrapped in plastic placed outside the entrance upon arrival at 07:00"
              }
            ]
          },
          {
            stepNo: "2",
            title: "Move Pallets Indoors",
            desc: "Use pallet jacks to safely move pallets from outside into the warehouse work area.",
            paragraphs: [
              "Workers use pallet jacks (electric or manual) to pull the pallets inside the warehouse.",
              "Once moved indoors safely, workers strip off the stretch wrap and begin inbound sorting."
            ],
            photos: [
              {
                src: "/express/01-pallet-jack.jpg",
                title: "02. Moving Pallets Indoors (Pallet Jack)",
                desc: "Staff moving pallets from entrance into the indoor working zone using a pallet jack"
              }
            ]
          },
          {
            stepNo: "3",
            title: "Our 2 Core Daily Tasks (At a Glance)",
            desc: "We process this cargo through 2 primary daily operations.",
            cargoTypes: [
              {
                tag: "Core Task 1",
                badge: "Arrival Cargo Sorting",
                head: "1. Sort Dawn Arrival Cargo into Designated Locations!",
                desc: "Unbox incoming pallets, sort items along floor aisles by Customer ID (0-9), affix tracking labels, and organize into warehouse racks.",
                tip: "Chapters: 01. Pallet Inbound & 1st Sorting ➔ 02. Labeling ➔ 04. Rack Storage"
              },
              {
                tag: "Core Task 2",
                badge: "Today Delivery Packing",
                head: "2. Pack and Consolidate Today's Deliveries!",
                desc: "Gather all items on today's dispatch list, verify cargo IDs (CTN double-check), consolidate multi-item bundles with W CLUB tape, and mark box tops.",
                tip: "Chapter: 03. Same-Day Dispatch Consolidation"
              }
            ],
            paragraphs: [
              "Our workflow centers on these two pillars: 'Sorting dawn cargo' and 'Packing today deliveries'. Step-by-step guidelines are provided in Chapters 01 through 04."
            ]
          }
        ],
        checklistTitle: "W-EXPRESS Core Onboarding Checklist",
        checklists: [
          "Understand the Korea (Incheon) to Hong Kong dawn air express model?",
          "Check palletized cargo outside warehouse entrance at 07:00 shift start?",
          "Know how to safely pull pallets indoors using a pallet jack?",
          "Grasp the two core operations: 'Sorting dawn cargo' & 'Packing today deliveries'?"
        ]
      },
      {
        id: "express-1",
        stepNo: "01",
        timeBadge: "Inbound & 1st Sorting",
        title: "Pallet Inbound & Floor Rack Sorting (0–9)",
        sub: "Pallet move-in · Unboxing · Waybill Customer ID check · Racks 0–9 floor distribution",
        calloutHead: "What is 1st Stage Sorting?",
        calloutLead: "Unbox cargo unloaded from pallets inside the warehouse, then distribute and place items along the floor aisles in front of Racks 0–9 based on the Customer ID (0–9) printed in the courier waybill address.",
        stepsWithPhotos: [
          {
            stepNo: "1",
            title: "Move Pallets Indoors & Cargo Unboxing (Consol Boxes · Sacks)",
            desc: "Pull pallets from outside into the warehouse using a pallet jack (electric or manual) and strip away the plastic stretch wrap.",
            paragraphs: [
              "Cargo arrives on pallets in three primary formats: individual loose boxes, consolidation boxes (consol boxes), and woven sacks (midae).",
              "Lightly slit the tape or sack exterior with a utility knife and start sorting cargo directly into rack aisles as you unpack."
            ],
            notice: {
              type: "warning",
              icon: "⚠️",
              title: "Utility Knife Caution (Preventing Product Damage)",
              text: "When cutting open consol boxes or sacks, never insert the blade deeply. Slit only the surface tape or outer sack fabric lightly to avoid damaging internal merchandise (clothing, food items, bags, etc.)."
            },
            photos: [
              {
                src: "/express/01-pallet-jack.jpg",
                title: "01. Move Pallet Indoors",
                desc: "Transport pallet inside using a pallet jack and remove stretch wrap"
              },
              {
                src: "/express/05-consol-box.jpg",
                title: "02. Consolidation Box",
                desc: "Large box containing smaller parcels inside (carefully slit tape)"
              },
              {
                src: "/express/04-midae-inside.jpg",
                title: "03. Woven Sack (Midae)",
                desc: "Parcels bundled inside heavy sack (lightly slit outer fabric)"
              }
            ]
          },
          {
            stepNo: "2",
            title: "Physical Waybill Sorting (Food Box Separation & Customer ID Rack Placement)",
            desc: "Begin sorting immediately upon unboxing. Segregate food boxes sealed with blue tape to the Central Workbench, and distribute general cargo in front of Racks 0–9 by reading the Customer ID in the courier waybill address.",
            foodBoxCard: {
              title: "Food Boxes (Blue / Colored Tape · F-Code) ➔ Separate to [Central Workbench]",
              desc: "During sorting, whenever you encounter a food box sealed with tape (applies to both regular cardboard boxes and styrofoam), do not place it in front of the racks; separate it to the [Central Workbench] first.",
              bullets: [
                "Boxes sealed with blue (colored) tape = Food shipments (cargo code starts with 'F')",
                "Immediately separate to the [Central Workbench] for ice pack replacement to preserve freshness and dedicated label printing/affixing",
                "※ Tape color may vary depending on on-site supplies; verify both tape binding and the invoice cargo code (starts with 'F')"
              ],
              photo: {
                src: "/express/01-food-box.jpg",
                title: "Actual Food Box (Blue Tape)",
                desc: "Boxes wrapped in blue tape (F-Code) ➔ Central Workbench"
              }
            },
            paragraphs: [
              "Checking Customer ID on general cargo waybill address: After setting food boxes aside at the central workbench, look for the 'Customer ID' at the end of the courier waybill address to distribute general items in front of Racks 0–9.",
              "🔍 Locating Customer ID (W01*-****) in waybill address: As printed at the tail end of the delivery address line, find the Customer ID formatted as 'W01*-****'."
            ],
            addressCard: {
              title: "Standard Inbound Customer Address Format",
              address: "서울시 강서구 하늘길 210 4번게이트 , W01*-****",
              note: "The W01*-**** code appended at the end of the address is the sorting Customer ID."
            },
            ruleParagraphs: [
              "🎯 Sorting criteria and example: Identify the [very first digit] among the last four digits of the Customer ID, and place the parcel on the floor before that corresponding rack (0–9). In the photo example below, the address shows 'W010-0161'; looking at the first digit '0' of the last four digits (0161), place it on the floor [in front of Rack 0]."
            ],
            guidePhoto: {
              src: "/express/06-customer-id-guide.jpg",
              title: "Physical Waybill Comparison Guide (Click to Enlarge)",
              desc: "Verify Customer ID (W01*-****) on the courier address to place in front of racks instead of sorting by the box's QR label (Cargo ID) number (Example: W010-0161 ➔ Rack 0)"
            },
            notice: {
              type: "warning",
              icon: "⛔",
              title: "Warning Against Misidentifying QR Label (Cargo ID)",
              text: "The number printed on the box's QR label sticker is strictly an internal warehouse 'Cargo ID' and must be completely ignored during 1st stage sorting! In the field, workers most frequently mistake the QR label numbers for rack numbers and mis-sort parcels. Never use the QR label during initial sorting; always check the 'Customer ID (W01*-****)' at the end of the courier waybill address to place parcels at the corresponding rack."
            },
            exceptionCard: {
              title: "Exception Parcels Grouped in Front of Wrapping Tape Boxes",
              desc: "If you encounter any of the following during sorting, do not place them at Racks 0–9; set them aside in front of the wrapping tape boxes.",
              items: [
                "Non-standard code formats with '0001-WB...' (e.g. W011-0001-WB167689)",
                "Waybills missing the W01*-**** Customer ID in address",
                "Damaged or unreadable waybills"
              ],
              note: "Once grouped, the area supervisor will inspect and process them separately.",
              photos: [
                {
                  src: "/express/01-exception-english-prefix.jpg",
                  title: "Exception Sample ①: 0001-WB Non-standard Long Code",
                  desc: "Waybills with '0001-WB...' format instead of standard Customer IDs (e.g. W011-0001-WB167689)\n💡 Identification Tip: Check if '0001' is present, or spot 'WB' letters which make the code noticeably longer than standard labels ➔ Stage in designated area"
                },
                {
                  src: "/express/01-exception-no-id.jpg",
                  title: "Exception Sample ②: Missing Customer ID",
                  desc: "Waybill address completely missing Customer ID (do not sort by QR label) ➔ Stage in designated area"
                }
              ]
            },
            photos: [
              {
                src: "/express/01-rack-floor-sorting.jpg",
                title: "Racks 0–9 Floor Alignment Area (Click to Enlarge)",
                desc: "Workers sorting general parcels along the floor aisles in front of Racks 0–9 by customer ID (exceptions staged in designated area)"
              }
            ]
          }
        ],
        checklistTitle: "1st Sorting Checklist",
        checklists: [
          "❌ Did you avoid sorting by the box's QR label (Cargo ID) number, and ⭕ verify the 'W01*-****' Customer ID in the courier waybill address?",
          "Did you place parcels in front of Racks 0–9 based on the first digit of the last 4 digits in Customer ID? (e.g. W010-0161 ➔ Rack 0)",
          "🧊 Were food boxes (blue/colored tape, F-code) separated to the 'Central Workbench' for ice pack replacement and dedicated labeling instead of being placed by racks?",
          "Were non-standard parcels (long 0001-WB codes) or unidentifiable parcels staged in the designated area?",
          "Did you exercise caution when slitting open sacks and consol boxes to avoid slicing into internal goods?"
        ]
      },
      {
        id: "express-2",
        stepNo: "02",
        timeBadge: "Labeling & 2nd Sorting",
        title: "Label Sticker Affixing & 2nd Sorting",
        sub: "Simultaneous verification of Customer & Cargo ID, isolating same-day dispatches",
        calloutHead: "Labeling & 2nd Sorting Key Summary",
        calloutLead: "You MUST verify BOTH: (1) Customer ID match and (2) Cargo ID match before affixing labels,\nwhile simultaneously: ① grouping same Customer ID parcels together and ② setting aside marked parcels.",
        stepsWithPhotos: [
          {
            stepNo: "1",
            title: "Rack Assignment & Label Sticker Preparation",
            desc: "Each worker takes charge of floor parcels in front of one rack (Racks 0~9),\nand prepares label stickers sorted in Customer ID order.",
            paragraphs: [
              "Individual Rack Assignment: Workers each take responsibility for parcels staged in front of a specific rack (e.g. Worker A oversees Rack 0, Worker B oversees Rack 1, etc.).",
              "Label Sticker Sequence: The printed label sticker sheet is organized in [Customer ID order], containing both Customer ID and Cargo ID information on each sticker."
            ],
            photos: [
              {
                src: "/express/02-label-stickers-prepared.jpg",
                title: "Prepared Label Sticker Sheet (Sorted by Customer ID)",
                desc: "Physical label sticker sheet prepared for the shift"
              },
              {
                src: "/express/02-labeling-overview.jpg",
                title: "Floor Labeling Work Overview",
                desc: "Workers stationed at individual racks inspecting parcels and affixing label stickers across the warehouse floor"
              }
            ]
          },
          {
            stepNo: "2",
            title: "Simultaneous Customer ID & Cargo ID Match and Label Affixing",
            desc: "Check the Customer ID on the courier waybill and the physical Cargo ID on the box,\nlocate the matching sticker, and affix it.",
            notice: {
              type: "warning",
              icon: "⚠️",
              title: "Cargo ID Verification Mandate",
              text: "The most crucial step is verifying the Cargo ID!\nWhen a single customer orders multiple items, one Customer ID has multiple Cargo IDs assigned.\nThese parcels share the same Customer ID but have distinct Cargo IDs. Never affix stickers based solely on Customer ID."
            },
            paragraphs: [
              "Step 1 - Check Customer ID: Confirm the Customer ID (W01*-****) at the end of the courier waybill address and locate that Customer ID block on the label sheet.",
              "Step 2 - Cross-check Cargo ID & Affix: Among stickers with the same Customer ID, find the sticker matching the Cargo ID (CTN number) printed on the parcel exterior, and affix it firmly to the top surface."
            ],
            photos: [
              {
                src: "/express/02-label-before.jpg",
                title: "Before Labeling: Verify Customer ID (W010-4777) & Cargo ID (W1014-5038)",
                desc: "• Yellow highlight: Confirms identical Customer ID (W010-4777).\n• Red highlight: Shows different CTN numbers (Cargo IDs) for different parcels under the same customer.\n➔ Find and affix the sticker matching the parcel's external QR label Cargo ID (W1014-5038)."
              },
              {
                src: "/express/02-label-after.jpg",
                title: "After Labeling: Matching Cargo ID Sticker Affixed",
                desc: "Label sticker with matching Customer ID and CTN number neatly affixed onto the open space of the parcel"
              }
            ]
          },
          {
            stepNo: "3",
            title: "[2nd Sorting ①] Group Same Customer ID Parcels Together",
            desc: "While affixing labels,\ngroup parcels belonging to the same Customer ID together side-by-side.",
            notice: {
              type: "info",
              icon: "💡",
              title: "Why group identical Customer IDs?",
              text: "Gathering multi-item customer orders beforehand saves significant time during downstream consolidation packing and rack shelving, preventing lost or scattered boxes."
            },
            photos: [
              {
                src: "/express/02-customer-id-grouping.jpg",
                title: "Parcels Grouped by Customer ID",
                desc: "Physical staging scene showing boxes grouped by identical Customer ID alongside label application"
              }
            ]
          },
          {
            stepNo: "4",
            title: "[2nd Sorting ②] Separate Marked Cargo (Same-Day Delivery / Pickup)",
            desc: "Parcels with pen markings on the label are scheduled for immediate outbound delivery today,\nso set them aside toward the 'aisle (outer) side' instead of rack-side.",
            notice: {
              type: "warning",
              icon: "🚨",
              title: "Placement Rule: Marked ➔ [Aisle Side], Unmarked ➔ [Rack Side]!",
              text: "• Marked (Slash / , Cross X) ➔ Outbound today! Place on aisle side for quick access during consolidation packaging.\n• Unmarked (Blank) ➔ General cargo! Stored on racks later, so align neatly inward toward the rack."
            },
            cargoTypes: [
              {
                tag: "Same-Day Delivery",
                badge: "Slash Mark ( / , — )",
                head: "Outbound for delivery today",
                desc: "Parcels with a pen slash drawn across the label sticker.\nScheduled for immediate dispatch today.",
                tip: "Placement:\nStage toward the [aisle (outer) side] so they can be picked immediately during consolidation packing.",
                photo: {
                  src: "/express/02-mark-delivery.jpg",
                  title: "Slash Mark (Same-Day Delivery)",
                  desc: "Slash mark on label ➔ Outbound today (staged on aisle side for easy packing access)"
                }
              },
              {
                tag: "Same-Day Pickup",
                badge: "Cross Mark (X)",
                head: "Customer pickup today",
                desc: "Parcels with an X mark drawn on the label sticker.\nScheduled for customer pickup today.",
                tip: "Placement:\nSet aside separately toward the [aisle (outer) side] for immediate pickup dispatch.",
                photo: {
                  src: "/express/02-mark-pickup.jpg",
                  title: "Cross Mark (Same-Day Pickup)",
                  desc: "X mark on label ➔ Customer pickup today (staged on aisle side)"
                }
              },
              {
                tag: "General Cargo",
                badge: "Unmarked (Blank)",
                head: "Cargo to be stored on racks after packing",
                desc: "Parcels with no pen marks on the label sticker.\nGeneral cargo to be organized onto racks after consolidation packing.",
                tip: "Placement:\nAlign inward toward the [rack side] ready for later shelving.",
                photo: {
                  src: "/express/02-mark-general.jpg",
                  title: "Unmarked (General Cargo)",
                  desc: "No markings on label ➔ Store on racks after consolidation packing (staged rack-side)"
                }
              }
            ]
          }
        ],
        checklistTitle: "Labeling & 2nd Sorting Checklist",
        checklists: [
          "⚠️ Even under the same Customer ID, each box has a distinct Cargo ID. Did you verify BOTH waybill Customer ID and physical Cargo ID match before affixing?",
          "📦 [Sorting ①] Did you gather same Customer ID parcels side-by-side to facilitate easy consolidation and rack storage?",
          "🚀 [Sorting ②] Were slash (/) and X marked parcels separated toward the outer aisle side for immediate today dispatch?"
        ]
      },
      {
        id: "express-3",
        stepNo: "03",
        timeBadge: "Same-Day Consolidation",
        title: "Same-Day Outbound Consolidation Packing",
        sub: "Delivery list verification, reinforced taping & box marking",
        calloutHead: "Consolidation Packaging Key Summary",
        calloutLead: "Floor staff retrieve cargo against the delivery list,\nverify (double-check) parcel numbers, and work in pairs of 2\n(Cross-checker ↔ Packer) with real-time communication to bundle and mark boxes.",
        stepsWithPhotos: [
          {
            stepNo: "1",
            title: "Retrieve Cargo by Customer ID (Floor Staff)",
            desc: "Floor staff check the delivery list and retrieve parcels\nfrom the aisle-side today shipments and warehouse racks, delivering them to the workbench.",
            photos: [
              {
                src: "/express/03-packing-table-02.jpg",
                title: "Retrieving Cargo & Delivering to Workbench",
                desc: "Floor worker retrieving customer parcels against the delivery list and staging them at the packing table"
              }
            ]
          },
          {
            stepNo: "2",
            title: "Cross-Check Cargo Number Against Delivery List",
            desc: "The cross-checker verifies the Cargo ID (CTN) against the delivery list\none-by-one to confirm an exact match before packing.",
            photos: [
              {
                src: "/express/03-packing-table-01.jpg",
                title: "Double-Checking Cargo Number Against List",
                desc: "Worker cross-checking parcel CTN numbers against the delivery list at the workbench"
              }
            ]
          },
          {
            stepNo: "3",
            title: "Mark Checked Parcels & Record Bundle Count on List",
            desc: "Tick verified parcel numbers on the delivery list,\nand record the final bundle count once packaging is complete.",
            photos: [
              {
                src: "/express/03-delivery-list.jpg",
                title: "Original Delivery List (Before Check)",
                desc: "Original manifest listing Customer ID, inbound date, Cargo ID, recipient name, and item counts"
              },
              {
                src: "/express/03-delivery-list-checked.jpg",
                title: "Verified Delivery List with Final Counts (After Check)",
                desc: "Physical delivery list marked with checkmarks and final consolidation bundle counts"
              }
            ]
          },
          {
            stepNo: "4",
            title: "Two-Person Taping Bundling & Top Box Marking",
            desc: "The cross-checker reads aloud the parcel count and customer info,\nwhile the packer securely tapes the bundle and writes the delivery info on top.",
            photos: [
              {
                src: "/express/03-taping-method.jpg",
                title: "Secure Cross-Taping Bundling",
                desc: "Worker tightly bundling multiple boxes into a single consolidated parcel using heavy OPP tape"
              },
              {
                src: "/express/03-marking-example.jpg",
                title: "Box Top Delivery Marking Example",
                desc: "Clear pen marking on the box top showing Customer ID, recipient name, and bundle fraction (e.g. 1/1, 1/2, 2/2)"
              }
            ]
          },
          {
            stepNo: "5",
            title: "Handover to Express Representative",
            desc: "After packaging and marking are complete,\nthe checked delivery list is handed over directly to the Express representative.",
            notice: {
              type: "info",
              icon: "✅",
              title: "Final Handover to Express Representative",
              text: "Hand over the completed delivery list to the Express representative.\n(Parcels with missing companion boxes are held for investigation with the representative.)"
            },
            photos: [
              {
                src: "/express/03-delivery-driver-handover.jpg",
                title: "Handover of Checked List to Express Representative",
                desc: "Worker handing over the completed delivery list to the Express representative after final check"
              }
            ]
          }
        ],
        checklistTitle: "Consolidation Packaging Checklist",
        checklists: [
          "Did you double-check the parcel CTN number against the delivery list before taping?",
          "Did you record checkmarks and total bundle counts on the delivery list?",
          "Is the bundle cross-taped securely so parcels cannot shift or separate during transit?",
          "Is the Customer ID, customer name, and bundle count (e.g. 1/2, 2/2) clearly marked on top?",
          "Was the completed delivery list handed over directly to the Express representative?"
        ]
      },
      {
        id: "express-4",
        stepNo: "04",
        timeBadge: "Warehouse Storage",
        title: "Remaining Boxes Rack Storage & Sorting",
        sub: "Store non-dispatched boxes onto designated warehouse racks by number ranges",
        calloutHead: "Remaining Cargo Rack Storage Rules",
        calloutLead: "After all same-day deliveries are dispatched, neatly stack remaining boxes onto designated warehouse rack tiers according to their number ranges for safe storage.",
        stepsWithPhotos: [
          {
            stepNo: "1",
            title: "Rack Storage Rules & Safe Stacking Example",
            desc: "After all same-day dispatches leave, write large identification numbers on the remaining boxes,\nand neatly stack them onto designated rack shelves according to their number ranges.",
            guidePhoto: {
              src: "/express/04-rack-organized.jpg",
              title: "Organized Rack Shelf Stacking (Correct Example)",
              desc: "Boxes stacked sequentially with large numbers facing the aisle, and ultra-small parcels safely placed inside the blue container",
              isPortrait: true,
              fit: "contain"
            },
            notices: [
              {
                type: "warning",
                icon: "🚨",
                title: "Customer ID Distinction: Check prefix (010 vs 011) even if last 4 digits match!",
                text: "When shelving racks, even if the last 4 digits match, different prefixes (010 vs 011) represent completely different customers!\n(e.g. W010-1234 and W011-1234 belong to different people)\nNever assume they belong to the same customer by looking only at the last 4 digits. Always separate 010 and 011 into distinct stacks."
              },
              {
                type: "blue",
                icon: "💡",
                title: "Using the Blue Container Box on the Shelf",
                text: "Dedicated storage bin for ultra-small parcels (poly mailers, small accessories, components) that risk blowing away or falling through shelf wire mesh.\n(Write number ranges on the container exterior for quick identification during next-day dispatch.)"
              }
            ],
            bullets: [
              "🏷️ Large Number Marking & Aisle-Facing Alignment:\nWrite numbers prominently with thick marker and face them directly outward toward the aisle so workers can instantly spot boxes tomorrow.",
              "⚖️ Safe Stacking Guidelines (Center of Gravity):\nStack heavy, bulky cartons on the lowest shelf tiers to maintain a stable center of gravity and prevent tipping hazards."
            ]
          },
          {
            stepNo: "2",
            title: "Warehouse Floor Cleanliness & Staging for Mart Operations",
            desc: "Full warehouse view after dispatching all express shipments, shelving remaining cargo, and clearing floor space for subsequent Mart operations.",
            guidePhoto: {
              src: "/express/04-warehouse-completed.jpg",
              title: "Final Warehouse Overview (Express Completion)",
              desc: "Full warehouse view with all express dispatches completed, remaining boxes organized on racks, and floor cleared for Mart operations"
            },
            outroParagraphs: [
              "✨ Express Shift Wrap-up & Staging for Mart Operations:\nSince W-Express is the first morning shift, once work is done, the floor must be thoroughly swept clean of all obstacles and leftover parcels.\nThe cleared floor space is immediately utilized for the subsequent Mart (W-Mart) inbound and outbound fulfillment operations."
            ]
          }
        ],
        checklistTitle: "Rack Storage & Express Wrap-up Checklist",
        checklists: [
          "⚖️ [Safe Stacking] Verified center of gravity and placed heavy cargo on the lowest shelf tiers for stable storage?",
          "🚨 [Customer ID Prefix] Verified 010 vs 011 prefixes to prevent mixing up different customers with identical 4-digit numbers?",
          "🏷️ [Number Marking] Wrote numbers prominently on box faces and aligned them facing the aisle?",
          "💡 [Small Parcels] Safely stored lightweight/small poly mailers inside the blue container box?",
          "🧹 [Floor Space Ready] Swept the warehouse floor clean of all debris and leftover parcels to secure staging space for subsequent Mart operations?"
        ]
      }
    ]
  }
};
