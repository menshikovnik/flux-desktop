import { ChevronRight } from "lucide-react";
import { ReactNode, useState } from "react";

type TaskGroupProps = {
  title: string;
  count: number;
  children: ReactNode;
  defaultCollapsed?: boolean;
};

export function TaskGroup({ title, count, children, defaultCollapsed = true }: TaskGroupProps) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);

  return (
    <section className="space-y-3">
      <button
        className="flex w-full items-center gap-2 text-left text-xs uppercase tracking-[0.18em] text-white/35 transition hover:text-white/70"
        onClick={() => setCollapsed((current) => !current)}
        type="button"
      >
        <ChevronRight className={collapsed ? "transition" : "rotate-90 transition"} size={14} />
        <span>{title}</span>
        <span className="rounded-full bg-white/8 px-2 py-0.5 text-[10px] text-white/50">{count}</span>
      </button>
      {!collapsed ? <div className="space-y-2">{children}</div> : null}
    </section>
  );
}
