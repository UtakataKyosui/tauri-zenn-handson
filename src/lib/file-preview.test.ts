import { describe, expect, it } from "vitest";
import { isImagePath, mimeTypeForImagePath } from "./file-preview";

describe("isImagePath", () => {
  it("returns true for known image extensions", () => {
    expect(isImagePath("/tmp/photo.png")).toBe(true);
    expect(isImagePath("/tmp/photo.JPG")).toBe(true);
  });

  it("returns false for text extensions", () => {
    expect(isImagePath("/tmp/notes.txt")).toBe(false);
  });

  it("returns false when there is no extension", () => {
    expect(isImagePath("/tmp/noext")).toBe(false);
  });
});

describe("mimeTypeForImagePath", () => {
  it("maps known extensions to their mime type", () => {
    expect(mimeTypeForImagePath("/tmp/a.png")).toBe("image/png");
    expect(mimeTypeForImagePath("/tmp/a.jpeg")).toBe("image/jpeg");
  });

  it("falls back to octet-stream for unknown extensions", () => {
    expect(mimeTypeForImagePath("/tmp/a.bin")).toBe("application/octet-stream");
  });
});
