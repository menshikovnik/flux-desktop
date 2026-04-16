import { useCallback, useDeferredValue, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { QueryKey, useQueries, useQueryClient } from "@tanstack/react-query";
import { Navigate, Route, Routes, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Search } from "lucide-react";
import { Kbd } from "./components/Kbd";
import { Project, Status, Task, isApiErrorWithStatus, logoutUser, normalizeApiError, setAccessToken } from "./api";
import "./App.css";
import { formatShortcut, getModifierKeyLabel } from "./app/platform";
import { useShortcut } from "./app/useShortcut";
import { useAuth } from "./auth";
import { AuthPage } from "./components/AuthPage";
import { NewProjectModal } from "./features/projects/components/NewProjectModal";
import { ProjectTopbar } from "./features/projects/components/ProjectTopbar";
import { useCreateProject } from "./features/projects/hooks/useCreateProject";
import { useDeleteProject } from "./features/projects/hooks/useDeleteProject";
import { useProject } from "./features/projects/hooks/useProject";
import { useProjects } from "./features/projects/hooks/useProjects";
import { ConfirmDeleteModal } from "./features/tasks/components/ConfirmDeleteModal";
import { NewTaskModal } from "./features/tasks/components/NewTaskModal";
import { TaskList } from "./features/tasks/components/TaskList";
import { TaskBoard } from "./features/tasks/components/TaskBoard";
import { TaskFullView } from "./features/tasks/components/TaskFullView";
import { deleteTask as deleteTaskRequest, getAllTasks } from "./features/tasks/api/tasksApi";
import { useCreateTask } from "./features/tasks/hooks/useCreateTask";
import { useTasks } from "./features/tasks/hooks/useTasks";
import { AppLayout } from "./layout/AppLayout";
import { Sidebar } from "./layout/Sidebar";

type Notice = {
  title: string;
  message: string;
  tone?: "error" | "success";
};

type UndoTaskToast = {
  taskTitle: string;
  onUndo: () => void;
};

type PendingTaskDelete = {
  taskId: number;
  timeoutId: number;
  previousEntries: Array<[QueryKey, Task[] | undefined]>;
  previousTask: Task;
};

const WORKSPACE_VIEW_STORAGE_KEY = "flux-workspace-view";
const WORKSPACE_VIEW_EVENT = "flux:set-workspace-view";

function readStoredWorkspaceView() {
  if (typeof window === "undefined") {
    return "list" as const;
  }

  const stored = window.sessionStorage.getItem(WORKSPACE_VIEW_STORAGE_KEY);
  return stored === "board" || stored === "timeline" ? stored : "list";
}

function setStoredWorkspaceView(view: "list" | "board" | "timeline") {
  if (typeof window === "undefined") {
    return;
  }

  window.sessionStorage.setItem(WORKSPACE_VIEW_STORAGE_KEY, view);
  window.dispatchEvent(new CustomEvent(WORKSPACE_VIEW_EVENT, { detail: view }));
}

function isToday(dateString?: string | null) {
  if (!dateString) {
    return false;
  }

  const today = new Date();
  const date = new Date(dateString);

  return (
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()
  );
}

function sortTasks(tasks: Task[]) {
  return [...tasks].sort((left, right) => {
    const statusOrder: Record<Task["status"], number> = {
      IN_PROGRESS: 0,
      OPEN: 1,
      DONE: 2,
      CANCELLED: 3,
    };

    return (
      statusOrder[left.status] - statusOrder[right.status] ||
      new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime()
    );
  });
}

function ComingSoonPanel({ label }: { label: string }) {
  return (
    <div className="flex h-full items-center justify-center px-6">
      <div className="rounded-[28px] border border-dashed border-white/10 bg-white/[0.03] px-10 py-12 text-center">
        <p className="text-xs uppercase tracking-[0.24em] text-white/35">{label}</p>
        <h2 className="mt-3 text-2xl font-semibold text-white">Coming soon</h2>
        <p className="mt-2 max-w-md text-sm text-white/50">
          {label} view is not implemented yet, but the navigation is already in place.
        </p>
      </div>
    </div>
  );
}

function WorkspaceView({
  allProjects,
  onDeleteTask,
  highlightedTaskId,
  onHighlightTask,
  onOpenTask,
  onOpenTaskModal,
  onQuickCreateTask,
  onToast,
}: {
  allProjects: Project[];
  onDeleteTask: (task: Task) => void;
  highlightedTaskId: number | null;
  onHighlightTask: (taskId: number | null) => void;
  onOpenTask: (task: Task) => void;
  onOpenTaskModal: (projectId?: number, initialStatus?: Status) => void;
  onQuickCreateTask: (values: { title: string; status: Status; projectId: number | null }) => Promise<void>;
  onToast: (toast: Notice) => void;
}) {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"list" | "board" | "timeline">(() => readStoredWorkspaceView());
  const [searchQuery, setSearchQuery] = useState("");
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const modifierLabel = getModifierKeyLabel();
  const tabsRef = useRef<Record<"list" | "board" | "timeline", HTMLButtonElement | null>>({
    list: null,
    board: null,
    timeline: null,
  });
  const tabsRailRef = useRef<HTMLDivElement | null>(null);
  const [tabUnderline, setTabUnderline] = useState({ width: 0, x: 0, opacity: 0 });
  const projectIdParam = useParams().projectId;
  const projectId = projectIdParam ? Number(projectIdParam) : null;
  const todayMode = searchParams.get("view") === "today";
  const projectQuery = useProject(projectId);
  const project = projectId
    ? projectQuery.data ?? allProjects.find((item) => item.id === projectId) ?? null
    : null;

  const taskQuery = useTasks(projectId ? { projectId } : {});
  const deleteProject = useDeleteProject();
  const rawTasks = useMemo(() => taskQuery.data ?? [], [taskQuery.data]);
  const scopedTasks = useMemo(() => {
    if (todayMode && projectId === null) {
      return rawTasks.filter((task) => isToday(task.dueDate));
    }

    return rawTasks;
  }, [projectId, rawTasks, todayMode]);
  // Defer the filter term so typing stays responsive — React keeps the input updating at
  // high priority and re-runs the (potentially expensive) filter during idle time.
  const deferredSearch = useDeferredValue(searchQuery);
  const tasks = useMemo(() => {
    const query = deferredSearch.trim().toLowerCase();
    const visibleTasks = query
      ? scopedTasks.filter((task) =>
          [task.title, task.description ?? ""].some((value) => value.toLowerCase().includes(query)),
        )
      : scopedTasks;

    return sortTasks(visibleTasks);
  }, [scopedTasks, deferredSearch]);

  const taskIndexById = useMemo(
    () => new Map(tasks.map((task, index) => [task.id, index])),
    [tasks],
  );

  const boardColumns = useMemo(() => {
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


  const title = project ? project.name : todayMode ? "Today" : "My tasks";
  const subtitle = project
    ? `${tasks.length} tasks in this workspace`
    : todayMode
      ? "Tasks due today across all projects"
      : "Everything across all projects";

  useLayoutEffect(() => {
    const activeButton = tabsRef.current[activeTab];
    const rail = tabsRailRef.current;

    if (!activeButton || !rail) {
      return;
    }

    setTabUnderline({
      width: activeButton.offsetWidth,
      x: activeButton.offsetLeft,
      opacity: 1,
    });
  }, [activeTab]);

  useEffect(() => {
    setStoredWorkspaceView(activeTab);
  }, [activeTab]);

  useEffect(() => {
    function handleWorkspaceViewChange(event: Event) {
      const nextView = (event as CustomEvent<"list" | "board" | "timeline">).detail;
      setActiveTab(nextView);
    }

    window.addEventListener(WORKSPACE_VIEW_EVENT, handleWorkspaceViewChange);
    return () => window.removeEventListener(WORKSPACE_VIEW_EVENT, handleWorkspaceViewChange);
  }, []);

  useShortcut(
    { code: "KeyC" },
    () => {
      onOpenTaskModal(project?.id ?? undefined);
    },
  );

  useShortcut(
    { code: "Digit1", mod: true },
    () => {
      setActiveTab("list");
    },
  );

  useShortcut(
    { code: "Digit2", mod: true },
    () => {
      setActiveTab("board");
    },
  );

  useShortcut(
    { code: "Slash" },
    () => {
      searchInputRef.current?.focus();
      searchInputRef.current?.select();
    },
  );

  useShortcut(
    { code: "ArrowDown" },
    () => {
      if (tasks.length === 0) {
        return;
      }

      if (activeTab === "board") {
        const currentTask = highlightedTaskId ? tasks.find((task) => task.id === highlightedTaskId) ?? null : null;
        if (!currentTask) {
          onHighlightTask(tasks[0].id);
          return;
        }

        const columnTasks = boardColumns[currentTask.status];
        const nextIndex = columnTasks.findIndex((task) => task.id === currentTask.id) + 1;
        const nextTask = columnTasks[Math.min(nextIndex, columnTasks.length - 1)];
        onHighlightTask(nextTask?.id ?? currentTask.id);
        return;
      }

      const currentIndex = highlightedTaskId !== null ? taskIndexById.get(highlightedTaskId) ?? -1 : -1;
      const nextTask = tasks[Math.min(currentIndex + 1, tasks.length - 1)] ?? tasks[0];
      onHighlightTask(nextTask.id);
    },
  );

  useShortcut(
    { code: "ArrowUp" },
    () => {
      if (tasks.length === 0) {
        return;
      }

      if (activeTab === "board") {
        const currentTask = highlightedTaskId ? tasks.find((task) => task.id === highlightedTaskId) ?? null : null;
        if (!currentTask) {
          onHighlightTask(tasks[0].id);
          return;
        }

        const columnTasks = boardColumns[currentTask.status];
        const currentIndex = columnTasks.findIndex((task) => task.id === currentTask.id);
        const nextTask = columnTasks[Math.max(currentIndex - 1, 0)];
        onHighlightTask(nextTask?.id ?? currentTask.id);
        return;
      }

      const currentIndex = highlightedTaskId !== null ? taskIndexById.get(highlightedTaskId) ?? tasks.length : tasks.length;
      const nextTask = tasks[Math.max(currentIndex - 1, 0)] ?? tasks[0];
      onHighlightTask(nextTask.id);
    },
  );

  useShortcut(
    { code: "ArrowRight" },
    () => {
      if (tasks.length === 0) {
        return;
      }

      if (activeTab !== "board") {
        const currentIndex = highlightedTaskId !== null ? taskIndexById.get(highlightedTaskId) ?? -1 : -1;
        const nextTask = tasks[Math.min(currentIndex + 1, tasks.length - 1)] ?? tasks[0];
        onHighlightTask(nextTask.id);
        return;
      }

      const statusOrder: Task["status"][] = ["OPEN", "IN_PROGRESS", "DONE", "CANCELLED"];
      const currentTask = highlightedTaskId ? tasks.find((task) => task.id === highlightedTaskId) ?? null : null;
      if (!currentTask) {
        onHighlightTask(tasks[0].id);
        return;
      }

      const currentStatusIndex = statusOrder.indexOf(currentTask.status);
      const currentRow = Math.max(boardColumns[currentTask.status].findIndex((task) => task.id === currentTask.id), 0);

      for (let index = currentStatusIndex + 1; index < statusOrder.length; index += 1) {
        const nextColumn = boardColumns[statusOrder[index]];
        if (nextColumn.length === 0) {
          continue;
        }

        const nextTask = nextColumn[Math.min(currentRow, nextColumn.length - 1)];
        onHighlightTask(nextTask.id);
        return;
      }
    },
  );

  useShortcut(
    { code: "ArrowLeft" },
    () => {
      if (tasks.length === 0) {
        return;
      }

      if (activeTab !== "board") {
        const currentIndex = highlightedTaskId !== null ? taskIndexById.get(highlightedTaskId) ?? tasks.length : tasks.length;
        const nextTask = tasks[Math.max(currentIndex - 1, 0)] ?? tasks[0];
        onHighlightTask(nextTask.id);
        return;
      }

      const statusOrder: Task["status"][] = ["OPEN", "IN_PROGRESS", "DONE", "CANCELLED"];
      const currentTask = highlightedTaskId ? tasks.find((task) => task.id === highlightedTaskId) ?? null : null;
      if (!currentTask) {
        onHighlightTask(tasks[0].id);
        return;
      }

      const currentStatusIndex = statusOrder.indexOf(currentTask.status);
      const currentRow = Math.max(boardColumns[currentTask.status].findIndex((task) => task.id === currentTask.id), 0);

      for (let index = currentStatusIndex - 1; index >= 0; index -= 1) {
        const nextColumn = boardColumns[statusOrder[index]];
        if (nextColumn.length === 0) {
          continue;
        }

        const nextTask = nextColumn[Math.min(currentRow, nextColumn.length - 1)];
        onHighlightTask(nextTask.id);
        return;
      }
    },
  );

  useShortcut(
    { code: "Delete" },
    () => {
      if (highlightedTaskId === null) {
        return;
      }

      const task = tasks.find((item) => item.id === highlightedTaskId);
      if (!task) {
        return;
      }

      onDeleteTask(task);
      const currentIndex = taskIndexById.get(task.id) ?? 0;
      const fallbackTask = tasks[currentIndex + 1] ?? tasks[currentIndex - 1] ?? null;
      onHighlightTask(fallbackTask?.id ?? null);
    },
  );

  useShortcut(
    { code: "Enter" },
    () => {
      if (highlightedTaskId === null) {
        return;
      }

      const task = tasks.find((item) => item.id === highlightedTaskId);
      if (!task) {
        return;
      }

      onOpenTask(task);
    },
  );

  useShortcut(
    { code: "Escape" },
    () => {
      onHighlightTask(null);
      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }
    },
  );

  if (projectId !== null && !project && !taskQuery.isLoading && !projectQuery.isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="rounded-[28px] border border-white/10 bg-white/[0.03] px-8 py-10 text-center">
          <h2 className="text-2xl font-semibold text-white">Project not found</h2>
          <p className="mt-2 text-sm text-white/50">This project may have been archived or removed.</p>
        </div>
      </div>
    );
  }

  // Stable handlers so memoized children (TaskList / TaskBoard) don't re-render on unrelated parent updates.
  const handleOpenTask = useCallback(
    (task: Task) => {
      if (projectId !== null) {
        onOpenTask({ ...task, projectId });
        return;
      }

      onOpenTask(task);
    },
    [onOpenTask, projectId],
  );

  const handleQuickCreate = useCallback(
    (status: Status, titleValue: string) =>
      onQuickCreateTask({
        title: titleValue,
        status,
        projectId,
      }),
    [onQuickCreateTask, projectId],
  );

  async function handleDeleteProjectConfirm() {
    if (!project) {
      return;
    }

    try {
      const projectName = project.name;
      await deleteProject.mutateAsync(project.id);
      setDeleteConfirmOpen(false);
      navigate("/tasks", { replace: true });
      onToast({
        title: "Project deleted",
        message: `${projectName} was removed.`,
        tone: "success",
      });
    } catch (error) {
      const normalized = normalizeApiError(error);
      onToast({
        title: "Couldn't delete project",
        message: normalized.message,
        tone: "error",
      });
    }
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <ProjectTopbar
        color={project?.color}
        deleteProjectLoading={deleteProject.isPending}
        isProjectView={Boolean(project)}
        onCreateTask={() => onOpenTaskModal(project?.id)}
        onDeleteProject={project ? () => setDeleteConfirmOpen(true) : undefined}
        onSearchChange={setSearchQuery}
        searchInputRef={searchInputRef}
        searchQuery={searchQuery}
        newTaskShortcutLabel="C"
        subtitle={subtitle}
        title={title}
      />

      <div className="flex items-center gap-2 border-b border-white/10 px-5">
        <div className="tab-strip relative inline-flex" ref={tabsRailRef}>
          <span
            className="tab-strip__underline absolute bottom-0 h-[1.5px] rounded-full bg-white/50 transition-[transform,width,opacity] duration-150 ease-[cubic-bezier(0.16,1,0.3,1)]"
            style={{
              width: `${tabUnderline.width}px`,
              transform: `translateX(${tabUnderline.x}px)`,
              opacity: tabUnderline.opacity,
            }}
          />
          {(["list", "board", "timeline"] as const).map((tab) => (
            <button
              className={[
                "relative z-10 inline-flex items-center gap-1.5 px-3 py-2.5 text-[13px] transition-colors duration-100 ease-[cubic-bezier(0.16,1,0.3,1)]",
                activeTab === tab ? "text-white/90" : "text-white/30 hover:text-white/60",
              ].join(" ")}
              key={tab}
              onClick={() => setActiveTab(tab)}
              ref={(node) => { tabsRef.current[tab] = node; }}
              type="button"
            >
              {tab === "list" ? "List" : tab === "board" ? "Board" : "Timeline"}
              {tab === "list" ? (
                <Kbd className="opacity-70">
                  {formatShortcut([modifierLabel, "1"])}
                </Kbd>
              ) : null}
              {tab === "board" ? (
                <Kbd className="opacity-70">
                  {formatShortcut([modifierLabel, "2"])}
                </Kbd>
              ) : null}
            </button>
          ))}
        </div>

        {todayMode && (
          <button
            className="ml-auto text-[12px] text-white/25 transition-colors duration-100 ease-[cubic-bezier(0.16,1,0.3,1)] hover:text-white/55"
            onClick={() => setSearchParams({})}
            type="button"
          >
            Exit Today view
          </button>
        )}
      </div>

      <div className={["min-h-0 flex-1", activeTab === "board" ? "overflow-hidden" : "overflow-y-auto"].join(" ")}>
        {activeTab === "board" ? (
          <TaskBoard
            loading={taskQuery.isLoading}
            highlightedTaskId={highlightedTaskId}
            onDeleteTask={onDeleteTask}
            onOpenTask={handleOpenTask}
            onQuickAdd={handleQuickCreate}
            onToast={onToast}
            tasks={tasks}
          />
        ) : activeTab === "timeline" ? (
          <ComingSoonPanel label="Timeline" />
        ) : (
          <TaskList
            loading={taskQuery.isLoading}
            highlightedTaskId={highlightedTaskId}
            onDeleteTask={onDeleteTask}
            onOpenTask={handleOpenTask}
            onQuickAdd={handleQuickCreate}
            onToast={onToast}
            storageScope={projectId !== null ? `project:${projectId}` : todayMode ? "tasks:today" : "tasks:all"}
            tasks={tasks}
          />
        )}
      </div>

      <ConfirmDeleteModal
        confirmLabel="Delete project"
        loading={deleteProject.isPending}
        message={
          project
            ? `This will permanently remove "${project.name}" and refresh the workspace.`
            : "This action cannot be undone."
        }
        onCancel={() => setDeleteConfirmOpen(false)}
        onConfirm={() => void handleDeleteProjectConfirm()}
        open={deleteConfirmOpen}
        title="Delete project?"
      />
    </div>
  );
}

function AppShell() {
  const { user, clearUser } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [notice, setNotice] = useState<Notice | null>(null);
  const [undoTaskToast, setUndoTaskToast] = useState<UndoTaskToast | null>(null);
  const [showArchived, setShowArchived] = useState(false);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [closingProjectModal, setClosingProjectModal] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [closingTaskModal, setClosingTaskModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailMounted, setDetailMounted] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [newTaskProjectId, setNewTaskProjectId] = useState<number | undefined>(undefined);
  const [newTaskStatus, setNewTaskStatus] = useState<Status | undefined>(undefined);
  const [highlightedProjectId, setHighlightedProjectId] = useState<number | null>(null);
  const [highlightedTaskId, setHighlightedTaskId] = useState<number | null>(null);

  const projectsQuery = useProjects();
  const allTasksQuery = useTasks();
  const createProject = useCreateProject();
  const createTask = useCreateTask();
  const pendingTaskDeleteRef = useRef<PendingTaskDelete | null>(null);
  const detailOpenFrameRef = useRef<number | null>(null);
  const detailCloseTimeoutRef = useRef<number | null>(null);
  const taskModalCloseTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    function preventBrowserContextMenu(event: MouseEvent) {
      event.preventDefault();
    }

    window.addEventListener("contextmenu", preventBrowserContextMenu);
    return () => window.removeEventListener("contextmenu", preventBrowserContextMenu);
  }, []);

  useShortcut(
    { code: "KeyK", mod: true },
    () => {
      setCommandPaletteOpen(true);
    },
  );

  useShortcut(
    {
      code: "Backspace",
      enabled: detailOpen && Boolean(selectedTask) && !showTaskModal && !showProjectModal && !commandPaletteOpen,
    },
    () => {
      if (selectedTask) {
        handleUndoableDeleteTask(selectedTask);
      }
    },
  );

  useShortcut(
    {
      code: "Delete",
      enabled: detailOpen && Boolean(selectedTask) && !showTaskModal && !showProjectModal && !commandPaletteOpen,
    },
    () => {
      if (selectedTask) {
        handleUndoableDeleteTask(selectedTask);
      }
    },
  );

  function showToast(toast: Notice) {
    setNotice(toast);
  }

  function restoreTaskDelete(context: Pick<PendingTaskDelete, "previousEntries" | "previousTask" | "taskId">) {
    context.previousEntries.forEach(([queryKey, data]) => {
      queryClient.setQueryData(queryKey, data);
    });
    queryClient.setQueryData(["task", context.taskId], context.previousTask);
  }

  function removeTaskFromCaches(taskId: number) {
    const cachedEntries = queryClient.getQueriesData<Task[]>({ queryKey: ["tasks"] });
    cachedEntries.forEach(([queryKey, tasks]) => {
      if (!tasks) {
        return;
      }

      queryClient.setQueryData<Task[]>(
        queryKey,
        tasks.filter((task) => task.id !== taskId),
      );
    });
    queryClient.removeQueries({ queryKey: ["task", taskId] });
  }

  function commitPendingTaskDelete() {
    const pending = pendingTaskDeleteRef.current;
    if (!pending) {
      return;
    }

    window.clearTimeout(pending.timeoutId);
    pendingTaskDeleteRef.current = null;
    void deleteTaskRequest(pending.taskId)
      .then(() => queryClient.invalidateQueries({ queryKey: ["tasks"] }))
      .catch((error) => {
        if (isApiErrorWithStatus(error, 404)) {
          removeTaskFromCaches(pending.taskId);
          return;
        }

        restoreTaskDelete(pending);
        const normalized = normalizeApiError(error);
        setNotice({
          title: "Couldn't delete task",
          message: normalized.message,
          tone: "error",
        });
      });
  }

  function handleUndoableDeleteTask(task: Task) {
    commitPendingTaskDelete();

    const previousEntries = queryClient.getQueriesData<Task[]>({ queryKey: ["tasks"] });
    const previousTask = queryClient.getQueryData<Task>(["task", task.id]) ?? task;

    previousEntries.forEach(([queryKey, tasks]) => {
      if (!tasks) {
        return;
      }

      queryClient.setQueryData<Task[]>(
        queryKey,
        tasks.filter((item) => item.id !== task.id),
      );
    });
    queryClient.removeQueries({ queryKey: ["task", task.id] });
    closeDetail();

    const pending: PendingTaskDelete = {
      taskId: task.id,
      previousEntries,
      previousTask,
      timeoutId: window.setTimeout(() => {
        pendingTaskDeleteRef.current = null;
        setUndoTaskToast(null);
        void deleteTaskRequest(task.id)
          .then(() => queryClient.invalidateQueries({ queryKey: ["tasks"] }))
          .catch((error) => {
            if (isApiErrorWithStatus(error, 404)) {
              removeTaskFromCaches(task.id);
              return;
            }

            restoreTaskDelete(pending);
            const normalized = normalizeApiError(error);
            setNotice({
              title: "Couldn't delete task",
              message: normalized.message,
              tone: "error",
            });
          });
      }, 4000),
    };

    pendingTaskDeleteRef.current = pending;
    setUndoTaskToast({
      taskTitle: task.title,
      onUndo: () => {
        window.clearTimeout(pending.timeoutId);
        if (pendingTaskDeleteRef.current?.taskId === task.id) {
          pendingTaskDeleteRef.current = null;
        }
        restoreTaskDelete(pending);
        setUndoTaskToast(null);
      },
    });
  }

  useEffect(() => {
    return () => {
      if (pendingTaskDeleteRef.current) {
        window.clearTimeout(pendingTaskDeleteRef.current.timeoutId);
      }
      if (detailOpenFrameRef.current !== null) {
        window.cancelAnimationFrame(detailOpenFrameRef.current);
      }
      if (detailCloseTimeoutRef.current !== null) {
        window.clearTimeout(detailCloseTimeoutRef.current);
      }
      if (taskModalCloseTimeoutRef.current !== null) {
        window.clearTimeout(taskModalCloseTimeoutRef.current);
      }
    };
  }, []);

  function openProjectModal() {
    setClosingProjectModal(false);
    setShowProjectModal(true);
  }

  function closeProjectModal() {
    setClosingProjectModal(true);
    window.setTimeout(() => {
      setShowProjectModal(false);
      setClosingProjectModal(false);
    }, 150);
  }

  function openTaskModal(projectId?: number, initialStatus?: Status) {
    if (taskModalCloseTimeoutRef.current !== null) {
      window.clearTimeout(taskModalCloseTimeoutRef.current);
      taskModalCloseTimeoutRef.current = null;
    }
    setNewTaskProjectId(projectId);
    setNewTaskStatus(initialStatus);
    setClosingTaskModal(false);
    setShowTaskModal(true);
  }

  function closeTaskModal() {
    if (taskModalCloseTimeoutRef.current !== null) {
      window.clearTimeout(taskModalCloseTimeoutRef.current);
    }
    setClosingTaskModal(true);
    taskModalCloseTimeoutRef.current = window.setTimeout(() => {
      taskModalCloseTimeoutRef.current = null;
      setShowTaskModal(false);
      setClosingTaskModal(false);
    }, 150);
  }

  function openDetail(task: Task) {
    if (detailCloseTimeoutRef.current !== null) {
      window.clearTimeout(detailCloseTimeoutRef.current);
      detailCloseTimeoutRef.current = null;
    }
    if (detailOpenFrameRef.current !== null) {
      window.cancelAnimationFrame(detailOpenFrameRef.current);
      detailOpenFrameRef.current = null;
    }

    if (detailOpen && selectedTask?.id === task.id) {
      closeDetail();
      return;
    }

    setSelectedTask(task);
    setDetailMounted(true);
    detailOpenFrameRef.current = window.requestAnimationFrame(() => {
      detailOpenFrameRef.current = null;
      setDetailOpen(true);
    });
  }

  function closeDetail() {
    if (detailOpenFrameRef.current !== null) {
      window.cancelAnimationFrame(detailOpenFrameRef.current);
      detailOpenFrameRef.current = null;
    }
    if (detailCloseTimeoutRef.current !== null) {
      window.clearTimeout(detailCloseTimeoutRef.current);
    }

    setDetailOpen(false);
    detailCloseTimeoutRef.current = window.setTimeout(() => {
      detailCloseTimeoutRef.current = null;
      setDetailMounted(false);
      setSelectedTask(null);
    }, 200);
  }

  async function handleLogout() {
    try {
      await logoutUser();
    } catch {
      // Ignore logout errors and clear local session anyway.
    } finally {
      setAccessToken(null);
      clearUser();
      navigate("/");
    }
  }

  async function handleCreateProject(values: { name: string; description: string; color: string }) {
    try {
      const project = await createProject.mutateAsync(values);
      setHighlightedProjectId(project.id);
      closeProjectModal();
      window.setTimeout(() => {
        navigate(`/projects/${project.id}`);
        setNotice({
          title: "Project created",
          message: `${project.name} is ready.`,
          tone: "success",
        });
      }, 150);
      window.setTimeout(() => {
        setHighlightedProjectId((current) => (current === project.id ? null : current));
      }, 1200);
    } catch (error) {
      const normalized = normalizeApiError(error);
      setNotice({
        title: "Couldn't create project",
        message: normalized.message,
        tone: "error",
      });
    }
  }

  async function handleCreateTask(values: {
    title: string;
    description: string;
    status: Task["status"];
    priority: Task["priority"];
    dueDate: string | null;
    projectId: number | null;
  }) {
    try {
      const task = await createTask.mutateAsync(values);
      setHighlightedTaskId(task.id);
      closeTaskModal();
    } catch (error) {
      const normalized = normalizeApiError(error);
      setNotice({
        title: "Couldn't create task",
        message: normalized.message,
        tone: "error",
      });
    }
  }

  async function handleQuickCreateTask(values: { title: string; status: Status; projectId: number | null }) {
    try {
      const task = await createTask.mutateAsync({
        title: values.title,
        description: "",
        status: values.status,
        priority: "MEDIUM",
        dueDate: null,
        projectId: values.projectId,
      });
      setHighlightedTaskId(task.id);
    } catch (error) {
      const normalized = normalizeApiError(error);
      setNotice({
        title: "Couldn't create task",
        message: normalized.message,
        tone: "error",
      });
      throw error;
    }
  }

  const projects = projectsQuery.data ?? [];
  const allTasks = allTasksQuery.data ?? [];
  const projectTaskQueries = useQueries({
    queries: projects.map((project) => ({
      queryKey: ["tasks", { projectId: project.id }],
      queryFn: () => getAllTasks({ projectId: project.id }),
      staleTime: 15_000,
    })),
  });
  const projectTaskCounts = useMemo(() => {
    return projects.reduce<Record<number, number>>((counts, project, index) => {
      const projectTasks = projectTaskQueries[index]?.data;
      if (projectTasks) {
        counts[project.id] = projectTasks.length;
        return counts;
      }

      counts[project.id] = allTasks.filter((task) => task.projectId === project.id).length;
      return counts;
    }, {});
  }, [allTasks, projectTaskQueries, projects]);

  return (
    <>
      <Routes>
        <Route element={<AuthPage />} path="/auth" />
        <Route
          element={
            <AppLayout
              detailOpen={detailOpen}
              detailMounted={detailMounted}
              onCloseDetail={closeDetail}
              onDeleteTask={handleUndoableDeleteTask}
              onToast={showToast}
              projects={projects}
              selectedTask={selectedTask}
              sidebar={
                <Sidebar
                  allTasks={allTasks}
                  onLogout={() => void handleLogout()}
                  onOpenNewProject={openProjectModal}
                  onToggleArchived={() => setShowArchived((current) => !current)}
                  projectTaskCounts={projectTaskCounts}
                  projects={projects}
                  showArchived={showArchived}
                  user={user ?? "Workspace"}
                  highlightedProjectId={highlightedProjectId}
                />
              }
            >
              <Routes>
                <Route element={<Navigate replace to="/tasks" />} path="/" />
                <Route
                  element={
                    <WorkspaceView
                      allProjects={projects}
                      highlightedTaskId={highlightedTaskId}
                      onHighlightTask={setHighlightedTaskId}
                      onDeleteTask={handleUndoableDeleteTask}
                      onOpenTask={openDetail}
                      onOpenTaskModal={openTaskModal}
                      onQuickCreateTask={handleQuickCreateTask}
                      onToast={showToast}
                    />
                  }
                  path="/tasks"
                />
                <Route element={<TaskFullView onDeleteTask={handleUndoableDeleteTask} onToast={showToast} />} path="/tasks/:taskId" />
                <Route element={<TaskFullView onDeleteTask={handleUndoableDeleteTask} onToast={showToast} />} path="/projects/:projectId/tasks/:taskId" />
                <Route
                  element={
                    <WorkspaceView
                      allProjects={projects}
                      highlightedTaskId={highlightedTaskId}
                      onHighlightTask={setHighlightedTaskId}
                      onDeleteTask={handleUndoableDeleteTask}
                      onOpenTask={openDetail}
                      onOpenTaskModal={openTaskModal}
                      onQuickCreateTask={handleQuickCreateTask}
                      onToast={showToast}
                    />
                  }
                  path="/projects/:projectId"
                />
              </Routes>
            </AppLayout>
          }
          path="*"
        />
      </Routes>

      <NewProjectModal
        closing={closingProjectModal}
        loading={createProject.isPending}
        onClose={closeProjectModal}
        onSubmit={handleCreateProject}
        open={showProjectModal}
      />

      <NewTaskModal
        closing={closingTaskModal}
        initialProjectId={newTaskProjectId}
        initialStatus={newTaskStatus}
        loading={createTask.isPending}
        onClose={closeTaskModal}
        onSubmit={handleCreateTask}
        open={showTaskModal}
        projects={projects}
      />

      <CommandPalette
        onClose={() => setCommandPaletteOpen(false)}
        onOpenBoard={() => {
          setCommandPaletteOpen(false);
          setStoredWorkspaceView("board");
          navigate("/tasks");
        }}
        onCreateTask={() => {
          setCommandPaletteOpen(false);
          openTaskModal();
        }}
        onNavigateToday={() => {
          setCommandPaletteOpen(false);
          navigate("/tasks?view=today");
        }}
        onNavigateTasks={() => {
          setCommandPaletteOpen(false);
          setStoredWorkspaceView("list");
          navigate("/tasks");
        }}
        open={commandPaletteOpen}
      />

      {notice ? <Toast notice={notice} onDismiss={() => setNotice(null)} /> : null}
      {undoTaskToast ? <UndoToast toast={undoTaskToast} /> : null}
    </>
  );
}

function CommandPalette({
  open,
  onClose,
  onOpenBoard,
  onCreateTask,
  onNavigateTasks,
  onNavigateToday,
}: {
  open: boolean;
  onClose: () => void;
  onOpenBoard: () => void;
  onCreateTask: () => void;
  onNavigateTasks: () => void;
  onNavigateToday: () => void;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const modifierLabel = getModifierKeyLabel();

  useEffect(() => {
    if (!open) {
      return;
    }

    window.requestAnimationFrame(() => inputRef.current?.focus());
  }, [open]);

  useShortcut({ code: "Escape", enabled: open, allowInEditable: true }, onClose);

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[110] flex items-start justify-center px-4 pt-[14vh]" onMouseDown={onClose}>
      <div
        className="command-palette w-full max-w-xl overflow-hidden rounded-2xl border border-white/10 bg-[#171719]/90 shadow-[0_18px_72px_rgba(0,0,0,0.46)] backdrop-blur-xl"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="flex items-center gap-2 border-b border-white/10 px-3 py-2.5">
          <Search size={15} strokeWidth={1.7} className="text-white/30" />
          <input
            className="min-w-0 flex-1 bg-transparent text-[13px] text-white/78 outline-none placeholder:text-white/28"
            placeholder="Search Flux or run a command..."
            ref={inputRef}
          />
          <Kbd>Esc</Kbd>
        </div>
        <div className="p-1.5">
          <CommandPaletteItem hint="C" label="New task" onClick={onCreateTask} />
          <CommandPaletteItem hint={`${modifierLabel} 1`} label="Open List view" onClick={onNavigateTasks} />
          <CommandPaletteItem hint={`${modifierLabel} 2`} label="Open Board view" onClick={onOpenBoard} />
          <CommandPaletteItem hint="/" label="Focus search" onClick={onClose} />
          <CommandPaletteItem label="Today" onClick={onNavigateToday} />
        </div>
      </div>
    </div>
  );
}

function CommandPaletteItem({ hint, label, onClick }: { hint?: string; label: string; onClick: () => void }) {
  return (
    <button
      className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-[13px] text-white/64 transition-colors duration-100 ease-[cubic-bezier(0.16,1,0.3,1)] hover:bg-white/[0.055] hover:text-white/86"
      onClick={onClick}
      type="button"
    >
      <span>{label}</span>
      {hint ? <Kbd>{hint}</Kbd> : null}
    </button>
  );
}

function Toast({ notice, onDismiss }: { notice: Notice; onDismiss: () => void }) {
  useEffect(() => {
    const timeoutId = window.setTimeout(onDismiss, 4000);
    return () => window.clearTimeout(timeoutId);
  }, [notice, onDismiss]);

  return (
    <div className="app-toast fixed bottom-6 left-1/2 z-[90] max-w-[calc(100vw-32px)] -translate-x-1/2 rounded-full border border-white/10 bg-neutral-900/80 px-3 py-2 shadow-[0_18px_70px_rgba(0,0,0,0.38)] backdrop-blur-md">
      <div className="flex items-center gap-2.5">
        <span
          className={[
            "h-1.5 w-1.5 shrink-0 rounded-full",
            notice.tone === "error" ? "bg-red-400" : "bg-emerald-400",
          ].join(" ")}
        />
        <div className="min-w-0">
          <p className="truncate text-[11px] font-medium leading-4 text-white/82">{notice.title}</p>
          <p className="max-w-[320px] truncate text-[11px] leading-4 text-white/48">{notice.message}</p>
        </div>
      </div>
    </div>
  );
}

function UndoToast({ toast }: { toast: UndoTaskToast }) {
  return (
    <div className="app-toast task-delete-toast fixed bottom-6 left-1/2 z-[90] max-w-[calc(100vw-32px)] -translate-x-1/2 rounded-full border border-white/10 bg-neutral-900/80 px-3 py-2 shadow-[0_18px_70px_rgba(0,0,0,0.38)] backdrop-blur-md">
      <div className="flex items-center gap-3 text-[11px] leading-4">
        <span className="whitespace-nowrap text-white/72">Task deleted</span>
        <button
          className="rounded-full bg-white/[0.10] px-2 py-0.5 font-medium text-white/88 transition-colors duration-100 ease-[cubic-bezier(0.16,1,0.3,1)] hover:bg-white/[0.16] hover:text-white"
          onClick={toast.onUndo}
          type="button"
        >
          Undo
        </button>
      </div>
    </div>
  );
}

export default AppShell;
