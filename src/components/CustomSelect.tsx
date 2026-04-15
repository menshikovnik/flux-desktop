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
          "flex min-h-7 w-full items-center gap-2 rounded-md border border-white/[0.06] bg-white/[0.018] px-2 py-1 text-left text-[12px] text-white/62 transition duration-100 ease-[cubic-bezier(0.16,1,0.3,1)] hover:border-white/[0.10] hover:bg-white/[0.03] hover:text-white/78 focus:border-white/[0.14] focus:outline-none",
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
            "shrink-0 text-white/28 transition duration-100 ease-[cubic-bezier(0.16,1,0.3,1)]",
            open ? "rotate-180 text-white/52" : "",
          ].join(" ")}
          size={13}
          strokeWidth={1.6}
        />
      </button>

      <div
        className={[
          "absolute left-0 top-[calc(100%+4px)] z-50 flex min-w-full origin-top flex-col gap-0.5 overflow-hidden rounded-lg border border-white/[0.07] bg-[#151516] p-1 shadow-[0_14px_34px_rgba(0,0,0,0.34)] ring-1 ring-white/[0.018] backdrop-blur-xl transition duration-100 ease-[cubic-bezier(0.16,1,0.3,1)]",
          open
            ? "pointer-events-auto translate-y-0 opacity-100"
            : "pointer-events-none -translate-y-0.5 opacity-0",
          menuClassName,
        ].join(" ")}
        role="listbox"
      >
        {options.map((option) => {
          const isSelected = option.value === value;

          return (
            <button
              className={[
                "flex min-h-7 w-full items-center gap-2 rounded-md px-2 py-1.5 text-left transition-colors duration-75 ease-[cubic-bezier(0.16,1,0.3,1)]",
                isSelected
                  ? "bg-white/[0.045] text-white/76"
                  : "text-white/48 hover:bg-white/[0.035] hover:text-white/72",
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
                    <span className="block whitespace-nowrap text-[12px]">{option.label}</span>
                    {option.helper ? (
                      <span className="block text-[11px] text-white/28">{option.helper}</span>
                    ) : null}
                  </span>
                </span>
              <Check
                className={isSelected ? "text-white/44" : "opacity-0"}
                size={12}
                strokeWidth={1.7}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}
