import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Task } from "../../../api";
import { updateTask } from "../api/tasksApi";

export function useUpdateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Parameters<typeof updateTask>[1] }) =>
      updateTask(id, payload),
    onMutate: async ({ id, payload }) => {
      await queryClient.cancelQueries({ queryKey: ["tasks"] });
      await queryClient.cancelQueries({ queryKey: ["task", id] });
      const previousEntries = queryClient.getQueriesData<Task[]>({ queryKey: ["tasks"] });
      const previousTask = queryClient.getQueryData<Task>(["task", id]);

      for (const [queryKey, tasks] of previousEntries) {
        if (!tasks) {
          continue;
        }

        queryClient.setQueryData<Task[]>(queryKey, tasks.map((task) => (task.id === id ? { ...task, ...payload } : task)));
      }

      if (previousTask) {
        queryClient.setQueryData<Task>(["task", id], { ...previousTask, ...payload });
      }

      return { previousEntries, previousTask, taskId: id };
    },
    onError: (_error, _variables, context) => {
      context?.previousEntries.forEach(([queryKey, data]) => {
        queryClient.setQueryData(queryKey, data);
      });

      if (context?.previousTask && context.taskId) {
        queryClient.setQueryData(["task", context.taskId], context.previousTask);
      }
    },
    onSuccess: (task) => {
      // Atomic cache update — patch only the mutated task instead of refetching the list.
      queryClient.setQueryData(["task", task.id], task);
      const entries = queryClient.getQueriesData<Task[]>({ queryKey: ["tasks"] });
      entries.forEach(([queryKey, tasks]) => {
        if (!tasks) {
          return;
        }

        queryClient.setQueryData<Task[]>(
          queryKey,
          tasks.map((item) => (item.id === task.id ? { ...item, ...task } : item)),
        );
      });
    },
  });
}
