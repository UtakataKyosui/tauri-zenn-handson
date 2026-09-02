-- #14: ISBNが分かっている本どうしの重複登録を防ぐ。`WHERE isbn != ''` を付けることで、
-- ISBN未入力の本を何冊登録しても空文字どうしの重複とはみなさない。
CREATE UNIQUE INDEX idx_books_isbn ON books (isbn) WHERE isbn != '';
