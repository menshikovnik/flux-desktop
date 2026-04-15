import { NavLink } from "react-router-dom";
import { Project } from "../../../api";

type ProjectNavItemProps = {
  project: Project;
  count: number;
  collapsed?: boolean;
  highlighted?: boolean;
};

export function ProjectNavItem({ project, count, collapsed = false, highlighted = false }: ProjectNavItemProps) {
  return (
    <NavLink
      className={({ isActive }) =>
        [
          highlighted ? "project-nav-item--new" : "",
          "flex items-center rounded-md text-[12px] transition-colors",
          collapsed ? "justify-center py-1.5" : "gap-2 px-2 py-[5px]",
          isActive
            ? "bg-white/[0.08] text-white/90"
            : "text-white/45 hover:bg-white/[0.05] hover:text-white/75",
        ].join(" ")
      }
      title={`${project.name} (${count})`}
      to={`/projects/${project.id}`}
    >
      <span
        className="h-1.5 w-1.5 shrink-0 rounded-full"
        style={{ backgroundColor: project.color || "#555558" }}
      />
      {!collapsed && <span className="min-w-0 flex-1 truncate">{project.name}</span>}
      {!collapsed && count > 0 && (
        <span className="text-[10px] tabular-nums text-white/22">{count}</span>
      )}
    </NavLink>
  );
}
