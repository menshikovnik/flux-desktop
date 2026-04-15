export type ToastHandler = (toast: { title: string; message: string; tone?: "error" | "success" }) => void;

export type Subtask = { id: number; title: string; done: boolean };

export type Attachment = { id: number; name: string; size: string; ext: "pdf" | "png" | "zip" };

export type ActivityItem =
  | { id: number; type: "event"; user: string; timestamp: string; oldValue: string; newValue: string; field: string }
  | { id: number; type: "comment"; user: string; timestamp: string; text: string };
