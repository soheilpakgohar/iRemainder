import dayjs from "dayjs";
import jalaliday from "jalaliday/dayjs";
import localeFa from "dayjs/locale/fa";

// Extend once — all dayjs instances can switch calendar via .calendar('jalali').
dayjs.extend(jalaliday);
dayjs.locale("fa", localeFa);

// Calendar-extended dayjs for Jalali use.
export { dayjs };

// Persian (Saturday-first) week order. dayjs `.day()`: 0=Sun..6=Sat.
// We want Saturday first, so the column order is: Sat(6), Sun(0), Mon(1)...
export const PERSIAN_WEEKDAYS = [6, 0, 1, 2, 3, 4, 5] as const;

// Short Persian weekday labels (Sat..Fri).
export const PERSIAN_WEEKDAY_LABELS = ["ش", "ی", "د", "س", "چ", "پ", "ج"] as const;

// Full Persian weekday names, indexed by Gregorian `.day()` (0=Sun..6=Sat).
// Used because jalaliday's `.format('dddd')` reads an internal that isn't
// reliably set after `.calendar()` conversion.
export const PERSIAN_WEEKDAY_NAMES = [
  "یکشنبه", // Sun (0)
  "دوشنبه", // Mon (1)
  "سه‌شنبه", // Tue (2)
  "چهارشنبه", // Wed (3)
  "پنجشنبه", // Thu (4)
  "جمعه", // Fri (5)
  "شنبه", // Sat (6)
] as const;

// Persian month names (Jalali), Farvardin..Esfand.
export const PERSIAN_MONTHS = [
  "فروردین",
  "اردیبهشت",
  "خرداد",
  "تیر",
  "مرداد",
  "شهریور",
  "مهر",
  "آبان",
  "آذر",
  "دی",
  "بهمن",
  "اسفند",
] as const;

/** Wrap a date as a Jalali-calendar dayjs (Persian locale, fa digits via format). */
export function jalali(
  date: Date | string | number = new Date(),
  options?: { jalali?: boolean },
) {
  return dayjs(date, options).calendar("jalali").locale("fa");
}

/**
 * Format a Jalali date WITHOUT relying on jalaliday's `.format()`, which
 * reads an internal `$jM`/`$jD` that isn't reliably set after `.calendar()`
 * conversion. We use the getter methods (which compute correctly) and our
 * own month/weekday name arrays.
 *
 * Tokens: "D" = day, "MMMM" = month name, "YYYY" = year, "dddd" = weekday.
 */
export function formatJalali(
  date: Date | string | number,
  template: string,
): string {
  const j = jalali(date);
  return template
    .replace(/dddd/g, PERSIAN_WEEKDAY_NAMES[j.day() as Day])
    .replace(/MMMM/g, PERSIAN_MONTHS[j.month() as Month])
    .replace(/YYYY/g, toPersianDigits(j.year()))
    .replace(/DD/g, toPersianDigits(String(j.date()).padStart(2, "0")))
    .replace(/D/g, toPersianDigits(j.date()));
}

type Day = 0 | 1 | 2 | 3 | 4 | 5 | 6;
type Month = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11;

/** Convert a Western digit string/number to Persian digits (۰-۹). */
export function toPersianDigits(value: string | number): string {
  const persian = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
  return String(value).replace(/\d/g, (d) => persian[Number(d)]);
}

/** Format an amount in Rial with thousands separators + Persian digits. */
export function formatRial(amount: number): string {
  return toPersianDigits(amount.toLocaleString("en-US"));
}

/**
 * Build the grid of days for one Jalali month.
 * Returns an array of 42 cells (6 weeks × 7 days); empty cells are null.
 * Each non-null cell is { day: number, iso: string } where iso is the
 * Gregorian ISO date at local noon (used to match installment dueDates).
 */
export function monthGrid(
  jalaliYear: number,
  jalaliMonth: number, // 0-indexed (0 = Farvardin)
): Array<{ day: number; iso: string; date: Date } | null> {
  // First day of the Jalali month.
  const firstOfMonth = jalali(`${jalaliYear}-${String(jalaliMonth + 1).padStart(2, "0")}-01`, {
    jalali: true,
  });
  const daysInMonth = firstOfMonth.daysInMonth();

  // `.day()` on a jalali dayjs returns the Gregorian weekday (0=Sun..6=Sat).
  // Map it to our Saturday-first column index.
  const firstWeekdayGregorian = firstOfMonth.day(); // 0..6
  const leadingBlanks = PERSIAN_WEEKDAYS.indexOf(
    firstWeekdayGregorian as (typeof PERSIAN_WEEKDAYS)[number],
  );

  const cells: Array<{ day: number; iso: string; date: Date } | null> = [];

  for (let i = 0; i < leadingBlanks; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    const cellDate = firstOfMonth.set("date", d);
    cells.push({
      day: d,
      // Gregorian ISO (NOT the jalali-format string) so it matches DB/counts keys.
      iso: gregorianIso(cellDate.toDate()),
      date: cellDate.toDate(),
    });
  }
  while (cells.length % 7 !== 0) cells.push(null);
  // Pad to 42 for a stable 6-row grid.
  while (cells.length < 42) cells.push(null);
  return cells;
}

/**
 * Returns a stable YYYY-MM-DD (Gregorian) key for a Date.
 * IMPORTANT: uses a plain (gregorian) dayjs — NOT a jalali-calendar one,
 * which would format the Jalali date instead. Used to match DB/counts keys.
 */
export function gregorianIso(date: Date): string {
  // Construct a fresh gregorian dayjs to avoid inheriting the jalali calendar.
  const d = new Date(date);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Alias kept for readability at call sites that mean "the day key". */
export const isoDayKey = gregorianIso;

/** Whole number of days between two dates (a - b), ignoring time. */
export function daysBetween(a: Date, b: Date): number {
  const startOfDay = (d: Date) => dayjs(d).startOf("day");
  return startOfDay(a).diff(startOfDay(b), "day");
}
