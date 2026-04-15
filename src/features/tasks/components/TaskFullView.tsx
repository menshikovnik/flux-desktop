import { useEffect, useMemo, useRef, useState } from "react";
import { Copy, Ellipsis, Send, Trash2, X } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Task } from "../../../api";
import { CustomDateInput } from "../../../components/CustomDateInput";
import { CustomSelect } from "../../../components/CustomSelect";
import { useProjects } from "../../projects/hooks/useProjects";
import { useDebouncedTaskPatch } from "../hooks/useDebouncedTaskPatch";
import { useTask } from "../hooks/useTask";
import { ActivityTimeline, Avatar, MetadataRow, SectionHeader } from "./detail/DetailPrimitives";
import {
  PRIORITY_OPTIONS,
  STATUS_OPTIONS,
  autosizeTextarea,
  defaultActivity,
  defaultSubtasks,
  fileHoverTone,
  priorityDot,
  statusDot,
  toDateInputValue,
} from "./detail/detailHelpers";
import { ActivityItem, Attachment, Subtask, ToastHandler } from "./detail/detailTypes";

export function TaskFullView({
  onDeleteTask,
  onToast,
}: {
  onDeleteTask: (task: Task) => void;
  onToast: ToastHandler;
}) {
  const navigate = useNavigate();
  const { projectId, taskId } = useParams();
  const routeProjectId = projectId ? Number(projectId) : null;
  const numericTaskId = taskId ? Number(taskId) : null;
  const { data: task, error, isLoading } = useTask(numericTaskId);
  const { data: projects = [] } = useProjects();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<Task["status"]>("OPEN");
  const [priority, setPriority] = useState<Task["priority"]>("MEDIUM");
  const [dueDate, setDueDate] = useState("");
  const [savedVisible, setSavedVisible] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [subtasks, setSubtasks] = useState<Subtask[]>(defaultSubtasks);
  const [newSubtask, setNewSubtask] = useState("");
  const [commentDraft, setCommentDraft] = useState("");
  const [activity, setActivity] = useState<ActivityItem[]>(defaultActivity);

  const titleRef = useRef<HTMLTextAreaElement | null>(null);
  const descriptionRef = useRef<HTMLTextAreaElement | null>(null);
  const savedTimeoutRef = useRef<number | null>(null);

  const project = useMemo(() => {
    const effectiveProjectId = routeProjectId ?? task?.projectId ?? null;
    return effectiveProjectId ? projects.find((item) => item.id === effectiveProjectId) ?? null : null;
  }, [projects, routeProjectId, task]);
  const parentPath = project ? `/projects/${project.id}` : "/tasks";

  const attachments = useMemo<Attachment[]>(
    () => [
      { id: 1, name: "spec-overview.pdf", size: "1.2 MB", ext: "pdf" },
      { id: 2, name: "panel-mock.png", size: "384 KB", ext: "png" },
      { id: 3, name: "desktop-assets.zip", size: "6.8 MB", ext: "zip" },
    ],
    [],
  );

  const { flushSave, scheduleSave } = useDebouncedTaskPatch(task?.id ?? 0, {
    onSaved: () => {
      if (savedTimeoutRef.current) window.clearTimeout(savedTimeoutRef.current);
      setSavedVisible(true);
      savedTimeoutRef.current = window.setTimeout(() => setSavedVisible(false), 1200);
    },
    onError: () =>
      onToast({
        title: "Failed to save",
        message: "Your latest task changes could not be saved.",
        tone: "error",
      }),
  });

  useEffect(() => {
    if (!task) return;
    setTitle(task.title);
    setDescription(task.description ?? "");
    setStatus(task.status);
    setPriority(task.priority);
    setDueDate(toDateInputValue(task.dueDate));
  }, [task]);

  useEffect(() => autosizeTextarea(titleRef.current), [title]);
  useEffect(() => autosizeTextarea(descriptionRef.current), [description]);

  useEffect(() => {
    return () => {
      if (savedTimeoutRef.current) window.clearTimeout(savedTimeoutRef.current);
    };
  }, []);

  if (isLoading && !task) {
    return <div className="flex h-full items-center justify-center text-[13px] text-white/38">Loading task...</div>;
  }

  if (!task) {
    return (
      <div className="flex h-full items-center justify-center px-6">
        <div className="max-w-md rounded-lg border border-white/[0.07] bg-white/[0.02] px-7 py-7 text-center">
          <h2 className="text-lg font-medium text-white/86">Task unavailable</h2>
          <p className="mt-2 text-[13px] leading-5 text-white/45">
            {error instanceof Error ? error.message : "We couldn't load this task right now."}
          </p>
          <button
            className="mt-5 rounded-md px-3 py-2 text-[12px] text-white/45 transition hover:bg-white/[0.045] hover:text-white/72"
            onClick={() => navigate("/tasks")}
            type="button"
          >
            Back to tasks
          </button>
        </div>
      </div>
    );
  }

  const currentTask = task;
  const doneSubtasks = subtasks.filter((subtask) => subtask.done).length;
  const subtaskProgress = subtasks.length === 0 ? 0 : (doneSubtasks / subtasks.length) * 100;
  const truncatedTitle = currentTask.title.length > 40 ? `${currentTask.title.slice(0, 40)}...` : currentTask.title;

  function handleDelete() {
    onDeleteTask(currentTask);
    navigate(parentPath);
  }

  function closeWorkspace() {
    setIsClosing(true);
    window.setTimeout(() => navigate(parentPath), 220);
  }

  function addSubtask() {
    if (!newSubtask.trim()) return;
    setSubtasks((current) => [...current, { id: Date.now(), title: newSubtask.trim(), done: false }]);
    setNewSubtask("");
  }

  function addComment() {
    if (!commentDraft.trim()) return;
    setActivity((current) => [
      {
        id: Date.now(),
        type: "comment",
        user: "N",
        timestamp: new Date().toISOString(),
        text: commentDraft.trim(),
      },
      ...current,
    ]);
    setCommentDraft("");
  }

  return (
    <>
      <div
        className={[
          "task-full-view flex h-full flex-col bg-[#111113]",
          isClosing ? "task-full-view--closing" : "task-full-view--opening",
        ].join(" ")}
      >
        <div className="sticky top-0 z-10 border-b border-white/[0.055] bg-[#111113]/92 px-6 py-3 backdrop-blur-xl">
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2 text-[12px] text-white/30">
                <Link className="inline-flex items-center gap-2 transition hover:text-white/70" to={parentPath}>
                  {project ? (
                    <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: project.color || "#777777" }} />
                  ) : null}
                  {project?.name ?? "My tasks"}
                </Link>
                <span>/</span>
                <span className="truncate text-white/45">{truncatedTitle}</span>
              </div>
            </div>

            <div className="flex items-center gap-0.5">
              <span className={["mr-2 text-[11px] text-white/34 transition-opacity duration-150 ease-[cubic-bezier(0.16,1,0.3,1)]", savedVisible ? "opacity-100" : "opacity-0"].join(" ")}>
                Saved
              </span>
              <button className="rounded-md p-2 text-white/30 transition hover:bg-white/[0.045] hover:text-white/68" onClick={() => navigator.clipboard.writeText(window.location.href)} type="button">
                <Copy size={14} strokeWidth={1.55} />
              </button>
              <button className="rounded-md p-2 text-white/30 transition hover:bg-white/[0.045] hover:text-white/68" type="button">
                <Ellipsis size={14} strokeWidth={1.55} />
              </button>
              <button className="rounded-md p-2 text-white/30 transition hover:bg-white/[0.045] hover:text-white/68" onClick={handleDelete} type="button">
                <Trash2 size={14} strokeWidth={1.55} />
              </button>
              <div className="mx-1 h-4 w-px bg-white/[0.055]" />
              <button className="rounded-md p-2 text-white/30 transition hover:bg-white/[0.045] hover:text-white/68" onClick={closeWorkspace} type="button">
                <X size={14} strokeWidth={1.55} />
              </button>
            </div>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6">
          <div className="mx-auto max-w-3xl">
            <textarea
              className="w-full resize-none overflow-hidden whitespace-pre-wrap break-words bg-transparent text-[18px] font-medium leading-7 text-white/86 outline-none"
              onBlur={() => {
                if (title.trim() && title !== currentTask.title) void flushSave("title", { title: title.trim() });
              }}
              onChange={(event) => {
                const nextValue = event.target.value;
                setTitle(nextValue);
                if (nextValue.trim()) scheduleSave("title", { title: nextValue.trim() });
              }}
              ref={titleRef}
              rows={1}
              value={title}
            />

            <div className="mt-4 grid max-w-xl gap-2.5">
              <MetadataRow label="Status">
                <CustomSelect
                  onChange={(value) => {
                    const nextStatus = value as Task["status"];
                    setStatus(nextStatus);
                    scheduleSave("status", { status: nextStatus });
                  }}
                  options={STATUS_OPTIONS.map((option) => ({
                    value: option,
                    label: option.replace("_", " "),
                    leading: statusDot(option),
                  }))}
                  menuClassName="min-w-[176px]"
                  triggerClassName="rounded-full border-transparent bg-transparent px-2 py-1 text-white/58 hover:border-white/[0.06] hover:bg-white/[0.028] focus:border-white/[0.10]"
                  value={status}
                />
              </MetadataRow>

              <MetadataRow label="Priority">
                <CustomSelect
                  onChange={(value) => {
                    const nextPriority = value as Task["priority"];
                    setPriority(nextPriority);
                    scheduleSave("priority", { priority: nextPriority });
                  }}
                  options={PRIORITY_OPTIONS.map((option) => ({
                    value: option,
                    label: option,
                    leading: priorityDot(option),
                  }))}
                  triggerClassName="rounded-full border-transparent bg-transparent px-2 py-1 text-white/58 hover:border-white/[0.06] hover:bg-white/[0.028] focus:border-white/[0.10]"
                  value={priority}
                />
              </MetadataRow>

              <MetadataRow label="Due date">
                <CustomDateInput
                  className="min-h-7 rounded-md border-transparent bg-transparent px-2 py-1 text-[12px] text-white/58 hover:border-white/[0.06] hover:bg-white/[0.028] focus:border-white/[0.10]"
                  compact
                  onChange={(value) => {
                    setDueDate(value);
                    scheduleSave("dueDate", { dueDate: value ? new Date(`${value}T00:00:00`).toISOString() : null });
                  }}
                  placeholder="Set due date"
                  align="left"
                  value={dueDate}
                />
              </MetadataRow>

              <MetadataRow label="Project">
                {project ? (
                  <span className="inline-flex min-h-7 items-center gap-2 rounded-md px-2 py-1 text-[12px] text-white/56 transition-colors duration-100 ease-[cubic-bezier(0.16,1,0.3,1)] hover:bg-white/[0.028]">
                    <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: project.color || "#777777" }} />
                    {project.name}
                  </span>
                ) : (
                  <span className="inline-flex min-h-7 items-center rounded-md px-2 py-1 text-[12px] text-white/34 transition-colors duration-100 ease-[cubic-bezier(0.16,1,0.3,1)] hover:bg-white/[0.028]">
                    No project
                  </span>
                )}
              </MetadataRow>
            </div>

            <section className="mt-7">
              <p className="text-[10px] uppercase tracking-[0.16em] text-white/28">Description</p>
              <textarea
                className="mt-2 min-h-[120px] w-full resize-none overflow-hidden whitespace-pre-wrap break-words rounded-lg border border-white/[0.06] bg-white/[0.018] px-3 py-2.5 text-[12.5px] leading-5 text-white/58 outline-none placeholder:text-white/20 focus:border-white/[0.12]"
                onBlur={() => {
                  if (description !== (currentTask.description ?? "")) void flushSave("description", { description });
                }}
                onChange={(event) => {
                  const nextValue = event.target.value;
                  setDescription(nextValue);
                  scheduleSave("description", { description: nextValue });
                }}
                placeholder="Add a description..."
                ref={descriptionRef}
                rows={4}
                value={description}
              />
            </section>

            <SectionHeader badge={`${doneSubtasks}/${subtasks.length}`} spacing="full" title="Subtasks" />
            <div className="mt-3 border-l border-white/[0.075] pl-3">
              <div className="mb-2 h-0.5 overflow-hidden rounded-full bg-white/[0.055]">
                <div className="h-full rounded-full bg-white/28" style={{ width: `${subtaskProgress}%` }} />
              </div>
              <div className="space-y-1.5">
                {subtasks.map((subtask) => (
                  <label className="flex items-center gap-2 text-[12px] text-white/58" key={subtask.id}>
                    <input
                      checked={subtask.done}
                      className="task-checkbox"
                      onChange={() =>
                        setSubtasks((current) =>
                          current.map((item) => (item.id === subtask.id ? { ...item, done: !item.done } : item)),
                        )
                      }
                      type="checkbox"
                    />
                    <span className={subtask.done ? "text-white/28 line-through decoration-white/16" : ""}>{subtask.title}</span>
                  </label>
                ))}
                <input
                  className="w-full bg-transparent pt-1 text-[12px] text-white/58 outline-none placeholder:text-white/20"
                  onChange={(event) => setNewSubtask(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      addSubtask();
                    }
                  }}
                  placeholder="Add subtask"
                  value={newSubtask}
                />
              </div>
            </div>

            <SectionHeader badge={`${attachments.length}`} spacing="full" title="Attachments" />
            <div className="mt-2 divide-y divide-white/[0.055] border-y border-white/[0.055]">
              {attachments.map((file) => (
                <div className="group flex items-center gap-2.5 py-2 transition-colors duration-100 ease-[cubic-bezier(0.16,1,0.3,1)] hover:bg-white/[0.018]" key={file.id}>
                  <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-white/[0.03] text-[10px] font-medium uppercase text-white/34 transition-colors duration-100 ease-[cubic-bezier(0.16,1,0.3,1)] ${fileHoverTone(file.ext)}`}>
                    {file.ext}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[12px] text-white/62">{file.name}</p>
                    <p className="text-[10px] text-white/26">{file.size}</p>
                  </div>
                </div>
              ))}
            </div>

            <SectionHeader badge={`${activity.length}`} spacing="full" title="Activity" />
            <ActivityTimeline activity={activity} />
            <div className="border-l border-white/[0.075] pl-3">
              <div className="mt-3 flex gap-2 border-t border-white/[0.055] pt-3">
                <Avatar letter="N" />
                <textarea
                  className="min-h-[48px] flex-1 resize-none rounded-lg border border-white/[0.06] bg-white/[0.018] px-3 py-2 text-[12px] leading-5 text-white/62 outline-none placeholder:text-white/20 focus:border-white/[0.12]"
                  onChange={(event) => setCommentDraft(event.target.value)}
                  placeholder="Leave a note..."
                  value={commentDraft}
                />
                <button className="self-end rounded-md p-2 text-white/34 transition hover:bg-white/[0.045] hover:text-white/68" onClick={addComment} type="button">
                  <Send size={13} strokeWidth={1.6} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
