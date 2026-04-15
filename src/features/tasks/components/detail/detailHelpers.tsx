import { Task } from "../../../../api";
import { ActivityItem, Attachment, Subtask } from "./detailTypes";

export const STATUS_OPTIONS: Task["status"][] = ["OPEN", "IN_PROGRESS", "DONE", "CANCELLED"];
export const PRIORITY_OPTIONS: Task["priority"][] = ["LOW", "MEDIUM", "HIGH"];

export const defaultSubtasks: Subtask[] = [
  { id: 1, title: "Map panel interactions", done: true },
  { id: 2, title: "Refine compact metadata", done: false },
  { id: 3, title: "Polish timeline density", done: false },
];

export const defaultActivity: ActivityItem[] = [
  {
    id: 1,
    type: "event",
    user: "N",
    timestamp: new Date().toISOString(),
    field: "status",
    oldValue: "OPEN",
    newValue: "IN_PROGRESS",
  },
  {
    id: 2,
    type: "comment",
    user: "S",
    timestamp: new Date(Date.now() - 1000 * 60 * 54).toISOString(),
    text: "Keep the detail surface calm and dense.",
  },
  {
    id: 3,
    type: "event",
    user: "N",
    timestamp: new Date(Date.now() - 1000 * 60 * 130).toISOString(),
    field: "priority",
    oldValue: "LOW",
    newValue: "MEDIUM",
  },
];

export function toDateInputValue(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  return `${date.getFullYear()}-${`${date.getMonth() + 1}`.padStart(2, "0")}-${`${date.getDate()}`.padStart(2, "0")}`;
}

export function formatCreatedAt(value: string) {
  return formatTimestamp(value);
}

export function formatTimestamp(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

export function statusDot(status: Task["status"]) {
  switch (status) {
    case "IN_PROGRESS":
      return <span className="inline-block h-1.5 w-1.5 rounded-full bg-white/52" />;
    case "DONE":
      return <span className="inline-block h-1.5 w-1.5 rounded-full bg-white/42" />;
    case "CANCELLED":
      return <span className="inline-block h-1.5 w-1.5 rounded-full bg-white/22" />;
    case "OPEN":
    default:
      return <span className="inline-block h-1.5 w-1.5 rounded-full border border-white/28" />;
  }
}

export function priorityDot(priority: Task["priority"]) {
  switch (priority) {
    case "HIGH":
      return <span className="inline-block h-1.5 w-1.5 rounded-full bg-white/55" />;
    case "MEDIUM":
      return <span className="inline-block h-1.5 w-1.5 rounded-full bg-white/35" />;
    case "LOW":
    default:
      return <span className="inline-block h-1.5 w-1.5 rounded-full bg-white/22" />;
  }
}

export function fileHoverTone(ext: Attachment["ext"]) {
  switch (ext) {
    case "pdf":
      return "group-hover:text-red-300/70";
    case "png":
      return "group-hover:text-sky-300/70";
    case "zip":
    default:
      return "group-hover:text-amber-200/70";
  }
}

export function autosizeTextarea(element: HTMLTextAreaElement | null) {
  if (!element) return;
  element.style.height = "auto";
  element.style.height = `${element.scrollHeight}px`;
}
