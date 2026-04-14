type ProjectStatsBarProps = {
  total: number;
  open: number;
  inProgress: number;
  done: number;
};

export function ProjectStatsBar({ total, open, inProgress, done }: ProjectStatsBarProps) {
  const items = [
    { label: "Total", value: total },
    { label: "Open", value: open },
    { label: "In progress", value: inProgress },
    { label: "Done", value: done },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 border-b border-white/10 px-6 py-4 md:grid-cols-4">
      {items.map((item) => (
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3" key={item.label}>
          <p className="text-[11px] uppercase tracking-[0.2em] text-white/35">{item.label}</p>
          <strong className="mt-2 block text-2xl font-semibold text-white">{item.value}</strong>
        </div>
      ))}
    </div>
  );
}
