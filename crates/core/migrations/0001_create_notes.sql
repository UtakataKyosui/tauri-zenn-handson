-- RS-09: サンプルドメイン（notes）のスキーマ。マイグレーションは追加のみとし、
-- 既存カラムの削除・型変更のような破壊的変更は新しいマイグレーションで
-- 移行手順を伴わせて行う（レビュー観点 §2「マイグレーションが既存データを壊さないか」）。
CREATE TABLE notes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    body TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
