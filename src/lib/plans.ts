import { jalali } from "./jalali";

/**
 * Plan auto-generation logic.
 *
 * Given a total amount, installment count, and start date, produce the
 * Installment rows for the plan. Recurrence is monthly.
 *
 * Amount distribution: floor(total/count) each, then add 1 to the first
 * (total % count) installments so the sum is exact — no rounding loss.
 *
 * Due dates: the SAME Jalali day-of-month each following month (start + i
 * Jalali months, day clamped at month end). This keeps a plan started on
 * e.g. the 10th on the 10th of every Jalali month. Arithmetic happens in the
 * Jalali calendar; the result is stored as a Gregorian Date at local noon to
 * avoid DST/TZ flips shifting the day.
 */

export interface GeneratedInstallment {
  number: number;
  dueDate: Date;
  amount: number;
}

export function generateInstallments(args: {
  totalAmount: number;
  count: number;
  startDate: Date;
  intervalDays: number;
}): GeneratedInstallment[] {
  const { totalAmount, count, startDate } = args;
  if (count <= 0) return [];

  const base = Math.floor(totalAmount / count);
  const remainder = totalAmount - base * count; // 0..count-1

  // Wrap as a Jalali-calendar instance so .add(i, "month") advances Jalali
  // months (same day-of-month each month, clamped at month end) rather than
  // Gregorian months, which drift the Jalali day. .toDate() returns the safe
  // Gregorian Date used for storage; noon avoids DST/TZ day flips.
  const start = jalali(startDate).startOf("day").hour(12);

  const out: GeneratedInstallment[] = [];
  for (let i = 0; i < count; i++) {
    out.push({
      number: i + 1,
      dueDate: start.add(i, "month").toDate(),
      amount: base + (i < remainder ? 1 : 0),
    });
  }
  return out;
}
