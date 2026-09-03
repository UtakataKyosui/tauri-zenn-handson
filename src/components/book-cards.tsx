import type { Book } from "@/lib/bindings";
import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

/**
 * #16: 一覧画面をモバイル幅（`useIsNarrow`）で表示するときのカード形式。
 * `index.tsx`の`Table`と同じ`Book`型・同じ絞り込み済みデータをそのまま受け取り、
 * 新規のAPI呼び出しは行わない。表の列（題名・著者・状態・ジャンル・登録日）を
 * そのままカード内の項目に対応させる。タップ領域を広く取るため、カード全体を
 * `Link`にする。
 */
export function BookCards({
  books,
  genreLabel,
}: {
  books: Book[];
  genreLabel: Record<Book["genre"], string>;
}) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-3">
      {books.map((book) => (
        <Link
          key={book.id}
          to="/books/$bookId"
          params={{ bookId: String(book.id) }}
          className="flex flex-col gap-1 rounded-lg border border-border bg-card p-4 text-card-foreground [&.active]:border-primary"
        >
          <span className="font-medium">{book.title}</span>
          <span className="text-sm text-muted-foreground">{book.author}</span>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
            <span>{t(`books.status.${book.status}`)}</span>
            <span>{genreLabel[book.genre]}</span>
            <span>{new Date(book.created_at).toLocaleDateString()}</span>
          </div>
        </Link>
      ))}
    </div>
  );
}
