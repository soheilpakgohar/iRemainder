# ADR 0003 — dayjs + jalaliday + custom calendar grid (not a calendar package)

- **Status:** Accepted
- **Date:** 2026-07-19

## Context

The UI is Persian, so the "whole year of installment due dates" the user
asked for must be a **Jalali (Shamsi)** year — Farvardin..Esfand,
Saturday-first week, Persian digits. The calendar has a bespoke layout:
12 compact month grids in a 2-column scroll, with a dot on each day that
has an unpaid installment due, and a bottom sheet on tap.

## Decision

Use **`dayjs` + the `jalaliday` plugin** for Jalali date math, and **build
the calendar grid ourselves in Tailwind** (`src/lib/jalali.ts` `monthGrid`
+ `src/components/calendar/`).

- `dayjs` handles parsing, arithmetic, and weekday/month getters.
- `jalaliday` adds the Jalali calendar (`.calendar('jalali')`, `.year()`,
  `.month()`, `.date()`, `.daysInMonth()`).
- Our `monthGrid()` builds the 6×7 cell array for a Jalali month and tags
  each cell with a **Gregorian ISO day key** — because the database stores
  `dueDate` as an ISO timestamp and the dot query keys off Gregorian days.
- Our `formatJalali()` formats dates using the **getter methods + our own
  month/weekday name arrays**, deliberately *not* using jalaliday's
  `.format()` (see "Gotcha" below).

## Alternatives considered

1. **A React Jalali calendar package** (`react-jalali`, `react-multi-date-picker`,
   etc.). Rejected: their layout, styling, and Next.js 16/React 19
   compatibility vary, and none ships the exact "12 mini-months with
   due-day dots → tap → sheet" UX the user described. We'd be fighting the
   library's opinions and re-skinning it heavily. We need full control of
   the cell rendering to place dots, the today highlight, and the RTL grid.

2. **`Intl.DateTimeFormat` with the `persian` calendar.** Works for
   formatting a single date, but gives no date arithmetic (add days,
   days-in-month, weekday-of-first-of-month) — which `monthGrid` needs.
   Pairing it with a separate date-math library is more moving parts than
   dayjs+jalaliday.

## Gotcha worth recording

`jalaliday`'s `.format('MMMM')` reads an internal `$jM` that is **only
populated when a date is parsed in jalali mode** (`{ jalali: true }`), not
when a Gregorian date is converted via `.calendar('jalali')`. So
`.format()` throws `Cannot read properties of undefined` on converted
dates. Our `formatJalali()` sidesteps this by using `.month()` / `.day()`
getters (which compute correctly) plus our own `PERSIAN_MONTHS` /
`PERSIAN_WEEKDAY_NAMES` arrays. Similarly, `monthGrid` tags cells with
Gregorian ISO keys (via `gregorianIso`) rather than the jalali-format
string, so they match the database.

## Consequences

- **Hard to reverse:** the calendar is ~300 lines of bespoke JSX/TS. But
  it's the product's centerpiece, so owning it is the point — not a cost.
- **Two timezone disciplines to remember:** (1) store `dueDate` at noon UTC
  to avoid day-flips; (2) `gregorianIso` uses local `getDate()` for the day
  key, and the dot query uses the same local-day convention. Both must stay
  local-time-consistent.
- **Surprising without context:** a reader might expect a calendar library
  and wonder why we hand-rolled it. This ADR records that the bespoke UX
  (dot = unpaid-due, year-of-mini-months, RTL) is the reason, and flags the
  jalaliday `.format()` gotcha so nobody re-introduces it.
