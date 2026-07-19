"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireOperator } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateInstallments } from "@/lib/plans";
import { dayjs } from "@/lib/jalali";

const CreatePlanSchema = z.object({
  fullName: z.string().min(1, "نام مشتری را وارد کنید").max(100),
  phone: z
    .string()
    .min(1, "شماره تماس را وارد کنید")
    .regex(/^0?\d{9,14}$/, "شماره تماس نامعتبر است"),
  totalAmount: z
    .number()
    .int("مبلغ باید عدد صحیح باشد")
    .min(1000, "مبلغ بسیار کم است"),
  installmentsCount: z
    .number()
    .int("تعداد اقساط باید عدد صحیح باشد")
    .min(1, "حداقل یک قسط")
    .max(60, "بیش از ۶۰ قسط مجاز نیست"),
  startJalali: z
    .string()
    .min(1, "تاریخ شروع را وارد کنید")
    .regex(/^\d{4}-\d{2}-\d{2}$/, "تاریخ شروع نامعتبر است (مثال: 1405-04-28)"),
});

export type CreatePlanState = {
  error?: string;
  fieldErrors?: Partial<Record<keyof z.infer<typeof CreatePlanSchema>, string>>;
  ok?: boolean;
};

/** Parse a Jalali "YYYY-MM-DD" string into a Gregorian Date at local noon. */
function parseJalaliDate(jalali: string): Date {
  const d = dayjs(jalali, { jalali: true }).startOf("day").hour(12);
  return d.toDate();
}

export async function createPlanAction(
  _prev: CreatePlanState,
  formData: FormData,
): Promise<CreatePlanState> {
  await requireOperator();

  const raw = {
    fullName: String(formData.get("fullName") ?? ""),
    phone: String(formData.get("phone") ?? ""),
    totalAmount: Number(formData.get("totalAmount") ?? 0),
    installmentsCount: Number(formData.get("installmentsCount") ?? 0),
    startJalali: String(formData.get("startJalali") ?? ""),
  };

  const parsed = CreatePlanSchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: CreatePlanState["fieldErrors"] = {};
    for (const issue of parsed.error.issues) {
      const field = issue.path[0] as keyof typeof fieldErrors;
      if (field && !fieldErrors[field]) fieldErrors[field] = issue.message;
    }
    return { fieldErrors };
  }
  const d = parsed.data;

  const startDate = parseJalaliDate(d.startJalali);
  const installments = generateInstallments({
    totalAmount: d.totalAmount,
    count: d.installmentsCount,
    startDate,
    intervalDays: 30, // monthly
  });

  await prisma.customer.create({
    data: {
      fullName: d.fullName,
      phone: d.phone,
      plans: {
        create: {
          totalAmount: d.totalAmount,
          installmentsCount: d.installmentsCount,
          startDate,
          intervalDays: 30,
          installments: {
            create: installments.map((it) => ({
              number: it.number,
              dueDate: it.dueDate,
              amount: it.amount,
            })),
          },
        },
      },
    },
  });

  revalidatePath("/", "layout");
  return { ok: true };
}
