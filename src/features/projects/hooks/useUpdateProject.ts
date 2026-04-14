import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Project } from "../../../api";
import { updateProject } from "../api/projectsApi";

export function useUpdateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Parameters<typeof updateProject>[1] }) =>
      updateProject(id, payload),
    onSuccess: async (project) => {
      queryClient.setQueryData(["project", project.id], project);
      queryClient.setQueryData<Project[] | undefined>(["projects"], (current) =>
        current?.map((item) => (item.id === project.id ? project : item)),
      );
      await queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });
}
