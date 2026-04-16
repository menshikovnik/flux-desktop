import { apiClient, extractCreatedIdFromLocation, PageResponse, Priority, Status, Task } from "../../../api";

export type TaskFilters = {
  page?: number;
  size?: number;
  projectId?: number;
  status?: Status;
  priority?: Priority;
};

export type CreateTaskPayload = {
  title: string;
  description: string;
  priority: Priority;
  status: Status;
  dueDate: string | null;
  projectId: number | null;
};

export type UpdateTaskPayload = Partial<CreateTaskPayload & { dueDate: string | null }>;

type TaskResponse = Omit<Task, "description"> & {
  description?: string | null;
  projectId?: number | null;
  dueDate?: string | null;
};

function normalizeTask(task: TaskResponse): Task {
  return {
    ...task,
    description: task.description ?? "",
    projectId: task.projectId ?? null,
    dueDate: task.dueDate ?? null,
  };
}

function isCompleteTaskResponse(task: TaskResponse | undefined): task is TaskResponse {
  return Boolean(
    task &&
      typeof task.id === "number" &&
      typeof task.title === "string" &&
      typeof task.status === "string" &&
      typeof task.priority === "string" &&
      typeof task.createdAt === "string",
  );
}

export async function getTasks({ page = 0, size = 100, projectId, status, priority }: TaskFilters = {}) {
  const response = await apiClient.get<PageResponse<TaskResponse>>("/tasks", {
    params: {
      page,
      size,
      ...(projectId !== undefined ? { projectId } : {}),
      ...(status ? { status } : {}),
      ...(priority ? { priority } : {}),
    },
  });

  return {
    ...response.data,
    content: response.data.content.map(normalizeTask),
  };
}

export async function getAllTasks(filters: Omit<TaskFilters, "page"> = {}) {
  const allTasks: Task[] = [];
  let page = 0;

  while (true) {
    const response = await getTasks({ ...filters, page });
    allTasks.push(...response.content);

    if (response.last || response.content.length === 0 || page >= response.totalPages - 1) {
      return allTasks;
    }

    page += 1;
  }
}

export async function createTask(payload: CreateTaskPayload) {
  const response = await apiClient.post<TaskResponse | undefined>("/tasks", {
    title: payload.title,
    description: payload.description,
    priority: payload.priority,
    status: payload.status,
    dueDate: payload.dueDate,
    projectId: payload.projectId,
  });
  const createdTask = isCompleteTaskResponse(response.data) ? normalizeTask(response.data) : undefined;
  const createdId = createdTask?.id ?? extractCreatedIdFromLocation(response.headers.location);

  if (createdTask) {
    return createdTask;
  }

  if (!createdId) {
    throw new Error("Task created but no task id was returned.");
  }

  return getTask(createdId);
}

export async function getTask(id: number) {
  const response = await apiClient.get<TaskResponse>(`/tasks/${id}`);
  return normalizeTask(response.data);
}

export async function updateTask(id: number, payload: UpdateTaskPayload) {
  const response = await apiClient.patch<TaskResponse>(`/tasks/${id}`, payload);
  return normalizeTask(response.data);
}

export async function deleteTask(id: number) {
  await apiClient.delete(`/tasks/${id}`);
}
