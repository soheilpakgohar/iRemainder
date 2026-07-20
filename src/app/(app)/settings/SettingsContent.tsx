"use client";

import { useActionState } from "react";
import { TopBar } from "@/components/ui/TopBar";
import { Button } from "@/components/ui/Button";
import {
  saveSmsTemplateAction,
  deleteSmsTemplateAction,
  setDefaultSmsTemplateAction,
  type TemplateFormState,
} from "@/app/actions/settings";
import { logoutAction } from "@/app/actions/auth";
import { SMS_PLACEHOLDERS } from "@/lib/sms";
import type { SmsTemplate } from "@prisma/client";
import {
  ChatBubbleLeftEllipsisIcon,
  ArrowRightStartOnRectangleIcon,
  PlusIcon,
  TrashIcon,
  StarIcon,
  CheckIcon,
} from "@heroicons/react/24/outline";

/**
 * SMS templates manager — full CRUD.
 *
 * Each template is its own form (saves independently via saveSmsTemplateAction,
 * which upserts by the hidden id field). Set-default and delete are separate
 * single-button forms calling their own server actions. An "add new" form at
 * the bottom creates a template (no id → action creates).
 */
export function SettingsContent({
  initialTemplates,
}: {
  initialTemplates: SmsTemplate[];
}) {
  return (
    <>
      <TopBar title="تنظیمات" />

      <main className="container-app px-4 py-5 space-y-6">
        {/* SMS templates */}
        <section>
          <div className="flex items-center gap-2 mb-3 px-1">
            <ChatBubbleLeftEllipsisIcon className="w-5 h-5 text-accent" />
            <h2 className="text-[15px] font-semibold">الگوهای پیامک</h2>
          </div>

          {/* Placeholder chips — informational, shared hint */}
          <div className="mb-4">
            <p className="text-[12px] text-fg-tertiary mb-1.5">
              متغیرهای قابل استفاده:
            </p>
            <div className="flex flex-wrap gap-1.5" dir="ltr">
              {SMS_PLACEHOLDERS.map((p) => (
                <code
                  key={p}
                  className="px-2 py-0.5 rounded-md bg-surface-sunken text-[11px] text-fg-secondary font-mono"
                >
                  {p}
                </code>
              ))}
            </div>
          </div>

          {/* Template cards: single column on mobile, 2 cols on md, 3 on xl. */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 items-start">
            {initialTemplates.map((t) => (
              <TemplateCard
                key={t.id}
                template={t}
                canDelete={initialTemplates.length > 1}
              />
            ))}
          </div>

          {/* Add new template — no id, so the action creates one. */}
          <NewTemplateForm />
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

/** One editable template card. Save, set-default, and delete are SIBLING
 *  forms (HTML forbids nesting <form> in <form>). The card root is a <div>;
 *  the save form holds name + body + id + submit; the actions row holds the
 *  set-default and delete forms next to it. */
function TemplateCard({
  template,
  canDelete,
}: {
  template: SmsTemplate;
  canDelete: boolean;
}) {
  const [state, formAction] = useActionState<TemplateFormState, FormData>(
    saveSmsTemplateAction,
    {},
  );

  return (
    <div className="rounded-card bg-surface-elevated border border-separator p-3 space-y-2">
      {/* Save form: name + body + id + submit. */}
      <form action={formAction} className="space-y-2">
        <input type="hidden" name="id" value={template.id} />

        <div className="flex items-center gap-2">
          <input
            name="name"
            type="text"
            defaultValue={template.name}
            placeholder="نام الگو (مثال: یادآور سررسید)"
            className="flex-1 h-10 px-3 rounded-card bg-surface-sunken border border-separator text-[14px] font-semibold outline-none focus:border-accent transition-colors"
          />
          {template.isDefault && (
            <span className="inline-flex items-center gap-1 px-2 h-7 rounded-full bg-accent text-white text-[11px] font-medium shrink-0">
              <StarIcon className="w-3 h-3" />
              پیش‌فرض
            </span>
          )}
        </div>

        <textarea
          name="body"
          defaultValue={template.body}
          rows={4}
          dir="rtl"
          className="w-full p-3 rounded-card bg-surface-sunken border border-separator text-[13px] leading-6 outline-none focus:border-accent transition-colors resize-none"
          aria-label="متن الگو"
        />

        {state.error && (
          <p role="alert" className="text-[12px] text-danger">
            {state.error}
          </p>
        )}
        {state.fieldErrors?.name && (
          <p role="alert" className="text-[12px] text-danger">
            {state.fieldErrors.name}
          </p>
        )}
        {state.fieldErrors?.body && (
          <p role="alert" className="text-[12px] text-danger">
            {state.fieldErrors.body}
          </p>
        )}

        <Button type="submit" size="sm" className="w-full">
          <CheckIcon className="w-4 h-4" />
          ذخیره تغییرات
        </Button>
      </form>

      {/* Actions row: SIBLING forms (set-default + delete). NOT nested. */}
      {(!template.isDefault || canDelete) && (
        <div className="flex items-center gap-2 pt-1 border-t border-separator">
          {!template.isDefault && <SetDefaultForm id={template.id} />}
          {canDelete && <DeleteForm id={template.id} />}
        </div>
      )}
    </div>
  );
}

/** Inline "set as default" — single-button form. Hidden for the current default. */
function SetDefaultForm({ id }: { id: string }) {
  return (
    <form action={setDefaultSmsTemplateAction} className="flex-1">
      <input type="hidden" name="id" value={id} />
      <Button
        type="submit"
        variant="secondary"
        size="sm"
        className="w-full"
      >
        <StarIcon className="w-4 h-4" />
        پیش‌فرض
      </Button>
    </form>
  );
}

/** Inline delete — single-button form. Disabled when only one template remains. */
function DeleteForm({ id }: { id: string }) {
  return (
    <form action={deleteSmsTemplateAction} className="flex-1">
      <input type="hidden" name="id" value={id} />
      <Button
        type="submit"
        variant="secondary"
        size="sm"
        className="w-full !text-danger"
      >
        <TrashIcon className="w-4 h-4" />
        حذف
      </Button>
    </form>
  );
}

/** Add-a-new-template form. No id → saveSmsTemplateAction creates. */
function NewTemplateForm() {
  const [state, formAction] = useActionState<TemplateFormState, FormData>(
    saveSmsTemplateAction,
    {},
  );
  return (
    <form
      action={formAction}
      className="mt-3 rounded-card border border-dashed border-separator p-3 space-y-2"
    >
      <div className="flex items-center gap-2 text-fg-tertiary">
        <PlusIcon className="w-4 h-4" />
        <span className="text-[13px] font-medium">الگوی جدید</span>
      </div>
      <input
        name="name"
        type="text"
        placeholder="نام الگو"
        className="w-full h-10 px-3 rounded-card bg-surface-sunken border border-separator text-[14px] outline-none focus:border-accent transition-colors"
      />
      <textarea
        name="body"
        rows={3}
        dir="rtl"
        placeholder="متن الگو با متغیرها…"
        className="w-full p-3 rounded-card bg-surface-sunken border border-separator text-[13px] leading-6 outline-none focus:border-accent transition-colors resize-none"
      />
      {state.fieldErrors?.name && (
        <p role="alert" className="text-[12px] text-danger">
          {state.fieldErrors.name}
        </p>
      )}
      {state.fieldErrors?.body && (
        <p role="alert" className="text-[12px] text-danger">
          {state.fieldErrors.body}
        </p>
      )}
      <Button type="submit" size="sm" variant="secondary" className="w-full">
        <PlusIcon className="w-4 h-4" />
        افزودن الگو
      </Button>
    </form>
  );
}
