"use client";

import { useEffect } from "react";
import { motion, AnimatePresence, type PanInfo } from "motion/react";
import { XMarkIcon, CheckIcon } from "@heroicons/react/24/solid";
import type { SmsTemplate } from "@prisma/client";

/**
 * Template chooser — an Apple-style bottom sheet (reuses the same spring /
 * drag-to-dismiss / scrim pattern as DaySheet). Lists the operator's saved
 * SMS templates; tapping one calls `onPick(body)` and closes.
 *
 * Used by BOTH send entry points (InstallmentRow inside DaySheet, and
 * TodayList on the home page) so the chooser UX is identical everywhere.
 *
 * `defaultId` controls which row is pre-highlighted; the caller passes the
 * chosen body through renderSmsBody + smsUri.
 */
export function TemplatePicker({
  open,
  templates,
  defaultId,
  onPick,
  onClose,
}: {
  open: boolean;
  templates: SmsTemplate[];
  defaultId?: string;
  onPick: (body: string) => void;
  onClose: () => void;
}) {
  // Escape to close.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const onDragEnd = (_e: unknown, info: PanInfo) => {
    if (info.offset.y > 120 || info.velocity.y > 600) onClose();
  };

  const handlePick = (body: string) => {
    onPick(body);
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center">
          {/* Scrim */}
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
            aria-label="انتخاب الگوی پیامک"
            className="relative w-full max-w-md max-h-[70vh] bg-surface-elevated rounded-t-sheet shadow-sheet flex flex-col"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 350 }}
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
            <div className="shrink-0 px-5 pt-2 pb-3 flex items-center justify-between gap-3">
              <h2 className="text-[17px] font-bold">انتخاب الگوی پیامک</h2>
              <button
                onClick={onClose}
                className="pressable -m-1 p-1.5 text-fg-tertiary"
                aria-label="بستن"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>

            {/* Template list */}
            <div className="flex-1 overflow-y-auto px-3 pb-[calc(env(safe-area-inset-bottom)+16px)]">
              {templates.length === 0 ? (
                <div className="px-4 py-10 text-center text-fg-tertiary text-[14px]">
                  الگویی ثبت نشده است. در تنظیمات الگو اضافه کنید.
                </div>
              ) : (
                <ul className="space-y-2">
                  {templates.map((t) => {
                    const isDefault = t.isDefault || t.id === defaultId;
                    return (
                      <li key={t.id}>
                        <button
                          onClick={() => handlePick(t.body)}
                          className="pressable w-full text-right rounded-card border border-separator bg-surface-elevated p-3 hover:bg-surface-sunken transition-colors"
                        >
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <span className="font-semibold text-[15px] flex items-center gap-2">
                              {t.name}
                              {t.isDefault && (
                                <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-md bg-accent text-white">
                                  پیش‌فرض
                                </span>
                              )}
                            </span>
                            {isDefault && (
                              <CheckIcon className="w-4 h-4 text-accent shrink-0" />
                            )}
                          </div>
                          <p className="text-[12px] text-fg-tertiary leading-5 line-clamp-2">
                            {t.body}
                          </p>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
