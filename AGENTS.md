# AGENTS.md

Persian (Farsi, RTL) installment-reminder web app for a single store operator.
Next.js 16 (App Router) · React 19 · Tailwind v4 · Prisma 6 + SQLite ·
dayjs + jalaliday · iron-session · Motion · Heroicons.

Read [`CONTEXT.md`](./CONTEXT.md) for the domain glossary and [`docs/adr/`](./docs/adr)
for the three irreversible decisions before touching auth, DB, or the calendar.

## Commands

```bash
npm run dev          # dev server (Turbopack), http://localhost:3000
npm run build        # production build (also typechecks)
npm run lint         # eslint
npm run db:migrate   # apply Prisma migrations
npm run db:seed      # seed 5 sample customers anchored near today
npm run db:reset     # wipe + migrate + seed (dev convenience)
npm run db:studio    # Prisma Studio GUI
```

Login dev password: `admin123` (hash in `.env` `OPERATOR_PASSWORD_HASH`).
Generate a new hash with the one-liner in `.env.example`.

## Architecture boundaries

- **`src/app/(app)/*`** — authenticated routes. Guarded by `src/proxy.ts`
  AND every server action calls `requireOperator()`. Keep both in sync.
- **`src/app/(auth)/login`** — the only public route.
- **`src/app/actions/*`** — `"use server"` mutation/fetch actions. Every
  mutation MUST call `requireOperator()` first. Fetch actions (e.g.
  `fetchDayAction`) are called from client components.
- **`src/lib/`** — pure(ish) helpers. `prisma.ts` (singleton client),
  `session.ts` + `auth.ts` (iron-session + SHA-256), `jalali.ts` (calendar),
  `queries.ts` (DB reads), `plans.ts` (installment auto-generation),
  `sms.ts` (template render + `sms:` URI).
- **`src/components/calendar/`** — the bespoke Jalali calendar. Owns the
  dot rule: a day shows a dot **iff ≥1 unpaid installment is due that day**.
  Optimistic dot removal lives in `YearOverview.tsx` (`useOptimistic`).
- **`src/proxy.ts`** — Next.js 16 renamed `middleware.ts` → `proxy.ts`;
  the exported function MUST be named `proxy` (not `middleware`).

## Conventions

- **Imports:** use the `@/*` alias (`@/lib/...`, `@/components/...`).
- **Dates:** store `dueDate` as ISO at **noon UTC** (avoids TZ day-flips).
  Calendar cells and the dot query key off **Gregorian ISO day**
  (`gregorianIso()` / `isoDayKey()`), never the jalali-format string.
- **Jalali formatting:** use `formatJalali(date, "D MMMM YYYY")` from
  `lib/jalali.ts`. **Do NOT call jalaliday's `.format()`** on a
  `.calendar('jalali')`-converted date — it throws
  `Cannot read properties of undefined` because the internal `$jM` is only
  set when a date is parsed with `{ jalali: true }`. See ADR 0003.
- **Forms:** use `useActionState` from `react` (NOT the deprecated
  `useFormState` from `react-dom`). `useFormStatus` stays on `react-dom`.
- **Tailwind tokens:** colors and radii are auto-generated shorthands from
  `@theme` in `globals.css` — use `bg-surface-elevated`, `text-fg-tertiary`,
  `border-separator`, `rounded-card`, `shadow-card`, etc. Do NOT write
  `bg-[var(--bg-elevated)]` or `bg-bg-elevated` (the latter collides with
  the `bg-` prefix — that's why tokens are named `surface*`, not `bg*`).
  Dark mode is `prefers-color-scheme` driven (no `.dark` class).
- **Persian UI:** `dir="rtl"` + `lang="fa"` on `<html>`. Persian digits via
  `toPersianDigits()`, Rial amounts via `formatRial()`. Phone numbers stay
  LTR (`dir="ltr"`).
- **Motion:** the `DaySheet` is an Apple-style spring bottom sheet
  (damping 30 / stiffness 350, drag-to-dismiss with velocity handoff,
  rubber-band at top). Respect `prefers-reduced-motion` (handled globally).

## Gotchas

- **Prisma is pinned to v6, not v7.** v7 mandates driver adapters and moves
  `url` out of `schema.prisma`. Do not upgrade without migrating the
  datasource config. See ADR 0002.
- **`next dev` + edited shared lib** (e.g. `jalali.ts`): if a fix doesn't
  show up, wipe `.next` and restart — Turbopack caches shared modules
  aggressively.
- **`getIronSession` in `proxy.ts`** must re-declare the session options —
  it cannot import from `lib/session.ts` (which uses `next/headers`,
  server-only).
- **Backups:** the whole DB is one file (`prisma/dev.db`). Copying it is a
  full backup.
