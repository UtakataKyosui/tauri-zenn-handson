import type { Book } from "@/lib/bindings";

/**
 * QA-13: `buildNote` と同じテストデータファクトリの規約（docs/testing.md §8）。
 */
export function buildBook(overrides: Partial<Book> = {}): Book {
  return {
    id: 1,
    title: "Sample book",
    author: "Sample author",
    status: "unread",
    note: "",
    genre: "other",
    created_at: "2024-01-01T00:00:00Z",
    ...overrides,
  };
}
