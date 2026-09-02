import { type Book, type NewBook, commands } from "@/lib/bindings";

export type { Book, NewBook };

export async function listBooks(): Promise<Book[]> {
  const result = await commands.listBooks();
  if (result.status === "error") throw new Error(JSON.stringify(result.error));
  return result.data;
}

export async function getBook(id: number): Promise<Book> {
  const result = await commands.getBook(id);
  if (result.status === "error") throw new Error(JSON.stringify(result.error));
  return result.data;
}

export async function createBook(input: NewBook): Promise<Book> {
  const result = await commands.createBook(input);
  if (result.status === "error") throw new Error(JSON.stringify(result.error));
  return result.data;
}

export async function updateBook(id: number, input: NewBook): Promise<Book> {
  const result = await commands.updateBook(id, input);
  if (result.status === "error") throw new Error(JSON.stringify(result.error));
  return result.data;
}

export async function deleteBook(id: number): Promise<void> {
  const result = await commands.deleteBook(id);
  if (result.status === "error") throw new Error(JSON.stringify(result.error));
}

/** #12: 全ての本を CSV にして `path` へ書き出す。戻り値は書き出した件数。 */
export async function exportBooks(path: string): Promise<number> {
  const result = await commands.exportBooks(path);
  if (result.status === "error") throw new Error(JSON.stringify(result.error));
  return result.data;
}
