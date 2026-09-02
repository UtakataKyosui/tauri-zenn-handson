import { mockCommand } from "@/test/mocks/tauri";
import { describe, expect, it } from "vitest";
import { lookupByIsbn } from "./isbn";

describe("lookupByIsbn", () => {
  it("returns the title and author found by the backend", async () => {
    mockCommand("lookup_isbn", () => ({
      title: "リーダブルコード",
      author: "Dustin Boswell",
    }));

    await expect(lookupByIsbn("9784873115658")).resolves.toEqual({
      title: "リーダブルコード",
      author: "Dustin Boswell",
    });
  });

  it("returns empty fields when the isbn is not found", async () => {
    mockCommand("lookup_isbn", () => ({ title: "", author: "" }));

    await expect(lookupByIsbn("0000000000000")).resolves.toEqual({
      title: "",
      author: "",
    });
  });

  it("throws when the backend command fails", async () => {
    mockCommand("lookup_isbn", () => {
      throw { kind: "Network", message: "timed out" };
    });

    await expect(lookupByIsbn("9784873115658")).rejects.toThrow();
  });
});
