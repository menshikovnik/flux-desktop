import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { QueryKey, useQueries, useQueryClient } from "@tanstack/react-query";
import { Navigate, Route, Routes, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Project, Status, Task, logoutUser, normalizeApiError, setAccessToken } from "./api";
import "./App.css";
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
  onOpenTask,
  onOpenTaskModal,
  onQuickCreateTask,
  onToast,
}: {
  allProjects: Project[];
  onOpenTask: (task: Task) => void;
  onOpenTaskModal: (projectId?: number, initialStatus?: Status) => void;
  onQuickCreateTask: (values: { title: string; status: Status; projectId: number | null }) => Promise<void>;
  onToast: (toast: Notice) => void;
}) {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"list" | "board" | "timeline">("list");
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
  const tasks = useMemo(() => sortTasks(scopedTasks), [scopedTasks]);


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

  function handleOpenTask(task: Task) {
    if (projectId !== null) {
      onOpenTask({ ...task, projectId });
      return;
    }

    onOpenTask(task);
  }

  function handleQuickCreate(status: Status, titleValue: string) {
    return onQuickCreateTask({
      title: titleValue,
      status,
      projectId,
    });
  }

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
        subtitle={subtitle}
        title={title}
      />

      <div className="flex items-center gap-2 border-b border-white/[0.06] px-5">
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
                "relative z-10 px-3 py-2.5 text-[13px] transition-colors duration-100 ease-[cubic-bezier(0.16,1,0.3,1)]",
                activeTab === tab ? "text-white/90" : "text-white/30 hover:text-white/60",
              ].join(" ")}
              key={tab}
              onClick={() => setActiveTab(tab)}
              ref={(node) => { tabsRef.current[tab] = node; }}
              type="button"
            >
              {tab === "list" ? "List" : tab === "board" ? "Board" : "Timeline"}
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
            onOpenTask={handleOpenTask}
            onQuickAdd={handleQuickCreate}
            tasks={tasks}
          />
        ) : activeTab === "timeline" ? (
          <ComingSoonPanel label="Timeline" />
        ) : (
          <TaskList
            loading={taskQuery.isLoading}
            onOpenTask={handleOpenTask}
            onQuickAdd={handleQuickCreate}
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
  const [newTaskProjectId, setNewTaskProjectId] = useState<number | undefined>(undefined);
  const [newTaskStatus, setNewTaskStatus] = useState<Status | undefined>(undefined);
  const [highlightedProjectId, setHighlightedProjectId] = useState<number | null>(null);

  const projectsQuery = useProjects();
  const allTasksQuery = useTasks();
  const createProject = useCreateProject();
  const createTask = useCreateTask();
  const pendingTaskDeleteRef = useRef<PendingTaskDelete | null>(null);

  function showToast(toast: Notice) {
    setNotice(toast);
  }

  function restoreTaskDelete(context: Pick<PendingTaskDelete, "previousEntries" | "previousTask" | "taskId">) {
    context.previousEntries.forEach(([queryKey, data]) => {
      queryClient.setQueryData(queryKey, data);
    });
    queryClient.setQueryData(["task", context.taskId], context.previousTask);
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
            restoreTaskDelete(pending);
            const normalized = normalizeApiError(error);
            setNotice({
              title: "Couldn't delete task",
              message: normalized.message,
              tone: "error",
            });
          });
      }, 5000),
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
    setNewTaskProjectId(projectId);
    setNewTaskStatus(initialStatus);
    setClosingTaskModal(false);
    setShowTaskModal(true);
  }

  function closeTaskModal() {
    setClosingTaskModal(true);
    window.setTimeout(() => {
      setShowTaskModal(false);
      setClosingTaskModal(false);
    }, 150);
  }

  function openDetail(task: Task) {
    if (detailOpen && selectedTask?.id === task.id) {
      closeDetail();
      return;
    }

    setSelectedTask(task);
    setDetailMounted(true);
    window.requestAnimationFrame(() => {
      setDetailOpen(true);
    });
  }

  function closeDetail() {
    setDetailOpen(false);
    window.setTimeout(() => {
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
      await createTask.mutateAsync(values);
      closeTaskModal();
      window.setTimeout(() => {
        setNotice({
          title: "Task created",
          message: `${values.title} was added to your queue.`,
          tone: "success",
        });
      }, 150);
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
      await createTask.mutateAsync({
        title: values.title,
        description: "",
        status: values.status,
        priority: "MEDIUM",
        dueDate: null,
        projectId: values.projectId,
      });
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

      {notice ? <Toast notice={notice} onDismiss={() => setNotice(null)} /> : null}
      {undoTaskToast ? <UndoToast toast={undoTaskToast} /> : null}
    </>
  );
}

function Toast({ notice, onDismiss }: { notice: Notice; onDismiss: () => void }) {
  return (
    <div className="fixed bottom-5 right-5 z-[70] max-w-sm rounded-2xl border border-white/10 bg-[#171728] px-4 py-3 shadow-2xl">
      <div className="flex items-start gap-3">
        <span
          className={[
            "mt-1 h-2.5 w-2.5 rounded-full",
            notice.tone === "error" ? "bg-red-400" : "bg-emerald-400",
          ].join(" ")}
        />
        <div className="min-w-0 flex-1">
          <p className="font-medium text-white">{notice.title}</p>
          <p className="mt-1 text-sm text-white/55">{notice.message}</p>
        </div>
        <button className="text-sm text-white/40 hover:text-white" onClick={onDismiss} type="button">
          x
        </button>
      </div>
    </div>
  );
}

function UndoToast({ toast }: { toast: UndoTaskToast }) {
  return (
    <div className="task-delete-toast fixed bottom-5 left-1/2 z-[90] -translate-x-1/2 rounded-lg border border-white/[0.08] bg-[#151516]/95 px-3 py-2 shadow-[0_18px_60px_rgba(0,0,0,0.42)] backdrop-blur-md">
      <div className="flex items-center gap-3 text-[12px]">
        <span className="text-white/68">Task deleted.</span>
        <button
          className="rounded-md px-2 py-1 font-medium text-white/82 transition-colors duration-100 ease-[cubic-bezier(0.16,1,0.3,1)] hover:bg-white/[0.06] hover:text-white"
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
