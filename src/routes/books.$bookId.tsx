import { BookForm } from "@/components/book-form";
import { Button } from "@/components/ui/button";
import { bookQuery, useDeleteBook, useUpdateBook } from "@/hooks/use-books";
import type { NewBook } from "@/lib/bindings";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

// #9: loader で `queryClient.ensureQueryData` を呼び、コンポーネント側は
// `useSuspenseQuery` でキャッシュ済みのデータを同期的に受け取る。
export const Route = createFileRoute("/books/$bookId")({
  loader: ({ context, params }) =>
    context.queryClient.ensureQueryData(bookQuery(Number(params.bookId))),
  component: BookDetail,
});

function BookDetail() {
  const { t } = useTranslation();
  const { bookId } = Route.useParams();
  const navigate = Route.useNavigate();
  const id = Number(bookId);
  const { data: book } = useSuspenseQuery(bookQuery(id));
  const updateBook = useUpdateBook(id);
  const deleteBook = useDeleteBook();

  const defaultValues: NewBook = {
    title: book.title,
    author: book.author,
    status: book.status,
    note: book.note,
    genre: book.genre,
  };

  // #10: 削除の確認は Tauri のダイアログプラグイン（`confirm`）を使う設計が本来の想定だが、
  // 権限（`dialog:allow-confirm`）の追加は #11 の範囲のため、ここでは暫定的に
  // ブラウザ標準の `window.confirm` を使う。
  const handleDelete = async () => {
    if (!window.confirm(t("books.detail.deleteConfirm", { title: book.title }))) return;
    await deleteBook.mutateAsync(id);
    navigate({ to: "/" });
  };

  return (
    <div className="mx-auto flex max-w-md flex-col gap-6">
      <h1 className="text-2xl font-semibold">{t("books.detail.title")}</h1>
      <BookForm
        defaultValues={defaultValues}
        submitLabel={t("books.detail.edit")}
        onSubmit={async (value) => {
          await updateBook.mutateAsync(value);
        }}
      />
      <Button
        type="button"
        variant="destructive"
        onClick={handleDelete}
        disabled={deleteBook.isPending}
      >
        {deleteBook.isPending ? t("books.detail.deleting") : t("books.detail.delete")}
      </Button>
    </div>
  );
}
