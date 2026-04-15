import { useState } from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { useDroppable, useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { Task } from "../../../api";
import { useUpdateTask } from "../hooks/useUpdateTask";

const COLUMNS: { id: Task["status"]; label: string; accent: string; dot: string; headerBg: string }[] = [
  {
    id: "OPEN",
    label: "Open",
    accent: "border-white/20",
    dot: "border border-white/40 bg-transparent",
    headerBg: "bg-white/[0.03]",
  },
  {
    id: "IN_PROGRESS",
    label: "In Progress",
    accent: "border-indigo-500/40",
    dot: "bg-indigo-500",
    headerBg: "bg-indigo-500/[0.06]",
  },
  {
    id: "DONE",
    label: "Done",
    accent: "border-emerald-500/40",
    dot: "bg-emerald-500",
    headerBg: "bg-emerald-500/[0.06]",
  },
  {
    id: "CANCELLED",
    label: "Cancelled",
    accent: "border-zinc-600/40",
    dot: "bg-zinc-500",
    headerBg: "bg-zinc-500/[0.04]",
  },
];

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
  if (!input) return null;
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(new Date(input));
}

function TaskCard({
  task,
  onOpen,
  isDragging = false,
}: {
  task: Task;
  onOpen: () => void;
  isDragging?: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({ id: task.id });

  const style = transform
    ? { transform: CSS.Translate.toString(transform) }
    : undefined;

  const due = formatDueDate(task.dueDate);

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={[
        "group relative rounded-2xl border bg-[#13131f] p-3.5 transition-shadow select-none",
        isDragging
          ? "border-white/20 opacity-0"
          : "border-white/[0.08] cursor-grab active:cursor-grabbing hover:border-white/[0.15] hover:bg-[#16162a]",
      ].join(" ")}
    >
      <p className="mb-3 text-sm leading-snug text-white/90 line-clamp-3 pr-1">{task.title}</p>
      <div className="flex items-center justify-between gap-2">
        <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-wide ${getPriorityClasses(task.priority)}`}>
          {task.priority}
        </span>
        {due && (
          <span className="text-[11px] text-white/35">{due}</span>
        )}
      </div>
      {/* Click zone for opening detail — separate from drag listeners */}
      <button
        className="absolute inset-0 rounded-2xl focus:outline-none"
        onClick={onOpen}
        onPointerDown={(e) => e.stopPropagation()}
        type="button"
        aria-label={`Open task: ${task.title}`}
      />
    </div>
  );
}

function TaskCardOverlay({ task }: { task: Task }) {
  const due = formatDueDate(task.dueDate);
  return (
    <div className="rounded-2xl border border-white/20 bg-[#1c1c30] p-3.5 shadow-[0_16px_48px_rgba(0,0,0,0.6)] rotate-[1.5deg] cursor-grabbing select-none w-[240px]">
      <p className="mb-3 text-sm leading-snug text-white/90 line-clamp-3 pr-1">{task.title}</p>
      <div className="flex items-center justify-between gap-2">
        <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-wide ${getPriorityClasses(task.priority)}`}>
          {task.priority}
        </span>
        {due && <span className="text-[11px] text-white/35">{due}</span>}
      </div>
    </div>
  );
}

function BoardColumn({
  column,
  tasks,
  isOver,
  onOpen,
}: {
  column: (typeof COLUMNS)[number];
  tasks: Task[];
  isOver: boolean;
  onOpen: (task: Task) => void;
}) {
  const { setNodeRef } = useDroppable({ id: column.id });

  return (
    <div className="flex w-[240px] shrink-0 flex-col gap-2">
      {/* Column header */}
      <div className={`flex items-center gap-2.5 rounded-xl border ${column.accent} ${column.headerBg} px-3.5 py-2.5`}>
        <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${column.dot}`} />
        <span className="flex-1 text-xs font-semibold uppercase tracking-[0.15em] text-white/60">
          {column.label}
        </span>
        <span className="text-xs text-white/30 tabular-nums">{tasks.length}</span>
      </div>

      {/* Drop zone */}
      <div
        ref={setNodeRef}
        className={[
          "flex min-h-[120px] flex-1 flex-col gap-2 rounded-2xl border-2 border-dashed p-1.5 transition-colors duration-150",
          isOver
            ? "border-white/25 bg-white/[0.04]"
            : "border-transparent",
        ].join(" ")}
      >
        {tasks.map((task) => (
          <TaskCard key={task.id} task={task} onOpen={() => onOpen(task)} />
        ))}
        {tasks.length === 0 && !isOver && (
          <div className="flex flex-1 items-center justify-center py-8">
            <span className="text-xs text-white/15">Drop here</span>
          </div>
        )}
      </div>
    </div>
  );
}

export function TaskBoard({
  tasks,
  loading,
  onOpenTask,
}: {
  tasks: Task[];
  loading: boolean;
  onOpenTask: (task: Task) => void;
}) {
  const updateTask = useUpdateTask();
  const [activeTaskId, setActiveTaskId] = useState<number | null>(null);
  const [overColumnId, setOverColumnId] = useState<Task["status"] | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  );

  const activeTask = activeTaskId != null ? tasks.find((t) => t.id === activeTaskId) ?? null : null;

  const tasksByStatus = Object.fromEntries(
    COLUMNS.map((col) => [col.id, tasks.filter((t) => t.status === col.id)])
  ) as Record<Task["status"], Task[]>;

  function handleDragStart(event: DragStartEvent) {
    setActiveTaskId(event.active.id as number);
  }

  function handleDragOver(event: DragOverEvent) {
    const overId = event.over?.id as Task["status"] | null;
    setOverColumnId(overId ?? null);
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveTaskId(null);
    setOverColumnId(null);

    if (!over) return;

    const taskId = active.id as number;
    const newStatus = over.id as Task["status"];
    const task = tasks.find((t) => t.id === taskId);

    if (!task || task.status === newStatus) return;

    updateTask.mutate({ id: taskId, payload: { status: newStatus } });
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <span className="text-sm text-white/30">Loading…</span>
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex h-full gap-4 overflow-x-auto px-6 py-5 pb-6">
        {COLUMNS.map((col) => (
          <BoardColumn
            key={col.id}
            column={col}
            tasks={tasksByStatus[col.id]}
            isOver={overColumnId === col.id}
            onOpen={onOpenTask}
          />
        ))}
      </div>

      <DragOverlay dropAnimation={{ duration: 180, easing: "cubic-bezier(0.22,1,0.36,1)" }}>
        {activeTask ? <TaskCardOverlay task={activeTask} /> : null}
      </DragOverlay>
    </DndContext>
  );
}
