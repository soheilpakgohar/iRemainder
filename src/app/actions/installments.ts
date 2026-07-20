"use server";

import { revalidatePath } from "next/cache";
import { requireOperator } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getInstallmentsForDay, getUnpaidDueCounts } from "@/lib/queries";
import type { InstallmentWithRelations } from "@/lib/queries";
import { dayjs } from "@/lib/jalali";
import { getSmsTemplates } from "./settings";
import type { SmsTemplate } from "@prisma/client";

/** One row as returned to the day sheet. No longer carries a template —
 *  templates are returned separately so the picker can list them. */
export type DayItem = InstallmentWithRelations & {
  daysLate: number;
};

/** Fetch all installments (any paid state) for a given Gregorian ISO day,
 *  plus the full SMS template list (fetched once, not per-row). */
export async function fetchDayAction(iso: string): Promise<{
  items: DayItem[];
  templates: SmsTemplate[];
}> {
  await requireOperator();

  const [rows, templates] = await Promise.all([
    getInstallmentsForDay(iso),
    getSmsTemplates(),
  ]);

  const todayStart = dayjs().startOf("day");

  const items: DayItem[] = rows.map((r) => ({
    ...r,
    daysLate: todayStart.diff(dayjs(r.dueDate).startOf("day"), "day"),
  }));

  return { items, templates };
}

/** Toggle an installment's paid state. */
export async function togglePaidAction(id: string, paid: boolean): Promise<void> {
  await requireOperator();
  await prisma.installment.update({
    where: { id },
    data: { paid, paidAt: paid ? new Date() : null },
  });
  revalidatePath("/", "page");
}

/**
 * Refetch unpaid-due counts for a Jalali year. Called from the client when
 * the operator navigates to a different year/month, so dots stay correct on
 * every navigated-to year (the initial page load only fetches current year).
 *
 * Returns a plain Record (not a Map) because server-action results cross
 * the wire as JSON. The client reconstructs the Map.
 */
export async function fetchYearCountsAction(
  year: number,
): Promise<Record<string, number>> {
  await requireOperator();
  const counts = await getUnpaidDueCounts(year);
  return Object.fromEntries(counts);
}

