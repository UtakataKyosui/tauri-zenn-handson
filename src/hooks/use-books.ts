import { createBook, deleteBook, getBook, listBooks, updateBook } from "@/lib/api/books";
import type { NewBook } from "@/lib/bindings";
import { useToastStore } from "@/stores/toast-store";
import { queryOptions, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

/**
 * FE-04: Rust 呼び出しは TanStack Query で一元化する規約のサンプル（`use-greeting.ts` 参照、#9）。
 * `bookListQuery`/`bookQuery` はルートの `loader` から `ensureQueryData` で先読みできるよう
 * `queryOptions` として公開する。ミューテーションは成功時に該当キーを invalidate し、
 * 再取得を通じて画面を最新化する。
 *
 * #13: 一覧取得（query）の失敗は画面を開いた直後から起きるため、呼び出し側
 * （`index.tsx`）がその場に留めて表示する。一方ミューテーションの失敗は
 * 登録・更新・削除という利用者の操作の結果を伝えるものなので、見落とされにくい
 * トースト通知で知らせる。バリデーションで防げる入力ミス（#10）とは異なり、
 * ここに来るのは利用者が直しようのない失敗なので、フォームには残さず通知だけで済ます。
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
  const { t } = useTranslation();
  const pushToast = useToastStore((s) => s.push);
  return useMutation({
    mutationFn: (input: NewBook) => createBook(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: bookKeys.list });
    },
    onError: (error) => {
      pushToast({
        title: t("books.form.saveError", { message: error.message }),
        variant: "destructive",
      });
    },
  });
}

export function useUpdateBook(id: number) {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const pushToast = useToastStore((s) => s.push);
  return useMutation({
    mutationFn: (input: NewBook) => updateBook(id, input),
    onSuccess: (book) => {
      queryClient.setQueryData(bookKeys.detail(id), book);
      queryClient.invalidateQueries({ queryKey: bookKeys.list });
    },
    onError: (error) => {
      pushToast({
        title: t("books.form.saveError", { message: error.message }),
        variant: "destructive",
      });
    },
  });
}

export function useDeleteBook() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const pushToast = useToastStore((s) => s.push);
  return useMutation({
    mutationFn: (id: number) => deleteBook(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: bookKeys.list });
    },
    onError: (error) => {
      pushToast({
        title: t("books.detail.deleteError", { message: error.message }),
        variant: "destructive",
      });
    },
  });
}
