import { monthGrid, toPersianDigits, PERSIAN_WEEKDAY_LABELS } from "@/lib/jalali";

/**
 * One month card. On mobile this is the single visible month (large cells);
 * on md+ screens several sit side-by-side in the YearOverview grid (smaller
 * cells). Scales via responsive classes — one source of truth.
 *
 * Days with unpaid installments get a dot. Tapping a day opens the sheet.
 * The grid is Saturday-first to match Persian convention.
 */
export function MiniMonth({
  jalaliYear,
  jalaliMonth, // 0-indexed
  monthName,
  unpaidCounts, // Map<isoDay, number>
  todayIso,
  onSelectDay,
}: {
  jalaliYear: number;
  jalaliMonth: number;
  monthName: string;
  unpaidCounts: Map<string, number>;
  todayIso: string;
  onSelectDay: (iso: string) => void;
}) {
  const cells = monthGrid(jalaliYear, jalaliMonth);

  return (
    <section className="rounded-card bg-surface-elevated p-3 md:p-3 lg:p-2 shadow-card">
      {/* Month-name header: prominent on mobile (single-month view), tight on grids. */}
      <h3 className="text-base md:text-[13px] font-semibold text-fg-secondary mb-3 md:mb-2 px-1">
        {monthName}
      </h3>

      {/* Weekday header — Saturday-first */}
      <div className="grid grid-cols-7 mb-1">
        {PERSIAN_WEEKDAY_LABELS.map((d) => (
          <div
            key={d}
            className="text-center text-[11px] md:text-[10px] lg:text-[10px] text-fg-tertiary font-medium"
          >
            {d}
          </div>
        ))}
      </div>

      {/* Day grid. Cells are large+tappable on mobile, compact on md+. */}
      <div className="grid grid-cols-7">
        {cells.map((cell, i) => {
          if (!cell) return <div key={`blank-${i}`} className="h-12 md:h-10 lg:h-9" />;
          const count = unpaidCounts.get(cell.iso) ?? 0;
          const hasDue = count > 0;
          const isToday = cell.iso === todayIso;
          return (
            <button
              key={cell.iso}
              type="button"
              onClick={() => onSelectDay(cell.iso)}
              aria-label={`${monthName} ${toPersianDigits(cell.day)}`}
              className="pressable relative h-12 md:h-10 lg:h-9 w-full flex items-center justify-center"
            >
              <span
                className={[
                  "flex items-center justify-center rounded-full leading-none",
                  "h-10 w-10 text-[15px] md:h-8 md:w-8 md:text-[13px] lg:h-7 lg:w-7 lg:text-[12px]",
                  isToday
                    ? "bg-accent text-white font-semibold"
                    : hasDue
                      ? "text-fg font-medium"
                      : "text-fg-tertiary",
                ].join(" ")}
              >
                {toPersianDigits(cell.day)}
              </span>
              {/* Dot: only when there are UNPAID installments due this day.
                  Slightly larger on mobile so it reads on the bigger cells. */}
              {hasDue && (
                <span
                  className="absolute bottom-0.5 md:bottom-0 h-1.5 w-1.5 md:h-1 md:w-1 rounded-full bg-danger"
                  aria-hidden
                />
              )}
            </button>
          );
        })}
      </div>
    </section>
  );
}
