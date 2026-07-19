# iRemainder — اقساط یار

A mobile-friendly installment-reminder web app for stores that sell on
installments. The operator opens it each day to see **which customers have
an installment due today (or overdue)**, with their phone number and amount,
and can call them, send a templated SMS, or mark the installment paid.

Persian (Farsi) UI, RTL layout, Jalali (Shamsi) calendar, Rial currency,
system dark mode.

Built with Next.js 16 (App Router), Tailwind v4, Prisma + SQLite,
dayjs + jalaliday, iron-session, and Motion. See [`CONTEXT.md`](./CONTEXT.md)
for the domain glossary and [`docs/adr/`](./docs/adr) for the key decisions.

---

## What it does

- **Year overview** — 12 Jalali months at a glance. A dot appears on any day
  with an **unpaid** installment due. Fully-paid days are clean.
- **Day sheet** — tap a day → an Apple-style spring bottom sheet lists every
  installment due that day, with name / phone / amount and Call · SMS · Paid.
- **Today's action list** — pinned to the top of the home screen: every
  unpaid installment due today or earlier, most-overdue first, with a
  "X روز تأخیر" (X days late) badge.
- **Customers** — search, create a new plan (auto-generates N monthly
  installments from total amount + start date + count), and a per-customer
  detail page showing every installment's status.
- **Settings** — edit the app-wide SMS template with placeholders
  `{name}`, `{amount}`, `{dueDate}`, `{installmentNo}`, `{totalInstallments}`.

## Getting started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

Copy `.env.example` to `.env` and set two secrets:

```bash
cp .env.example .env
```

- `OPERATOR_PASSWORD_HASH` — SHA-256 hex of your chosen password. Generate with:
  ```bash
  node -e "import('node:crypto').then(c=>console.log(c.createHash('sha256').update('YOUR_PASSWORD').digest('hex')))"
  ```
  The default in `.env` is the hash of `admin123` — **change it before real use**.
- `SESSION_SECRET` — a 32-byte random hex string. Generate with:
  ```bash
  node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
  ```

### 3. Set up the database

```bash
npm run db:migrate    # create the SQLite file + tables
npm run db:seed       # seed 5 sample customers with installments near today
```

### 4. Run

```bash
npm run dev
```

Open <http://localhost:3000>, log in with `admin123` (or your chosen password).

## Scripts

| Script | What it does |
| --- | --- |
| `npm run dev` | Start the dev server (Turbopack) |
| `npm run build` | Production build |
| `npm run start` | Run the production build |
| `npm run db:migrate` | Apply Prisma migrations |
| `npm run db:seed` | Seed sample data |
| `npm run db:reset` | Wipe + migrate + seed (dev convenience) |
| `npm run db:studio` | Open Prisma Studio (GUI DB browser) |

## Backups

The entire database is a single file at `prisma/dev.db`. **Copying that file
is a complete backup.** For real deployments, schedule a periodic copy.

## Tech & architecture

| Layer | Choice | Why |
| --- | --- | --- |
| Framework | Next.js 16, App Router, TypeScript | — |
| Styling | Tailwind v4 (system dark mode via `prefers-color-scheme`) | No theme flash |
| DB | SQLite + Prisma 6 | Local file, zero services. See [ADR 0002](./docs/adr/0002-sqlite-prisma-single-store.md) |
| Dates | dayjs + jalaliday + custom grid | Jalali math with full layout control. See [ADR 0003](./docs/adr/0003-jalali-dayjs-custom-grid.md) |
| Auth | SHA-256 env hash + iron-session | Single shared operator password. See [ADR 0001](./docs/adr/0001-shared-password-sha256-auth.md) |
| Icons | `@heroicons/react` | — |
| Motion | Motion (spring sheet, drag-to-dismiss) | Apple-style interruptible physics |

## Project layout

```
src/
├── app/
│   ├── (auth)/login/          # login page (public)
│   ├── (app)/                 # authenticated routes
│   │   ├── page.tsx           # home: today list + year overview
│   │   ├── customers/         # list, /new, /[id]
│   │   └── settings/          # SMS template + logout
│   └── actions/               # server actions (auth-checked)
├── components/
│   ├── calendar/              # YearOverview, MiniMonth, DaySheet, TodayList
│   ├── ui/                    # Button, TopBar, Field
│   └── InstallmentRow.tsx
├── lib/                       # prisma, session, auth, jalali, sms, plans, queries
└── proxy.ts                   # auth guard (Next.js "proxy", formerly middleware)
prisma/
├── schema.prisma
└── seed.ts
docs/adr/                      # architectural decisions
CONTEXT.md                     # domain glossary
```

## SMS

The SMS button opens the device's native SMS app (via an `sms:` URI) with
the template pre-filled. iRemainder does **not** send SMS directly — that
would require a paid gateway (Kavenegar / Farapayamak). The send path is
isolated in `src/lib/sms.ts`, so a gateway can be added later without
touching the UI.

## Out of scope (by design)

- No multi-operator accounts (single shared password).
- No SMS gateway (native `sms:` only).
- No payments — only a manual Paid toggle.
- No customer self-service portal — operator-only.
