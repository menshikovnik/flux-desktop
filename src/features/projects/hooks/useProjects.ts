import { useQuery } from "@tanstack/react-query";
import { getAllProjects } from "../api/projectsApi";

export function useProjects() {
  return useQuery({
    queryKey: ["projects"],
    queryFn: getAllProjects,
  });
}
