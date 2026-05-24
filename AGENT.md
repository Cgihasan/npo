# Aqaba Trust

## 🎯 Project Overview
Build a modern, production-ready **Non-Profit Organization (NPO) Accounting Management System** with stunning UI, smooth animations, and complete double-entry bookkeeping features for receipts, payments, and contra entries.

---

## 🛠️ Tech Stack

| Category | Technology |
|----------|-----------|
| Framework | Next.js 14+ (App Router) |
| Language | TypeScript (strict mode) |
| Styling | Tailwind CSS + shadcn/ui |
| Animation | Framer Motion |
| Forms | React Hook Form + Zod |
| Tables | TanStack Table |
| Charts | Recharts |
| Icons | Lucide React |
| Database | Prisma + SQLite (dev) / PostgreSQL (prod) |
| Auth | NextAuth.js |
| PDF | jsPDF + html2canvas |
| Notifications | Sonner |
| Date | date-fns |

---

## 🎨 Design System

### Colors
- **Primary**: Emerald/Teal (`#10b981`)
- **Accent**: Warm Amber (`#f59e0b`)
- **Neutrals**: Zinc/Slate
- **Dark mode**: Full support

### Typography
- **Headings**: Cal Sans / Inter Bold
- **Body**: Inter

### UI Principles
- Glassmorphism cards (`backdrop-blur-md`)
- Rounded corners (`rounded-2xl`)
- Soft shadows (`shadow-lg`, `shadow-xl`)
- Gradient accents on hero sections
- Micro-interactions (hover scale, button ripples)
- Skeleton loaders during data fetch
- Mobile-first responsive
- WCAG AA accessibility

### Animations (Framer Motion)
- Page transitions: fade + slide-up (0.3s ease-out)
- Sidebar: smooth expand/collapse
- Modals: slide-in with backdrop fade
- Table rows: stagger fade-in
- Buttons: scale 0.98 on tap
- Counter animations on KPI cards
- Toast: slide from top-right

---

## 📂 Folder Structure

```
/app
  /(auth)
    /login/page.tsx
    /register/page.tsx
  /(dashboard)
    /layout.tsx          # Sidebar + Navbar layout
    /dashboard/page.tsx
    /receipts
      /page.tsx          # List
      /new/page.tsx      # Create form
      /[id]/page.tsx     # View/Edit
    /payments
      /page.tsx
      /new/page.tsx
      /[id]/page.tsx
    /contra
      /page.tsx
      /new/page.tsx
    /accounts/page.tsx
    /reports/page.tsx
    /masters
      /donors/page.tsx
      /vendors/page.tsx
      /account-heads/page.tsx
    /settings/page.tsx
  /api
    /receipts/route.ts
    /payments/route.ts
    /contra/route.ts
    /auth/[...nextauth]/route.ts
/components
  /ui                    # shadcn components
  /forms                 # Reusable form fields
  /tables                # DataTable wrapper
  /charts                # Chart components
  /layouts               # Sidebar, Navbar
  /shared                # StatCard, PageTransition, etc.
/lib
  /db.ts                 # Prisma client
  /auth.ts               # NextAuth config
  /utils.ts              # Helpers
  /validators            # Zod schemas
/hooks
/types
/prisma
  /schema.prisma
  /seed.ts
```

---

## 🗃️ Database Schema (Prisma)

```prisma
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String
  password  String
  role      Role     @default(VIEWER)
  createdAt DateTime @default(now())
}

enum Role { ADMIN ACCOUNTANT VIEWER }

model Donor {
  id       String    @id @default(cuid())
  name     String
  email    String?
  phone    String?
  address  String?
  pan      String?
  receipts Receipt[]
}

model Vendor {
  id       String    @id @default(cuid())
  name     String
  email    String?
  phone    String?
  gstin    String?
  payments Payment[]
}

model Account {
  id           String         @id @default(cuid())
  name         String
  type         AccountType
  balance      Decimal        @default(0)
  transactions Transaction[]
}

enum AccountType { CASH BANK INCOME EXPENSE ASSET LIABILITY }

model Receipt {
  id          String      @id @default(cuid())
  receiptNo   String      @unique
  date        DateTime
  donorId     String
  donor       Donor       @relation(fields: [donorId], references: [id])
  type        String
  amount      Decimal
  paymentMode String
  referenceNo String?
  accountId   String
  narration   String?
  attachment  String?
  createdAt   DateTime    @default(now())
}

model Payment {
  id          String   @id @default(cuid())
  voucherNo   String   @unique
  date        DateTime
  vendorId    String
  vendor      Vendor   @relation(fields: [vendorId], references: [id])
  type        String
  amount      Decimal
  paymentMode String
  chequeNo    String?
  bankName    String?
  accountId   String
  narration   String?
  attachment  String?
  status      Status   @default(PENDING)
  createdAt   DateTime @default(now())
}

enum Status { PENDING APPROVED PAID }

model ContraEntry {
  id            String   @id @default(cuid())
  entryNo       String   @unique
  date          DateTime
  transferType  String   // CASH_TO_BANK | BANK_TO_CASH
  fromAccountId String
  toAccountId   String
  amount        Decimal
  reference     String?
  narration     String?
  createdAt     DateTime @default(now())
}

model Transaction {
  id        String   @id @default(cuid())
  accountId String
  account   Account  @relation(fields: [accountId], references: [id])
  debit     Decimal  @default(0)
  credit    Decimal  @default(0)
  refType   String   // RECEIPT | PAYMENT | CONTRA
  refId     String
  date      DateTime
  createdAt DateTime @default(now())
}
```

---

## 📄 Pages to Build

### 1. **Authentication** (`/login`, `/register`)
- Clean centered card with gradient background
- Form validation with Zod
- Role-based redirects after login

### 2. **Dashboard** (`/dashboard`)
- Welcome header with org name & current date
- 4 KPI cards (animated counters):
  - Total Receipts (This Month)
  - Total Payments (This Month)
  - Cash in Hand
  - Bank Balance
- Line chart: Income vs Expenses (12 months)
- Pie chart: Expense categories
- Bar chart: Donor contributions
- Recent transactions table (last 10)
- Quick action buttons

### 3. **Receipt Entry** (`/receipts`, `/receipts/new`)
**Form Fields:**
- Receipt No. (auto: `RCP-2025-0001`)
- Date (date picker)
- Received From (donor dropdown + add new modal)
- Receipt Type (Donation / Membership Fee / Grant / Event / Other)
- Amount (₹)
- Payment Mode (Cash / Cheque / Bank Transfer / UPI / Card)
- Reference No.
- Account Head (dropdown)
- Narration (textarea)
- Attachment upload
- Submit → printable PDF receipt

**List View:** Searchable, sortable, filterable table with View/Edit/Print/Delete actions

### 4. **Payment Entry** (`/payments`, `/payments/new`)
**Form Fields:**
- Voucher No. (auto: `PAY-2025-0001`)
- Date
- Paid To (vendor dropdown)
- Payment Type (Salary / Utilities / Rent / Program / Office / Travel / Other)
- Amount
- Payment Mode + Cheque/Bank details
- Account Head
- Narration
- Bill attachment
- Approval workflow (Pending → Approved → Paid)

### 5. **Contra Entry** (`/contra`, `/contra/new`)
- Entry No. (auto: `CON-2025-0001`)
- Toggle: `[Cash → Bank]` / `[Bank → Cash]`
- From / To account auto-set
- Amount, Reference, Narration
- **Animated flow diagram** showing money movement

### 6. **Reports** (`/reports`)
- Receipts & Payments Statement
- Income & Expenditure
- Balance Sheet
- Donor Report
- Date-range filter, PDF/Excel export

### 7. **Masters** (`/masters/*`)
- Donors, Vendors, Account Heads, Bank Accounts CRUD

### 8. **Settings** (`/settings`)
- Org profile (name, logo, PAN, 80G, FCRA)
- Financial year setup
- User management

---

## 🧩 Reusable Components

- `<StatCard>` — KPI card with animated counter
- `<DataTable>` — TanStack Table wrapper with search/sort/filter/pagination
- `<FormField>` — Generic form field with label + error
- `<PageTransition>` — Framer Motion wrapper for pages
- `<ConfirmDialog>` — Confirmation modal
- `<Sidebar>` — Collapsible navigation
- `<Navbar>` — Top bar with search, theme, user menu
- `<EmptyState>` — Friendly empty states
- `<SkeletonLoader>` — Loading placeholders

---

## ✅ Build Order (Phases)

### **Phase 1 — Foundation**
1. Initialize project (Next.js + Tailwind + shadcn)
2. Install all dependencies
3. Setup Prisma schema + migrate
4. Create seed data
5. Setup NextAuth

### **Phase 2 — Layout & Auth**
1. Build sidebar + navbar layout
2. Login/Register pages
3. Protected routes middleware
4. Theme toggle (dark mode)

### **Phase 3 — Core Modules**
1. Dashboard with charts
2. Receipt module (list + form + PDF)
3. Payment module
4. Contra entry module

### **Phase 4 — Supporting Features**
1. Masters (Donors, Vendors, Accounts)
2. Reports with export
3. Settings page

### **Phase 5 — Polish**
1. Animations refinement
2. Mobile responsiveness
3. Accessibility audit
4. Performance optimization

---

## 🎯 Acceptance Criteria

- [ ] All forms validate with Zod
- [ ] All transactions create double-entry records
- [ ] PDF receipts can be downloaded & printed
- [ ] Dark mode works on all pages
- [ ] Mobile responsive (320px+)
- [ ] Smooth page transitions
- [ ] Toast notifications on all actions
- [ ] Search & filter on all list pages
- [ ] Excel/PDF export on reports
- [ ] Role-based access control

---

## 📦 Installation Commands

```bash
# Create project
npx create-next-app@latest . --typescript --tailwind --app

# Install dependencies
npm install framer-motion lucide-react react-hook-form zod @hookform/resolvers \
  @tanstack/react-table recharts date-fns sonner next-themes \
  @prisma/client next-auth bcryptjs jspdf html2canvas

npm install -D prisma @types/bcryptjs

# Setup shadcn/ui
npx shadcn@latest init
npx shadcn@latest add button card input label form select textarea \
  table dialog dropdown-menu sheet tabs toast badge avatar separator

# Setup Prisma
npx prisma init --datasource-provider sqlite
npx prisma migrate dev --name init
npx prisma db seed

# Run
npm run dev
```

---

## 🚀 Getting Started Instructions for Agent

1. Read this entire file before starting
2. Build in the **phase order** listed above
3. After each phase, **run the dev server** to verify
4. Use **TypeScript strict mode** — no `any` types
5. Follow the **folder structure** exactly
6. Every page must have **smooth Framer Motion transitions**
7. Every form must use **React Hook Form + Zod**
8. Every list must use **TanStack DataTable**
9. Every action must show a **Sonner toast**
10. Test **dark mode** on every page

---

## 📝 Notes

- Currency: Default ₹ (Indian Rupees) — make configurable
- Financial Year: April–March (India) — make configurable
- Compliance: 80G, FCRA fields for Indian NPOs
- All dates in `dd-MM-yyyy` format
- All amounts with 2 decimal places & comma separators