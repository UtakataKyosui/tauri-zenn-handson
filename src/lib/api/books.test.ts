import type { NewBook } from "@/lib/bindings";
import { buildBook } from "@/test/factories/book";
import { mockCommand } from "@/test/mocks/tauri";
import { describe, expect, it } from "vitest";
import { createBook, deleteBook, getBook, listBooks, updateBook } from "./books";

describe("books api", () => {
  it("lists books returned by the command", async () => {
    const book = buildBook({ id: 2, title: "From backend" });
    mockCommand("list_books", () => [book]);

    await expect(listBooks()).resolves.toEqual([book]);
  });

  it("gets a single book by id", async () => {
    const book = buildBook({ id: 3, title: "Readable Code" });
    mockCommand("get_book", () => book);

    await expect(getBook(3)).resolves.toEqual(book);
  });

  it("creates a book with the given input", async () => {
    mockCommand("create_book", (args) => buildBook(args.input as NewBook));

    const book = await createBook({
      title: "Refactoring",
      author: "Martin Fowler",
      status: "unread",
      note: "",
      genre: "technology",
    });

    expect(book.title).toBe("Refactoring");
    expect(book.author).toBe("Martin Fowler");
  });

  it("updates a book with the given input", async () => {
    mockCommand("update_book", (args) =>
      buildBook({ id: args.id as number, ...(args.input as NewBook) }),
    );

    const book = await updateBook(4, {
      title: "Refactoring (2nd ed.)",
      author: "Martin Fowler",
      status: "finished",
      note: "読了",
      genre: "technology",
    });

    expect(book.id).toBe(4);
    expect(book.status).toBe("finished");
  });

  it("throws when deleting a book the backend rejects", async () => {
    mockCommand("delete_book", () => {
      throw { kind: "Core", message: { kind: "NotFound", message: "book 1" } };
    });

    await expect(deleteBook(1)).rejects.toThrow();
  });
});
