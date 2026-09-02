import { describe, expect, it } from "vitest";
import { dirname } from "./path";

describe("dirname", () => {
  it("returns the parent directory for a unix-style path", () => {
    expect(dirname("/tmp/exports/books.csv")).toBe("/tmp/exports");
  });

  it("returns the parent directory for a windows-style path", () => {
    expect(dirname("C:\\Users\\me\\books.csv")).toBe("C:\\Users\\me");
  });

  it("returns an empty string for a bare filename", () => {
    expect(dirname("books.csv")).toBe("");
  });

  it("returns an empty string for a root-level file", () => {
    expect(dirname("/books.csv")).toBe("");
  });
});
