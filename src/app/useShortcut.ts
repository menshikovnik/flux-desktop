import { useEffect, useRef } from "react";
import { isModifierPressed } from "./platform";

type ShortcutOptions = {
  code: string;
  mod?: boolean;
  preventDefault?: boolean;
  enabled?: boolean;
  allowInEditable?: boolean;
};

function isEditableTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  return Boolean(target.closest("input, textarea, select, [contenteditable='true']"));
}

function codeMatches(event: KeyboardEvent, code: string) {
  return event.code === code;
}

export function useShortcut(options: ShortcutOptions, handler: (event: KeyboardEvent) => void) {
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  useEffect(() => {
    if (options.enabled === false) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (!options.allowInEditable && isEditableTarget(event.target)) {
        return;
      }

      if (options.mod && !isModifierPressed(event)) {
        return;
      }

      if (!options.mod && (event.metaKey || event.ctrlKey || event.altKey)) {
        return;
      }

      if (!codeMatches(event, options.code)) {
        return;
      }

      if (options.preventDefault !== false) {
        event.preventDefault();
      }

      handlerRef.current(event);
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [options.allowInEditable, options.code, options.enabled, options.mod, options.preventDefault]);
}
