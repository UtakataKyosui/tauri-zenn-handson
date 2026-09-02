-- 読書ログ本体のスキーマ（#5）。マイグレーションは追加のみとし、既存カラムの削除・型変更の
-- ような破壊的変更は新しいマイグレーションで移行手順を伴わせて行う（レビュー観点 §2）。
CREATE TABLE books (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    title      TEXT NOT NULL,
    author     TEXT NOT NULL,
    status     TEXT NOT NULL DEFAULT 'unread',
    note       TEXT NOT NULL DEFAULT '',
    genre      TEXT NOT NULL DEFAULT 'other',
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX idx_books_created_at ON books (created_at DESC);
