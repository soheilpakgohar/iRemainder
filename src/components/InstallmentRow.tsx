"use client";

import {
  PhoneIcon,
  ChatBubbleLeftRightIcon,
  CheckIcon,
} from "@heroicons/react/24/solid";
import {
  formatRial,
  toPersianDigits,
} from "@/lib/jalali";
import type { InstallmentWithRelations } from "@/lib/queries";

/**
 * One installment row inside the day sheet.
 * Shows customer name, phone, installment no/total, amount.
 * Actions: Call (tel:), SMS (opens the template picker in the parent),
 * Paid toggle.
 *
 * `optimisticPaid` (if set) overrides `item.paid` for instant UI feedback.
 *
 * The SMS button no longer sends directly — it asks the parent (DaySheet) to
 * open the shared TemplatePicker, then the parent renders the chosen body
 * and opens the native SMS app. This keeps one picker for the whole sheet.
 */
export function InstallmentRow({
  item,
  optimisticPaid,
  daysLate = 0,
  onOpenSmsPicker,
  onToggle,
  pending,
}: {
  item: InstallmentWithRelations;
  optimisticPaid?: boolean;
  daysLate?: number;
  onOpenSmsPicker: () => void;
  onToggle: () => void;
  pending?: boolean;
}) {
  const paid = optimisticPaid ?? item.paid;
  const customer = item.plan.customer;

  return (
    <div
      className={[
        "rounded-card border p-3 transition-opacity",
        paid
          ? "bg-surface-sunken border-separator opacity-60"
          : "bg-surface-elevated border-separator",
      ].join(" ")}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-semibold text-[15px] truncate">{customer.fullName}</p>
          <a
            href={`tel:${customer.phone.replace(/[^\d+]/g, "")}`}
            className="pressable inline-flex items-center gap-1 text-[13px] text-accent mt-0.5"
            dir="ltr"
          >
            <PhoneIcon className="w-3.5 h-3.5" />
            {toPersianDigits(customer.phone)}
          </a>
        </div>
        <div className="text-left shrink-0">
          <p className="font-bold text-[15px]" dir="ltr">
            {formatRial(item.amount)}
            <span className="text-[11px] text-fg-tertiary font-normal mr-1">
              ﷼
            </span>
          </p>
          <p className="text-[11px] text-fg-tertiary mt-0.5">
            قسط {toPersianDigits(item.number)} از{" "}
            {toPersianDigits(item.plan.installmentsCount)}
          </p>
        </div>
      </div>

      {daysLate > 0 && !paid && (
        <p className="mt-2 inline-flex items-center gap-1 text-[12px] text-danger font-medium">
          {toPersianDigits(daysLate)} روز تأخیر
        </p>
      )}

      <div className="flex items-center gap-2 mt-3">
        <button
          onClick={onOpenSmsPicker}
          className="pressable flex-1 h-9 inline-flex items-center justify-center gap-1.5 rounded-[10px] bg-surface-sunken text-[13px] font-medium text-fg-secondary"
        >
          <ChatBubbleLeftRightIcon className="w-4 h-4" />
          پیامک
        </button>
        <button
          onClick={onToggle}
          disabled={pending}
          className={[
            "pressable flex-1 h-9 inline-flex items-center justify-center gap-1.5 rounded-[10px] text-[13px] font-medium transition-colors",
            paid
              ? "bg-success text-white"
              : "bg-accent text-white",
          ].join(" ")}
        >
          <CheckIcon className="w-4 h-4" />
          {paid ? "پرداخت‌شده" : "ثبت پرداخت"}
        </button>
      </div>
    </div>
  );
}
