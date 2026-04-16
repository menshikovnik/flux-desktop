import { useEffect, useMemo, useRef, useState } from "react";
import type { FormEvent, KeyboardEvent, ReactNode } from "react";
import { CalendarDays, CircleDot, Flag, UserRound } from "lucide-react";
import { Priority, Project, Status } from "../../../api";
import { formatShortcut, getModifierKeyLabel, isModifierPressed } from "../../../app/platform";
import { Kbd } from "../../../components/Kbd";
import { CustomSelect } from "../../../components/CustomSelect";
import { CommandModal } from "../../../components/modal/CommandModal";
import { DueDateField } from "./DueDateField";
import { serializeDueDate } from "../utils/dueDate";

export function NewTaskModal({
  open,
  closing,
  loading,
  projects,
  initialProjectId,
  initialStatus,
  onClose,
  onSubmit,
}: {
  open: boolean;
  closing: boolean;
  loading: boolean;
  projects: Project[];
  initialProjectId?: number;
  initialStatus?: Status;
  onClose: () => void;
  onSubmit: (values: {
    title: string;
    description: string;
    status: Status;
    priority: Priority;
    dueDate: string | null;
    projectId: number | null;
  }) => Promise<void> | void;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<Status>(initialStatus ?? "OPEN");
  const [priority, setPriority] = useState<Priority>("MEDIUM");
  const [dueDate, setDueDate] = useState("");
  const [dueTime, setDueTime] = useState("");
  const [projectId, setProjectId] = useState<string>("none");
  const descriptionRef = useRef<HTMLTextAreaElement | null>(null);
  const submitShortcutLabel = formatShortcut([getModifierKeyLabel(), "Enter"]);

  function resetForm() {
    setTitle("");
    setDescription("");
    setStatus(initialStatus ?? "OPEN");
    setPriority("MEDIUM");
    setDueDate("");
    setDueTime("");
    setProjectId(initialProjectId ? String(initialProjectId) : "none");
  }

  useEffect(() => {
    if (open) {
      resetForm();
    }
  }, [initialProjectId, initialStatus, open]);

  useEffect(() => {
    if (!descriptionRef.current) {
      return;
    }

    descriptionRef.current.style.height = "auto";
    descriptionRef.current.style.height = `${descriptionRef.current.scrollHeight}px`;
  }, [description]);

  const activeProject = useMemo(
    () =>
      projectId === "none"
        ? null
        : projects.find((project) => String(project.id) === projectId) ?? null,
    [projectId, projects],
  );

  if (!open) {
    return null;
  }

  async function submitTask() {
    if (loading || !title.trim()) {
      return;
    }

    await onSubmit({
      title: title.trim(),
      description: description.trim(),
      status,
      priority,
      dueDate: serializeDueDate(dueDate, dueTime),
      projectId: projectId === "none" ? null : Number(projectId),
    });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await submitTask();
  }

  function handleFormKeyDown(event: KeyboardEvent<HTMLFormElement>) {
    if (event.key !== "Enter") {
      return;
    }

    const shouldSubmit = isModifierPressed(event);
    if (shouldSubmit) {
      event.preventDefault();
      event.stopPropagation();
      void submitTask();
      return;
    }

    if (event.target instanceof HTMLTextAreaElement) {
      return;
    }

    event.preventDefault();
  }

  return (
    <CommandModal
      closing={closing}
      eyebrow={activeProject?.name ?? "No project"}
      onClose={onClose}
      open={open}
      title="New Task"
    >
        <form onKeyDown={handleFormKeyDown} onSubmit={handleSubmit}>
          <div className="px-5 py-4">
            <input
              autoFocus
              className="w-full bg-transparent text-xl font-medium leading-7 text-white/88 outline-none placeholder:text-white/24"
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Task title"
              required
              value={title}
            />

            <textarea
              className="mt-2 max-h-48 min-h-12 w-full resize-none overflow-hidden bg-transparent text-[13px] leading-5 text-white/52 outline-none placeholder:text-white/20"
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Add details..."
              ref={descriptionRef}
              rows={2}
              value={description}
            />
          </div>

          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-x-4 gap-y-2 border-t border-white/10 px-3 py-2.5">
            <div className="grid min-w-0 grid-cols-[max-content_max-content_max-content] gap-1">
              <MetaControl icon={<CircleDot size={13} strokeWidth={1.6} />}>
                <CustomSelect
                  onChange={(value) => setStatus(value as Status)}
                  options={[
                    { value: "OPEN", label: "Open" },
                    { value: "IN_PROGRESS", label: "In progress" },
                    { value: "DONE", label: "Done" },
                    { value: "CANCELLED", label: "Cancelled" },
                  ]}
                  triggerClassName="border-transparent bg-transparent px-1.5 py-1 text-white/56 hover:border-transparent hover:bg-transparent focus:border-transparent"
                  menuClassName="min-w-[150px]"
                  value={status}
                />
              </MetaControl>

              <MetaControl icon={<Flag size={13} strokeWidth={1.6} />}>
                <CustomSelect
                  onChange={(value) => setPriority(value as Priority)}
                  options={[
                    { value: "LOW", label: "Low" },
                    { value: "MEDIUM", label: "Medium" },
                    { value: "HIGH", label: "High" },
                  ]}
                  triggerClassName="border-transparent bg-transparent px-1.5 py-1 text-white/56 hover:border-transparent hover:bg-transparent focus:border-transparent"
                  menuClassName="min-w-[124px]"
                  value={priority}
                />
              </MetaControl>

              <MetaControl icon={<UserRound size={13} strokeWidth={1.6} />}>
                <button
                  className="flex min-h-7 items-center gap-1.5 rounded-md px-1.5 py-1 text-[12px] text-white/46 outline-none transition-colors duration-100 ease-[cubic-bezier(0.16,1,0.3,1)] active:duration-0"
                  type="button"
                >
                  L
                </button>
              </MetaControl>

              <div className="col-span-3 flex min-w-0 items-center gap-1">
                <MetaControl className="shrink-0" icon={<CalendarDays size={13} strokeWidth={1.6} />}>
                <DueDateField
                  dateValue={dueDate}
                  onDateChange={setDueDate}
                  onTimeChange={setDueTime}
                  timeValue={dueTime}
                />
                </MetaControl>

                <div className="w-[118px] shrink-0">
                  <CustomSelect
                    onChange={(value) => setProjectId(String(value))}
                    options={[
                      { value: "none", label: "No project" },
                      ...projects
                        .filter((project) => !project.archived)
                        .map((project) => ({ value: String(project.id), label: project.name })),
                    ]}
                    triggerClassName="border-transparent bg-transparent px-2 py-1 text-white/42 hover:border-transparent hover:bg-white/[0.045] focus:border-transparent"
                    menuClassName="min-w-[180px]"
                    value={projectId}
                  />
                </div>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-1.5 self-center">
              <button
                className="inline-flex h-7 items-center gap-1.5 rounded-md px-2.5 text-[12px] text-white/42 transition-colors duration-100 ease-[cubic-bezier(0.16,1,0.3,1)] hover:bg-white/[0.045] hover:text-white/70 active:duration-0"
                onClick={onClose}
                type="button"
              >
                Cancel <Kbd>Esc</Kbd>
              </button>
              <button
                className="inline-flex h-7 items-center gap-1.5 rounded-md border border-white/10 bg-white/[0.05] px-2.5 text-[12px] font-medium text-white/82 transition-colors duration-100 ease-[cubic-bezier(0.16,1,0.3,1)] hover:bg-white/[0.09] active:duration-0 disabled:cursor-not-allowed disabled:opacity-45"
                disabled={loading || !title.trim()}
                type="submit"
              >
                {loading ? "Creating" : "Create"} <Kbd>{submitShortcutLabel}</Kbd>
              </button>
            </div>
          </div>
        </form>
    </CommandModal>
  );
}

function MetaControl({ children, icon, className = "" }: { children: ReactNode; icon: ReactNode; className?: string }) {
  return (
    <div className={["group flex min-h-7 items-center gap-1 rounded-md px-1 text-white/30 transition-colors duration-100 ease-[cubic-bezier(0.16,1,0.3,1)] hover:text-white/52", className].join(" ")}>
      <span className="shrink-0">{icon}</span>
      <div className="min-w-0">{children}</div>
    </div>
  );
}
