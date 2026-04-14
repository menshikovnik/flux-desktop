import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createProject } from "../api/projectsApi";

export function useCreateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createProject,
    onSuccess: async (project) => {
      await queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.setQueryData(["project", project.id], project);
    },
  });
}
