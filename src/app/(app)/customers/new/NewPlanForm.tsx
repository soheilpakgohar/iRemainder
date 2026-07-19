"use client";

import { useFormStatus } from "react-dom";
import { useEffect, useMemo, useState, useActionState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRightIcon } from "@heroicons/react/24/solid";
import { TopBar } from "@/components/ui/TopBar";
import { Button } from "@/components/ui/Button";
import { Field, inputClasses } from "@/components/ui/Field";
import { createPlanAction, type CreatePlanState } from "@/app/actions/plans";
import {
  jalali,
  toPersianDigits,
  formatRial,
  formatJalali,
} from "@/lib/jalali";
import { generateInstallments } from "@/lib/plans";

export function NewPlanForm() {
  const router = useRouter();
  const [state, formAction] = useActionState<CreatePlanState, FormData>(
    createPlanAction,
    {},
  );

  useEffect(() => {
    if (state.ok) router.push("/customers");
  }, [state, router]);

  // Live preview of installment breakdown.
  const [total, setTotal] = useState("");
  const [count, setCount] = useState("");
  const [start, setStart] = useState("");

  const preview = useMemo(() => {
    const t = Number(total);
    const c = Number(count);
    if (!t || !c || c < 1) return null;
    try {
      const startDate = start
        ? jalali(start, { jalali: true }).startOf("day").hour(12).toDate()
        : new Date();
      const items = generateInstallments({
        totalAmount: t,
        count: c,
        startDate,
        intervalDays: 30,
      });
      return items.slice(0, 4); // show first 4
    } catch {
      return null;
    }
  }, [total, count, start]);

  const fe = state.fieldErrors ?? {};

  return (
    <>
      <TopBar
        title="مشتری جدید"
        leading={
          <button
            onClick={() => router.push("/customers")}
            className="pressable -m-1 p-1 text-accent"
            aria-label="بازگشت"
          >
            <ArrowRightIcon className="w-6 h-6" />
          </button>
        }
      />

      <main className="max-w-md mx-auto px-4 py-5">
        <form action={formAction} className="space-y-4">
          <Field label="نام کامل" htmlFor="fullName" error={fe.fullName}>
            <input
              id="fullName"
              name="fullName"
              type="text"
              placeholder="مثال: سارا احمدی"
              className={inputClasses}
            />
          </Field>

          <Field
            label="شماره تماس"
            htmlFor="phone"
            error={fe.phone}
            hint="بدون فاصله و خط تیره، مثال: 09123456789"
          >
            <input
              id="phone"
              name="phone"
              type="tel"
              dir="ltr"
              inputMode="numeric"
              placeholder="09123456789"
              className={`${inputClasses} text-right`}
            />
          </Field>

          <Field
            label="مبلغ کل (ریال)"
            htmlFor="totalAmount"
            error={fe.totalAmount}
          >
            <input
              id="totalAmount"
              name="totalAmount"
              type="number"
              inputMode="numeric"
              min={0}
              step={1000}
              placeholder="3000000"
              dir="ltr"
              className={`${inputClasses} text-right`}
              value={total}
              onChange={(e) => setTotal(e.target.value)}
            />
          </Field>

          <Field
            label="تعداد اقساط"
            htmlFor="installmentsCount"
            error={fe.installmentsCount}
            hint="اقساط هر ۳۰ روز یک‌بار محاسبه می‌شوند"
          >
            <input
              id="installmentsCount"
              name="installmentsCount"
              type="number"
              inputMode="numeric"
              min={1}
              max={60}
              placeholder="6"
              dir="ltr"
              className={`${inputClasses} text-right`}
              value={count}
              onChange={(e) => setCount(e.target.value)}
            />
          </Field>

          <Field
            label="تاریخ شروع (شمسی)"
            htmlFor="startJalali"
            error={fe.startJalali}
            hint="فرمت: YYYY-MM-DD — مثال: 1405-04-28"
          >
            <input
              id="startJalali"
              name="startJalali"
              type="text"
              dir="ltr"
              placeholder="1405-04-28"
              className={`${inputClasses} text-right`}
              value={start}
              onChange={(e) => setStart(e.target.value)}
            />
          </Field>

          {/* Live preview */}
          {preview && preview.length > 0 && (
            <div className="rounded-card bg-surface-sunken p-3">
              <p className="text-[12px] font-semibold text-fg-secondary mb-2">
                پیش‌نمایش اقساط:
              </p>
              <ul className="space-y-1">
                {preview.map((it) => (
                  <li
                    key={it.number}
                    className="flex items-center justify-between text-[12px]"
                  >
                    <span className="text-fg-tertiary">
                      قسط {toPersianDigits(it.number)} —{" "}
                      {formatJalali(it.dueDate, "D MMMM YYYY")}
                    </span>
                    <span className="font-medium" dir="ltr">
                      {formatRial(it.amount)} ﷼
                    </span>
                  </li>
                ))}
                {Number(count) > preview.length && (
                  <li className="text-[12px] text-fg-tertiary pt-1">
                    و {toPersianDigits(Number(count) - preview.length)} قسط دیگر…
                  </li>
                )}
              </ul>
            </div>
          )}

          {state.error && (
            <p role="alert" className="text-[13px] text-danger">
              {state.error}
            </p>
          )}

          <SubmitButton />
        </form>
      </main>
    </>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" className="w-full" disabled={pending}>
      {pending ? "در حال ثبت…" : "ذخیره و تولید اقساط"}
    </Button>
  );
}
