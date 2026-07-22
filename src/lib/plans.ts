import { dayjs } from "./jalali";

/**
 * Plan auto-generation logic.
 *
 * Given a total amount, installment count, start date, and interval in days
 * (default 30 = monthly), produce the Installment rows for the plan.
 *
 * Amount distribution: floor(total/count) each, then add 1 to the first
 * (total % count) installments so the sum is exact — no rounding loss.
 *
 * Due dates: startDate + i*intervalDays, normalized to local noon to avoid
 * DST/TZ flips shifting the day.
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
  const { totalAmount, count, startDate, intervalDays } = args;
  if (count <= 0) return [];

  const base = Math.floor(totalAmount / count);
  const remainder = totalAmount - base * count; // 0..count-1

  const start = dayjs(startDate).startOf("day").hour(12); // noon, stable

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
