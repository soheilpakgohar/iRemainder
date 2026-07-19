"use client";

import { useFormStatus } from "react-dom";
import { useEffect, useState, useActionState } from "react";
import { TopBar } from "@/components/ui/TopBar";
import { Button } from "@/components/ui/Button";
import { saveSettingsAction, type SettingsState } from "@/app/actions/settings";
import { logoutAction } from "@/app/actions/auth";
import {
  ChatBubbleLeftEllipsisIcon,
  ArrowRightStartOnRectangleIcon,
  CheckIcon,
} from "@heroicons/react/24/outline";

const PLACEHOLDERS = [
  "{name}",
  "{amount}",
  "{dueDate}",
  "{installmentNo}",
  "{totalInstallments}",
];

export function SettingsContent({ initialTemplate }: { initialTemplate: string }) {
  const [state, formAction] = useActionState<SettingsState, FormData>(
    saveSettingsAction,
    {},
  );
  const [justSaved, setJustSaved] = useState(false);

  useEffect(() => {
    if (state.ok) {
      setJustSaved(true);
      const t = setTimeout(() => setJustSaved(false), 2000);
      return () => clearTimeout(t);
    }
  }, [state]);

  return (
    <>
      <TopBar title="تنظیمات" />

      <main className="max-w-md mx-auto px-4 py-5 space-y-6">
        {/* SMS template */}
        <section>
          <div className="flex items-center gap-2 mb-2 px-1">
            <ChatBubbleLeftEllipsisIcon className="w-5 h-5 text-accent" />
            <h2 className="text-[15px] font-semibold">الگوی پیامک</h2>
          </div>

          <form action={formAction} className="space-y-3">
            <textarea
              name="smsTemplate"
              defaultValue={initialTemplate}
              rows={5}
              dir="rtl"
              className="w-full p-3 rounded-card bg-surface-elevated border border-separator text-[14px] leading-6 outline-none focus:border-accent transition-colors resize-none"
              aria-label="الگوی پیامک"
            />

            {state.error && (
              <p role="alert" className="text-[13px] text-danger">
                {state.error}
              </p>
            )}

            {/* Placeholder chips */}
            <div>
              <p className="text-[12px] text-fg-tertiary mb-1.5">
                متغیرهای قابل استفاده:
              </p>
              <div className="flex flex-wrap gap-1.5" dir="ltr">
                {PLACEHOLDERS.map((p) => (
                  <code
                    key={p}
                    className="px-2 py-0.5 rounded-md bg-surface-sunken text-[11px] text-fg-secondary font-mono"
                  >
                    {p}
                  </code>
                ))}
              </div>
            </div>

            <SaveButton justSaved={justSaved} />
          </form>
        </section>

        {/* Logout */}
        <section className="pt-4 border-t border-separator">
          <form action={logoutAction}>
            <Button
              type="submit"
              variant="secondary"
              size="lg"
              className="w-full !text-danger"
            >
              <ArrowRightStartOnRectangleIcon className="w-5 h-5" />
              خروج از حساب
            </Button>
          </form>
        </section>
      </main>
    </>
  );
}

function SaveButton({ justSaved }: { justSaved: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      size="lg"
      className="w-full"
      disabled={pending}
      variant={justSaved ? "secondary" : "primary"}
    >
      {justSaved ? (
        <>
          <CheckIcon className="w-5 h-5" />
          ذخیره شد
        </>
      ) : pending ? (
        "در حال ذخیره…"
      ) : (
        "ذخیره"
      )}
    </Button>
  );
}
