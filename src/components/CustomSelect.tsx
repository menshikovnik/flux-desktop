import { ReactNode, useEffect, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";

type SelectOption = {
  value: string | number;
  label: string;
  helper?: string;
  leading?: ReactNode;
};

type CustomSelectProps = {
  value: string | number;
  options: SelectOption[];
  onChange: (value: string | number) => void;
  triggerClassName?: string;
  menuClassName?: string;
  optionClassName?: string;
};

export function CustomSelect({
  value,
  options,
  onChange,
  triggerClassName = "",
  menuClassName = "",
  optionClassName = "",
}: CustomSelectProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const selectedOption = options.find((option) => option.value === value) ?? options[0];

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

  return (
    <div className="relative" ref={rootRef}>
      <button
        aria-expanded={open}
        className={[
          "flex w-full items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-2.5 text-left text-sm text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.02)] transition duration-200 hover:bg-white/[0.055] hover:text-white focus:border-[#6C63FF]/55 focus:outline-none",
          triggerClassName,
        ].join(" ")}
        onClick={() => setOpen((current) => !current)}
        type="button"
      >
        {selectedOption.leading ? (
          <span className="shrink-0">{selectedOption.leading}</span>
        ) : null}
        <span className="min-w-0 flex-1 truncate">{selectedOption.label}</span>
        <ChevronDown
          className={[
            "shrink-0 text-white/35 transition duration-200",
            open ? "rotate-180 text-white/65" : "",
          ].join(" ")}
          size={15}
        />
      </button>

      <div
        className={[
          "absolute left-0 top-[calc(100%+8px)] z-50 flex min-w-full origin-top flex-col gap-1 overflow-hidden rounded-2xl border border-white/[0.08] bg-[#171727] p-1 shadow-[0_18px_60px_rgba(0,0,0,0.42)] ring-1 ring-white/[0.03] backdrop-blur-xl transition duration-200",
          open
            ? "pointer-events-auto translate-y-0 scale-100 opacity-100"
            : "pointer-events-none -translate-y-1 scale-[0.98] opacity-0",
          menuClassName,
        ].join(" ")}
        role="listbox"
      >
        {options.map((option) => {
          const isSelected = option.value === value;

          return (
            <button
              className={[
                "flex min-h-[32px] w-full items-center gap-3 rounded-[12px] px-3 py-1.5 text-left transition",
                isSelected
                  ? "bg-[#6C63FF]/14 text-white"
                  : "text-white/68 hover:bg-white/[0.05] hover:text-white",
                optionClassName,
              ].join(" ")}
              key={String(option.value)}
              onClick={() => {
                onChange(option.value);
                setOpen(false);
              }}
              type="button"
            >
                <span className="flex min-w-0 flex-1 items-center gap-2">
                  {option.leading ? <span className="shrink-0">{option.leading}</span> : null}
                  <span className="min-w-0">
                    <span className="block whitespace-nowrap text-sm">{option.label}</span>
                    {option.helper ? (
                      <span className="block text-xs text-white/35">{option.helper}</span>
                    ) : null}
                  </span>
                </span>
              <Check
                className={isSelected ? "text-[#8d86ff]" : "opacity-0"}
                size={14}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}
