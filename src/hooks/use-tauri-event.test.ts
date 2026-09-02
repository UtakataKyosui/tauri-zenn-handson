import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useTauriEvent } from "./use-tauri-event";

const { listenMock } = vi.hoisted(() => ({
  listenMock: vi.fn(),
}));

vi.mock("@tauri-apps/api/event", () => ({
  listen: listenMock,
}));

describe("useTauriEvent", () => {
  beforeEach(() => {
    listenMock.mockReset();
  });

  it("forwards the event payload to the handler", async () => {
    const unlisten = vi.fn();
    listenMock.mockResolvedValue(unlisten);
    const handler = vi.fn();

    renderHook(() => useTauriEvent("menu://export", handler));
    const emit = listenMock.mock.calls[0]?.[1] as (e: { payload: unknown }) => void;

    emit({ payload: undefined });

    expect(handler).toHaveBeenCalledWith({ payload: undefined });
  });

  it("does not resubscribe when only the handler identity changes", async () => {
    const unlisten = vi.fn();
    listenMock.mockResolvedValue(unlisten);

    const { rerender } = renderHook(
      ({ handler }: { handler: (e: { payload: unknown }) => void }) =>
        useTauriEvent("menu://export", handler),
      { initialProps: { handler: vi.fn() } },
    );
    rerender({ handler: vi.fn() });
    rerender({ handler: vi.fn() });

    expect(listenMock).toHaveBeenCalledTimes(1);
  });

  it("calls the latest handler even after the handler identity changes", async () => {
    const unlisten = vi.fn();
    listenMock.mockResolvedValue(unlisten);
    const firstHandler = vi.fn();
    const secondHandler = vi.fn();

    const { rerender } = renderHook(
      ({ handler }: { handler: (e: { payload: unknown }) => void }) =>
        useTauriEvent("menu://export", handler),
      { initialProps: { handler: firstHandler } },
    );
    rerender({ handler: secondHandler });

    const emit = listenMock.mock.calls[0]?.[1] as (e: { payload: unknown }) => void;
    emit({ payload: undefined });

    expect(firstHandler).not.toHaveBeenCalled();
    expect(secondHandler).toHaveBeenCalledWith({ payload: undefined });
  });

  it("resubscribes when the event name changes", async () => {
    const unlisten = vi.fn();
    listenMock.mockResolvedValue(unlisten);

    const { rerender } = renderHook(
      ({ event }: { event: string }) => useTauriEvent(event, vi.fn()),
      { initialProps: { event: "menu://export" } },
    );
    rerender({ event: "menu://other" });

    expect(listenMock).toHaveBeenCalledTimes(2);
  });

  it("unlistens on unmount", async () => {
    const unlisten = vi.fn();
    listenMock.mockResolvedValue(unlisten);

    const { unmount } = renderHook(() => useTauriEvent("menu://export", vi.fn()));
    await Promise.resolve();
    unmount();
    await Promise.resolve();

    expect(unlisten).toHaveBeenCalled();
  });
});
