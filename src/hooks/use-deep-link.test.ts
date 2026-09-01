import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useDeepLink } from "./use-deep-link";

const { onOpenUrlMock } = vi.hoisted(() => ({
  onOpenUrlMock: vi.fn(),
}));

vi.mock("@tauri-apps/plugin-deep-link", () => ({
  onOpenUrl: onOpenUrlMock,
}));

describe("useDeepLink", () => {
  it("forwards a URL matching the expected scheme", async () => {
    const unlisten = vi.fn();
    onOpenUrlMock.mockResolvedValue(unlisten);
    const onUrl = vi.fn();

    renderHook(() => useDeepLink(onUrl));
    const handler = onOpenUrlMock.mock.calls[0]?.[0] as (urls: string[]) => void;

    handler(["tauri-app-template://callback?token=abc"]);

    expect(onUrl).toHaveBeenCalledWith("tauri-app-template://callback?token=abc");
  });

  it("ignores URLs with an unexpected scheme", async () => {
    const unlisten = vi.fn();
    onOpenUrlMock.mockResolvedValue(unlisten);
    const onUrl = vi.fn();

    renderHook(() => useDeepLink(onUrl));
    const handler = onOpenUrlMock.mock.calls[0]?.[0] as (urls: string[]) => void;

    handler(["https://evil.example/phish"]);

    expect(onUrl).not.toHaveBeenCalled();
  });

  it("ignores unparsable URLs without throwing", async () => {
    const unlisten = vi.fn();
    onOpenUrlMock.mockResolvedValue(unlisten);
    const onUrl = vi.fn();

    renderHook(() => useDeepLink(onUrl));
    const handler = onOpenUrlMock.mock.calls[0]?.[0] as (urls: string[]) => void;

    expect(() => handler(["not a url"])).not.toThrow();
    expect(onUrl).not.toHaveBeenCalled();
  });

  it("unlistens on unmount", async () => {
    const unlisten = vi.fn();
    onOpenUrlMock.mockResolvedValue(unlisten);

    const { unmount } = renderHook(() => useDeepLink(vi.fn()));
    await Promise.resolve();
    unmount();
    await Promise.resolve();

    expect(unlisten).toHaveBeenCalled();
  });
});
