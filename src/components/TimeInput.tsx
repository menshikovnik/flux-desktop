type TimeInputProps = {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  disabled?: boolean;
};

export function TimeInput({ value, onChange, className = "", disabled = false }: TimeInputProps) {
  return (
    <input
      className={[
        "h-7 min-w-[78px] rounded-md border border-white/10 bg-white/[0.02] px-2 py-1 text-[12px] text-white/58 outline-none transition duration-100 ease-[cubic-bezier(0.16,1,0.3,1)] [color-scheme:dark] hover:border-white/10 hover:bg-white/[0.04] focus:border-white/10",
        className,
      ].join(" ")}
      disabled={disabled}
      onChange={(event) => onChange(event.target.value)}
      step={60}
      type="time"
      value={value}
    />
  );
}
