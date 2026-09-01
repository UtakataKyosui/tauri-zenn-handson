import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { TOAST_DURATION_MS, TOAST_LIMIT, useToastStore } from "./toast-store";

describe("useToastStore", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    useToastStore.setState({ toasts: [] });
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  it("starts with no toasts", () => {
    expect(useToastStore.getState().toasts).toEqual([]);
  });

  it("pushes a toast with a generated id", () => {
    useToastStore.getState().push({ title: "Saved" });

    const toasts = useToastStore.getState().toasts;
    expect(toasts).toHaveLength(1);
    expect(toasts[0]?.title).toBe("Saved");
    expect(toasts[0]?.id).toBeTruthy();
  });

  it("keeps previously pushed toasts when pushing a new one", () => {
    useToastStore.getState().push({ title: "First" });
    useToastStore.getState().push({ title: "Second" });

    expect(useToastStore.getState().toasts.map((t) => t.title)).toEqual(["First", "Second"]);
  });

  it("dismisses a toast by id", () => {
    useToastStore.getState().push({ title: "Removable" });
    const toasts = useToastStore.getState().toasts;
    const toast = toasts[0];
    if (!toast) throw new Error("expected a toast to have been pushed");

    useToastStore.getState().dismiss(toast.id);

    expect(useToastStore.getState().toasts).toEqual([]);
  });

  it("auto-dismisses a toast after TOAST_DURATION_MS", () => {
    useToastStore.getState().push({ title: "Auto" });
    expect(useToastStore.getState().toasts).toHaveLength(1);

    vi.advanceTimersByTime(TOAST_DURATION_MS);

    expect(useToastStore.getState().toasts).toEqual([]);
  });

  it("does not dismiss a toast before TOAST_DURATION_MS has elapsed", () => {
    useToastStore.getState().push({ title: "Auto" });

    vi.advanceTimersByTime(TOAST_DURATION_MS - 1);

    expect(useToastStore.getState().toasts).toHaveLength(1);
  });

  it("caps the number of visible toasts, dropping the oldest first", () => {
    for (let i = 0; i < TOAST_LIMIT + 2; i++) {
      useToastStore.getState().push({ title: `Toast ${i}` });
    }

    const toasts = useToastStore.getState().toasts;
    expect(toasts).toHaveLength(TOAST_LIMIT);
    expect(toasts.map((t) => t.title)).toEqual([
      "Toast 2",
      "Toast 3",
      "Toast 4",
      "Toast 5",
      "Toast 6",
    ]);
  });

  it("merges a duplicate consecutive push into the existing toast instead of stacking", () => {
    useToastStore.getState().push({ title: "Network error", variant: "destructive" });
    useToastStore.getState().push({ title: "Network error", variant: "destructive" });

    expect(useToastStore.getState().toasts).toHaveLength(1);
  });

  it("resets the auto-dismiss timer when a duplicate push arrives", () => {
    useToastStore.getState().push({ title: "Network error", variant: "destructive" });

    vi.advanceTimersByTime(TOAST_DURATION_MS - 1);
    useToastStore.getState().push({ title: "Network error", variant: "destructive" });
    vi.advanceTimersByTime(TOAST_DURATION_MS - 1);

    expect(useToastStore.getState().toasts).toHaveLength(1);

    vi.advanceTimersByTime(1);

    expect(useToastStore.getState().toasts).toEqual([]);
  });

  it("does not merge pushes with a different title or variant", () => {
    useToastStore.getState().push({ title: "Network error", variant: "destructive" });
    useToastStore.getState().push({ title: "Network error" });

    expect(useToastStore.getState().toasts).toHaveLength(2);
  });
});
