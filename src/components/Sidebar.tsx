import { FolderPlus, LogOut } from "lucide-react";
import fluxLogo from "../assets/flux-logo.svg";
import {
  PROJECT_FILTER_OPTIONS,
  SIDEBAR_PRIMARY_FILTERS,
  SIDEBAR_SECONDARY_FILTERS,
} from "../app/constants";
import { Project, ProjectFilter, TaskFilter } from "../app/types";

type SidebarProps = {
  activeFilter: TaskFilter;
  activeProjectFilter: ProjectFilter;
  projects: Project[];
  projectTaskCounts: Record<number, number>;
  user: string;
  showArchivedProjects: boolean;
  onFilterChange: (filter: TaskFilter) => void;
  onProjectFilterChange: (filter: ProjectFilter) => void;
  onToggleArchivedProjects: () => void;
  onOpenProjectManager: () => void;
  onLogout: () => void;
};

export function Sidebar({
  activeFilter,
  activeProjectFilter,
  projects,
  projectTaskCounts,
  user,
  showArchivedProjects,
  onFilterChange,
  onProjectFilterChange,
  onToggleArchivedProjects,
  onOpenProjectManager,
  onLogout,
}: SidebarProps) {
  const activeProjects = projects.filter((project) => !project.isArchived);
  const archivedProjects = projects.filter((project) => project.isArchived);

  return (
    <aside className="sidebar">
      <div className="sidebar__content">
        <div>
          <div className="brand">
            <div className="brand__mark">
              <img alt="Flux logo" className="brand__logo" src={fluxLogo} />
            </div>
            <div>
              <h1>Flux</h1>
            </div>
          </div>

          <nav className="sidebar-nav">
            {SIDEBAR_PRIMARY_FILTERS.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  className={
                    activeFilter === item.key ? "sidebar-nav__item is-active" : "sidebar-nav__item"
                  }
                  key={item.key}
                  onClick={() => onFilterChange(item.key)}
                  type="button"
                >
                  <Icon />
                  <span>{item.label}</span>
                </button>
              );
            })}
            <div className="sidebar-nav__divider" />
            {SIDEBAR_SECONDARY_FILTERS.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  className={
                    activeFilter === item.key ? "sidebar-nav__item is-active" : "sidebar-nav__item"
                  }
                  key={item.label}
                  onClick={() => onFilterChange(item.key)}
                  type="button"
                >
                  <Icon />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <section className="project-nav">
          <div className="project-nav__header">
            <div>
              <span className="project-nav__eyebrow">Projects</span>
              <strong>Task scope</strong>
            </div>
            <button className="ghost-button ghost-button--compact" onClick={onOpenProjectManager} type="button">
              <FolderPlus size={14} />
              Manage
            </button>
          </div>

          <div className="project-nav__list">
            {PROJECT_FILTER_OPTIONS.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  className={
                    activeProjectFilter === item.key
                      ? "project-nav__item is-active"
                      : "project-nav__item"
                  }
                  key={item.key}
                  onClick={() => onProjectFilterChange(item.key)}
                  type="button"
                >
                  <div className="project-nav__item-main">
                    <span className="project-nav__generic-icon">
                      <Icon size={14} />
                    </span>
                    <span>{item.label}</span>
                  </div>
                </button>
              );
            })}

            {activeProjects.map((project) => (
              <button
                className={
                  activeProjectFilter === project.id ? "project-nav__item is-active" : "project-nav__item"
                }
                key={project.id}
                onClick={() => onProjectFilterChange(project.id)}
                type="button"
              >
                <div className="project-nav__item-main">
                  <span className="project-nav__dot" style={{ backgroundColor: project.color }} />
                  <span>{project.name}</span>
                </div>
                <span className="project-nav__count">{projectTaskCounts[project.id] ?? 0}</span>
              </button>
            ))}
          </div>

          {archivedProjects.length > 0 ? (
            <>
              <button className="project-nav__archive-toggle" onClick={onToggleArchivedProjects} type="button">
                {showArchivedProjects ? "Hide archived" : "Show archived"} ({archivedProjects.length})
              </button>

              {showArchivedProjects ? (
                <div className="project-nav__list project-nav__list--archived">
                  {archivedProjects.map((project) => (
                    <button
                      className={
                        activeProjectFilter === project.id
                          ? "project-nav__item is-active is-archived"
                          : "project-nav__item is-archived"
                      }
                      key={project.id}
                      onClick={() => onProjectFilterChange(project.id)}
                      type="button"
                    >
                      <div className="project-nav__item-main">
                        <span className="project-nav__dot" style={{ backgroundColor: project.color }} />
                        <span>{project.name}</span>
                      </div>
                      <span className="project-nav__count">{projectTaskCounts[project.id] ?? 0}</span>
                    </button>
                  ))}
                </div>
              ) : null}
            </>
          ) : null}
        </section>
      </div>

      <div className="sidebar-footer">
        <div className="user-card">
          <div className="user-card__avatar">{user.slice(0, 1).toUpperCase()}</div>
          <div>
            <strong>{user}</strong>
            <span>Signed in</span>
          </div>
        </div>
        <button className="ghost-button" onClick={onLogout} type="button">
          <LogOut size={14} />
          Logout
        </button>
      </div>
    </aside>
  );
}
