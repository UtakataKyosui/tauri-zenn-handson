import { buildNote } from "@/test/factories/note";
import { mockCommand } from "@/test/mocks/tauri";
import { describe, expect, it } from "vitest";
import { createNote, deleteNote, listNotes } from "./notes";

describe("notes api", () => {
  it("lists notes returned by the command", async () => {
    const note = buildNote({ id: 2, title: "From backend" });
    mockCommand("list_notes", () => [note]);

    await expect(listNotes()).resolves.toEqual([note]);
  });

  it("creates a note with the given title and body", async () => {
    mockCommand("create_note", ({ title, body }) =>
      buildNote({ title: title as string, body: body as string }),
    );

    const note = await createNote("Groceries", "milk, eggs");

    expect(note.title).toBe("Groceries");
    expect(note.body).toBe("milk, eggs");
  });

  it("throws when deleting a note the backend rejects", async () => {
    mockCommand("delete_note", () => {
      throw { kind: "Core", message: { kind: "NotFound", message: "note 1" } };
    });

    await expect(deleteNote(1)).rejects.toThrow();
  });
});
