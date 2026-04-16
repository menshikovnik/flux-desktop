import { PointerEvent, ReactNode, useEffect } from "react";
import { X } from "lucide-react";
import { useDraggableModal } from "./useDraggableModal";

export function CommandModal({
  open,
  closing,
  closeOnEscape = true,
  eyebrow,
  title,
  children,
  onClose,
}: {
  open: boolean;
  closing: boolean;
  closeOnEscape?: boolean;
  eyebrow: ReactNode;
  title: ReactNode;
  children: ReactNode;
  onClose: () => void;
}) {
  const { modalShellRef, handleDragStart } = useDraggableModal(open);

  useEffect(() => {
    if (!open) return;

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        if (closeOnEscape) {
          onClose();
        }
      }
    }

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [closeOnEscape, onClose, open]);

  if (!open) {
    return null;
  }

  function handleOverlayPointerDown(event: PointerEvent<HTMLDivElement>) {
    if (event.target === event.currentTarget) {
      onClose();
    }
  }

  return (
    <div
      className={`modal-overlay fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/35 px-6 py-10 backdrop-blur-[4px]${closing ? " is-closing" : ""}`}
      onPointerDown={handleOverlayPointerDown}
    >
      <div className="w-[640px] max-w-[calc(100vw-48px)]" ref={modalShellRef}>
        <div className={`modal-surface w-full overflow-visible rounded-xl border border-white/10 bg-[#171719] shadow-[0_24px_84px_rgba(0,0,0,0.5)]${closing ? " is-closing" : ""}`}>
          <div className="flex items-center justify-between gap-4 border-b border-white/10 px-4 py-3">
            <div
              className="min-w-0 flex-1 touch-none select-none cursor-grab active:cursor-grabbing"
              onPointerDown={handleDragStart}
            >
              <p className="truncate text-[11px] text-white/32">
                <span>{eyebrow}</span>
                <span className="px-1.5 text-white/18">/</span>
                <span className="text-white/45">{title}</span>
              </p>
            </div>
            <button
              className="flex h-7 w-7 items-center justify-center rounded-md text-white/30 transition-colors duration-100 ease-[cubic-bezier(0.16,1,0.3,1)] hover:bg-white/[0.045] hover:text-white/68 active:duration-0"
              onPointerDown={(event) => event.stopPropagation()}
              onClick={onClose}
              type="button"
            >
              <X size={14} strokeWidth={1.6} />
            </button>
          </div>

          {children}
        </div>
      </div>
    </div>
  );
}
