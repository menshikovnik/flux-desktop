type ConfirmDeleteModalProps = {
  open: boolean;
  loading?: boolean;
  title?: string;
  message?: string;
  confirmLabel?: string;
  loadingLabel?: string;
  onCancel: () => void;
  onConfirm: () => void;
};

export function ConfirmDeleteModal({
  open,
  loading = false,
  title = "Delete task?",
  message = "This action cannot be undone.",
  confirmLabel = "Delete",
  loadingLabel = "Deleting...",
  onCancel,
  onConfirm,
}: ConfirmDeleteModalProps) {
  if (!open) {
    return null;
  }

  return (
    <div className="modal-overlay fixed inset-0 z-[80] flex items-center justify-center bg-black/60 p-6 backdrop-blur-md">
      <div className="modal-surface w-full max-w-[400px] rounded-xl border border-white/10 bg-[#171719]/92 p-4 shadow-[0_24px_84px_rgba(0,0,0,0.48)] backdrop-blur-xl">
        <p className="text-[11px] text-white/32">Projects / Delete</p>
        <h3 className="mt-3 text-[15px] font-medium text-white/88">{title}</h3>
        <p className="mt-2 text-[12px] leading-5 text-white/42">{message}</p>
        <div className="mt-5 flex justify-end gap-1.5">
          <button
            className="h-7 rounded-md px-2.5 text-[12px] text-white/42 transition-colors duration-100 ease-[cubic-bezier(0.16,1,0.3,1)] hover:bg-white/[0.05] hover:text-white/72"
            onClick={onCancel}
            type="button"
          >
            Cancel
          </button>
          <button
            className="h-7 rounded-md border border-red-400/18 bg-transparent px-2.5 text-[12px] font-medium text-red-200/60 transition-colors duration-100 ease-[cubic-bezier(0.16,1,0.3,1)] hover:border-red-400/38 hover:bg-red-500/14 hover:text-red-100 disabled:cursor-not-allowed disabled:opacity-45"
            disabled={loading}
            onClick={onConfirm}
            type="button"
          >
            {loading ? loadingLabel : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
