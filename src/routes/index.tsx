import { Link, createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

export const Route = createFileRoute("/")({
  component: BookList,
});

// RT-08: 画面遷移の骨組みのみを実装する回。永続化されたデータは扱わず、
// 仮データをそのまま表示する。実データとの接続は #9（TanStack Query）以降で行う。
const sampleBooks = [
  { id: 1, title: "リーダブルコード", author: "Dustin Boswell" },
  { id: 2, title: "達人プログラマー", author: "David Thomas" },
];

function BookList() {
  const { t } = useTranslation();

  return (
    <div className="mx-auto flex max-w-md flex-col gap-4">
      <h1 className="text-2xl font-semibold">{t("books.list.title")}</h1>
      <ul className="flex flex-col gap-2">
        {sampleBooks.map((book) => (
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
    </div>
  );
}
