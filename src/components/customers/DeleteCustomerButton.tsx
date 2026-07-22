"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { TrashIcon, ExclamationTriangleIcon } from "@heroicons/react/24/outline";
import { Button } from "@/components/ui/Button";
import { deleteCustomerAction } from "@/app/actions/customers";

/**
 * Delete a customer and all their data (plans + installments, cascaded).
 *
 * Renders a danger button that opens a confirmation dialog — deletion is
 * irreversible, so we require an explicit second tap. The confirm button is
 * a `<form action={deleteCustomerAction}>` posting the hidden id; the server
 * action cascades the delete and redirects back to the customers list.
 */
export function DeleteCustomerButton({
  id,
  fullName,
}: {
  id: string;
  fullName: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="pressable w-full inline-flex items-center justify-center gap-2 h-11 rounded-card border border-separator bg-surface-elevated text-danger text-[14px] font-medium"
      >
        <TrashIcon className="w-5 h-5" />
        حذف مشتری
      </button>

      <AnimatePresence>
        {open && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-5">
            {/* Dimming scrim */}
            <motion.div
              className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setOpen(false)}
            />

            {/* Dialog card */}
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label="حذف مشتری"
              className="relative w-full max-w-sm bg-surface-elevated rounded-card shadow-sheet p-5"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ type: "spring", damping: 26, stiffness: 380 }}
            >
              {/* Warning icon */}
              <div className="flex justify-center mb-3">
                <div className="w-12 h-12 rounded-full bg-danger/10 flex items-center justify-center">
                  <ExclamationTriangleIcon className="w-6 h-6 text-danger" />
                </div>
              </div>

              <h3 className="text-center text-[16px] font-bold mb-1">
                حذف مشتری
              </h3>
              <p className="text-center text-[13px] text-fg-secondary leading-6 mb-5">
                آیا از حذف «{fullName}» مطمئن هستید؟
                <br />
                تمام اقساط و برنامه‌های او نیز حذف می‌شوند و این عمل برگشت‌ناپذیر است.
              </p>

              {/* SIBLING buttons — confirm is its own form posting the id. */}
              <div className="flex gap-2">
                <form action={deleteCustomerAction} className="flex-1">
                  <input type="hidden" name="id" value={id} />
                  <Button type="submit" variant="danger" className="w-full">
                    <TrashIcon className="w-4 h-4" />
                    بله، حذف کن
                  </Button>
                </form>
                <Button
                  type="button"
                  variant="secondary"
                  className="flex-1"
                  onClick={() => setOpen(false)}
                >
                  انصراف
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
