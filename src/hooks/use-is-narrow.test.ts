import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useIsNarrow } from "./use-is-narrow";

function mockMatchMedia(matches: boolean) {
  const listeners = new Set<(e: MediaQueryListEvent) => void>();
  const mql = {
    matches,
    media: "(max-width: 640px)",
    addEventListener: (_: string, cb: (e: MediaQueryListEvent) => void) => listeners.add(cb),
    removeEventListener: (_: string, cb: (e: MediaQueryListEvent) => void) => listeners.delete(cb),
  } as unknown as MediaQueryList;
  vi.stubGlobal("matchMedia", vi.fn().mockReturnValue(mql));
  return { mql, listeners };
}

describe("useIsNarrow", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("画面幅が640px以下のとき true を返す", () => {
    mockMatchMedia(true);

    const { result } = renderHook(() => useIsNarrow());

    expect(result.current).toBe(true);
  });

  it("画面幅が640pxを超えるとき false を返す", () => {
    mockMatchMedia(false);

    const { result } = renderHook(() => useIsNarrow());

    expect(result.current).toBe(false);
  });

  it("メディアクエリの変化を購読して値を更新する", () => {
    const { mql, listeners } = mockMatchMedia(false);

    const { result } = renderHook(() => useIsNarrow());
    expect(result.current).toBe(false);

    act(() => {
      const changed = { ...mql, matches: true } as unknown as MediaQueryListEvent;
      for (const cb of listeners) cb(changed);
    });

    expect(result.current).toBe(true);
  });
});
