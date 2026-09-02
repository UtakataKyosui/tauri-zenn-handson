import { BookForm } from "@/components/book-form";
import { Button } from "@/components/ui/button";
import { bookQuery, useDeleteBook, useUpdateBook } from "@/hooks/use-books";
import type { NewBook } from "@/lib/bindings";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { confirm } from "@tauri-apps/plugin-dialog";
import { useState } from "react";
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
  const [confirming, setConfirming] = useState(false);

  const defaultValues: NewBook = {
    title: book.title,
    author: book.author,
    status: book.status,
    note: book.note,
    genre: book.genre,
  };

  // #11: 削除の確認は Tauri のダイアログプラグインを使う。`confirm()` は内部で
  // `message` コマンドを呼ぶため、必要な権限は `dialog:allow-confirm` ではなく
  // `dialog:allow-message`（`allow-confirm` は v3 で削除予定のエイリアス）。
  const handleDelete = async () => {
    setConfirming(true);
    try {
      const confirmed = await confirm(t("books.detail.deleteConfirm", { title: book.title }));
      if (!confirmed) return;
      await deleteBook.mutateAsync(id);
      navigate({ to: "/" });
    } finally {
      setConfirming(false);
    }
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
        disabled={confirming || deleteBook.isPending}
      >
        {deleteBook.isPending ? t("books.detail.deleting") : t("books.detail.delete")}
      </Button>
    </div>
  );
}
