import { FormEvent, useMemo, useState } from "react";
import { X } from "lucide-react";

const PRESET_COLORS = ["#6366f1", "#f59e0b", "#10b981", "#ef4444", "#3b82f6", "#ec4899"];

type NewProjectModalProps = {
  open: boolean;
  closing: boolean;
  loading: boolean;
  onClose: () => void;
  onSubmit: (values: { name: string; description: string; color: string }) => Promise<void> | void;
};

export function NewProjectModal({ open, closing, loading, onClose, onSubmit }: NewProjectModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState(PRESET_COLORS[0]);
  const disabled = useMemo(() => loading || !name.trim(), [loading, name]);

  if (!open) {
    return null;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await onSubmit({
      name: name.trim(),
      description: description.trim(),
      color,
    });
    setName("");
    setDescription("");
    setColor(PRESET_COLORS[0]);
  }

  return (
    <div className={`modal-overlay fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-6 backdrop-blur-sm${closing ? " is-closing" : ""}`}>
      <div className={`modal-surface w-full max-w-xl rounded-[28px] border border-white/10 bg-[#151525] p-6 shadow-2xl${closing ? " is-closing" : ""}`}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-white/35">Projects</p>
            <h2 className="mt-2 text-2xl font-semibold text-white">Create a new workspace</h2>
            <p className="mt-2 text-sm text-white/55">
              Projects are the main way to navigate Flux. Pick a color and give the space a clear
              focus.
            </p>
          </div>
          <button
            className="rounded-xl border border-white/10 bg-white/5 p-2 text-white/60 transition hover:bg-white/10 hover:text-white"
            onClick={onClose}
            type="button"
          >
            <X size={16} />
          </button>
        </div>

        <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
          <label className="block space-y-2 text-sm text-white/70">
            <span>Name</span>
            <input
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition placeholder:text-white/25 focus:border-[#6C63FF] focus:ring-2 focus:ring-[#6C63FF]/30"
              maxLength={100}
              onChange={(event) => setName(event.target.value)}
              placeholder="Spring sync"
              value={name}
            />
          </label>

          <div className="space-y-2">
            <span className="text-sm text-white/70">Color</span>
            <div className="flex flex-wrap gap-3">
              {PRESET_COLORS.map((preset) => (
                <button
                  aria-label={`Pick ${preset}`}
                  className={[
                    "h-10 w-10 rounded-full border-2 transition",
                    color === preset ? "border-white scale-110" : "border-transparent hover:scale-105",
                  ].join(" ")}
                  key={preset}
                  onClick={() => setColor(preset)}
                  style={{ backgroundColor: preset }}
                  type="button"
                />
              ))}
            </div>
          </div>

          <label className="block space-y-2 text-sm text-white/70">
            <span>Description</span>
            <textarea
              className="min-h-28 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition placeholder:text-white/25 focus:border-[#6C63FF] focus:ring-2 focus:ring-[#6C63FF]/30"
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Backend auth improvements, rollout tasks, polish."
              value={description}
            />
          </label>

          <div className="flex justify-end gap-3">
            <button
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white/75 transition hover:bg-white/10 hover:text-white"
              onClick={onClose}
              type="button"
            >
              Cancel
            </button>
            <button
              className="rounded-xl bg-[#6C63FF] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[#7a72ff] disabled:cursor-not-allowed disabled:opacity-60"
              disabled={disabled}
              type="submit"
            >
              {loading ? "Creating..." : "Create project"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
