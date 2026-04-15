import { ReactNode } from "react";
import { ActivityItem } from "./detailTypes";
import { formatTimestamp } from "./detailHelpers";

export function IconButton({ children, label, onClick }: { children: ReactNode; label: string; onClick: () => void }) {
  return (
    <button
      aria-label={label}
      className="flex h-7 w-7 items-center justify-center rounded-md text-white/30 transition hover:bg-white/[0.045] hover:text-white/68"
      onClick={onClick}
      title={label}
      type="button"
    >
      {children}
    </button>
  );
}

export function MetadataRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-[62px_minmax(0,1fr)] items-center gap-2">
      <span className="text-[11px] text-white/27">{label}</span>
      <div className="min-w-0">{children}</div>
    </div>
  );
}

export function SectionHeader({ title, badge, spacing = "panel" }: { title: string; badge: string; spacing?: "panel" | "full" }) {
  return (
    <div className={`${spacing === "full" ? "mt-7" : "mt-6"} flex items-center gap-2`}>
      <p className="text-[10px] uppercase tracking-[0.16em] text-white/28">{title}</p>
      <span className="text-[10px] text-white/24">{badge}</span>
      <span className="h-px flex-1 bg-white/[0.055]" />
    </div>
  );
}

export function Avatar({ letter }: { letter: string }) {
  return (
    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/[0.045] text-[10px] font-medium text-white/30">
      {letter.slice(0, 1)}
    </span>
  );
}

export function ActivityTimeline({ activity }: { activity: ActivityItem[] }) {
  return (
    <div className="mt-2 space-y-0 border-l border-white/[0.075] pl-3">
      {activity.map((item) => (
        <div className="relative flex gap-2 py-2" key={item.id}>
          <span className="absolute -left-[15px] top-4 h-1.5 w-1.5 rounded-full bg-[#111113] ring-1 ring-white/[0.16]" />
          <Avatar letter={item.user} />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 text-[11px] text-white/28">
              <span>{item.user}</span>
              <span>{formatTimestamp(item.timestamp)}</span>
            </div>
            {item.type === "event" ? (
              <p className="mt-1 text-[12px] text-white/42">
                <span className="text-white/24 line-through">{item.oldValue}</span>
                <span className="mx-1.5 text-white/20">{"->"}</span>
                <span className="text-white/58">{item.newValue}</span>
              </p>
            ) : (
              <p className="mt-1 whitespace-pre-wrap break-words text-[12px] leading-5 text-white/52">{item.text}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
