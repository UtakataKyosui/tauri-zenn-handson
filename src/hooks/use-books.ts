import { createBook, deleteBook, getBook, listBooks, updateBook } from "@/lib/api/books";
import type { NewBook } from "@/lib/bindings";
import { queryOptions, useMutation, useQueryClient } from "@tanstack/react-query";

/**
 * FE-04: Rust 呼び出しは TanStack Query で一元化する規約のサンプル（`use-greeting.ts` 参照、#9）。
 * `bookListQuery`/`bookQuery` はルートの `loader` から `ensureQueryData` で先読みできるよう
 * `queryOptions` として公開する。ミューテーションは成功時に該当キーを invalidate し、
 * 再取得を通じて画面を最新化する。
 */

const bookKeys = {
  list: ["books"] as const,
  detail: (id: number) => ["books", id] as const,
};

export const bookListQuery = () =>
  queryOptions({
    queryKey: bookKeys.list,
    queryFn: listBooks,
  });

export const bookQuery = (id: number) =>
  queryOptions({
    queryKey: bookKeys.detail(id),
    queryFn: () => getBook(id),
  });

export function useCreateBook() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: NewBook) => createBook(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: bookKeys.list });
    },
  });
}

export function useUpdateBook(id: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: NewBook) => updateBook(id, input),
    onSuccess: (book) => {
      queryClient.setQueryData(bookKeys.detail(id), book);
      queryClient.invalidateQueries({ queryKey: bookKeys.list });
    },
  });
}

export function useDeleteBook() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteBook(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: bookKeys.list });
    },
  });
}
