import { useCallback, useEffect, useRef } from "react";
import { Task } from "../../../api";
import { useUpdateTask } from "./useUpdateTask";

type Options = {
  onSaved?: () => void;
  onError?: () => void;
};

export function useDebouncedTaskPatch(taskId: number, options: Options = {}) {
  const updateTask = useUpdateTask();
  const timersRef = useRef<Record<string, number>>({});

  const runSave = useCallback(
    async (payload: Partial<Task>) => {
      try {
        await updateTask.mutateAsync({
          id: taskId,
          payload: payload as Parameters<typeof updateTask.mutateAsync>[0]["payload"],
        });
        options.onSaved?.();
      } catch {
        options.onError?.();
      }
    },
    [options, taskId, updateTask],
  );

  const scheduleSave = useCallback(
    (key: string, payload: Partial<Task>, delay = 400) => {
      window.clearTimeout(timersRef.current[key]);
      timersRef.current[key] = window.setTimeout(() => {
        void runSave(payload);
        delete timersRef.current[key];
      }, delay);
    },
    [runSave],
  );

  const flushSave = useCallback(
    async (key: string, payload: Partial<Task>) => {
      window.clearTimeout(timersRef.current[key]);
      delete timersRef.current[key];
      await runSave(payload);
    },
    [runSave],
  );

  useEffect(() => {
    return () => {
      Object.values(timersRef.current).forEach((timer) => window.clearTimeout(timer));
    };
  }, []);

  return {
    flushSave,
    isSaving: updateTask.isPending,
    scheduleSave,
  };
}
