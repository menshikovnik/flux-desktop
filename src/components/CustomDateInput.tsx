import { useEffect, useMemo, useRef, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, X } from "lucide-react";

type CustomDateInputProps = {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  placeholder?: string;
  compact?: boolean;
  align?: "left" | "right";
  showIcon?: boolean;
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
  showIcon = true,
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
  const calendarWidth = compact ? "w-[226px]" : "w-[264px]";
  const dayCellClassName = compact ? "h-7 w-7 text-[12px]" : "h-8 w-8 text-sm";
  const blankCellClassName = compact ? "h-7 w-7" : "h-8 w-8";
  const panelPadding = compact ? "p-2" : "p-3";
  const panelAlignment = align === "right" ? "right-0" : "left-0";
  const headerMeta = compact ? "text-[11px]" : "text-xs";

  return (
    <div className="relative" ref={rootRef}>
      <button
        className={[
          "flex min-h-7 w-full items-center gap-2 rounded-md border border-white/10 bg-white/[0.02] px-2 py-1 text-[12px] text-white transition duration-100 ease-[cubic-bezier(0.16,1,0.3,1)] hover:border-white/10 hover:bg-white/[0.04] hover:text-white focus:border-white/10 focus:outline-none",
          className,
        ].join(" ")}
        onClick={() => setOpen((current) => !current)}
        type="button"
      >
        {showIcon ? <CalendarDays className="shrink-0 text-white/34" size={13} strokeWidth={1.6} /> : null}
        <span className={value ? "truncate text-white" : "truncate text-white/38"}>
          {value ? formatDateLabel(value) : placeholder}
        </span>
      </button>

      <div
        className={[
          "absolute top-[calc(100%+6px)] z-50 origin-top overflow-hidden rounded-xl border border-white/10 bg-[#171719] shadow-[0_18px_48px_rgba(0,0,0,0.44)] ring-1 ring-white/[0.025] backdrop-blur-xl transition duration-100 ease-[cubic-bezier(0.16,1,0.3,1)]",
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
            className="flex h-7 w-7 items-center justify-center rounded-md text-white/38 transition-colors duration-75 ease-[cubic-bezier(0.16,1,0.3,1)] hover:bg-white/[0.05] hover:text-white/72"
            onClick={() =>
              setViewDate((current) => new Date(current.getFullYear(), current.getMonth() - 1, 1))
            }
            type="button"
          >
              <ChevronLeft size={14} strokeWidth={1.7} />
          </button>

          <div className="text-center">
            <p className="text-[12px] font-medium text-white/78">
              {new Intl.DateTimeFormat("en-US", {
                month: "long",
                year: "numeric",
              }).format(viewDate)}
            </p>
            <p className={`${headerMeta} text-white/28`}>Due date</p>
          </div>

          <button
            className="flex h-7 w-7 items-center justify-center rounded-md text-white/38 transition-colors duration-75 ease-[cubic-bezier(0.16,1,0.3,1)] hover:bg-white/[0.05] hover:text-white/72"
            onClick={() =>
              setViewDate((current) => new Date(current.getFullYear(), current.getMonth() + 1, 1))
            }
            type="button"
          >
              <ChevronRight size={14} strokeWidth={1.7} />
          </button>
        </div>

        <div className="mt-2.5 grid grid-cols-7 gap-0.5 text-center text-[9px] uppercase tracking-[0.12em] text-white/24">
          {WEEKDAY_LABELS.map((label) => (
            <span key={label}>{label}</span>
          ))}
        </div>

        <div className="mt-1.5 grid grid-cols-7 gap-0.5">
          {calendarCells.map((cell, index) => {
            if (!cell) {
              return <span className={blankCellClassName} key={`blank-${index}`} />;
            }

            const isSelected = sameDay(cell, selectedDate);
            const isToday = sameDay(cell, today);

            return (
              <button
                className={[
                  `flex items-center justify-center rounded-md transition-colors duration-75 ease-[cubic-bezier(0.16,1,0.3,1)] ${dayCellClassName}`,
                  isSelected
                    ? "bg-white/[0.13] text-white"
                    : isToday
                      ? "text-white/82 ring-1 ring-white/[0.13] hover:bg-white/[0.06]"
                      : "text-white/55 hover:bg-white/[0.05] hover:text-white/82",
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

        <div className="mt-2 flex items-center justify-between border-t border-white/[0.055] pt-2">
          <button
            className="rounded-md px-2 py-1.5 text-[11px] text-white/40 transition-colors duration-75 ease-[cubic-bezier(0.16,1,0.3,1)] hover:bg-white/[0.05] hover:text-white/72"
            onClick={() => {
              onChange(toInputValue(new Date()));
              setOpen(false);
            }}
            type="button"
          >
            Today
          </button>
          <button
            className="inline-flex items-center gap-1 rounded-md px-2 py-1.5 text-[11px] text-white/40 transition-colors duration-75 ease-[cubic-bezier(0.16,1,0.3,1)] hover:bg-white/[0.05] hover:text-white/72"
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
