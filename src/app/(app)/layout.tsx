import { redirect } from "next/navigation";
import Link from "next/link";
import {
  CalendarDaysIcon,
  UsersIcon,
  Cog6ToothIcon,
} from "@heroicons/react/24/outline";
import { isLoggedIn } from "@/lib/session";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Server-side guard (middleware also enforces this, belt-and-braces).
  if (!(await isLoggedIn())) redirect("/login");

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="flex-1 overflow-y-auto pb-20">{children}</div>

      {/* Translucent bottom tab bar (apple-design §12 — material chrome). */}
      <nav className="fixed bottom-0 inset-x-0 z-30 material border-t border-separator pb-[env(safe-area-inset-bottom)]">
        <div className="max-w-md mx-auto grid grid-cols-3">
          <TabLink href="/" label="تقویم" icon={CalendarDaysIcon} />
          <TabLink href="/customers" label="مشتریان" icon={UsersIcon} />
          <TabLink href="/settings" label="تنظیمات" icon={Cog6ToothIcon} />
        </div>
      </nav>
    </div>
  );
}

function TabLink({
  href,
  label,
  icon: Icon,
}: {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <Link
      href={href}
      className="pressable flex flex-col items-center justify-center gap-1 py-2 text-fg-tertiary text-[11px] font-medium"
    >
      <Icon className="w-6 h-6" />
      <span>{label}</span>
    </Link>
  );
}
