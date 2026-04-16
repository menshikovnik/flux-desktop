import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Task } from "../../../api";
import { deleteTask } from "../api/tasksApi";

export function useDeleteTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteTask,
    onMutate: async (taskId) => {
      await queryClient.cancelQueries({ queryKey: ["tasks"] });
      await queryClient.cancelQueries({ queryKey: ["task", taskId] });
      const previousEntries = queryClient.getQueriesData<Task[]>({ queryKey: ["tasks"] });
      const previousTask = queryClient.getQueryData<Task>(["task", taskId]);

      previousEntries.forEach(([queryKey, tasks]) => {
        if (!tasks) {
          return;
        }

        queryClient.setQueryData<Task[]>(
          queryKey,
          tasks.filter((task) => task.id !== taskId),
        );
      });

      queryClient.removeQueries({ queryKey: ["task", taskId] });

      return { previousEntries, previousTask, taskId };
    },
    onError: (_error, _taskId, context) => {
      // Roll back the optimistic delete if the server rejected the change.
      context?.previousEntries.forEach(([queryKey, data]) => {
        queryClient.setQueryData(queryKey, data);
      });

      if (context?.previousTask && context.taskId) {
        queryClient.setQueryData(["task", context.taskId], context.previousTask);
      }
    },
  });
}
