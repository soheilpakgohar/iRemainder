import { prisma } from "./prisma";
import { dayjs, isoDayKey } from "./jalali";
import type { Installment, Plan, Customer } from "@prisma/client";

/**
 * Data-access layer. Keeps Prisma queries out of components so the
 * calendar / sheet / forms stay pure and testable.
 */

export type InstallmentWithRelations = Installment & {
  plan: Plan & { customer: Customer };
};

/**
 * Map of "YYYY-MM-DD" (Gregorian ISO, local-day) → count of UNPAID
 * installments due that day. Days with zero unpaid are omitted.
 *
 * This powers the calendar dots: a dot shows iff count > 0.
 * Fully-paid days are absent → no dot.
 *
 * @param year  Jalali year (e.g. 1405)
 */
export async function getUnpaidDueCounts(year: number): Promise<Map<string, number>> {
  // Range covers the whole Jalali year (Farvardin 1 .. Esfand 29/30),
  // expressed in Gregorian ISO for the DB query.
  const start = dayjs()
    .calendar("jalali")
    .locale("fa")
    .year(year)
    .month(0)
    .date(1)
    .startOf("day");
  // Esfand has 29 or 30 days; use month(11).endOf('month') to be exact.
  const end = start.month(11).endOf("month").endOf("day");

  const rows = await prisma.installment.findMany({
    where: {
      paid: false,
      dueDate: {
        gte: start.toDate(),
        lte: end.toDate(),
      },
    },
    select: { dueDate: true },
  });

  const counts = new Map<string, number>();
  for (const r of rows) {
    const key = isoDayKey(r.dueDate);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return counts;
}

/**
 * All installments due on a given Gregorian day (any paid state),
 * including overdue ones when the day is "today" (caller decides).
 * Sorted: unpaid-first, then by customer name.
 */
export async function getInstallmentsForDay(
  dayIso: string,
): Promise<InstallmentWithRelations[]> {
  // dayIso is "YYYY-MM-DD"; query the full 24h window in UTC-offset local time.
  const start = dayjs(dayIso).startOf("day").toDate();
  const end = dayjs(dayIso).endOf("day").toDate();

  return prisma.installment.findMany({
    where: { dueDate: { gte: start, lte: end } },
    include: { plan: { include: { customer: true } } },
    orderBy: [{ paid: "asc" }, { plan: { customer: { fullName: "asc" } } }],
  });
}

/**
 * Today's actionable list: every unpaid installment with dueDate <= now.
 * Sorted oldest-due first (most overdue first), then by name.
 * Each row includes daysLate for the overdue badge.
 */
export async function getTodaysActionList(): Promise<
  Array<InstallmentWithRelations & { daysLate: number }>
> {
  const now = new Date();
  const rows = await prisma.installment.findMany({
    where: { paid: false, dueDate: { lte: now } },
    include: { plan: { include: { customer: true } } },
    orderBy: [{ dueDate: "asc" }, { plan: { customer: { fullName: "asc" } } }],
  });

  const todayStart = dayjs().startOf("day");
  return rows.map((r) => ({
    ...r,
    daysLate: todayStart.diff(dayjs(r.dueDate).startOf("day"), "day"),
  }));
}

/** Count of unpaid installments due today or earlier — for the nav badge. */
export async function getTodayActionCount(): Promise<number> {
  return prisma.installment.count({
    where: { paid: false, dueDate: { lte: new Date() } },
  });
}

/** Current Jalali year (so the overview defaults to the right year). */
export function currentJalaliYear(): number {
  return dayjs().calendar("jalali").locale("fa").year();
}

/** Current Jalali month index, 0-based (0 = Farvardin). For the mobile
 *  single-month view to open on "today's month". */
export function currentJalaliMonth(): number {
  return dayjs().calendar("jalali").locale("fa").month();
}

/** Current Jalali year + month names for header display. */
export function currentJalaliMonthName(): string {
  const months = [
    "فروردین", "اردیبهشت", "خرداد", "تیر", "مرداد", "شهریور",
    "مهر", "آبان", "آذر", "دی", "بهمن", "اسفند",
  ];
  return months[dayjs().calendar("jalali").locale("fa").month()];
}
