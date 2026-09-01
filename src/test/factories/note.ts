import type { Note } from "@/lib/bindings";

/**
 * QA-13: テストデータのファクトリ規約のサンプル。「テストに必要な最小限のデフォルト値」を
 * 返し、個々のテストは差分だけ上書きする（docs/testing.md §8）。
 */
export function buildNote(overrides: Partial<Note> = {}): Note {
  return {
    id: 1,
    title: "Sample note",
    body: "",
    ...overrides,
  };
}
