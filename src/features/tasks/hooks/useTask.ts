import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { isApiErrorWithStatus, Task } from "../../../api";
import { getTask } from "../api/tasksApi";

export function useTask(taskId: number | null) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["task", taskId],
    queryFn: () => getTask(taskId as number),
    enabled: taskId !== null,
    retry: false,
    placeholderData: () => {
      if (taskId === null) {
        return undefined;
      }

      const cachedEntries = queryClient.getQueriesData<Task[]>({ queryKey: ["tasks"] });
      for (const [, tasks] of cachedEntries) {
        const matchedTask = tasks?.find((task) => task.id === taskId);
        if (matchedTask) {
          return matchedTask;
        }
      }

      return undefined;
    },
  });

  useEffect(() => {
    if (taskId === null || !isApiErrorWithStatus(query.error, 404)) {
      return;
    }

    const cachedEntries = queryClient.getQueriesData<Task[]>({ queryKey: ["tasks"] });
    cachedEntries.forEach(([queryKey, tasks]) => {
      if (!tasks?.some((task) => task.id === taskId)) {
        return;
      }

      queryClient.setQueryData<Task[]>(
        queryKey,
        tasks.filter((task) => task.id !== taskId),
      );
    });
    queryClient.removeQueries({ queryKey: ["task", taskId] });
  }, [query.error, queryClient, taskId]);

  return query;
}
