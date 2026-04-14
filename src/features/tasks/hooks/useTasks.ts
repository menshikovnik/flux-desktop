import { useQuery } from "@tanstack/react-query";
import { getAllTasks, TaskFilters } from "../api/tasksApi";

export function useTasks(filters: Omit<TaskFilters, "page"> = {}) {
  return useQuery({
    queryKey: ["tasks", filters],
    queryFn: () => getAllTasks(filters),
  });
}
