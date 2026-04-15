import { Task } from "../../../api";

type StatItem = {
  label: string;
  value: number;
  status: Task["status"] | null;
  activeColor: string;
};

type ProjectStatsBarProps = {
  total: number;
  open: number;
  inProgress: number;
  done: number;
  cancelled: number;
  activeFilter: Task["status"] | null;
  onFilter: (status: Task["status"] | null) => void;
};

export function ProjectStatsBar({
  total,
  open,
  inProgress,
  done,
  cancelled,
  activeFilter,
  onFilter,
}: ProjectStatsBarProps) {
  const items: StatItem[] = [
    { label: "Total", value: total, status: null, activeColor: "" },
    { label: "Open", value: open, status: "OPEN", activeColor: "border-white/20 bg-white/[0.06]" },
    { label: "In progress", value: inProgress, status: "IN_PROGRESS", activeColor: "border-indigo-500/30 bg-indigo-500/[0.08]" },
    { label: "Done", value: done, status: "DONE", activeColor: "border-emerald-500/30 bg-emerald-500/[0.08]" },
    { label: "Cancelled", value: cancelled, status: "CANCELLED", activeColor: "border-zinc-500/30 bg-zinc-500/[0.06]" },
  ];

  return (
    <div className="grid grid-cols-3 gap-3 border-b border-white/10 px-6 py-4 md:grid-cols-5">
      {items.map((item) => {
        const isActive = item.status !== null && activeFilter === item.status;
        const isClickable = item.status !== null;

        const baseClass =
          "rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 transition-colors duration-150";
        const activeClass = isActive ? item.activeColor : "";
        const hoverClass = isClickable
          ? "cursor-pointer hover:border-white/[0.16] hover:bg-white/[0.07]"
          : "";

        return isClickable ? (
          <button
            key={item.label}
            type="button"
            onClick={() => onFilter(activeFilter === item.status ? null : item.status)}
            className={[baseClass, activeClass, hoverClass, "text-left w-full"].join(" ")}
          >
            <p className="text-[11px] uppercase tracking-[0.2em] text-white/35">{item.label}</p>
            <strong className="mt-2 block text-2xl font-semibold text-white">{item.value}</strong>
          </button>
        ) : (
          <div key={item.label} className={[baseClass].join(" ")}>
            <p className="text-[11px] uppercase tracking-[0.2em] text-white/35">{item.label}</p>
            <strong className="mt-2 block text-2xl font-semibold text-white">{item.value}</strong>
          </div>
        );
      })}
    </div>
  );
}
