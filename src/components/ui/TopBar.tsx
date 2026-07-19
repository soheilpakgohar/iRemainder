import { type ReactNode } from "react";

/**
 * Translucent top navigation bar (apple-design §12).
 * Content scrolls underneath; safe-area-aware for notched devices.
 */
export function TopBar({
  title,
  subtitle,
  leading,
  trailing,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  leading?: ReactNode;
  trailing?: ReactNode;
}) {
  return (
    <header className="sticky top-0 z-20 material border-b border-separator pt-[env(safe-area-inset-top)]">
      <div className="max-w-md mx-auto h-14 px-3 flex items-center justify-between gap-2">
        <div className="flex-1 min-w-0 flex items-center justify-start gap-2">
          {leading}
          <div className="min-w-0">
            <h1 className="text-[17px] font-semibold truncate leading-tight">
              {title}
            </h1>
            {subtitle && (
              <p className="text-[12px] text-fg-tertiary truncate leading-tight">
                {subtitle}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1">{trailing}</div>
      </div>
    </header>
  );
}
