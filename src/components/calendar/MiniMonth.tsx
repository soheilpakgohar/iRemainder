import { monthGrid, toPersianDigits, PERSIAN_WEEKDAY_LABELS } from "@/lib/jalali";

/**
 * One compact month in the year-overview grid.
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
    <section className="rounded-card bg-surface-elevated p-3 shadow-card">
      <h3 className="text-[13px] font-semibold text-fg-secondary mb-2 px-1">
        {monthName}
      </h3>

      {/* Weekday header — Saturday-first */}
      <div className="grid grid-cols-7 gap-y-1 mb-1">
        {PERSIAN_WEEKDAY_LABELS.map((d) => (
          <div
            key={d}
            className="text-center text-[10px] text-fg-tertiary font-medium"
          >
            {d}
          </div>
        ))}
      </div>

      {/* Day grid */}
      <div className="grid grid-cols-7 gap-y-1">
        {cells.map((cell, i) => {
          if (!cell) return <div key={`blank-${i}`} />;
          const count = unpaidCounts.get(cell.iso) ?? 0;
          const hasDue = count > 0;
          const isToday = cell.iso === todayIso;
          return (
            <button
              key={cell.iso}
              type="button"
              onClick={() => onSelectDay(cell.iso)}
              aria-label={`${monthName} ${toPersianDigits(cell.day)}`}
              className="pressable relative h-7 w-full flex items-center justify-center text-[11px] rounded-md"
            >
              <span
                className={[
                  "flex items-center justify-center h-6 w-6 rounded-full leading-none",
                  isToday
                    ? "bg-accent text-white font-semibold"
                    : hasDue
                      ? "text-fg font-medium"
                      : "text-fg-tertiary",
                ].join(" ")}
              >
                {toPersianDigits(cell.day)}
              </span>
              {/* Dot: only when there are UNPAID installments due this day. */}
              {hasDue && (
                <span
                  className="absolute bottom-0 h-1 w-1 rounded-full bg-danger"
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
