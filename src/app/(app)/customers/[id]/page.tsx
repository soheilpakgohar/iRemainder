import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRightIcon, PhoneIcon, CheckCircleIcon } from "@heroicons/react/24/solid";
import { TopBar } from "@/components/ui/TopBar";
import { requireOperator } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { toPersianDigits, formatRial, formatJalali } from "@/lib/jalali";
import { daysBetween } from "@/lib/jalali";

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireOperator();
  const { id } = await params;

  const customer = await prisma.customer.findUnique({
    where: { id },
    include: {
      plans: {
        orderBy: { createdAt: "asc" },
        include: {
          installments: { orderBy: { number: "asc" } },
        },
      },
    },
  });
  if (!customer) notFound();

  return (
    <>
      <TopBar
        title={customer.fullName}
        leading={
          <Link
            href="/customers"
            className="pressable -m-1 p-1 text-accent"
            aria-label="بازگشت"
          >
            <ArrowRightIcon className="w-6 h-6" />
          </Link>
        }
      />

      <main className="max-w-md mx-auto px-4 py-5 space-y-5">
        {/* Contact card */}
        <section className="rounded-card bg-surface-elevated border border-separator p-4">
          <h2 className="text-[17px] font-bold mb-1">{customer.fullName}</h2>
          <a
            href={`tel:${customer.phone.replace(/[^\d+]/g, "")}`}
            className="pressable inline-flex items-center gap-2 text-accent"
            dir="ltr"
          >
            <PhoneIcon className="w-4 h-4" />
            {toPersianDigits(customer.phone)}
          </a>
        </section>

        {/* Plans */}
        {customer.plans.map((plan) => {
          const paidCount = plan.installments.filter((i) => i.paid).length;
          const remaining = plan.installments
            .filter((i) => !i.paid)
            .reduce((s, i) => s + i.amount, 0);

          return (
            <section key={plan.id}>
              <div className="flex items-center justify-between px-1 mb-2">
                <h3 className="text-[15px] font-semibold">
                  برنامه اقساط
                </h3>
                <span className="text-[12px] text-fg-tertiary">
                  {toPersianDigits(paidCount)} از{" "}
                  {toPersianDigits(plan.installmentsCount)} پرداخت شده
                </span>
              </div>

              <ul className="rounded-card bg-surface-elevated border border-separator divide-y divide-separator overflow-hidden">
                {plan.installments.map((it) => {
                  const late = !it.paid
                    ? daysBetween(new Date(), it.dueDate)
                    : 0;
                  return (
                    <li
                      key={it.id}
                      className={[
                        "flex items-center justify-between gap-3 px-3 py-3",
                        it.paid ? "opacity-55" : "",
                      ].join(" ")}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {it.paid ? (
                          <CheckCircleIcon className="w-5 h-5 text-success shrink-0" />
                        ) : (
                          <span className="w-5 h-5 rounded-full border-2 border-separator-opaque shrink-0" />
                        )}
                        <div className="min-w-0">
                          <p className="text-[14px] font-medium">
                            قسط {toPersianDigits(it.number)} از{" "}
                            {toPersianDigits(plan.installmentsCount)}
                          </p>
                          <p className="text-[12px] text-fg-tertiary">
                            {formatJalali(it.dueDate, "D MMMM YYYY")}
                            {late > 0 && (
                              <span className="text-danger mr-2">
                                • {toPersianDigits(late)} روز تأخیر
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                      <span className="font-semibold text-[14px] shrink-0" dir="ltr">
                        {formatRial(it.amount)} ﷼
                      </span>
                    </li>
                  );
                })}
              </ul>

              {remaining > 0 && (
                <p className="text-[12px] text-fg-tertiary mt-2 px-1">
                  مانده:{" "}
                  <span className="font-semibold text-warning" dir="ltr">
                    {formatRial(remaining)} ﷼
                  </span>
                </p>
              )}
            </section>
          );
        })}
      </main>
    </>
  );
}
