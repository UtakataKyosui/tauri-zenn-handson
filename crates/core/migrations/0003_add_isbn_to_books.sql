-- #14: バーコードで読み取ったISBNを保存する列を足す。ISBNが分かっている本だけが対象で、
-- 分からない本は空文字のまま登録できるようにする（NOT NULL DEFAULT ''）。
ALTER TABLE books ADD COLUMN isbn TEXT NOT NULL DEFAULT '';
