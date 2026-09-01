import { type Note, commands } from "@/lib/bindings";

export type { Note };

export async function listNotes(): Promise<Note[]> {
  const result = await commands.listNotes();
  if (result.status === "error") throw new Error(JSON.stringify(result.error));
  return result.data;
}

export async function createNote(title: string, body: string): Promise<Note> {
  const result = await commands.createNote(title, body);
  if (result.status === "error") throw new Error(JSON.stringify(result.error));
  return result.data;
}

export async function deleteNote(id: number): Promise<void> {
  const result = await commands.deleteNote(id);
  if (result.status === "error") throw new Error(JSON.stringify(result.error));
}
