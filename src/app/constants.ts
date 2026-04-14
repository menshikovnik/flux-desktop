import {
  AlertCircle,
  CheckCircle2,
  FolderKanban,
  List,
  LoaderCircle,
  MinusCircle,
  XCircle,
} from "lucide-react";
import { Priority, Status } from "../api";
import { Project, ProjectFormState, TaskFilter, TaskFormState } from "./types";

export const FILTERS: Array<{ key: TaskFilter; label: string }> = [
  { key: "ALL", label: "All" },
  { key: "OPEN", label: "Open" },
  { key: "IN_PROGRESS", label: "In Progress" },
  { key: "DONE", label: "Done" },
  { key: "CANCELLED", label: "Cancelled" },
  { key: "HIGH_PRIORITY", label: "High priority" },
];

export const PRIORITY_ORDER: Priority[] = ["HIGH", "MEDIUM", "LOW"];
export const STATUS_OPTIONS: Status[] = ["OPEN", "IN_PROGRESS", "DONE", "CANCELLED"];
export const PRIORITY_OPTIONS: Priority[] = ["LOW", "MEDIUM", "HIGH"];

export const SIDEBAR_PRIMARY_FILTERS: Array<{
  key: TaskFilter;
  label: string;
  icon: typeof List;
}> = [
  { key: "ALL", label: "All tasks", icon: List },
  { key: "HIGH_PRIORITY", label: "High priority", icon: AlertCircle },
  { key: "IN_PROGRESS", label: "In progress", icon: LoaderCircle },
];

export const SIDEBAR_SECONDARY_FILTERS: Array<{
  key: TaskFilter;
  label: string;
  icon: typeof List;
}> = [
  { key: "DONE", label: "Completed", icon: CheckCircle2 },
  { key: "CANCELLED", label: "Cancelled", icon: XCircle },
];

export const EMPTY_TASK_FORM: TaskFormState = {
  title: "",
  description: "",
  priority: "MEDIUM",
  status: "OPEN",
  projectId: "ALL",
};

export const EMPTY_PROJECT_FORM: ProjectFormState = {
  name: "",
  description: "",
  color: "#5b8def",
};

export const PROJECT_FILTER_OPTIONS: Array<{
  key: "ALL" | "NONE";
  label: string;
  icon: typeof FolderKanban;
}> = [
  { key: "ALL", label: "All projects", icon: FolderKanban },
  { key: "NONE", label: "Without project", icon: MinusCircle },
];

export const STUB_PROJECTS: Project[] = [
  {
    id: 101,
    name: "Desktop polish",
    description: "Refresh the desktop workspace and interaction details.",
    color: "#5b8def",
    isArchived: false,
    createdAt: "2026-04-10T09:00:00.000Z",
  },
  {
    id: 102,
    name: "Spring sync",
    description: "Prepare backend endpoints and payloads for project binding.",
    color: "#f97316",
    isArchived: false,
    createdAt: "2026-04-11T11:30:00.000Z",
  },
  {
    id: 103,
    name: "Old onboarding",
    description: "Legacy onboarding cleanup kept for history.",
    color: "#10b981",
    isArchived: true,
    createdAt: "2026-04-01T14:20:00.000Z",
  },
];

export const TITLE_BY_FILTER: Record<TaskFilter, string> = {
  ALL: "All tasks",
  OPEN: "Open tasks",
  IN_PROGRESS: "In progress",
  DONE: "Completed",
  CANCELLED: "Cancelled",
  HIGH_PRIORITY: "High priority",
};
