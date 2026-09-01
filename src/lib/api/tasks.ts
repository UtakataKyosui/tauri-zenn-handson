import { events, type TaskProgress, commands } from "@/lib/bindings";

export type { TaskProgress };

export async function startLongTask(steps: number): Promise<string> {
  const result = await commands.startLongTask(steps);
  if (result.status === "error") throw new Error(JSON.stringify(result.error));
  return result.data;
}

export async function cancelLongTask(taskId: string): Promise<void> {
  const result = await commands.cancelLongTask(taskId);
  if (result.status === "error") throw new Error(JSON.stringify(result.error));
}

export function onTaskProgress(callback: (progress: TaskProgress) => void) {
  return events.taskProgress.listen((event) => callback(event.payload));
}
