# NPO Management System

A web-based accounting and management system for Non-Profit Organizations built with Next.js, Prisma, Neon (PostgreSQL), and NextAuth.

## Features

- **Dashboard** — KPI overview, cash/bank balances, recent transactions
- **Receipts** — Record and manage incoming donations with voucher printing
- **Payments** — Record and manage outgoing payments with voucher printing
- **Journal Vouchers** — General journal entries for complex transactions
- **Contra Entries** — Bank-to-cash and cash-to-bank transfers
- **Masters** — Manage accounts, donors, and vendors
- **Reports** — Receipts & Payments Statement filtered by date range
- **User Management** — Admin panel for managing users (ADMIN/VIEWER roles, disable/re-enable)
- **Authentication** — Email/password login, signup, and password reset flow

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | [Next.js 15](https://nextjs.org/) (App Router) |
| Database | [Neon](https://neon.tech/) (Serverless PostgreSQL) |
| ORM | [Prisma](https://www.prisma.io/) with `@prisma/adapter-neon` |
| Auth | [NextAuth v5](https://next-auth.js.org/) with JWT sessions |
| Email | [Nodemailer](https://nodemailer.com/) (SMTP) |
| UI | [shadcn/ui](https://ui.shadcn.com/) + Tailwind CSS |
| Font | [Geist](https://vercel.com/font) |

## Getting Started

### 1. Clone and install

```bash
git clone <repo-url> npo
cd npo
npm install
```

### 2. Environment Variables

Copy the following into a `.env` file at the project root:

```env
# ─────────────────────────────────────────────
# Database (required)
# ─────────────────────────────────────────────
DATABASE_URL=postgresql://user:password@ep-xxx.us-east-1.aws.neon.tech/neondb?sslmode=require

# ─────────────────────────────────────────────
# Authentication (required)
# ─────────────────────────────────────────────
AUTH_SECRET=your-nextauth-secret-here

# ─────────────────────────────────────────────
# Email — Password Reset (optional; prints to console if unset)
# ─────────────────────────────────────────────
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your@email.com
SMTP_PASS=your-app-password
SMTP_FROM=noreply@yourorg.com

# ─────────────────────────────────────────────
# Base URL — Used in password reset email links (optional)
# Falls back to NEXT_PUBLIC_BASE_URL, then http://localhost:3000
# ─────────────────────────────────────────────
BASE_URL=https://your-app.vercel.app
```

#### Variable Reference

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | **Yes** | — | PostgreSQL connection string for Neon |
| `AUTH_SECRET` | **Yes** | — | NextAuth secret (generate with `openssl rand -base64 32`) |
| `SMTP_HOST` | No | — | SMTP server hostname |
| `SMTP_PORT` | No | `587` | SMTP server port |
| `SMTP_SECURE` | No | `false` | Use TLS (`true` for port 465, `false` for 587) |
| `SMTP_USER` | No | — | SMTP login username |
| `SMTP_PASS` | No | — | SMTP login password |
| `SMTP_FROM` | No | `noreply@npo.com` | "From" address for outgoing emails |
| `BASE_URL` | No | `http://localhost:3000` | Base URL for password reset links (takes priority) |
| `NEXT_PUBLIC_BASE_URL` | No | `http://localhost:3000` | Fallback base URL if `BASE_URL` is unset |

> **Without SMTP config**, password reset links are printed to the server console instead of being emailed.

### 3. Push the schema and seed

```bash
npx prisma migrate deploy
npx tsx prisma/seed.ts
```

This creates the database tables and seeds an admin user:

| Email | Password | Role |
|-------|----------|------|
| admin@npo.org | admin123 | ADMIN |

### 4. Start developing

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — you'll be redirected to the login page.

## Project Structure

```
app/
  (dashboard)/          # Authenticated routes (sidebar layout)
    dashboard/          # KPI dashboard
    receipts/           # Receipt management
    payments/           # Payment management
    journal/            # Journal vouchers
    contra/             # Contra entries
    masters/            # Accounts, Donors, Vendors
    reports/            # Receipts & Payments Statement
    users/              # Admin user management
  login/                # Login page
  signup/               # Signup page
  forgot-password/      # Request password reset
  reset-password/       # Complete password reset
  actions/              # Server actions (API logic)
  api/auth/             # NextAuth API route
components/
  forms/                # Form components (Receipt, Payment, Journal, etc.)
  layouts/              # Navbar, Sidebar
  reports/              # Report components
  receipts/             # ReceiptVoucher
  payments/             # PaymentVoucher
  ui/                   # shadcn/ui primitives
lib/
  auth.ts               # NextAuth configuration
  db.ts                 # PrismaClient singleton (lazy init via Proxy)
  email.ts              # Nodemailer SMTP utility
  utils.ts              # Shared utilities
prisma/
  schema.prisma         # Database schema
  seed.ts               # Admin user + test data seeder
  migrations/           # Prisma migrations
```

## Deployment

This app is designed to run on [Vercel](https://vercel.com). To deploy:

1. Push the repo to GitHub
2. Import the project in Vercel
3. Set all environment variables listed above in the Vercel dashboard
4. Deploy — Vercel will automatically run `npx prisma migrate deploy` during the build

## Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Start dev server |
| `npm run build` | Production build |
| `npx prisma migrate deploy` | Apply pending migrations |
| `npx prisma studio` | Open database browser |
| `npx tsx prisma/seed.ts` | Seed admin user and test data |
