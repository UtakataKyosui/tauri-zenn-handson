import { mockCommand } from "@/test/mocks/tauri";
import { describe, expect, it, vi } from "vitest";

const { listenMock } = vi.hoisted(() => ({
  listenMock: vi.fn(),
}));

vi.mock("@/lib/bindings", async () => {
  const actual = await vi.importActual<typeof import("@/lib/bindings")>("@/lib/bindings");
  return {
    ...actual,
    events: {
      taskProgress: { listen: listenMock },
    },
  };
});

const { cancelLongTask, onTaskProgress, startLongTask } = await import("./tasks");

describe("tasks api", () => {
  it("starts a long task and returns its id", async () => {
    mockCommand("start_long_task", () => "task-1");

    await expect(startLongTask(10)).resolves.toBe("task-1");
  });

  it("throws when starting a task is rejected by the backend", async () => {
    mockCommand("start_long_task", () => {
      throw { kind: "Core", message: { kind: "InvalidInput", message: "steps must be > 0" } };
    });

    await expect(startLongTask(0)).rejects.toThrow();
  });

  it("cancels a long task", async () => {
    mockCommand("cancel_long_task", () => null);

    await expect(cancelLongTask("task-1")).resolves.toBeUndefined();
  });

  it("throws when cancelling a task the backend rejects", async () => {
    mockCommand("cancel_long_task", () => {
      throw { kind: "Core", message: { kind: "NotFound", message: "task-1" } };
    });

    await expect(cancelLongTask("task-1")).rejects.toThrow();
  });

  it("forwards task progress events to the callback", async () => {
    const unlisten = vi.fn();
    listenMock.mockResolvedValue(unlisten);
    const onProgress = vi.fn();

    onTaskProgress(onProgress);
    const handler = listenMock.mock.calls[0]?.[0] as (e: { payload: unknown }) => void;
    const payload = { task_id: "task-1", completed: 1, total: 10, status: "running" as const };
    handler({ payload });

    expect(onProgress).toHaveBeenCalledWith(payload);
  });
});
