"use client";

import { useState, useOptimistic, useEffect, useCallback, useTransition } from "react";
import { ChevronRightIcon, ChevronLeftIcon } from "@heroicons/react/24/solid";
import { MiniMonth } from "./MiniMonth";
import { DaySheet } from "./DaySheet";
import { PERSIAN_MONTHS, toPersianDigits } from "@/lib/jalali";
import { fetchYearCountsAction } from "@/app/actions/installments";

type Counts = Map<string, number>;

/**
 * The calendar host. Holds the selected Jalali year + month, the unpaid-due
 * counts per year (refetched on year change so every navigated-to year shows
 * correct dots — the initial page load only fetched the current year), and
 * the tapped day (drives the sheet).
 *
 * Layout:
 *  - Mobile: ONE big month with prev/next month nav (matches the reference).
 *  - md+: all 12 months in a responsive grid (2 / 3 / 4 columns).
 *
 * When an installment is marked paid, we optimistically remove one from that
 * day's count so the dot disappears before the server round-trip (apple-design §3).
 */
export function YearOverview({
  initialYear,
  initialMonth,
  initialCounts,
  todayIso,
}: {
  initialYear: number;
  initialMonth: number;
  initialCounts: Counts;
  todayIso: string;
}) {
  const [year, setYear] = useState(initialYear);
  const [month, setMonth] = useState(initialMonth);

  // Counts cached per year so back-navigation is instant after first fetch.
  const [countsByYear, setCountsByYear] = useState<Record<number, Counts>>({
    [initialYear]: initialCounts,
  });
  const [loadingYear, setLoadingYear] = useState<number | null>(null);

  // Refetch counts when navigating to a year we haven't loaded yet.
  useEffect(() => {
    if (countsByYear[year]) return;
    setLoadingYear(year);
    fetchYearCountsAction(year)
      .then((record) => {
        const map = new Map(Object.entries(record));
        setCountsByYear((prev) => ({ ...prev, [year]: map }));
      })
      .finally(() => setLoadingYear(null));
  }, [year, countsByYear]);

  const currentCounts = countsByYear[year] ?? new Map<string, number>();

  // Optimistic dot counts for the currently-viewed year. Decrement on each
  // paid toggle; drop the day key at 0.
  const [optimisticCounts, mutateOptimistic] = useOptimistic<
    Counts,
    { iso: string }
  >(currentCounts, (state, action) => {
    const next = new Map(state);
    const cur = next.get(action.iso) ?? 0;
    if (cur <= 1) next.delete(action.iso);
    else next.set(action.iso, cur - 1);
    return next;
  });

  const [selectedIso, setSelectedIso] = useState<string | null>(null);

  // Step by one month, rolling the year over at Farvardin/Esfand boundaries.
  const goToMonth = useCallback((delta: number) => {
    setMonth((prevMonth) => {
      let next = prevMonth + delta;
      if (next < 0) {
        setYear((y) => y - 1);
        next = 11;
      } else if (next > 11) {
        setYear((y) => y + 1);
        next = 0;
      }
      return next;
    });
  }, []);

  // Step by one year (desktop: the grid shows all 12 months, so year-step is
  // the meaningful navigation there). Resets the mobile month pointer to the
  // current month so the single-month view doesn't land on an odd offset.
  const goToYear = useCallback((delta: number) => {
    setYear((y) => y + delta);
    setMonth(initialMonth);
  }, [initialMonth]);

  // Dot-removal transition. DaySheet calls onPaidChange from inside its own
  // transition, but the async boundary can drop the transition context — so
  // wrap the optimistic dot decrement in our own transition to satisfy
  // React 19's rule that useOptimistic updates run inside a transition/action.
  const [, startDotTransition] = useTransition();

  // Apply the dot-count change to the real base state (countsByYear).
  // This is essential: useOptimistic REVERTS to its base when the transition
  // ends, so unless we persist the decrement into countsByYear, the dot
  // disappears optimistically then reappears on revert.
  const persistCountChange = (iso: string, becamePaid: boolean) => {
    setCountsByYear((prev) => {
      const current = prev[year];
      if (!current) return prev;
      const next = new Map(current);
      const cur = next.get(iso) ?? 0;
      if (becamePaid) {
        if (cur <= 1) next.delete(iso);
        else next.set(iso, cur - 1);
      } else {
        next.set(iso, cur + 1);
      }
      return { ...prev, [year]: next };
    });
  };

  // Called by DaySheet after a successful paid toggle.
  const handlePaidChange = (iso: string, becamePaid: boolean) => {
    if (!becamePaid) return;
    // 1. Apply to the real base state so the change survives the optimistic revert.
    persistCountChange(iso, becamePaid);
    // 2. Apply optimistically so the dot disappears instantly, before the
    //    state update above repaints.
    startDotTransition(() => mutateOptimistic({ iso }));
  };

  const monthLabel = PERSIAN_MONTHS[month];

  return (
    <>
      {/* Mobile nav: step by MONTH (single-month view).
          Hidden on md+ where the year grid makes month-step pointless. */}
      <div className="md:hidden flex items-center justify-between gap-2 mb-4">
        <button
          onClick={() => goToMonth(-1)}
          className="pressable p-2 -m-2 text-fg-tertiary"
          aria-label="ماه قبل"
        >
          <ChevronRightIcon className="w-6 h-6" />
        </button>
        <div className="text-center min-w-0">
          <div className="text-[20px] font-bold display leading-tight my-1.5">
            {monthLabel}
          </div>
          <div className="text-[13px] text-fg-tertiary leading-tight">
            {toPersianDigits(year)}
          </div>
        </div>
        <button
          onClick={() => goToMonth(1)}
          className="pressable p-2 -m-2 text-fg-tertiary"
          aria-label="ماه بعد"
        >
          <ChevronLeftIcon className="w-6 h-6" />
        </button>
      </div>

      {/* Desktop nav: step by YEAR (12-month grid view).
          Hidden on mobile where single-month stepping applies. */}
      <div className="hidden md:flex items-center justify-center gap-6 mb-4">
        <button
          onClick={() => goToYear(-1)}
          className="pressable p-2 -m-2 text-fg-tertiary"
          aria-label="سال قبل"
        >
          <ChevronRightIcon className="w-5 h-5" />
        </button>
        <span className="text-[22px] font-bold display min-w-[3ch] text-center">
          {toPersianDigits(year)}
        </span>
        <button
          onClick={() => goToYear(1)}
          className="pressable p-2 -m-2 text-fg-tertiary"
          aria-label="سال بعد"
        >
          <ChevronLeftIcon className="w-5 h-5" />
        </button>
      </div>

      {/* Mobile: single big month (the one selected by month nav). */}
      <div className="md:hidden">
        {loadingYear === year ? (
          <div className="rounded-card bg-surface-elevated p-8 text-center text-fg-tertiary text-[14px] shadow-card">
            در حال بارگذاری…
          </div>
        ) : (
          <MiniMonth
            jalaliYear={year}
            jalaliMonth={month}
            monthName={monthLabel}
            unpaidCounts={optimisticCounts}
            todayIso={todayIso}
            onSelectDay={setSelectedIso}
          />
        )}
      </div>

      {/* md+: all 12 months in a responsive grid. */}
      <div className="hidden md:grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {PERSIAN_MONTHS.map((name, monthIdx) => (
          <MiniMonth
            key={monthIdx}
            jalaliYear={year}
            jalaliMonth={monthIdx}
            monthName={name}
            unpaidCounts={optimisticCounts}
            todayIso={todayIso}
            onSelectDay={setSelectedIso}
          />
        ))}
      </div>

      <DaySheet
        iso={selectedIso}
        onClose={() => setSelectedIso(null)}
        onPaidChange={handlePaidChange}
      />
    </>
  );
}
