import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useDefaultSort } from "./use-default-sort";

const { getSettingsStoreMock } = vi.hoisted(() => ({
  getSettingsStoreMock: vi.fn(),
}));

vi.mock("@/lib/settings-store", () => ({
  getSettingsStore: getSettingsStoreMock,
}));

function fakeStore(initial: Record<string, unknown> = {}) {
  const data = { ...initial };
  return {
    get: vi.fn(async (key: string) => data[key]),
    set: vi.fn(async (key: string, value: unknown) => {
      data[key] = value;
    }),
  };
}

describe("useDefaultSort", () => {
  it("starts with the fallback sort before the store resolves", () => {
    getSettingsStoreMock.mockReturnValue(new Promise(() => {}));

    const { result } = renderHook(() => useDefaultSort());

    expect(result.current[0]).toEqual([{ id: "created_at", desc: true }]);
  });

  it("replaces the fallback with the saved sort once the store resolves", async () => {
    const store = fakeStore({ defaultSort: [{ id: "title", desc: false }] });
    getSettingsStoreMock.mockResolvedValue(store);

    const { result } = renderHook(() => useDefaultSort());

    await waitFor(() => {
      expect(result.current[0]).toEqual([{ id: "title", desc: false }]);
    });
  });

  it("persists a new sort to the store after hydration", async () => {
    const store = fakeStore();
    getSettingsStoreMock.mockResolvedValue(store);

    const { result } = renderHook(() => useDefaultSort());

    await waitFor(() => {
      expect(store.get).toHaveBeenCalledWith("defaultSort");
    });

    act(() => {
      result.current[1]([{ id: "author", desc: true }]);
    });

    await waitFor(() => {
      expect(store.set).toHaveBeenCalledWith("defaultSort", [{ id: "author", desc: true }]);
    });
  });

  it("does not throw when the store fails to load", async () => {
    getSettingsStoreMock.mockRejectedValue(new Error("boom"));

    const { result } = renderHook(() => useDefaultSort());

    await waitFor(() => {
      expect(result.current[0]).toEqual([{ id: "created_at", desc: true }]);
    });
  });
});
