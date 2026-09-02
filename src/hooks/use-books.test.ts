import { useToastStore } from "@/stores/toast-store";
import { buildBook } from "@/test/factories/book";
import { mockCommand } from "@/test/mocks/tauri";
import { QueryClient, QueryClientProvider, useQuery } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { type ReactNode, createElement } from "react";
import { beforeEach, describe, expect, it } from "vitest";
import { bookListQuery, bookQuery, useCreateBook, useDeleteBook, useUpdateBook } from "./use-books";

beforeEach(() => {
  useToastStore.setState({ toasts: [] });
});

function wrapper({ children }: { children: ReactNode }) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return createElement(QueryClientProvider, { client: queryClient }, children);
}

describe("bookListQuery", () => {
  it("resolves the book list returned by the command", async () => {
    const book = buildBook({ id: 1, title: "Readable Code" });
    mockCommand("list_books", () => [book]);

    const { result } = renderHook(() => useQuery(bookListQuery()), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([book]);
  });

  it("surfaces an error when the command rejects", async () => {
    mockCommand("list_books", () => {
      throw { kind: "Core", message: { kind: "Internal" } };
    });

    const { result } = renderHook(() => useQuery(bookListQuery()), { wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toBeInstanceOf(Error);
  });
});

describe("bookQuery", () => {
  it("resolves a single book by id", async () => {
    const book = buildBook({ id: 5, title: "Refactoring" });
    mockCommand("get_book", () => book);

    const { result } = renderHook(() => useQuery(bookQuery(5)), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(book);
  });
});

describe("useCreateBook", () => {
  it("creates a book and invalidates the list", async () => {
    const book = buildBook({ id: 9, title: "New book" });
    mockCommand("create_book", () => book);

    const { result } = renderHook(() => useCreateBook(), { wrapper });
    result.current.mutate({
      title: "New book",
      author: "Someone",
      status: "unread",
      note: "",
      genre: "other",
      isbn: "",
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(book);
  });

  it("pushes a destructive toast when the command fails", async () => {
    mockCommand("create_book", () => {
      throw { kind: "Core", message: { kind: "Internal" } };
    });

    const { result } = renderHook(() => useCreateBook(), { wrapper });
    result.current.mutate({
      title: "New book",
      author: "Someone",
      status: "unread",
      note: "",
      genre: "other",
      isbn: "",
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(useToastStore.getState().toasts.some((toast) => toast.variant === "destructive")).toBe(
      true,
    );
  });
});

describe("useUpdateBook", () => {
  it("updates a book and reports success", async () => {
    const book = buildBook({ id: 2, status: "finished" });
    mockCommand("update_book", () => book);

    const { result } = renderHook(() => useUpdateBook(2), { wrapper });
    result.current.mutate({
      title: book.title,
      author: book.author,
      status: "finished",
      note: "",
      genre: book.genre,
      isbn: book.isbn,
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.status).toBe("finished");
  });

  it("pushes a destructive toast when the command fails", async () => {
    mockCommand("update_book", () => {
      throw { kind: "Core", message: { kind: "Internal" } };
    });

    const { result } = renderHook(() => useUpdateBook(2), { wrapper });
    result.current.mutate({
      title: "Some book",
      author: "Someone",
      status: "unread",
      note: "",
      genre: "other",
      isbn: "",
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(useToastStore.getState().toasts.some((toast) => toast.variant === "destructive")).toBe(
      true,
    );
  });
});

describe("useDeleteBook", () => {
  it("deletes a book by id", async () => {
    mockCommand("delete_book", () => null);

    const { result } = renderHook(() => useDeleteBook(), { wrapper });
    result.current.mutate(1);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });

  it("pushes a destructive toast when the command fails", async () => {
    mockCommand("delete_book", () => {
      throw { kind: "Core", message: { kind: "Internal" } };
    });

    const { result } = renderHook(() => useDeleteBook(), { wrapper });
    result.current.mutate(1);

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(useToastStore.getState().toasts.some((toast) => toast.variant === "destructive")).toBe(
      true,
    );
  });
});
