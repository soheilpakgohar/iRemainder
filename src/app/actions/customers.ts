"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireOperator } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * Delete a customer and everything under them — plans and installments
 * cascade via onDelete: Cascade in the schema (see schema.prisma), so a
 * single customer.delete removes all related rows.
 *
 * Invoked via `<form action>`: reads `id` from formData. After deletion we
 * redirect back to the customers list (the detail page no longer exists).
 */
export async function deleteCustomerAction(formData: FormData): Promise<void> {
  await requireOperator();
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  await prisma.customer.delete({ where: { id } });

  revalidatePath("/", "layout");
  redirect("/customers");
}
