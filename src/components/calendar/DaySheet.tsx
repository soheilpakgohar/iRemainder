"use client";

import {
  useEffect,
  useState,
  useTransition,
  useOptimistic,
} from "react";
import { motion, AnimatePresence, type PanInfo } from "motion/react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { toPersianDigits, formatJalali } from "@/lib/jalali";
import { fetchDayAction, togglePaidAction } from "@/app/actions/installments";
import type { InstallmentWithRelations } from "@/lib/queries";
import { InstallmentRow } from "@/components/InstallmentRow";
import { TemplatePicker } from "@/components/sms/TemplatePicker";
import { renderSmsBody, smsUri, type SmsContext } from "@/lib/sms";
import type { SmsTemplate } from "@prisma/client";

type DayItem = InstallmentWithRelations & {
  daysLate: number;
};

/**
 * Apple-style bottom sheet (apple-design §3–7, §9, §12).
 *
 * - Spring entry (damping ~0.8 / response ~0.3): physical, slight bounce.
 * - Drag-to-dismiss: follows finger 1:1, hands release velocity to the spring.
 * - Rubber-band at top (drag up past 0): progressive resistance.
 * - Interruptible: can grab mid-flight.
 * - Reduced motion handled globally via the CSS media query.
 *
 * Data is fetched via a server action when the sheet opens. Paid toggles
 * are optimistic — UI flips instantly, server reconciles.
 *
 * The SMS button opens a shared TemplatePicker (one picker for all rows);
 * picking a template renders its body with the row's context and opens the
 * native SMS app.
 */
export function DaySheet({
  iso,
  onClose,
  onPaidChange,
}: {
  iso: string | null;
  onClose: () => void;
  onPaidChange: (iso: string, becamePaid: boolean) => void;
}) {
  const [items, setItems] = useState<DayItem[]>([]);
  const [templates, setTemplates] = useState<SmsTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [pending, startTransition] = useTransition();
  const [optimisticPaid, setOptimisticPaid] = useOptimistic<
    Record<string, boolean>,
    { id: string; paid: boolean }
  >({}, (state, action) => ({ ...state, [action.id]: action.paid }));

  // The item the SMS picker is currently open for (null = picker closed).
  const [smsPickerFor, setSmsPickerFor] = useState<DayItem | null>(null);

  // Fetch the day's data + templates when the sheet opens.
  useEffect(() => {
    if (!iso) {
      setItems([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    fetchDayAction(iso)
      .then(({ items, templates }) => {
        if (!cancelled) {
          setItems(items);
          setTemplates(templates);
        }
      })
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [iso]);

  // Lock body scroll while open.
  useEffect(() => {
    if (!iso) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [iso]);

  // Escape to close.
  useEffect(() => {
    if (!iso) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [iso, onClose]);

  const dayLabel = iso ? formatJalali(iso, "dddd D MMMM") : "";
  const unpaidCount = items.filter(
    (it) => !(optimisticPaid[it.id] ?? it.paid),
  ).length;

  // Drag-to-dismiss: commit if dragged far enough or flicked fast enough.
  const onDragEnd = (_e: unknown, info: PanInfo) => {
    if (info.offset.y > 120 || info.velocity.y > 600) onClose();
  };

  const handleToggle = (item: DayItem) => {
    const newPaid = !(optimisticPaid[item.id] ?? item.paid);
    startTransition(async () => {
      // Optimistic update MUST live inside the transition (React 19 rule).
      setOptimisticPaid({ id: item.id, paid: newPaid });
      await togglePaidAction(item.id, newPaid);
      setItems((prev) =>
        prev.map((it) =>
          it.id === item.id
            ? { ...it, paid: newPaid, paidAt: newPaid ? new Date() : null }
            : it,
        ),
      );
      if (iso) onPaidChange(iso, newPaid);
    });
  };

  // Send: pick a template, render it with this item's context, open SMS app.
  const handleSendSms = (item: DayItem, body: string) => {
    const ctx: SmsContext = {
      name: item.plan.customer.fullName,
      amount: item.amount,
      dueDate: item.dueDate,
      installmentNo: item.number,
      totalInstallments: item.plan.installmentsCount,
    };
    window.location.href = smsUri(item.plan.customer.phone, renderSmsBody(body, ctx));
  };

  // The default template id (so the picker pre-highlights it).
  const defaultTemplateId = templates.find((t) => t.isDefault)?.id;

  return (
    <AnimatePresence>
      {iso && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          {/* Dimming scrim (apple-design §12). */}
          <motion.div
            className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={dayLabel}
            className="relative w-full max-w-md max-h-[85vh] bg-surface-elevated rounded-t-sheet shadow-sheet flex flex-col"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{
              type: "spring",
              damping: 30,
              stiffness: 350,
            }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0.2, bottom: 0.6 }}
            onDragEnd={onDragEnd}
          >
            {/* Grabber */}
            <div className="shrink-0 pt-2.5 pb-1 flex justify-center cursor-grab active:cursor-grabbing touch-none">
              <div className="w-10 h-1 rounded-full bg-separator-opaque" />
            </div>

            {/* Header */}
            <div className="shrink-0 px-5 pt-2 pb-3 flex items-start justify-between gap-3">
              <div>
                <h2 className="text-[18px] font-bold leading-tight">
                  {dayLabel}
                </h2>
                <p className="text-[13px] text-fg-tertiary mt-0.5">
                  {loading
                    ? "…"
                    : unpaidCount > 0
                      ? `${toPersianDigits(unpaidCount)} قسط سررسید شده`
                      : items.length > 0
                        ? "همه پرداخت شده ✅"
                        : "قسطی ثبت نشده"}
                </p>
              </div>
              <button
                onClick={onClose}
                className="pressable -m-1 p-1.5 text-fg-tertiary"
                aria-label="بستن"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto px-3 pb-[calc(env(safe-area-inset-bottom)+16px)]">
              {loading ? (
                <div className="px-4 py-10 text-center text-fg-tertiary text-[14px]">
                  در حال بارگذاری…
                </div>
              ) : items.length === 0 ? (
                <div className="px-4 py-10 text-center text-fg-tertiary text-[14px]">
                  برای این روز قسطی ثبت نشده است.
                </div>
              ) : (
                <ul className="space-y-2">
                  {items.map((item) => (
                    <li key={item.id}>
                      <InstallmentRow
                        item={item}
                        daysLate={item.daysLate}
                        optimisticPaid={optimisticPaid[item.id]}
                        pending={pending}
                        onOpenSmsPicker={() => setSmsPickerFor(item)}
                        onToggle={() => handleToggle(item)}
                      />
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </motion.div>
        </div>
      )}

      {/* SMS template picker — shared by all rows in this sheet. */}
      <TemplatePicker
        open={smsPickerFor !== null}
        templates={templates}
        defaultId={defaultTemplateId}
        onPick={(body) => {
          if (smsPickerFor) handleSendSms(smsPickerFor, body);
        }}
        onClose={() => setSmsPickerFor(null)}
      />
    </AnimatePresence>
  );
}
