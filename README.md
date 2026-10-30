# StockVista (स्टॉकविस्टा) 📦
### *Smart Inventory. Strong Business.*

> Enterprise warehouse inventory, GST billing, logistics tracking, and multi-hub distribution system built for Indian wholesale distributors.

[![Live Web App](https://img.shields.io/badge/🌐_OPEN_LIVE_WEBSITE-CLICK_HERE-FF6B35?style=for-the-badge&logo=googlechrome&logoColor=white)](https://shivbiss91-dev.github.io/stock-manager/docs/)
[![GitHub Pages](https://img.shields.io/badge/GitHub_Pages-Online-emerald?style=for-the-badge&logo=github)](https://shivbiss91-dev.github.io/stock-manager/docs/)

---

### 🚀 **Open the Application Directly:**
- 🔗 **Direct Live Link (GitHub Pages):** [**https://shivbiss91-dev.github.io/stock-manager/docs/**](https://shivbiss91-dev.github.io/stock-manager/docs/)
- 🔗 **Alternative Root Link:** [https://shivbiss91-dev.github.io/stock-manager/](https://shivbiss91-dev.github.io/stock-manager/)

---

[![TypeScript](https://img.shields.io/badge/TypeScript-Strict_5.x-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.x-61dafb.svg)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-5.x-646cff.svg)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-3.4-38bdf8.svg)](https://tailwindcss.com/)
[![Tests](https://img.shields.io/badge/Vitest-58%2F58_Passing-emerald.svg)](https://vitest.dev/)
[![Localization](https://img.shields.io/badge/Localization-INR_₹_%7C_GSTIN_%7C_5_Languages-teal.svg)](https://react.i18next.com/)

---

## 🌟 Executive Overview & Reference Concept Alignments

StockVista is engineered specifically to address the operational and regulatory requirements of Indian wholesale and distribution enterprises (B2B timber, metals, hardware, textiles, plastics, and chemicals). It directly matches the four concept reference templates with strict adherence to real-world Indian taxation and warehousing rules:

### 1. Dashboard Home (Reference Image 1)
- **7 Synchronized KPI Cards:** Total Items (`3,420`), Total Pieces (`1,28,490`), Stock Value (`₹8.42 Cr`), Today's Sales (`₹14.85 L`), This Month's Sales (`₹1.84 Cr`), Outstanding Payments (`₹38.45 L`), and Low-Stock Alerts (`28 SKU`). Each card includes trend indicators and sparklines.
- **Orders Velocity Card:** Textured progress bars tracking Overdue, Returns, In Progress, and Completed orders.
- **Stock Distribution Radial Chart:** Textured radial half-donut visualizer (In Stock, Out of Stock, Low Stock, Dead Stock). **Interactive link:** Clicking any status slice instantly filters the master Product List table.
- **Order History Carousel:** Stacked interactive card carousel showcasing customer orders, payment status chips, and transit statuses.
- **Logistics Map:** Offline high-resolution India SVG map visualizing warehouse hubs (Bhiwandi Central, Panvel Logistics, Nagpur Central, Pune Chakan) with live truck routes and transit delay tags.
- **Product List Table:** Real-time search, category filters, supplier filters, warehouse filters, column customization, CSV export, and quick action menus.
- **Customizable Dashboard Layout:** Users can drag to reorder or toggle cards on and off; the layout is saved per user in browser state.

### 2. Material Category Catalog (Reference Image 2 — Wood Category)
- **Master Scale:** Exactly `1,248` wood items (`3,420` catalog items across 8 material categories: Wood, Metal, Plastic, Glass, Fabric, Rubber, Paper, Ceramic).
- **Synchronized Dual Price Slider:** Dual-handle price range slider (`₹0` to `₹25,000+`) synced bidirectionally with Min and Max number inputs.
- **Live Stock Status Checkboxes:** Shows real-time counts for In Stock, Low Stock, and Out of Stock.
- **TanStack Virtualized Scrolling:** Effortlessly scrolls through 1,000+ items at 60 FPS.
- **Bulk Action Bar:** Floating contextual action bar for selected items (Bulk Price Update, Category Relocation, Barcode Label Printing, and Multi-format CSV/Excel/PDF Export).
- **Favourites Drawer:** Pin frequently ordered wholesale lines to persistent `/favourites`.

### 3. Item Detail Page with Sales Analytics (Reference Image 3)
- **Image Gallery:** Thumbnail carousel, zoom magnification, and material categorization chips.
- **Role-Guarded Cost & Margin:** Cost Price (`₹`) and Gross Profit Margin (`%`) are strictly hidden from non-admin staff, visible exclusively to Owner/Administrator accounts.
- **Sales Analytics Tab:**
  - Daily, Weekly, Monthly, and Yearly period toggles with date range selection.
  - **4 Synchronized KPIs:** Total Sales, Orders Count, Avg Selling Price, and Units Sold (where $\text{Avg Selling Price} \equiv \text{Total Sales} \div \text{Units Sold}$).
  - **Recharts Dual-Axis Chart:** Sales in ₹ (Bar/Line on primary axis) and Units Sold (Line on secondary axis) with interactive data labels, tooltips, and Chart/Table view toggle.
  - Top buyers breakdown table and CSV export.
- **Stock Movement Ledger:** Complete chronological audit trail with date, transaction type (`In`, `Out`, `Transfer`, `Return`, `Damage`, `Adjustment`), quantity delta ($\pm$), actor, and linked PO/SO/Transfer references.
- **Action Suite:** Thermal Barcode/QR label preview & printing modal, Inter-Hub Stock Transfer modal, and Item Edit modal (direct save for Admins; submits to two-tier Authorization Queue for non-admins).

### 4. GST Create Invoice Page (Reference Image 4)
- **4-Step Wizard:**
  1. *Customer Selection:* Instant search by Name, Phone, or GSTIN; selected customer card with 15-character GSTIN, credit limit, and outstanding balance monitoring (warns if invoice pushes balance past credit limit).
  2. *Delivery Address & Place of Supply:* Automatically detects Place of Supply from customer state code and determines whether to charge intra-state **CGST + SGST** (Maharashtra $\to$ Maharashtra) or inter-state **IGST** (Maharashtra $\to$ Other States).
  3. *Payment Terms:* Configurable terms (Immediate, 7, 15, 30, 45, 60 days, Custom) with automated due date calculation and partial RTGS/NEFT/UPI payment tracking.
  4. *Add Items Line Table:* Real-time search by Name, SKU, Barcode, or HSN with barcode scanner support. Automatically calculates wholesale tier discounts based on quantity and customer pricing group.
- **Integer Paise Precision:** Line amounts, taxes, and grand totals are computed strictly in integer paise (`₹1.00 = 100 paise`) to eliminate floating-point rounding errors.
- **Sticky Tax Ledger & Amount in Words:** Detailed breakdown with amount formatted in the Indian numbering system (e.g., *"Forty Nine Thousand Three Hundred Seventy One Rupees and Twenty Paise Only"*).
- **Statutory Outputs:**
  - Print-ready A4 Tax Invoice modal with company GSTIN, HDFC Bank RTGS details, terms & conditions, and HSN summary table.
  - Mock 64-character E-Invoice IRN & QR generation (with validation of mandatory GST fields).
  - Mock 12-digit E-Way Bill generation with vehicle registration number.
  - One-click WhatsApp and Email invoice dispatch simulator.

---

## 🛠 Complete Module Architecture

```
StockVista Platform
├── Shell & Navigation
│   ├── Collapsible Sidebar (Role-filtered navigation with badge indicators)
│   ├── Top Header (Warehouse Hub selector, Period filter, Ctrl+K Global Search, Notifications, Theme toggle, i18n)
│   └── 2FA Login Flow (Email/Password + 6-digit OTP verification for Admins)
│
├── Inventory & Warehousing
│   ├── Materials Hub (8 Material tiles with stock value & sales mini-charts)
│   ├── Material Category Catalog (/materials/:id with virtualized scrolling)
│   ├── Master Items Directory (/items with SKU search and batch filters)
│   ├── Item Detail (/items/:id with Recharts analytics & thermal label printing)
│   ├── Regional Warehouses (/warehouses across Bhiwandi, Panvel, Nagpur, Pune)
│   ├── Inter-Hub Transfers (/transfers with driver details & receiving flow)
│   └── Global Movements Ledger (/stock-movements with In/Out/Transfer audit)
│
├── Commerce & Billing
│   ├── Sales Quotations (/sales/quotations with status tracking)
│   ├── Sales Orders (/sales/orders with dispatch status)
│   ├── GST Tax Invoices (/sales/invoices and /sales/invoices/new)
│   ├── Returns & Credit Notes (/sales/returns with GST credit adjustments)
│   ├── Purchase Orders (/purchases/orders with PO approval workflow)
│   ├── Goods Received Notes (/purchases/grn with automatic inventory increments)
│   └── Supplier Bills (/purchases/bills with 3-way PO matching & RTGS settlement)
│
├── Commercial Directories
│   ├── Customers Directory (/customers with 30/60/90-day overdue receivables matrix)
│   └── Suppliers Directory (/suppliers with payment terms & mill categories)
│
├── Financial & Tax Intelligence
│   └── Reports Suite (/reports)
│       ├── Stock Valuation Report (Weighted Average vs FIFO)
│       ├── GST Liability & ITC Offset (GSTR-1 Outward & GSTR-3B Summary)
│       ├── Low Stock & Reorder Trigger Report
│       └── Fast/Slow Moving Velocity Matrix
│
└── Governance & Administration
    ├── Compliance Documents (/documents with BIS licenses, E-Way bills, LRs)
    ├── Approvals Queue (/approvals with two-tier authorization for price/stock edits)
    ├── Enterprise Audit Log (/audit-log with user, IP, device, and old/new delta values)
    ├── Users & Roles (/users-roles with RBAC permission matrix and status toggles)
    ├── Database Backup (/backup with complete JSON snapshot export and restore)
    └── System Settings (/settings with company GSTIN profile and bank parameters)
```

---

## 🇮🇳 Indian Localisation & Statutory Business Rules

1. **Indian Currency Formatting (`formatINR`):**
   - Standard format: `₹12,34,567.00` (e.g. 2 digits after first thousand: `12,34,567`).
   - Compact notation for dashboards: `₹8.42 Cr`, `₹14.85 L`, `₹38.5 K`.
2. **Indian Number to Words (`numberToWordsINR`):**
   - Converts totals into Indian numbering conventions (Crores, Lakhs, Thousands, Hundreds, Rupees, and Paise).
3. **15-Character GSTIN Validation & Place of Supply (`gstUtils`):**
   - Validates Indian GSTIN format: `^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$`.
   - Extracts state code (e.g., `27` for Maharashtra, `24` for Gujarat, `29` for Karnataka).
   - Intra-state ($State_{supplier} = State_{buyer}$): Charges **CGST** (half rate) + **SGST** (half rate).
   - Inter-state ($State_{supplier} \neq State_{buyer}$): Charges **IGST** (full rate).
4. **Integer Paise Calculation:**
   - All monetary calculations are performed in paise ($\text{amount} \times 100$) before division to ensure exact rounding matching standard Indian accounting norms.
5. **Reorder Level Status Determination:**
   - `Out of Stock`: Current Stock $= 0$.
   - `Low Stock`: $1 \le \text{Current Stock} \le \text{Reorder Level}$.
   - `In Stock`: $\text{Current Stock} > \text{Reorder Level}$.
   - `Dead Stock`: Stock exists but 0 units sold in the last 90 days.
6. **Multi-Language Support (i18n):**
   - English (Complete default)
   - Hindi (हिन्दी)
   - Kannada (ಕನ್ನಡ)
   - Tamil (தமிழ்)
   - Telugu (తెలుగు)

---

## 🔒 Security & Access Control (RBAC)

| Role | Dashboard & Items | Create Invoices | Cost Price & Margins | PO & GRN Receiving | Transfers | Approvals Queue | Users & Audit Log | Backup & Recovery |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Admin / Owner** | ✅ Full | ✅ Full | ✅ Visible | ✅ Full | ✅ Full | ✅ Authorize | ✅ Full | ✅ Full |
| **Operations Manager**| ✅ Full | ✅ Full | ❌ Hidden | ✅ Full | ✅ Full | ✅ Review | ❌ Denied | ❌ Denied |
| **Billing Staff** | ✅ View Only | ✅ Full | ❌ Hidden | ❌ Denied | ❌ Denied | ❌ Denied | ❌ Denied | ❌ Denied |
| **Auditor / Viewer** | 👁️ Read Only | ❌ Denied | ❌ Hidden | ❌ Denied | ❌ Denied | ❌ Denied | ❌ Denied | ❌ Denied |

- **Two-Tier Modification Governance:** If non-admin staff attempt to alter a selling price, modify item master data, or write off stock, the system creates an `ApprovalRequest` in the `/approvals` queue. Price and stock levels only change after an Administrator approves the request with review notes.
- **Enterprise Audit Trail:** Every sensitive operation (login, price edit, invoice creation, stock adjustment, GRN inward, transfer dispatch, approval) is recorded in `/audit-log` with the operator's ID, role, client IP, user agent, old value, and new value.

---

## ⚡ Tech Stack

- **Framework:** React 18 with TypeScript (Strict mode enabled)
- **Bundler & Build Tool:** Vite 5.x (`tsc && vite build`)
- **Routing:** React Router v6 with `ProtectedRoute` guards and role gates
- **Styling & Design System:** Tailwind CSS with custom light/dark design tokens
  - *Light Theme:* Deep Navy (`#0B1F3A`), Teal Accent (`#0E8F83`), Soft Page Grey (`#F4F7FA`), White Cards
  - *Dark Theme:* Near-Black Navy (`#070D18`), Orange Accent (`#FF6B35`), Blue Glow (`#3B5BFF`)
- **State Management:** Zustand (Stores for UI, Auth, and Notifications)
- **Forms & Validation:** React Hook Form + Zod + Custom GSTIN Validators
- **Data Visualization:** Recharts (Dual-axis line & bar charts, radial half-donut, sparklines)
- **Tables & Large List Virtualization:** TanStack Table + TanStack Virtual
- **Icons:** Lucide React
- **Date Manipulation:** date-fns (Indian DD/MM/YYYY formatting & FY calculation)
- **Testing:** Vitest (58 comprehensive unit & integration tests)

---

## 🧪 Testing & Verification

The codebase includes 7 test suites covering all architectural layers:

```bash
# Run the complete test suite
npm test
```

### Test Suite Summary (58/58 Passing):
- **Phase 1 (`src/tests/phase1.test.ts`):** 13 tests — INR formatting, paise precision, number-to-words, 15-char GSTIN validator, FY generator, auth store, 2FA OTP verification.
- **Phase 2 (`src/tests/phase2.test.ts`):** 9 tests — Master inventory constraints (3,420 items, Wood 1,248), HSN format validity, non-negative stock, dashboard KPIs consistency, radial stock donut segment aggregation.
- **Phase 3 (`src/tests/phase3.test.ts`):** 7 tests — Price slider range filtering, subtype checkbox counts, stock status filter summation, bulk actions, category counts.
- **Phase 4 (`src/tests/phase4.test.ts`):** 8 tests — Role-guarded cost/margin privacy, sales analytics KPI synchronization ($\text{Avg Price} = \text{Sales} \div \text{Units}$), stock movement ledger tracking, inter-hub transfer validation.
- **Phase 5 (`src/tests/phase5.test.ts`):** 8 tests — Integer paise invoice math, CGST+SGST intra-state vs IGST inter-state detection, customer credit limit warning, inventory deduction on invoice generation, 64-char IRN and 12-digit E-Way bill generation.
- **Phase 6 (`src/tests/phase6.test.ts`):** 7 tests — Purchase order creation, GRN receiving and automatic inventory stock increment, supplier bill RTGS reconciliation, receivables ageing matrix (30/60/90 days), stock valuation methods (Weighted Average vs FIFO).
- **Phase 7 (`src/tests/phase7.test.ts`):** 6 tests — User role promotion and status toggling, immutable audit logging with delta changes, two-tier approval workflow, compliance document repository, database JSON snapshot generation and restore validation, company GSTIN settings persistence.

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18.x or 20.x
- npm 9.x or higher

### Installation & Launch
```bash
# 1. Install dependencies
npm install

# 2. Run the development server
npm run dev

# 3. Open in your browser
http://localhost:5173/
```

### Pre-Configured Demo Accounts
The login page (`/login`) includes one-click credentials for instant evaluation:

| Role | Email | Password | 2FA OTP Code |
| :--- | :--- | :--- | :---: |
| **System Administrator** | `rajesh@stockvista.in` | `Admin@2026` | `123456` |
| **Operations Manager** | `suresh@stockvista.in` | `Manager@2026` | *(Bypassed)* |
| **Billing Staff** | `amit@stockvista.in` | `Staff@2026` | *(Bypassed)* |
| **Auditor / Viewer** | `anita@stockvista.in` | `Viewer@2026` | *(Bypassed)* |

### Production Build
```bash
npm run build
```
Generates an optimized, tree-shaken static production bundle in `/dist` with zero TypeScript errors.

---

## 📄 License & Attribution
Developed for Indian wholesale and supply chain enterprises. Built with strict TypeScript, React 18, and modern enterprise best practices.
