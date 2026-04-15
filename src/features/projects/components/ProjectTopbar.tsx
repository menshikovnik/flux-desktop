import { Plus, Trash2 } from "lucide-react";

type ProjectTopbarProps = {
  title: string;
  subtitle: string;
  color?: string | null;
  onCreateTask: () => void;
  onDeleteProject?: () => void;
  deleteProjectLoading?: boolean;
  isProjectView: boolean;
};

export function ProjectTopbar({
  title,
  subtitle,
  color,
  onCreateTask,
  onDeleteProject,
  deleteProjectLoading = false,
  isProjectView,
}: ProjectTopbarProps) {
  return (
    <div className="flex items-center gap-3 border-b border-white/[0.06] px-5 py-3">
      {/* Title block */}
      <div className="flex min-w-0 flex-1 items-center gap-2.5">
        {isProjectView && (
          <span
            className="h-2.5 w-2.5 shrink-0 rounded-full"
            style={{ backgroundColor: color || "#555558" }}
          />
        )}
        <h1 className="truncate text-[14px] font-semibold text-white/90">{title}</h1>
        <span className="hidden text-white/20 sm:inline">·</span>
        <span className="hidden truncate text-[13px] text-white/35 sm:block">{subtitle}</span>
      </div>

      {/* Actions */}
      <div className="flex shrink-0 items-center gap-2">
        {isProjectView && onDeleteProject && (
          <button
            className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[12px] text-red-400/60 transition hover:bg-red-500/[0.08] hover:text-red-400 disabled:opacity-40"
            disabled={deleteProjectLoading}
            onClick={onDeleteProject}
            type="button"
          >
            <Trash2 size={13} strokeWidth={1.75} />
            {deleteProjectLoading ? "Deleting…" : "Delete"}
          </button>
        )}
        <button
          className="flex items-center gap-1.5 rounded-md bg-white/[0.07] px-3 py-1.5 text-[12px] font-medium text-white/80 transition hover:bg-white/[0.11] hover:text-white"
          onClick={onCreateTask}
          type="button"
        >
          <Plus size={13} strokeWidth={2} />
          New task
        </button>
      </div>
    </div>
  );
}
