import Link from "next/link";
import { PlusIcon, PhoneIcon } from "@heroicons/react/24/solid";
import { TopBar } from "@/components/ui/TopBar";
import { requireOperator } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { toPersianDigits, formatRial } from "@/lib/jalali";

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  await requireOperator();
  const { q } = await searchParams;
  const query = (q ?? "").trim();

  const customers = await prisma.customer.findMany({
    where: query
      ? {
          OR: [
            { fullName: { contains: query } },
            { phone: { contains: query } },
          ],
        }
      : undefined,
    include: {
      plans: {
        include: {
          _count: { select: { installments: true } },
          installments: {
            where: { paid: false },
            select: { amount: true },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <>
      <TopBar title="مشتریان" />

      <main className="container-app mx-auto px-4 py-5">
        {/* Search */}
        <form action="/customers" className="mb-4">
          <input
            name="q"
            type="search"
            defaultValue={query}
            placeholder="جستجوی نام یا شماره…"
            className="w-full h-11 px-4 rounded-card bg-surface-elevated border border-separator text-[14px] outline-none focus:border-accent"
          />
        </form>

        {/* New customer CTA */}
        <Link
          href="/customers/new"
          className="pressable mb-4 flex items-center justify-center gap-2 h-12 rounded-card bg-accent text-white font-medium"
        >
          <PlusIcon className="w-5 h-5" />
          افزودن مشتری جدید
        </Link>

        {/* List */}
        {customers.length === 0 ? (
          <div className="text-center text-fg-tertiary py-12 text-[14px]">
            {query ? "نتیجه‌ای یافت نشد" : "هنوز مشتری‌ای ثبت نشده است"}
          </div>
        ) : (
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {customers.map((c) => {
              const remaining = c.plans.reduce(
                (sum, p) => sum + p.installments.reduce((s, i) => s + i.amount, 0),
                0,
              );
              const totalInstallments = c.plans.reduce(
                (sum, p) => sum + p._count.installments,
                0,
              );
              return (
                <li key={c.id} className="h-full">
                  <Link
                    href={`/customers/${c.id}`}
                    className="pressable block h-full rounded-card bg-surface-elevated border border-separator p-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-semibold text-[15px] truncate">
                          {c.fullName}
                        </p>
                        <p
                          className="text-[13px] text-accent flex items-center gap-1 mt-0.5"
                          dir="ltr"
                        >
                          <PhoneIcon className="w-3 h-3" />
                          {toPersianDigits(c.phone)}
                        </p>
                      </div>
                      <div className="text-left shrink-0">
                        <p className="text-[11px] text-fg-tertiary">
                          {toPersianDigits(totalInstallments)} قسط
                        </p>
                        {remaining > 0 && (
                          <p className="text-[13px] font-semibold text-warning" dir="ltr">
                            {formatRial(remaining)} ﷼
                          </p>
                        )}
                      </div>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </main>
    </>
  );
}
