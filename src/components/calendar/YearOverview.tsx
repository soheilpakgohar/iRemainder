"use client";

import { useState, useOptimistic } from "react";
import { ChevronRightIcon, ChevronLeftIcon } from "@heroicons/react/24/solid";
import { MiniMonth } from "./MiniMonth";
import { DaySheet } from "./DaySheet";
import { PERSIAN_MONTHS, toPersianDigits } from "@/lib/jalali";

type Counts = Map<string, number>;

/**
 * Client component holding the selected Jalali year, the unpaid-due counts
 * (from the server), and the tapped day (drives the sheet).
 *
 * When an installment is marked paid, we optimistically remove one from
 * that day's count — so the dot disappears the instant the last unpaid
 * row flips, before the server round-trip (apple-design §3).
 */
export function YearOverview({
  initialYear,
  initialCounts,
  todayIso,
}: {
  initialYear: number;
  initialCounts: Counts;
  todayIso: string;
}) {
  const [year, setYear] = useState(initialYear);
  const [selectedIso, setSelectedIso] = useState<string | null>(null);

  // Optimistic dot counts. Decrement on each paid toggle; drop the day at 0.
  const [optimisticCounts, mutateOptimistic] = useOptimistic<
    Counts,
    { iso: string }
  >(initialCounts, (state, action) => {
    const next = new Map(state);
    const cur = next.get(action.iso) ?? 0;
    if (cur <= 1) next.delete(action.iso);
    else next.set(action.iso, cur - 1);
    return next;
  });

  const goToYear = (delta: number) => setYear((y) => y + delta);

  // Called by DaySheet after a successful paid toggle.
  const handlePaidChange = (iso: string, becamePaid: boolean) => {
    if (becamePaid) mutateOptimistic({ iso });
  };

  return (
    <>
      {/* Year switcher */}
      <div className="flex items-center justify-center gap-6 mb-4">
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

      {/* 12 months in a 2-column grid */}
      <div className="grid grid-cols-2 gap-3">
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
