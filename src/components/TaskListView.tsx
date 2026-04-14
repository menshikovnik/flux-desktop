import { FolderKanban, Sparkles } from "lucide-react";
import { useLayoutEffect, useRef, useState } from "react";
import { Task } from "../api";
import { FILTERS, TITLE_BY_FILTER } from "../app/constants";
import { formatDate, formatPriority } from "../app/formatters";
import { Project, ProjectFilter, TaskFilter } from "../app/types";

type TaskListViewProps = {
  activeFilter: TaskFilter;
  activeProjectFilter: ProjectFilter;
  groupedTasks: Array<{ priority: Task["priority"]; tasks: Task[] }>;
  hoveredTaskId: number | null;
  createdTaskId: number | null;
  taskLoading: boolean;
  activeProject: Project | null;
  projectStats: {
    total: number;
    open: number;
    done: number;
  };
  projectById: Map<number, Project>;
  onFilterChange: (filter: TaskFilter) => void;
  onHoverChange: (taskId: number | null) => void;
  onQuickComplete: (taskId: number) => void;
  onOpenTask: (taskId: number) => void;
  onOpenTaskModal: () => void;
  onOpenContextMenu: (taskId: number, x: number, y: number) => void;
};

export function TaskListView({
  activeFilter,
  activeProjectFilter,
  groupedTasks,
  hoveredTaskId,
  createdTaskId,
  taskLoading,
  activeProject,
  projectStats,
  projectById,
  onFilterChange,
  onHoverChange,
  onQuickComplete,
  onOpenTask,
  onOpenTaskModal,
  onOpenContextMenu,
}: TaskListViewProps) {
  const filterBarRef = useRef<HTMLDivElement>(null);
  const filterButtonRefs = useRef<Record<TaskFilter, HTMLButtonElement | null>>({
    ALL: null,
    OPEN: null,
    IN_PROGRESS: null,
    DONE: null,
    CANCELLED: null,
    HIGH_PRIORITY: null,
  });
  const [bubbleStyle, setBubbleStyle] = useState({ width: 0, x: 0, opacity: 0 });

  useLayoutEffect(() => {
    const filterBar = filterBarRef.current;
    const activeButton = filterButtonRefs.current[activeFilter];

    if (!filterBar || !activeButton) {
      return;
    }

    setBubbleStyle({
      width: activeButton.offsetWidth,
      x: activeButton.offsetLeft,
      opacity: 1,
    });
  }, [activeFilter]);

  const projectHeadline =
    activeProjectFilter === "NONE"
      ? "Tasks without a project"
      : activeProject?.name ?? "All projects";
  const projectDescription =
    activeProjectFilter === "NONE"
      ? "Loose tasks that still need a home."
      : activeProject?.description ?? "Browse every task or narrow the board by project from the sidebar.";

  return (
    <section className="task-column task-column--list">
      <header className="task-column__header">
        <div className="task-column__title-wrap">
          <h2>{TITLE_BY_FILTER[activeFilter]}</h2>
          <p>{projectHeadline}</p>
        </div>
        <button className="primary-button" onClick={onOpenTaskModal} type="button">
          New task
        </button>
      </header>

      <div className="filter-bar" ref={filterBarRef}>
        <span
          className="filter-bar__bubble"
          style={{
            width: `${bubbleStyle.width}px`,
            transform: `translateX(${bubbleStyle.x}px)`,
            opacity: bubbleStyle.opacity,
          }}
        />
        {FILTERS.map((filter) => (
          <button
            className={activeFilter === filter.key ? "filter-pill is-active" : "filter-pill"}
            key={filter.key}
            onClick={() => onFilterChange(filter.key)}
            ref={(node) => {
              filterButtonRefs.current[filter.key] = node;
            }}
            type="button"
          >
            {filter.label}
          </button>
        ))}
      </div>

      <div className="project-focus-card">
        <div className="project-focus-card__headline">
          <div className="project-focus-card__icon">
            <FolderKanban />
          </div>
          <div>
            <strong>{projectHeadline}</strong>
            <p>{projectDescription}</p>
          </div>
        </div>
        <div className="project-focus-card__stats">
          <div>
            <span>Total</span>
            <strong>{projectStats.total}</strong>
          </div>
          <div>
            <span>Open</span>
            <strong>{projectStats.open}</strong>
          </div>
          <div>
            <span>Done</span>
            <strong>{projectStats.done}</strong>
          </div>
        </div>
      </div>

      <div className="ai-focus-bar">
        <div className="ai-focus-bar__icon">
          <Sparkles />
        </div>
        <p>
          Project-aware planning is ready in the UI: tasks can already be grouped and filtered before
          the backend contract is finished.
        </p>
        <button className="ghost-button ghost-button--compact" type="button">
          Review flow
        </button>
      </div>

      <div className="task-groups task-groups--animated" key={`${activeFilter}-${projectHeadline}`}>
        {taskLoading ? <p className="empty-state">Loading tasks...</p> : null}
        {!taskLoading && groupedTasks.length === 0 ? (
          <p className="empty-state">No tasks match this task and project combination yet.</p>
        ) : null}

        {!taskLoading
          ? groupedTasks.map((group) => (
              <section className="task-group" key={group.priority}>
                <div className="task-group__header">
                  <span>{formatPriority(group.priority)}</span>
                  <span>{group.tasks.length}</span>
                </div>
                <div className="task-list">
                  {group.tasks.map((task) => {
                    const project = task.projectId ? projectById.get(task.projectId) ?? null : null;

                    return (
                      <button
                        className={[
                          "task-row",
                          hoveredTaskId === task.id ? "is-hovered" : "",
                          task.status === "DONE" ? "is-complete" : "",
                          createdTaskId === task.id ? "is-created" : "",
                        ]
                          .filter(Boolean)
                          .join(" ")}
                        key={task.id}
                        onClick={() => onOpenTask(task.id)}
                        onContextMenu={(event) => {
                          event.preventDefault();
                          onOpenContextMenu(task.id, event.clientX, event.clientY);
                        }}
                        onMouseEnter={() => onHoverChange(task.id)}
                        onMouseLeave={() =>
                          onHoverChange(hoveredTaskId === task.id ? null : hoveredTaskId)
                        }
                        type="button"
                      >
                        <button
                          aria-label={
                            task.status === "DONE"
                              ? `Move ${task.title} back to open`
                              : `Mark ${task.title} as done`
                          }
                          className={
                            task.status === "DONE"
                              ? "task-row__checkbox is-complete"
                              : "task-row__checkbox"
                          }
                          onClick={(event) => {
                            event.stopPropagation();
                            onQuickComplete(task.id);
                          }}
                          type="button"
                        />
                        <div className="task-row__main">
                          <span className="task-row__title">{task.title}</span>
                          <div className="task-row__meta">
                            {project ? (
                              <span className="task-row__project-tag">
                                <span
                                  className="task-row__project-dot"
                                  style={{ backgroundColor: project.color }}
                                />
                                {project.name}
                              </span>
                            ) : (
                              <span className="task-row__project-tag is-muted">Without project</span>
                            )}
                          </div>
                        </div>
                        <span className="task-row__date">{formatDate(task.createdAt)}</span>
                      </button>
                    );
                  })}
                </div>
              </section>
            ))
          : null}
      </div>
    </section>
  );
}
