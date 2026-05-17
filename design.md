# Aqaba Trust — NPO Accounting Management System

## 1. App Overview

- **Name**: Aqaba Trust — NPO Accounting Management System
- **Purpose**: Double-entry bookkeeping for non-profit organizations
- **Key Modules**: Receipts, Payments, Journal Vouchers, Contra Entries, Reports, Master Data

## 2. Page Inventory (15 pages)

| Page | Route | Key UI Elements |
|---|---|---|
| **Login** | `/login` | Email + Password form, centered card |
| **Dashboard** | `/dashboard` | 4 KPI cards (Receipts/Payments/Cash/Bank), Bar chart (Income vs Expenses), Recent Transactions list |
| **Receipts List** | `/receipts` | Data table with search, date/type filters, bulk delete, print voucher dialog |
| **Receipt Form** | `/receipts/new`, `/receipts/[id]/edit` | Receipt No (auto), Date, Donor picker, Income Ledger picker, Event Name, Amount, Payment Mode, Reference No, Deposit To picker, Narration |
| **Payments List** | `/payments` | Data table with search, date/type filters, print voucher dialog |
| **Payment Form** | `/payments/new`, `/payments/[id]/edit` | Voucher No (auto), Date, Expense Ledger picker, Amount, Payment Mode, Pay From picker, Narration |
| **Journal List** | `/journal` | Data table, view details dialog with debit/credit breakdown |
| **Journal Form** | `/journal/new` | Date, Narration, Dynamic ledger-entry grid (N rows with Account Picker + Debit + Credit), real-time balance validation, Add Row |
| **Contra List** | `/contra` | Data table |
| **Contra Form** | `/contra/new`, `/contra/[id]/edit` | Transfer Type (Cash↔Bank), animated direction indicator, Amount, Reference, Narration |
| **Masters** | `/masters` | Tabbed: Donors / Vendors / Accounts, each with CRUD dialogs |
| **Transaction History** | `/reports` | General ledger table (last 100 transactions) |
| **R&P Statement** | `/reports/receipts-payments-statement` | Period picker, two-column layout (RECEIPTS left / PAYMENTS right), totals footer |

## 3. Navigation Structure

- **Sidebar** (left): Dashboard, Receipts, Payments, Contra, Journal, Masters, Reports (collapsible), Settings
- **Top Navbar**: User name, Dark/Light toggle
- **Mobile**: Sheet-based drawer

## 4. Shared Components

- `JournalAccountPicker` — type-ahead with on-the-fly account creation (used in Receipt, Payment, Journal forms)
- `CalendarDatePicker` — popover calendar with month/year dropdowns
- `ReceiptVoucher` / `PaymentVoucher` — printable A4 voucher layouts
- `PageTransition` — framer-motion page animations

## 5. Data Model (8 tables)

- **User** — auth with roles (ADMIN/VIEWER)
- **Donor / Vendor** — master data
- **Account** — chart of accounts (CASH / BANK / INCOME / EXPENSE / ASSET / LIABILITY)
- **Receipt** — income transactions
- **Payment** — expense transactions
- **JournalVoucher** — multi-leg adjustments (N entries)
- **ContraEntry** — internal cash/bank transfers
- **Transaction** — unified general ledger (double-entry)

## 6. Double-Entry Flows

Every action creates balanced debit/credit pairs:
- **Receipt**: Debit Cash/Bank | Credit Income
- **Payment**: Debit Expense | Credit Cash/Bank
- **Journal**: N debit entries = N credit entries
- **Contra**: Credit Source | Debit Destination

## 7. Color System

- **Base**: Zinc (neutral), shadcn New York style, CSS variables in `oklch()`
- **Module colors**: Receipts = Emerald, Payments = Amber, Journal = Blue, Contra = Indigo
- **Accounting**: Income = Emerald (green), Expense = Amber (orange)
- **Dark/Light**: Full theme support via `next-themes`
- **Border radius**: 0.75rem (12px)

## 8. Current UI Pain Points (for redesign)

- Report date picker layout could be improved
- Forms could be more compact/modern
- Dashboard could have richer visualizations
- Mobile responsiveness could be better
- No consistent empty states / loading skeletons pattern
