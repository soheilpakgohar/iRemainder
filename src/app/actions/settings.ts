"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireOperator } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const TemplateSchema = z.object({
  smsTemplate: z
    .string()
    .min(1, "الگوی پیامک نمی‌تواند خالی باشد")
    .max(500, "الگو بیش از حد طولانی است"),
});

export type SettingsState = {
  error?: string;
  ok?: boolean;
};

/** Load the current SMS template (server-side). */
export async function getSmsTemplate(): Promise<string> {
  const setting = await prisma.setting.findUnique({
    where: { id: "singleton" },
  });
  return (
    setting?.smsTemplate ??
    "سلام {name} عزیز، قسط شماره {installmentNo} از {totalInstallments} به مبلغ {amount} سررسید شده است. لطفًاً پرداخت فرمایید."
  );
}

export async function saveSettingsAction(
  _prev: SettingsState,
  formData: FormData,
): Promise<SettingsState> {
  await requireOperator();

  const parsed = TemplateSchema.safeParse({
    smsTemplate: formData.get("smsTemplate"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "ورودی نامعتبر" };
  }

  await prisma.setting.upsert({
    where: { id: "singleton" },
    update: { smsTemplate: parsed.data.smsTemplate },
    create: { id: "singleton", smsTemplate: parsed.data.smsTemplate },
  });

  revalidatePath("/", "layout");
  return { ok: true };
}
