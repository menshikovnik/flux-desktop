import { memo, useCallback, useMemo, useState } from "react";
import type { MouseEvent } from "react";
import { Status, Task } from "../../../api";
import { TaskContextMenu } from "./TaskContextMenu";
import { TaskGroup } from "./TaskGroup";
import { TaskRow } from "./TaskRow";

const STATUS_GROUPS: Array<{ key: Task["status"]; label: string }> = [
  { key: "IN_PROGRESS", label: "In progress" },
  { key: "OPEN", label: "Open" },
  { key: "DONE", label: "Done" },
  { key: "CANCELLED", label: "Cancelled" },
];

type TaskListProps = {
  tasks: Task[];
  highlightedTaskId: number | null;
  loading: boolean;
  onDeleteTask: (task: Task) => void;
  onOpenTask: (task: Task) => void;
  onQuickAdd?: (status: Status, title: string) => Promise<void> | void;
  onToast?: (toast: { title: string; message: string; tone?: "error" | "success" }) => void;
  storageScope?: string;
};

function TaskListInner({
  tasks,
  highlightedTaskId,
  loading,
  onDeleteTask,
  onOpenTask,
  onQuickAdd,
  onToast,
  storageScope = "default",
}: TaskListProps) {
  const [contextMenu, setContextMenu] = useState<{ task: Task; x: number; y: number } | null>(null);

  // Stable — TaskRow is memo'd; recreating this on every render would defeat the memoization.
  const handleTaskContextMenu = useCallback((event: MouseEvent<HTMLButtonElement>, task: Task) => {
    event.preventDefault();
    setContextMenu({ task, x: event.clientX, y: event.clientY });
  }, []);
  const handleCloseContextMenu = useCallback(() => setContextMenu(null), []);

  // Bucket tasks by status once per `tasks` identity instead of scanning the full list per group.
  const tasksByStatus = useMemo(() => {
    const buckets: Record<Task["status"], Task[]> = {
      OPEN: [],
      IN_PROGRESS: [],
      DONE: [],
      CANCELLED: [],
    };

    for (const task of tasks) {
      buckets[task.status].push(task);
    }

    return buckets;
  }, [tasks]);

  if (loading) {
    return <div className="p-6 text-sm text-white/50">Loading tasks...</div>;
  }

  if (tasks.length === 0) {
    return <div className="p-6 text-sm text-white/50">No tasks here yet.</div>;
  }

  return (
    <div className="space-y-5 px-5 py-4">
      {STATUS_GROUPS.map((group) => {
        const groupTasks = tasksByStatus[group.key];
        if (groupTasks.length === 0) {
          return null;
        }

        const hasHighlightedTask = highlightedTaskId !== null &&
          groupTasks.some((task) => task.id === highlightedTaskId);

        return (
          <TaskGroup
            count={groupTasks.length}
            hasHighlightedTask={hasHighlightedTask}
            key={`${storageScope}:${group.key}`}
            onQuickAdd={onQuickAdd}
            status={group.key}
            storageScope={storageScope}
            title={group.label.toUpperCase()}
          >
            {groupTasks.map((task) => (
              <TaskRow
                key={task.id}
                highlighted={task.id === highlightedTaskId}
                onContextMenu={handleTaskContextMenu}
                onOpen={onOpenTask}
                task={task}
              />
            ))}
          </TaskGroup>
        );
      })}

      {contextMenu ? (
        <TaskContextMenu
          onClose={handleCloseContextMenu}
          onDeleteTask={onDeleteTask}
          onToast={onToast}
          task={contextMenu.task}
          x={contextMenu.x}
          y={contextMenu.y}
        />
      ) : null}
    </div>
  );
}

export const TaskList = memo(TaskListInner);
