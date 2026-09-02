import { bookListQuery } from "@/hooks/use-books";
import { useQuery } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

export const Route = createFileRoute("/")({
  component: BookList,
});

// #9: 仮データ（#8）を TanStack Query 経由の実データ取得に置き換える。
export function BookList() {
  const { t } = useTranslation();
  const { data: books, isPending, error } = useQuery(bookListQuery());

  return (
    <div className="mx-auto flex max-w-md flex-col gap-4">
      <h1 className="text-2xl font-semibold">{t("books.list.title")}</h1>
      {isPending ? (
        <p className="text-sm text-muted-foreground">{t("books.list.loading")}</p>
      ) : error ? (
        <p className="text-sm text-destructive">
          {t("books.list.error", { message: error.message })}
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {books.map((book) => (
            <li key={book.id} className="flex items-center justify-between text-sm">
              <Link
                to="/books/$bookId"
                params={{ bookId: String(book.id) }}
                className="font-medium [&.active]:text-primary"
              >
                {book.title}
              </Link>
              <span className="text-muted-foreground">{book.author}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
