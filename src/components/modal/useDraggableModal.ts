import { PointerEvent, useEffect, useRef } from "react";

export function useDraggableModal(open: boolean) {
  const VIEWPORT_MARGIN = 24;
  const modalShellRef = useRef<HTMLDivElement | null>(null);
  const dragRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    originX: number;
    originY: number;
  } | null>(null);
  const offsetRef = useRef({ x: 0, y: 0 });
  const nextOffsetRef = useRef({ x: 0, y: 0 });
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    if (!open) return;

    offsetRef.current = { x: 0, y: 0 };
    nextOffsetRef.current = { x: 0, y: 0 };
    if (modalShellRef.current) {
      modalShellRef.current.style.transform = "translate3d(0px, 0px, 0)";
    }
  }, [open]);

  useEffect(() => {
    function clampOffset(offset: { x: number; y: number }) {
      const modal = modalShellRef.current;
      if (!modal) {
        return offset;
      }

      const rect = modal.getBoundingClientRect();
      const currentOffset = offsetRef.current;
      const minX = VIEWPORT_MARGIN - rect.left;
      const maxX = window.innerWidth - VIEWPORT_MARGIN - rect.right;
      const minY = VIEWPORT_MARGIN - rect.top;
      const maxY = window.innerHeight - VIEWPORT_MARGIN - rect.bottom;

      return {
        x: Math.min(Math.max(offset.x, currentOffset.x + minX), currentOffset.x + maxX),
        y: Math.min(Math.max(offset.y, currentOffset.y + minY), currentOffset.y + maxY),
      };
    }

    function commitDragFrame() {
      animationFrameRef.current = null;
      const nextOffset = clampOffset(nextOffsetRef.current);
      nextOffsetRef.current = nextOffset;
      offsetRef.current = nextOffset;
      if (modalShellRef.current) {
        modalShellRef.current.style.transform = `translate3d(${nextOffset.x}px, ${nextOffset.y}px, 0)`;
      }
    }

    function handlePointerMove(event: globalThis.PointerEvent) {
      const drag = dragRef.current;
      if (!drag || event.pointerId !== drag.pointerId) return;

      nextOffsetRef.current = {
        x: drag.originX + event.clientX - drag.startX,
        y: drag.originY + event.clientY - drag.startY,
      };

      if (animationFrameRef.current === null) {
        animationFrameRef.current = window.requestAnimationFrame(commitDragFrame);
      }
    }

    function handlePointerUp(event: globalThis.PointerEvent) {
      if (dragRef.current?.pointerId !== event.pointerId) return;

      dragRef.current = null;
      if (animationFrameRef.current !== null) {
        window.cancelAnimationFrame(animationFrameRef.current);
        commitDragFrame();
      }
    }

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    window.addEventListener("pointercancel", handlePointerUp);
    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("pointercancel", handlePointerUp);
      if (animationFrameRef.current !== null) {
        window.cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  function handleDragStart(event: PointerEvent<HTMLDivElement>) {
    if (event.button !== 0) return;
    if ((event.target as HTMLElement).closest("button, input, textarea, select, a")) return;

    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originX: offsetRef.current.x,
      originY: offsetRef.current.y,
    };
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  return { modalShellRef, handleDragStart };
}
