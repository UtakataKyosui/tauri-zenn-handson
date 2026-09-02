import { BookForm } from "@/components/book-form";
import { useCreateBook } from "@/hooks/use-books";
import type { NewBook } from "@/lib/bindings";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

export const Route = createFileRoute("/books/new")({
  component: BookNew,
});

const defaultValues: NewBook = {
  title: "",
  author: "",
  status: "unread",
  note: "",
  genre: "other",
  isbn: "",
};

// #10: 登録フォーム本体。保存に成功したら詳細画面へ遷移する。
export function BookNew() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const createBook = useCreateBook();

  return (
    <div className="mx-auto flex max-w-md flex-col gap-4">
      <h1 className="text-2xl font-semibold">{t("books.new.title")}</h1>
      <BookForm
        defaultValues={defaultValues}
        submitLabel={t("books.form.submit")}
        onSubmit={async (value) => {
          const book = await createBook.mutateAsync(value);
          navigate({ to: "/books/$bookId", params: { bookId: String(book.id) } });
        }}
      />
    </div>
  );
}
