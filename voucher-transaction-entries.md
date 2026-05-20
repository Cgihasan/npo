# Voucher Transaction Entries Documentation

This document details the structure, fields, validation rules, and accounting impact (ledger entries) for all voucher types in the NPO Accounting Application.

## 1. Receipt Voucher
**Purpose:** Records incoming funds from donors or other sources.

### Fields & Data Structure
| Field | Type | Description | Validation |
| :--- | :--- | :--- | :--- |
| `receiptNo` | String | Unique identifier. Auto-generated. | Format: `RCP-YYYY-NNN` (e.g., `RCP-2024-001`) |
| `date` | DateTime | Date of the transaction. | Required |
| `donorId` | String? | ID of the donor (optional). | Nullable |
| `type` | String | Income Ledger name (e.g., "General Donation"). | Required |
| `category` | String? | Income Category (e.g., "Direct Incomes"). | Defaults to "Direct Incomes" |
| `accountType` | String? | Alias for `type`. | Required |
| `eventName` | String? | Tag for specific fundraising events. | Optional |
| `amount` | Float | Amount received. | Must be > 0 |
| `paymentMode` | String | Method of payment. | Enum: `Cash`, `Cheque`, `Bank Transfer`, `UPI`, `Card` |
| `referenceNo` | String? | Reference number (e.g., UTR, Check No.). | Optional |
| `accountId` | String | Asset Account ID where funds are deposited. | Required (Must be CASH or BANK type) |
| `narration` | String? | Description of the receipt. | Optional |

### Accounting Impact (Ledger Entries)
When a Receipt is created, two transaction entries are posted to the ledger:
1.  **Debit**: Asset Account (`accountId`) - Increases Cash/Bank balance.
2.  **Credit**: Income Account (`type`/`accountType`) - Increases Income balance.

---

## 2. Payment Voucher
**Purpose:** Records outgoing funds for expenses or liabilities.

### Fields & Data Structure
| Field | Type | Description | Validation |
| :--- | :--- | :--- | :--- |
| `voucherNo` | String | Unique identifier. Auto-generated. | Format: `PV-YYYY-NNN` (e.g., `PV-2024-001`) |
| `date` | DateTime | Date of the transaction. | Required |
| `type` | String | Expense Ledger name (e.g., "Office Rent"). | Required |
| `category` | String? | Expense Category (e.g., "Indirect Expenses"). | Defaults to "Indirect Expenses" |
| `accountType` | String? | Alias for `type`. | Required |
| `amount` | Float | Amount paid. | Must be > 0 |
| `paymentMode` | String | Method of payment. | Enum: `Cash`, `Cheque`, `Bank Transfer`, `UPI` |
| `chequeNo` | String? | Cheque number (if applicable). | Optional |
| `bankName` | String? | Name of the bank (if applicable). | Optional |
| `accountId` | String | Asset Account ID from which funds are paid. | Required (Must be CASH or BANK type) |
| `narration` | String? | Description of the payment. | Optional |
| `status` | String | Current status of the voucher. | Default: `PENDING` |

### Accounting Impact (Ledger Entries)
When a Payment is created, two transaction entries are posted to the ledger:
1.  **Debit**: Expense Account (`type`/`accountType`) - Increases Expense balance.
2.  **Credit**: Asset Account (`accountId`) - Decreases Cash/Bank balance.

---

## 3. Contra Entry
**Purpose:** Records transfers between Cash and Bank accounts (or vice versa).

### Fields & Data Structure
| Field | Type | Description | Validation |
| :--- | :--- | :--- | :--- |
| `entryNo` | String | Unique identifier. | Format: `CON-YYYY-NNN` |
| `date` | DateTime | Date of the transfer. | Required |
| `transferType` | String | Direction of transfer. | Enum: `CASH_TO_BANK`, `BANK_TO_CASH` |
| `fromAccountId` | String | Source Asset Account ID. | Required |
| `toAccountId` | String | Destination Asset Account ID. | Required |
| `amount` | Float | Amount transferred. | Must be > 0 |
| `reference` | String? | Reference details (e.g., Deposit Slip No.). | Optional |
| `narration` | String? | Description of the transfer. | Optional |

### Accounting Impact (Ledger Entries)
Contra entries affect two asset accounts simultaneously:

**Case A: Cash to Bank (`CASH_TO_BANK`)**
1.  **Credit**: Cash Account (`fromAccountId`) - Decreases Cash balance.
2.  **Debit**: Bank Account (`toAccountId`) - Increases Bank balance.

**Case B: Bank to Cash (`BANK_TO_CASH`)**
1.  **Credit**: Bank Account (`fromAccountId`) - Decreases Bank balance.
2.  **Debit**: Cash Account (`toAccountId`) - Increases Cash balance.

---

## 4. Journal Voucher
**Purpose:** Records complex accounting adjustments involving multiple accounts.

### Fields & Data Structure
| Field | Type | Description | Validation |
| :--- | :--- | :--- | :--- |
| `voucherNo` | String | Unique identifier. Auto-generated. | Format: `JV-YYYY-NNN` (e.g., `JV-2024-001`) |
| `date` | DateTime | Date of the entry. | Required |
| `narration` | String? | Description of the journal entry. | Optional |
| `entries` | Array | List of account impacts. | See Entry Structure below |

#### Entry Structure
Each entry in the `entries` array contains:
-   `accountId`: The account being debited or credited.
-   `debit`: Amount to debit (must be 0 if credit > 0).
-   `credit`: Amount to credit (must be 0 if debit > 0).

### Validation Rules
-   **Balancing**: Total Debits must equal Total Credits (within a tolerance of 0.01).
-   **Non-Zero**: Total amount cannot be zero.
-   **Account Selection**: Every entry must have a valid account selected.

### Accounting Impact (Ledger Entries)
Journal vouchers create multiple transaction records based on the `entries` array:
-   For each entry with `debit > 0`: **Debit** the specified `accountId`.
-   For each entry with `credit > 0`: **Credit** the specified `accountId`.

---

## 5. Common Reference Data

### Account Types Used in Vouchers
-   **Asset (CASH/BANK)**: Used for `accountId` in Receipts/Payments and `fromAccountId`/`toAccountId` in Contra entries.
-   **Income**: Used for `type` in Receipts.
-   **Expense**: Used for `type` in Payments.
-   **General Ledger**: Any account can be used in Journal Vouchers.

### Transaction Model
All voucher types ultimately create records in the `Transaction` table, which serves as the general ledger.
-   `refType`: Indicates the source voucher type (`RECEIPT`, `PAYMENT`, `CONTRA`, `JOURNAL`).
-   `refId`: Links the transaction back to the specific voucher ID.
