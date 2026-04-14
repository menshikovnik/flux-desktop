import { useEffect, useMemo, useRef, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, X } from "lucide-react";

type CustomDateInputProps = {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  placeholder?: string;
  compact?: boolean;
  align?: "left" | "right";
};

const WEEKDAY_LABELS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

function parseDate(value: string) {
  if (!value) {
    return null;
  }

  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function toInputValue(date: Date) {
  return `${date.getFullYear()}-${`${date.getMonth() + 1}`.padStart(2, "0")}-${`${date.getDate()}`.padStart(2, "0")}`;
}

function formatDateLabel(value: string) {
  if (!value) {
    return "Set due date";
  }

  const date = parseDate(value);
  if (!date) {
    return "Set due date";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function sameDay(left: Date | null, right: Date | null) {
  if (!left || !right) {
    return false;
  }

  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  );
}

export function CustomDateInput({
  value,
  onChange,
  className = "",
  placeholder = "Set due date",
  compact = false,
  align = "left",
}: CustomDateInputProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const selectedDate = parseDate(value);
  const [open, setOpen] = useState(false);
  const [viewDate, setViewDate] = useState<Date>(() =>
    selectedDate ? startOfMonth(selectedDate) : startOfMonth(new Date()),
  );

  useEffect(() => {
    if (selectedDate) {
      setViewDate(startOfMonth(selectedDate));
    }
  }, [value]);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    window.addEventListener("mousedown", handlePointerDown);
    window.addEventListener("keydown", handleEscape);
    return () => {
      window.removeEventListener("mousedown", handlePointerDown);
      window.removeEventListener("keydown", handleEscape);
    };
  }, []);

  const calendarCells = useMemo(() => {
    const monthStart = startOfMonth(viewDate);
    const monthEnd = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0);
    const daysInMonth = monthEnd.getDate();
    const leadingBlankDays = monthStart.getDay();
    const cells: Array<Date | null> = [];

    for (let index = 0; index < leadingBlankDays; index += 1) {
      cells.push(null);
    }

    for (let day = 1; day <= daysInMonth; day += 1) {
      cells.push(new Date(viewDate.getFullYear(), viewDate.getMonth(), day));
    }

    while (cells.length % 7 !== 0) {
      cells.push(null);
    }

    return cells;
  }, [viewDate]);

  const today = new Date();
  const calendarWidth = compact ? "w-[248px]" : "w-[280px]";
  const dayCellClassName = compact ? "h-8 w-8 text-[13px]" : "h-9 w-9 text-sm";
  const blankCellClassName = compact ? "h-8 w-8" : "h-9 w-9";
  const panelPadding = compact ? "p-2.5" : "p-3";
  const panelAlignment = align === "right" ? "right-0" : "left-0";
  const headerMeta = compact ? "text-[11px]" : "text-xs";

  return (
    <div className="relative" ref={rootRef}>
      <button
        className={[
          "flex w-full items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-2.5 text-sm text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.02)] transition duration-200 hover:bg-white/[0.055] hover:text-white focus:border-[#6C63FF]/55 focus:outline-none",
          className,
        ].join(" ")}
        onClick={() => setOpen((current) => !current)}
        type="button"
      >
        <CalendarDays className="shrink-0 text-white/45" size={15} />
        <span className={value ? "truncate text-white" : "truncate text-white/38"}>
          {value ? formatDateLabel(value) : placeholder}
        </span>
      </button>

      <div
        className={[
          "absolute top-[calc(100%+8px)] z-50 origin-top overflow-hidden rounded-2xl border border-white/[0.08] bg-[#171727] shadow-[0_18px_60px_rgba(0,0,0,0.42)] ring-1 ring-white/[0.03] backdrop-blur-xl transition duration-200",
          panelAlignment,
          calendarWidth,
          panelPadding,
          open
            ? "pointer-events-auto translate-y-0 scale-100 opacity-100"
            : "pointer-events-none -translate-y-1 scale-[0.98] opacity-0",
        ].join(" ")}
      >
        <div className="flex items-center justify-between">
          <button
            className="flex h-8 w-8 items-center justify-center rounded-xl text-white/45 transition hover:bg-white/[0.05] hover:text-white"
            onClick={() =>
              setViewDate((current) => new Date(current.getFullYear(), current.getMonth() - 1, 1))
            }
            type="button"
          >
            <ChevronLeft size={16} />
          </button>

          <div className="text-center">
            <p className="text-sm font-medium text-white">
              {new Intl.DateTimeFormat("en-US", {
                month: "long",
                year: "numeric",
              }).format(viewDate)}
            </p>
            <p className={`${headerMeta} text-white/35`}>Pick a due date</p>
          </div>

          <button
            className="flex h-8 w-8 items-center justify-center rounded-xl text-white/45 transition hover:bg-white/[0.05] hover:text-white"
            onClick={() =>
              setViewDate((current) => new Date(current.getFullYear(), current.getMonth() + 1, 1))
            }
            type="button"
          >
            <ChevronRight size={16} />
          </button>
        </div>

        <div className="mt-3 grid grid-cols-7 gap-1 text-center text-[10px] uppercase tracking-[0.14em] text-white/28">
          {WEEKDAY_LABELS.map((label) => (
            <span key={label}>{label}</span>
          ))}
        </div>

        <div className="mt-2 grid grid-cols-7 gap-1">
          {calendarCells.map((cell, index) => {
            if (!cell) {
              return <span className={blankCellClassName} key={`blank-${index}`} />;
            }

            const isSelected = sameDay(cell, selectedDate);
            const isToday = sameDay(cell, today);

            return (
              <button
                className={[
                  `flex items-center justify-center rounded-xl transition ${dayCellClassName}`,
                  isSelected
                    ? "bg-[#6C63FF] text-white shadow-[0_10px_30px_rgba(108,99,255,0.32)]"
                    : isToday
                      ? "border border-white/[0.14] text-white/90 hover:bg-white/[0.06]"
                      : "text-white/62 hover:bg-white/[0.05] hover:text-white",
                ].join(" ")}
                key={toInputValue(cell)}
                onClick={() => {
                  onChange(toInputValue(cell));
                  setOpen(false);
                }}
                type="button"
              >
                {cell.getDate()}
              </button>
            );
          })}
        </div>

        <div className="mt-3 flex items-center justify-between border-t border-white/[0.06] pt-2.5">
          <button
            className="rounded-xl px-2.5 py-2 text-xs text-white/45 transition hover:bg-white/[0.05] hover:text-white"
            onClick={() => {
              onChange(toInputValue(new Date()));
              setOpen(false);
            }}
            type="button"
          >
            Today
          </button>
          <button
            className="inline-flex items-center gap-1 rounded-xl px-2.5 py-2 text-xs text-white/45 transition hover:bg-white/[0.05] hover:text-white"
            onClick={() => {
              onChange("");
              setOpen(false);
            }}
            type="button"
          >
            <X size={12} />
            Clear
          </button>
        </div>
      </div>
    </div>
  );
}
