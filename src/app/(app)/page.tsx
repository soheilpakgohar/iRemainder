import {
  getUnpaidDueCounts,
  getTodaysActionList,
  currentJalaliYear,
  currentJalaliMonth,
} from "@/lib/queries";
import { isoDayKey } from "@/lib/jalali";
import { getSmsTemplates } from "@/app/actions/settings";
import { TopBar } from "@/components/ui/TopBar";
import { YearOverview } from "@/components/calendar/YearOverview";
import { TodayList } from "@/components/calendar/TodayList";
import { BellIcon } from "@heroicons/react/24/solid";

export default async function HomePage() {
  const year = currentJalaliYear();
  const month = currentJalaliMonth();
  // Fetch counts, today's action list, and SMS templates in parallel.
  // Templates are passed to TodayList once (not stamped per-row).
  const [counts, todays, templates] = await Promise.all([
    getUnpaidDueCounts(year),
    getTodaysActionList(),
    getSmsTemplates(),
  ]);
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

      <main className="container-app px-4 py-5">
        {/* Today's actionable list — pinned above the calendar */}
        <div className="mb-6">
          <TodayList initialItems={todays} templates={templates} />
        </div>

        {/* Year overview calendar */}
        <YearOverview
          initialYear={year}
          initialMonth={month}
          initialCounts={counts}
          todayIso={todayIso}
        />
      </main>
    </>
  );
}
