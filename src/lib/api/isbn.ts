import { type BookInfo, commands } from "@/lib/bindings";

export type { BookInfo };

/**
 * #14: ISBNから書名・著者を引く。実際のHTTP通信は `src-tauri` 側の `lookup_isbn`
 * コマンドが行う（`crates/core` は tauri に依存できないため、副作用の境界は
 * コマンド層に置く）。該当するISBNが見つからない場合もエラーにはならず、
 * `title`/`author` が空の `BookInfo` が返る。
 */
export async function lookupByIsbn(isbn: string): Promise<BookInfo> {
  const result = await commands.lookupIsbn(isbn);
  if (result.status === "error") throw new Error(JSON.stringify(result.error));
  return result.data;
}
