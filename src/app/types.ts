import { Priority, Status } from "../api";

export type AuthMode = "login" | "register";
export type TaskFilter =
  | "ALL"
  | "OPEN"
  | "IN_PROGRESS"
  | "DONE"
  | "CANCELLED"
  | "HIGH_PRIORITY";

export type ProjectFilter = "ALL" | "NONE" | number;

export type Project = {
  id: number;
  name: string;
  description: string;
  color: string;
  isArchived: boolean;
  createdAt: string;
};

export type TaskFormState = {
  title: string;
  description: string;
  priority: Priority;
  status: Status;
  projectId: ProjectFilter;
};

export type ProjectFormState = {
  name: string;
  description: string;
  color: string;
};

export type AppFeedback = {
  title: string;
  message: string;
  tone?: "error" | "success";
};
