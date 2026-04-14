import { useQuery } from "@tanstack/react-query";
import { getProject } from "../api/projectsApi";

export function useProject(projectId: number | null) {
  return useQuery({
    queryKey: ["project", projectId],
    queryFn: () => getProject(projectId as number),
    enabled: projectId !== null,
  });
}
