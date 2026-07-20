"use client";

import { useState, useTransition, useOptimistic } from "react";
import { BellAlertIcon } from "@heroicons/react/24/solid";
import {
  formatRial,
  toPersianDigits,
  formatJalali,
} from "@/lib/jalali";
import { smsUri, renderSmsBody, type SmsContext } from "@/lib/sms";
import { togglePaidAction } from "@/app/actions/installments";
import type { InstallmentWithRelations } from "@/lib/queries";

type Item = InstallmentWithRelations & { daysLate: number; smsTemplate: string };

/**
 * Today's actionable list — pinned above the calendar on the home page.
 * Shows every unpaid installment due today or earlier (most overdue first),
 * with the same Call / SMS / Paid actions as the day sheet.
 */
export function TodayList({ initialItems }: { initialItems: Item[] }) {
  const [items, setItems] = useState(initialItems);
  const [pending, startTransition] = useTransition();
  const [removed, removeOptimistic] = useOptimistic<string[], string>(
    [],
    (_state, id) => [..._state, id],
  );

  const handleToggle = (item: Item) => {
    startTransition(async () => {
      // Optimistic update MUST live inside the transition (React 19 rule).
      // Marking paid removes it from the "needs action" list.
      removeOptimistic(item.id);
      await togglePaidAction(item.id, true);
      setItems((prev) => prev.filter((it) => it.id !== item.id));
    });
  };

  const handleSms = (item: Item) => {
    const ctx: SmsContext = {
      name: item.plan.customer.fullName,
      amount: item.amount,
      dueDate: item.dueDate,
      installmentNo: item.number,
      totalInstallments: item.plan.installmentsCount,
    };
    window.location.href = smsUri(
      item.plan.customer.phone,
      renderSmsBody(item.smsTemplate, ctx),
    );
  };

  if (items.length === 0) {
    return (
      <div className="rounded-card bg-surface-elevated border border-separator p-4 flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-success/15 flex items-center justify-center">
          <BellAlertIcon className="w-5 h-5 text-success" />
        </div>
        <div>
          <p className="text-[14px] font-semibold">همه چیز رو به راه است</p>
          <p className="text-[12px] text-fg-tertiary">
            قسط سررسیدشده‌ای برای پیگیری وجود ندارد.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-2 px-1">
        <BellAlertIcon className="w-4 h-4 text-danger" />
        <h2 className="text-[14px] font-semibold">
          اقساط امروز
        </h2>
        <span className="text-[12px] text-fg-tertiary">
          ({toPersianDigits(items.length)} مورد)
        </span>
      </div>

      <ul className="space-y-2">
        {items
          .filter((it) => !removed.includes(it.id))
          .map((item) => (
            <li
              key={item.id}
              className="rounded-card bg-surface-elevated border border-separator p-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <a
                    href={`/customers/${item.plan.customerId}`}
                    className="font-semibold text-[14px] hover:text-accent truncate block"
                  >
                    {item.plan.customer.fullName}
                  </a>
                  <p className="text-[11px] text-fg-tertiary mt-0.5">
                    {formatJalali(item.dueDate, "D MMMM")}
                    {item.daysLate > 0 && (
                      <span
                        className={
                          item.daysLate > 0
                            ? "text-danger mr-2"
                            : ""
                        }
                      >
                        • {toPersianDigits(item.daysLate)} روز تأخیر
                      </span>
                    )}
                  </p>
                </div>
                <p className="text-[13px] font-semibold shrink-0" dir="ltr">
                  {formatRial(item.amount)} ﷼
                </p>
              </div>

              <div className="flex items-center gap-2 mt-2">
                <a
                  href={`tel:${item.plan.customer.phone.replace(/[^\d+]/g, "")}`}
                  className="pressable flex-1 h-8 inline-flex items-center justify-center gap-1 rounded-[8px] bg-surface-sunken text-[12px] font-medium text-fg-secondary"
                >
                  تماس
                </a>
                <button
                  onClick={() => handleSms(item)}
                  className="pressable flex-1 h-8 inline-flex items-center justify-center gap-1 rounded-[8px] bg-surface-sunken text-[12px] font-medium text-fg-secondary"
                >
                  پیامک
                </button>
                <button
                  onClick={() => handleToggle(item)}
                  disabled={pending}
                  className="pressable flex-1 h-8 inline-flex items-center justify-center gap-1 rounded-[8px] bg-accent text-white text-[12px] font-medium"
                >
                  پرداخت شد
                </button>
              </div>
            </li>
          ))}
      </ul>
    </div>
  );
}
