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
    warehouseManualTitle: "Warehouse Manual",
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
    sidebarFoot: "Dawn Air Express Standard · 07:00 Shift\nInbound → Labeling → Bundling → Rack Storage",
    pages: [
      {
        id: "express-0",
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
              title: "Food Boxes (Blue Tape, F-Code) ➔ Move to [Central Workbench]",
              desc: "During sorting, whenever you encounter a box sealed with 'blue tape' (applies to both regular cardboard boxes and styrofoam), do not place it in front of the racks; bring it to the [Central Workbench] first.",
              bullets: [
                "Boxes sealed with blue tape = Food shipments (cargo code starts with 'F')",
                "Move to [Central Workbench] instead of Racks 0–9",
                "Food items (F-boxes) are handled by dedicated team members, so we focus on sorting general products"
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
                "Numbers starting with WB prefix",
                "Numbers starting with HG prefix",
                "Waybills missing the W01*-**** Customer ID in address",
                "Damaged or unreadable waybills"
              ],
              note: "Once grouped, the area supervisor will inspect and process them separately."
            },
            photos: [
              {
                src: "/express/01-rack-floor-sorting.jpg",
                title: "Racks 0–9 Floor Alignment Area (Click to Enlarge)",
                desc: "Workers sorting general parcels along the floor aisles in front of Racks 0–9 by customer ID (exceptions staged at wrapping tape boxes)"
              }
            ]
          }
        ],
        checklistTitle: "1st Sorting Checklist",
        checklists: [
          "❌ Did you avoid sorting by the box's QR label (Cargo ID) number, and ⭕ verify the 'W01*-****' Customer ID in the courier waybill address?",
          "Did you place parcels in front of Racks 0–9 based on the first digit of the last 4 digits in Customer ID? (e.g. W010-0161 ➔ Rack 0)",
          "🧊 Were food boxes sealed with blue tape (regular cardboard / styrofoam, F-code) placed on the 'Central Workbench' instead of the racks?",
          "Were WB/HG prefix shipments or parcels with missing/unclear IDs segregated in front of the wrapping tape boxes?",
          "Did you exercise caution when slitting open sacks and consol boxes to avoid slicing into internal goods?"
        ]
      },
      {
        id: "express-1",
        stepNo: "02",
        timeBadge: "Inspection & Verification",
        title: "Labeling & Cross-Check Verification",
        sub: "Verify 4-digit number match & Cargo ID match simultaneously before affixing labels",
        calloutHead: "Double-Check Verification Mandate",
        calloutLead: "You MUST verify BOTH: ① 4-digit number match and ② Cargo Tracking ID match before affixing labels. Any discrepancy leads to mislabeling and misdelivery accidents.",
        flowTitle: "Labeling Procedure",
        flow: [
          {
            step: "Check 1",
            head: "4-Digit Number Verification",
            desc: "Confirm that the 4-digit number on the printed label sheet matches the 4-digit number printed on the box waybill."
          },
          {
            step: "Check 2",
            head: "Cargo ID Cross-Validation",
            desc: "Verify that the Cargo Tracking ID in the system matches the physical box barcode/identifier to confirm identical cargo."
          },
          {
            step: "Affix",
            head: "Affix Label to Designated Spot",
            desc: "Once both items match, apply the label flatly onto the designated top/side area without covering existing barcodes."
          }
        ],
        checklistTitle: "Labeling Precautions",
        checklists: [
          "Carefully check all 4 digits including the last digit, as similar number sequences can easily cause confusion",
          "If the Cargo ID does not match, immediately stop labeling and place in the holding area",
          "Smooth the label down with your palm so it adheres firmly without wrinkles or peeling edges"
        ],
        placeholder: {
          badge: "Photo & Label Example In Progress",
          title: "4-Digit Number & Cargo ID Cross-Check Screen and Label Position",
          desc: "Actual comparison photos of waybill labels and Cargo IDs, plus placement guides, will be updated here.",
          hint: "Planned: Close-up of 4-digit waybill number & Cargo ID barcode cross-check shot"
        }
      },
      {
        id: "express-2",
        stepNo: "03",
        timeBadge: "Outbound Packing",
        title: "Same-Day Outbound Consolidation Packaging",
        sub: "Filter same-day delivery shipments & safely bundle multi-box orders",
        calloutHead: "Same-Day Delivery Bundling Rules",
        calloutLead: "Filter parcels scheduled for delivery today from the dispatch list, and perform consolidation (bundling and reinforced taping) for multiple boxes addressed to the same recipient.",
        flowTitle: "Consolidation Packaging Workflow",
        flow: [
          {
            step: "Filter",
            head: "Select Same-Day Delivery Parcels",
            desc: "From labeled cargo, isolate boxes scheduled for immediate outbound delivery today against the manifest."
          },
          {
            step: "Match",
            head: "Match Multi-Box Consolidations",
            desc: "Gather multiple boxes bound for the same recipient/destination into a single consolidated set."
          },
          {
            step: "Bundle",
            head: "Banding, Taping & Consolidated Labeling",
            desc: "Firmly strap and tape boxes together so they cannot separate during transit, and mark consolidation labels."
          }
        ],
        checklistTitle: "Consolidation Checklist",
        checklists: [
          "Double-check outbound box counts (e.g. 1/2, 2/2) to ensure no companion box is left behind",
          "Always place heavier boxes at the bottom and lighter boxes on top when bundling",
          "Line up finished bundles in the outbound staging area (dock/line) ready for driver pickup"
        ],
        placeholder: {
          badge: "Packaging Guide Photo In Progress",
          title: "Consolidation Taping Standards & Bundling Completion Example",
          desc: "Actual photos of multi-box bundling taping techniques and staging alignment will be updated here.",
          hint: "Planned: 2+ boxes strapped/taped bundling shot & consolidation label mark shot"
        }
      },
      {
        id: "express-3",
        stepNo: "04",
        timeBadge: "Warehouse Storage",
        title: "Remaining Boxes Rack Storage & Sorting",
        sub: "Store non-dispatched boxes onto designated warehouse racks by number ranges",
        calloutHead: "Remaining Cargo Rack Storage Rules",
        calloutLead: "After all same-day deliveries are dispatched, neatly stack remaining boxes onto designated warehouse rack tiers according to their number ranges for safe storage.",
        flowTitle: "Rack Storage Workflow",
        flow: [
          {
            step: "Tally",
            head: "Tally Remaining Boxes by Number Range",
            desc: "Group non-dispatched boxes by number range (e.g. 0000s, 1000s, etc.) for organized rack placement."
          },
          {
            step: "Store",
            head: "Safe Stacking on Designated Racks",
            desc: "Neatly stack boxes onto their allocated rack tiers with labels facing outwards toward the aisle for easy visibility."
          },
          {
            step: "Clear",
            head: "Clear Aisles & Final Inspection",
            desc: "Clear work aisles of any debris and organize all items sequentially so they can be retrieved immediately tomorrow."
          }
        ],
        checklistTitle: "Rack Storage Safety Rules",
        checklists: [
          "Follow ladder safety guidelines and keep heavy cargo on bottom tiers for stable center of gravity",
          "Keep box labels (number and Cargo ID) aligned facing the aisle for immediate identification",
          "Store strictly in sequential order to enable fast retrieval during tomorrow's dispatch"
        ],
        placeholder: {
          badge: "Rack Map & Storage Photo In Progress",
          title: "Warehouse Rack Zone Diagram & Box Stacking Example",
          desc: "Actual layout diagrams of W Express racks and completed safe storage photos will be updated here.",
          hint: "Planned: Front shot of numbered rack tiers & full panoramic view of stacked boxes"
        }
      }
    ]
  }
};
