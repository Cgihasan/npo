# Aqaba Trust - Project Overview -

This document provides a comprehensive overview of the NPO (Non-Profit Organization) Accounting Management System. It is designed to track financial data (income, expenses, and asset/liability adjustments) using double-entry bookkeeping principles.

## 1. Technology Stack

- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript
- **Database**: SQLite (via Prisma ORM)
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui (Radix UI primitives)
- **Authentication**: NextAuth.js
- **PDF Generation**: jsPDF / html2canvas (for generating receipt/payment vouchers)
- **Icons**: Lucide React

## 2. Core Architecture & Design Patterns

The application follows a standard Server-Client architecture utilizing Next.js Server Actions:

- **Server Actions (`app/actions/*.ts`)**: All database operations (CRUD) are isolated in server actions. These functions run securely on the server and use Prisma `$transaction` blocks to ensure double-entry accounting integrity (e.g., when a receipt is created, both the Receipt record and the Ledger Transaction records are created atomically).
- **Double-Entry Bookkeeping**: Every financial event (Receipt, Payment, Contra, Journal) pushes records into a centralized `Transaction` table. This allows for a unified general ledger.
- **Client Components (`app/(dashboard)/**/\*.tsx`)**: The UI uses React hooks (`useState`, `useEffect`) to interact with Server Actions, managing state, modals (Dialogs), and real-time form validation.

## 3. Database Schema Overview

The database uses Prisma ORM. Key entities include:

- **User**: System users/admins.
- **Donor**: Individuals or organizations that contribute funds. Contains name, email, phone, pan, etc.
- **Vendor**: Suppliers or service providers being paid by the NPO.
- **Account**: The Chart of Accounts. Each account has a `type` (ASSET, LIABILITY, INCOME, EXPENSE, CASH, BANK) and a running `balance`.
- **Transaction**: The General Ledger. Links to an `Account`, has `debit` and `credit` amounts, and references the source voucher (`refType` like "RECEIPT", "PAYMENT", "CONTRA", "JOURNAL" and `refId`).
- **Receipt**: Incoming funds (Income). Linked to a `Donor` and an `Account` (Bank/Cash).
- **Payment**: Outgoing funds (Expense). Linked to a `Vendor` and an `Account`.
- **ContraEntry**: Transfers purely between Cash and Bank accounts.
- **JournalVoucher**: Non-cash transactions, adjustments, or complex multi-account entries (e.g., rent advance deductions, depreciation).

## 4. Key Modules & Features

### A. Dashboard (`/dashboard`)

- **Financial Summary**: Displays high-level metrics like Total Receipts, Total Payments, Total Cash/Bank balances.
- **Recent Activity**: A unified feed showing the latest Receipts, Payments, and Journal Vouchers.

### B. Receipts (`/receipts`)

- **Purpose**: Record incoming donations or other income.
- **Features**:
  - Create new receipts (auto-generates sequential Receipt Nos like `RCP-2026-001`).
  - PDF Export: Generate printable Receipt Vouchers for donors.
  - Search and filter by Donor, Date, and Type.
  - Bulk Delete: Select multiple receipts and delete them simultaneously (automatically reverses ledger transactions).

### C. Payments (`/payments`)

- **Purpose**: Record outgoing expenses.
- **Features**:
  - Track payments to specific vendors.
  - Record payment modes (Cash, Cheque, RTGS/NEFT).
  - Auto-generates sequential Payment Vouchers.

### D. Contra Entries (`/contra`)

- **Purpose**: Internal transfers between Cash and Bank (e.g., Cash deposited into the Bank, or Cash withdrawn from the Bank).
- **Features**:
  - Simple form to select "From Account" and "To Account" (filtered to only show Cash/Bank accounts).

### E. Journal Vouchers (`/journal`)

- **Purpose**: Handle accounting scenarios that don't fit into standard receipts/payments.
- **Features**:
  - Dynamic multi-row grid to input complex debits and credits.
  - Strict validation: The system enforces that Total Debits must exactly equal Total Credits before saving.
  - Real-world uses: Rent advances, security deposit adjustments, correcting entries, depreciation.

### F. Reports & Ledgers (`/reports` & `/accounts`)

- **Accounts Page**: View the Chart of Accounts and the current running balance of each account.
- **Ledger View**: Click into any account to see a chronological ledger (passbook view) of all transactions (debits/credits) affecting that account.
- **Financial Reports**: Overview of Income vs. Expense.

### G. Master Data Management (`/masters`)

- **Purpose**: Manage the core entities required for accounting.
- **Features**:
  - Tabbed interface for Donors, Vendors, and Accounts.
  - Full CRUD (Create, Read, Update, Delete) capabilities.
  - Safety checks: Prevents deletion of a master record if it is currently being referenced by an existing transaction.

## 5. Typical Workflows & Scenarios Supported

1. **Standard Donation**:
   - User goes to Receipts -> Selects Donor -> Selects Bank Account -> Enters Amount -> Saves. (System Debits Bank, Credits Donation Income).
2. **Paying a Bill**:
   - User goes to Payments -> Selects Vendor -> Selects Cash Account -> Enters Amount. (System Credits Cash, Debits Expense).
3. **Complex Refund / Security Deposit**:
   - User goes to Journal -> Debits Bank (for cash returned), Debits Repair Expense (for damages withheld), Credits Rent Advance (to clear the asset).

## 6. Future Integration Considerations (For NotebookLM Discussions)

When discussing new features, consider the following constraints and architecture rules of this app:

- **Double-Entry Rule**: Any new financial feature MUST generate balanced `Transaction` entries (Debits = Credits).
- **Server Components**: Keep complex logic and database writes in `app/actions/`.
- **State Management**: The app relies heavily on `revalidatePath` to refresh server components rather than using complex global client-side state (like Redux).
