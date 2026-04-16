import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Task } from "../../../api";
import { createTask } from "../api/tasksApi";

type TasksQueryFilters = {
  projectId?: number;
  status?: Task["status"];
  priority?: Task["priority"];
};

function getTaskFiltersFromQueryKey(queryKey: readonly unknown[]) {
  const filters = queryKey[1];
  return filters && typeof filters === "object" ? (filters as TasksQueryFilters) : {};
}

function taskMatchesFilters(task: Task, filters: TasksQueryFilters) {
  return (
    (filters.projectId === undefined || task.projectId === filters.projectId) &&
    (filters.status === undefined || task.status === filters.status) &&
    (filters.priority === undefined || task.priority === filters.priority)
  );
}

// Monotonically decreasing id used for optimistic placeholders.
// Negative values guarantee no collision with server-assigned ids.
let nextOptimisticId = -1;

export function useCreateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createTask,
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey: ["tasks"] });

      const previousEntries = queryClient.getQueriesData<Task[]>({ queryKey: ["tasks"] });
      const optimisticId = nextOptimisticId--;
      const now = new Date().toISOString();

      // Reuse an existing cached task to source `creatorId` — the current user — without
      // reaching for auth state here. Falls back to 0 if the cache is empty.
      const existingSample = previousEntries
        .map(([, tasks]) => tasks?.[0])
        .find((task): task is Task => Boolean(task));

      const optimisticTask: Task = {
        id: optimisticId,
        title: variables.title,
        description: variables.description,
        status: variables.status,
        priority: variables.priority,
        dueDate: variables.dueDate,
        projectId: variables.projectId,
        createdAt: now,
        creatorId: existingSample?.creatorId ?? 0,
      };

      previousEntries.forEach(([queryKey, tasks]) => {
        if (!tasks) {
          return;
        }

        const filters = getTaskFiltersFromQueryKey(queryKey);
        if (!taskMatchesFilters(optimisticTask, filters)) {
          return;
        }

        queryClient.setQueryData<Task[]>(queryKey, [optimisticTask, ...tasks]);
      });

      return { previousEntries, optimisticId };
    },
    onError: (_error, _variables, context) => {
      // Roll back optimistic insert on failure.
      context?.previousEntries.forEach(([queryKey, data]) => {
        queryClient.setQueryData(queryKey, data);
      });
    },
    onSuccess: (task, variables, context) => {
      const taskForCache = {
        ...task,
        projectId: task.projectId ?? variables.projectId,
      };

      // Replace the optimistic placeholder with the real, server-authored task.
      queryClient.setQueryData<Task>(["task", taskForCache.id], taskForCache);
      queryClient.getQueriesData<Task[]>({ queryKey: ["tasks"] }).forEach(([queryKey, tasks]) => {
        if (!tasks) {
          return;
        }

        const filters = getTaskFiltersFromQueryKey(queryKey);
        const matches = taskMatchesFilters(taskForCache, filters);

        // Strip the placeholder (if present) and the real task (if it already exists).
        const withoutPlaceholder = tasks.filter(
          (item) => item.id !== context?.optimisticId && item.id !== taskForCache.id,
        );

        if (!matches) {
          queryClient.setQueryData<Task[]>(queryKey, withoutPlaceholder);
          return;
        }

        queryClient.setQueryData<Task[]>(queryKey, [taskForCache, ...withoutPlaceholder]);
      });
    },
  });
}
