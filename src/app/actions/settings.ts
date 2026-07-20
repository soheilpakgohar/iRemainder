"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireOperator } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { SmsTemplate } from "@prisma/client";

const TemplateSchema = z.object({
  id: z.string().optional(), // absent ⇒ create new
  name: z
    .string()
    .min(1, "نام الگو را وارد کنید")
    .max(50, "نام الگو بیش از حد طولانی است"),
  body: z
    .string()
    .min(1, "متن الگو نمی‌تواند خالی باشد")
    .max(1000, "متن الگو بیش از حد طولانی است"),
});

export type TemplateFormState = {
  error?: string;
  fieldErrors?: Partial<Record<keyof z.infer<typeof TemplateSchema>, string>>;
  ok?: boolean;
};

/** All templates, ordered by `order` then creation time. */
export async function getSmsTemplates(): Promise<SmsTemplate[]> {
  return prisma.smsTemplate.findMany({
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
  });
}

/**
 * Create or update a template (upsert by id). When creating (no id), the new
 * template gets order = (max existing order) + 1. isDefault is managed
 * separately by setDefaultSmsTemplateAction.
 */
export async function saveSmsTemplateAction(
  _prev: TemplateFormState,
  formData: FormData,
): Promise<TemplateFormState> {
  await requireOperator();

  const raw = {
    id: (formData.get("id") as string) || undefined,
    name: String(formData.get("name") ?? ""),
    body: String(formData.get("body") ?? ""),
  };

  const parsed = TemplateSchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: TemplateFormState["fieldErrors"] = {};
    for (const issue of parsed.error.issues) {
      const field = issue.path[0] as keyof typeof fieldErrors;
      if (field && !fieldErrors[field]) fieldErrors[field] = issue.message;
    }
    return { fieldErrors };
  }
  const d = parsed.data;

  if (d.id) {
    await prisma.smsTemplate.update({
      where: { id: d.id },
      data: { name: d.name, body: d.body },
    });
  } else {
    const maxOrder = await prisma.smsTemplate.aggregate({ _max: { order: true } });
    await prisma.smsTemplate.create({
      data: {
        name: d.name,
        body: d.body,
        order: (maxOrder._max.order ?? -1) + 1,
      },
    });
  }

  revalidatePath("/", "layout");
  return { ok: true };
}

/**
 * Delete a template. Guard: never delete the last remaining template (the
 * picker must always have at least one to send). If the deleted template was
 * the default, promote the lowest-order survivor to default.
 *
 * Invoked via `<form action>`: reads `id` from formData.
 */
export async function deleteSmsTemplateAction(formData: FormData): Promise<void> {
  await requireOperator();
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const count = await prisma.smsTemplate.count();
  if (count <= 1) return; // keep at least one

  const deleted = await prisma.smsTemplate.delete({ where: { id } });

  // If we removed the default, mark another as default so there's always one.
  if (deleted.isDefault) {
    const survivor = await prisma.smsTemplate.findFirst({
      orderBy: [{ order: "asc" }, { createdAt: "asc" }],
    });
    if (survivor) {
      await prisma.smsTemplate.update({
        where: { id: survivor.id },
        data: { isDefault: true },
      });
    }
  }

  revalidatePath("/", "layout");
}

/** Mark one template as the default; un-set all others (single transaction).
 *  Invoked via `<form action>`: reads `id` from formData. */
export async function setDefaultSmsTemplateAction(formData: FormData): Promise<void> {
  await requireOperator();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await prisma.$transaction([
    prisma.smsTemplate.updateMany({ data: { isDefault: false } }),
    prisma.smsTemplate.update({ where: { id }, data: { isDefault: true } }),
  ]);
  revalidatePath("/", "layout");
}
