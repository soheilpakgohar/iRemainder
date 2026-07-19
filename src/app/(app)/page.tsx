import {
  getUnpaidDueCounts,
  getTodaysActionList,
  currentJalaliYear,
} from "@/lib/queries";
import { isoDayKey } from "@/lib/jalali";
import { prisma } from "@/lib/prisma";
import { TopBar } from "@/components/ui/TopBar";
import { YearOverview } from "@/components/calendar/YearOverview";
import { TodayList } from "@/components/calendar/TodayList";
import { BellIcon } from "@heroicons/react/24/solid";

export default async function HomePage() {
  const year = currentJalaliYear();
  const [counts, todaysRaw, setting] = await Promise.all([
    getUnpaidDueCounts(year),
    getTodaysActionList(),
    prisma.setting.findUnique({ where: { id: "singleton" } }),
  ]);
  const smsTemplate = setting?.smsTemplate ?? "";
  // Attach the SMS template to each row for the TodayList.
  const todays = todaysRaw.map((r) => ({ ...r, smsTemplate }));
  const todayIso = isoDayKey(new Date());

  return (
    <>
      <TopBar
        title="اقساط یار"
        subtitle="تقویم سررسید اقساط"
        trailing={
          todays.length > 0 ? (
            <span className="inline-flex items-center gap-1 px-2 h-7 rounded-full bg-danger text-white text-[12px] font-semibold">
              <BellIcon className="w-3.5 h-3.5" />
              {new Intl.NumberFormat("fa-IR").format(todays.length)}
            </span>
          ) : undefined
        }
      />

      <main className="max-w-md mx-auto px-4 py-5">
        {/* Today's actionable list — pinned above the calendar */}
        <div className="mb-6">
          <TodayList initialItems={todays} />
        </div>

        {/* Year overview calendar */}
        <YearOverview
          initialYear={year}
          initialCounts={counts}
          todayIso={todayIso}
        />
      </main>
    </>
  );
}
