import { Task } from "../../../api";

function getStatusClasses(status: Task["status"]) {
  switch (status) {
    case "IN_PROGRESS":
      return "border-[#6366f1] bg-[#6366f1]";
    case "DONE":
      return "border-[#10b981] bg-[#10b981]";
    case "CANCELLED":
      return "border-[#6b7280] bg-[#6b7280]";
    case "OPEN":
    default:
      return "border-white/30 bg-transparent";
  }
}

function getPriorityClasses(priority: Task["priority"]) {
  switch (priority) {
    case "HIGH":
      return "bg-red-500/15 text-red-400";
    case "MEDIUM":
      return "bg-amber-500/15 text-amber-400";
    case "LOW":
    default:
      return "bg-green-500/15 text-green-400";
  }
}

function formatDueDate(input?: string | null) {
  if (!input) {
    return "No date";
  }

  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(new Date(input));
}

export function TaskRow({ task, onOpen }: { task: Task; onOpen: () => void }) {
  return (
    <button
      className="flex w-full items-center gap-3 rounded-2xl border border-white/10 bg-transparent px-4 py-3 text-left transition hover:bg-white/5"
      onClick={onOpen}
      type="button"
    >
      <span className={`h-3 w-3 shrink-0 rounded-full border-2 ${getStatusClasses(task.status)}`} />
      <span className="min-w-0 flex-1 truncate text-sm text-white">{task.title}</span>
      <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${getPriorityClasses(task.priority)}`}>
        {task.priority}
      </span>
      <span className="text-xs text-white/45">{formatDueDate(task.dueDate)}</span>
    </button>
  );
}
