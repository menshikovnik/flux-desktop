import { useMemo } from "react";
import { FolderPlus, LayoutGrid, LogOut, ChevronDown, Clock3, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import fluxLogo from "../assets/flux-logo.svg";
import { Project, Task } from "../api";
import { ProjectNavItem } from "../features/projects/components/ProjectNavItem";

function isToday(dateString?: string | null) {
  if (!dateString) return false;
  const today = new Date();
  const date = new Date(dateString);
  return (
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()
  );
}

export function Sidebar({
  user,
  projects,
  allTasks,
  collapsed = false,
  showArchived,
  onToggleCollapsed,
  onToggleArchived,
  onOpenNewProject,
  onLogout,
  highlightedProjectId,
  projectTaskCounts,
}: {
  user: string;
  projects: Project[];
  allTasks: Task[];
  projectTaskCounts?: Record<number, number>;
  collapsed?: boolean;
  showArchived: boolean;
  onToggleCollapsed?: () => void;
  onToggleArchived: () => void;
  onOpenNewProject: () => void;
  onLogout: () => void;
  highlightedProjectId?: number | null;
}) {
  const location = useLocation();

  const projectCounts = useMemo(
    () =>
      allTasks.reduce<Record<number, number>>((counts, task) => {
        if (typeof task.projectId === "number") {
          counts[task.projectId] = (counts[task.projectId] ?? 0) + 1;
        }
        return counts;
      }, {}),
    [allTasks],
  );

  const todayCount = useMemo(() => allTasks.filter((task) => isToday(task.dueDate)).length, [allTasks]);
  const activeProjects = projects.filter((p) => !p.archived);
  const archivedProjects = projects.filter((p) => p.archived);

  return (
    <aside
      className={[
        "flex h-screen w-full min-w-0 shrink-0 flex-col bg-[#171719] py-2.5 transition-[padding] duration-150 ease-[cubic-bezier(0.16,1,0.3,1)]",
        collapsed ? "px-1.5" : "px-1.5",
      ].join(" ")}
    >
      {/* Logo + collapse */}
      <div
        className={[
          "mb-3 flex items-center",
          collapsed ? "justify-center px-0 py-0.5" : "gap-2 px-1.5 py-0.5",
        ].join(" ")}
      >
        {!collapsed && (
          <div className="flex h-5 w-5 items-center justify-center rounded-md bg-white/[0.045]">
            <img alt="Flux" className="h-3.5 w-3.5" src={fluxLogo} />
          </div>
        )}
        {!collapsed && (
          <span className="flex-1 text-[12px] font-semibold text-white/76">Flux</span>
        )}
        <button
          className={[
            "flex h-6 w-6 items-center justify-center rounded-md text-white/28 transition hover:bg-white/[0.05] hover:text-white/64",
            collapsed ? "mx-auto" : "",
          ].join(" ")}
          onClick={onToggleCollapsed}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          type="button"
        >
          {collapsed ? <PanelLeftOpen size={14} strokeWidth={1.45} /> : <PanelLeftClose size={14} strokeWidth={1.45} />}
        </button>
      </div>

      {/* Main nav */}
      <nav className={["space-y-0.5", collapsed ? "px-0" : "px-0"].join(" ")}>
        <NavLink
          className={({ isActive }) =>
            [
              "flex items-center rounded-md text-[12px] transition-colors",
              collapsed ? "justify-center py-1.5" : "gap-2 px-2 py-[5px]",
              isActive && location.search !== "?view=today"
                ? "bg-white/[0.08] text-white/90"
                : "text-white/45 hover:bg-white/[0.05] hover:text-white/75",
            ].join(" ")
          }
          title="My tasks"
          to="/tasks"
        >
          <LayoutGrid size={14} strokeWidth={1.45} />
          {!collapsed && <span>My tasks</span>}
        </NavLink>

        <NavLink
          className={() =>
            [
              "flex items-center rounded-md text-[12px] transition-colors",
              collapsed ? "justify-center py-1.5" : "gap-2 px-2 py-[5px]",
              location.pathname === "/tasks" && location.search === "?view=today"
                ? "bg-white/[0.08] text-white/90"
                : "text-white/45 hover:bg-white/[0.05] hover:text-white/75",
            ].join(" ")
          }
          title={`Today${collapsed ? ` (${todayCount})` : ""}`}
          to="/tasks?view=today"
        >
          <Clock3 size={14} strokeWidth={1.45} />
          {!collapsed && <span className="flex-1">Today</span>}
          {!collapsed && todayCount > 0 && (
            <span className="text-[11px] tabular-nums text-white/25">{todayCount}</span>
          )}
        </NavLink>
      </nav>

      {/* Divider */}
      <div className="mx-1.5 my-2.5 h-px bg-white/10" />

      {/* Projects */}
      <div className="min-h-0 flex-1 overflow-hidden">
        {!collapsed && (
          <div className="mb-1 flex items-center justify-between px-2">
            <span className="text-[10px] font-medium uppercase tracking-[0.14em] text-white/22">
              Projects
            </span>
          </div>
        )}

        <div className={["h-full overflow-y-auto pb-4", collapsed ? "px-0" : "px-0"].join(" ")}>
          <div className="space-y-0.5">
            {activeProjects.map((project) => (
              <ProjectNavItem
                collapsed={collapsed}
                count={projectTaskCounts?.[project.id] ?? projectCounts[project.id] ?? 0}
                highlighted={project.id === highlightedProjectId}
                key={project.id}
                project={project}
              />
            ))}
          </div>

          <button
            className={[
              "mt-1.5 flex w-full items-center rounded-md text-[12px] text-white/28 transition hover:bg-white/[0.04] hover:text-white/52",
              collapsed ? "justify-center py-1.5" : "gap-2 px-2 py-[5px]",
            ].join(" ")}
            onClick={onOpenNewProject}
            title="New project"
            type="button"
          >
            <FolderPlus size={14} strokeWidth={1.45} />
            {!collapsed && "New project"}
          </button>

          {archivedProjects.length > 0 && (
            <div className="mt-2.5 space-y-1.5">
              <button
                className={[
                  "flex text-[11px] text-white/24 transition hover:text-white/48",
                  collapsed ? "w-full justify-center" : "items-center gap-1.5 px-2",
                ].join(" ")}
                onClick={onToggleArchived}
                title={`Archived (${archivedProjects.length})`}
                type="button"
              >
                <ChevronDown
                  className={showArchived ? "rotate-0 transition" : "-rotate-90 transition"}
                  size={12}
                  strokeWidth={1.45}
                />
                {!collapsed && `Archived (${archivedProjects.length})`}
              </button>

              {showArchived && (
                <div className="space-y-0.5">
                  {archivedProjects.map((project) => (
                    <ProjectNavItem
                      collapsed={collapsed}
                      count={projectTaskCounts?.[project.id] ?? projectCounts[project.id] ?? 0}
                      highlighted={project.id === highlightedProjectId}
                      key={project.id}
                      project={project}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* User + logout */}
      <div
        className={[
          "border-t border-white/10 pt-1.5",
          collapsed ? "px-0" : "px-0",
        ].join(" ")}
      >
        <div
          className={[
            "flex items-center",
            collapsed ? "justify-center py-0.5" : "gap-1.5 px-1.5 py-1",
          ].join(" ")}
        >
          <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/[0.055] text-[10px] font-semibold text-white/52">
            {user.slice(0, 1).toUpperCase()}
          </div>
          {!collapsed && (
            <span className="min-w-0 flex-1 truncate text-[12px] text-white/45">{user}</span>
          )}
          <button
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-white/22 transition hover:bg-white/[0.05] hover:text-white/58"
            onClick={onLogout}
            title="Logout"
            type="button"
          >
            <LogOut size={13} strokeWidth={1.45} />
          </button>
        </div>
      </div>
    </aside>
  );
}
