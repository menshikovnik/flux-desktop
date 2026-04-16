import type { ReactNode } from "react";

/**
 * <Kbd> – a styled keyboard shortcut badge.
 *
 * Very muted by design: meant to hint at a shortcut without
 * competing with the surrounding UI. Hidden on touch-only
 * (coarse pointer) devices where physical keys aren't present.
 */
export function Kbd({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <kbd
      className={[
        // Hidden on coarse-pointer (touch) devices
        "hidden [@media(pointer:fine)]:inline-flex",
        "items-center justify-center",
        "rounded-md border border-white/10 bg-white/[0.045]",
        "px-1.5 py-0.5",
        "font-mono text-[9px] leading-none font-normal tracking-wide text-white/22",
        "select-none",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </kbd>
  );
}
