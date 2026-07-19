import { type ReactNode } from "react";

/**
 * A labeled form field with inline error (apple-design §16: validate inline,
 * not on submit; feedback in four kinds — here "warning/error").
 */
export function Field({
  label,
  htmlFor,
  error,
  hint,
  children,
  ltr,
}: {
  label: string;
  htmlFor?: string;
  error?: string;
  hint?: string;
  children: ReactNode;
  ltr?: boolean;
}) {
  return (
    <div>
      <label
        htmlFor={htmlFor}
        className="block text-[13px] font-medium text-fg-secondary mb-1.5 px-1"
      >
        {label}
      </label>
      {children}
      {hint && !error && (
        <p className="text-[12px] text-fg-tertiary mt-1 px-1">{hint}</p>
      )}
      {error && (
        <p role="alert" className="text-[12px] text-danger mt-1 px-1">
          {error}
        </p>
      )}
      {ltr && <span />}
    </div>
  );
}

/** Shared input styling. */
export const inputClasses =
  "w-full h-12 px-4 rounded-card bg-surface-elevated border border-separator text-base outline-none focus:border-accent transition-colors";
