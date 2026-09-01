import { mockCommand } from "@/test/mocks/tauri";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { type ReactNode, createElement } from "react";
import { describe, expect, it } from "vitest";
import { useGreet } from "./use-greeting";

function wrapper({ children }: { children: ReactNode }) {
  const queryClient = new QueryClient();
  return createElement(QueryClientProvider, { client: queryClient }, children);
}

describe("useGreet", () => {
  it("resolves with the greeting returned by the Rust command", async () => {
    mockCommand("greet", ({ name }) => `Hello, ${name}!`);

    const { result } = renderHook(() => useGreet(), { wrapper });
    result.current.mutate("Ada");

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toBe("Hello, Ada!");
  });

  it("surfaces an error when the command rejects", async () => {
    mockCommand("greet", () => {
      throw { kind: "Core", message: { kind: "InvalidInput", message: "name must not be empty" } };
    });

    const { result } = renderHook(() => useGreet(), { wrapper });
    result.current.mutate("");

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toBeInstanceOf(Error);
  });
});
