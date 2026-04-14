import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Task } from "../../../api";
import { getTask } from "../api/tasksApi";

export function useTask(taskId: number | null) {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: ["task", taskId],
    queryFn: () => getTask(taskId as number),
    enabled: taskId !== null,
    retry: false,
    initialData: () => {
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
}
