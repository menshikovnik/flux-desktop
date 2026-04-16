import { useEffect, useMemo, useRef, useState } from "react";
import { Clock3, X } from "lucide-react";
import { isModifierPressed } from "../../../app/platform";
import { CustomDateInput } from "../../../components/CustomDateInput";

const QUICK_MINUTES = ["00", "15", "30", "45"];

function clampHour(value: number) {
  return Math.min(Math.max(value, 0), 23);
}

function clampMinute(value: number) {
  return Math.min(Math.max(value, 0), 59);
}

function formatTime(hour: number, minute: number) {
  return `${`${clampHour(hour)}`.padStart(2, "0")}:${`${clampMinute(minute)}`.padStart(2, "0")}`;
}

function formatMaskedTime(raw: string) {
  const digits = raw.replace(/\D/g, "").slice(0, 4);
  if (digits.length <= 2) {
    return digits;
  }

  return `${digits.slice(0, 2)}:${digits.slice(2)}`;
}

function isCompleteTime(value: string) {
  return /^\d{2}:\d{2}$/.test(value);
}

function parseTime(value: string) {
  if (!isCompleteTime(value)) {
    return null;
  }

  const [hour, minute] = value.split(":").map(Number);
  if (Number.isNaN(hour) || Number.isNaN(minute) || hour > 23 || minute > 59) {
    return null;
  }

  return { hour, minute };
}

export function DueDateField({
  dateValue,
  timeValue,
  onDateChange,
  onTimeChange,
}: {
  dateValue: string;
  timeValue: string;
  onDateChange: (value: string) => void;
  onTimeChange: (value: string) => void;
}) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(timeValue);
  const parsedTime = useMemo(() => parseTime(timeValue), [timeValue]);

  useEffect(() => {
    setDraft(timeValue);
  }, [timeValue]);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    window.addEventListener("mousedown", handlePointerDown);
    return () => window.removeEventListener("mousedown", handlePointerDown);
  }, []);

  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (!open || event.key !== "Escape") {
        return;
      }

      const target = event.target as Node | null;
      const activeInside = rootRef.current?.contains(document.activeElement);
      const targetInside = target ? rootRef.current?.contains(target) : false;
      if (!activeInside && !targetInside) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      if ("stopImmediatePropagation" in event) {
        event.stopImmediatePropagation();
      }
      setOpen(false);
    }

    window.addEventListener("keydown", handleEscape, true);
    return () => window.removeEventListener("keydown", handleEscape, true);
  }, [open]);

  function commitDraft(nextValue: string) {
    const parsed = parseTime(nextValue);
    if (!parsed) {
      setDraft(timeValue);
      return;
    }

    const normalized = formatTime(parsed.hour, parsed.minute);
    setDraft(normalized);
    onTimeChange(normalized);
  }

  function updateHour(hour: number) {
    const currentMinute = parsedTime?.minute ?? 0;
    const nextValue = formatTime(hour, currentMinute);
    setDraft(nextValue);
    onTimeChange(nextValue);
  }

  function updateMinute(minute: string) {
    const currentHour = parsedTime?.hour ?? new Date().getHours();
    const nextValue = formatTime(currentHour, Number(minute));
    setDraft(nextValue);
    onTimeChange(nextValue);
  }

  function clearTime() {
    setDraft("");
    onTimeChange("");
    setOpen(false);
  }

  return (
    <div className="flex shrink-0 items-center gap-1" ref={rootRef}>
      <div className="w-[112px] shrink-0">
        <CustomDateInput
          align="right"
          className="border-transparent bg-transparent px-1.5 py-1 text-[12px] text-white/56 hover:border-transparent hover:bg-transparent focus:border-transparent"
          compact
          onChange={(value) => {
            onDateChange(value);
            if (!value) {
              clearTime();
            }
          }}
          showIcon={false}
          value={dateValue}
        />
      </div>

      {dateValue ? (
        <div className="relative shrink-0 group/time">
          <div className="relative">
            <Clock3 className="pointer-events-none absolute left-1.5 top-1/2 -translate-y-1/2 text-white/24" size={11} strokeWidth={1.7} />
            <input
              className="h-7 w-[84px] rounded-md border border-white/10 bg-transparent pl-6 pr-5 font-mono text-[11.5px] text-white/64 outline-none transition-colors duration-100 ease-[cubic-bezier(0.16,1,0.3,1)] placeholder:text-white/22 hover:border-white/10 hover:bg-white/[0.04] focus:border-white/10 focus:bg-white/[0.04]"
              inputMode="numeric"
              onBlur={() => {
                if (!draft) {
                  onTimeChange("");
                  return;
                }
                commitDraft(draft);
              }}
              onChange={(event) => setDraft(formatMaskedTime(event.target.value))}
              onFocus={() => setOpen(true)}
              onKeyDown={(event) => {
                if (isModifierPressed(event)) {
                  return;
                }

                if (event.key === "Enter") {
                  event.preventDefault();
                  if (!draft) {
                    clearTime();
                    return;
                  }
                  commitDraft(draft);
                  setOpen(false);
                }
              }}
              placeholder="hh:mm"
              ref={inputRef}
              value={draft}
            />
            {timeValue ? (
              <button
                className="absolute right-1 top-1/2 flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded-sm text-white/0 transition-colors duration-100 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover/time:text-white/28 hover:bg-white/[0.06] hover:text-white/66"
                onClick={clearTime}
                type="button"
              >
                <X size={11} strokeWidth={1.8} />
              </button>
            ) : null}
          </div>

          <div
            className={[
              "absolute right-0 top-[calc(100%+8px)] z-50 w-[272px] rounded-xl border border-white/10 bg-[#171719]/96 p-3 shadow-[0_18px_48px_rgba(0,0,0,0.44)] backdrop-blur-xl transition duration-100 ease-[cubic-bezier(0.16,1,0.3,1)]",
              open ? "pointer-events-auto translate-y-0 opacity-100" : "pointer-events-none -translate-y-1 opacity-0",
            ].join(" ")}
          >
            <div className="flex items-center justify-between">
              <p className="text-[11px] text-white/34">Time</p>
              <button
                className="rounded-md px-2 py-1 text-[11px] text-white/34 transition-colors duration-100 ease-[cubic-bezier(0.16,1,0.3,1)] hover:bg-white/[0.05] hover:text-white/72"
                onClick={clearTime}
                type="button"
              >
                Clear
              </button>
            </div>

            <div className="mt-3 grid grid-cols-6 gap-1">
              {Array.from({ length: 24 }, (_, hour) => {
                const selected = parsedTime?.hour === hour;
                return (
                  <button
                    className={[
                      "flex h-8 items-center justify-center rounded-md border text-[12px] transition-colors duration-100 ease-[cubic-bezier(0.16,1,0.3,1)]",
                      selected
                        ? "border-indigo-400/40 bg-indigo-500/18 text-indigo-100"
                        : "border-white/10 text-white/56 hover:bg-white/[0.05] hover:text-white/82",
                    ].join(" ")}
                    key={hour}
                    onClick={() => updateHour(hour)}
                    type="button"
                  >
                    {`${hour}`.padStart(2, "0")}
                  </button>
                );
              })}
            </div>

            <div className="mt-3 border-t border-white/10 pt-3">
              <p className="mb-2 text-[11px] text-white/34">Minutes</p>
              <div className="flex items-center gap-1.5">
                {QUICK_MINUTES.map((minute) => {
                  const selected = parsedTime?.minute === Number(minute);
                  return (
                    <button
                      className={[
                        "flex h-8 min-w-10 items-center justify-center rounded-md border px-2 text-[12px] transition-colors duration-100 ease-[cubic-bezier(0.16,1,0.3,1)]",
                        selected
                          ? "border-indigo-400/40 bg-indigo-500/18 text-indigo-100"
                          : "border-white/10 text-white/56 hover:bg-white/[0.05] hover:text-white/82",
                      ].join(" ")}
                      key={minute}
                      onClick={() => updateMinute(minute)}
                      type="button"
                    >
                      {minute}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
