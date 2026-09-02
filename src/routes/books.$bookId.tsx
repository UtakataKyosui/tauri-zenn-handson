import { bookQuery } from "@/hooks/use-books";
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
  const { data: book } = useSuspenseQuery(bookQuery(Number(bookId)));

  return (
    <div className="mx-auto flex max-w-md flex-col gap-4">
      <h1 className="text-2xl font-semibold">{t("books.detail.title")}</h1>
      <article className="flex flex-col gap-2">
        <h2 className="text-lg font-medium">{book.title}</h2>
        <p className="text-sm text-muted-foreground">{book.author}</p>
        {book.note && <p className="text-sm">{book.note}</p>}
      </article>
    </div>
  );
}
