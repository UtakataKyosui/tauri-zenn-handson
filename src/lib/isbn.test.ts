import { describe, expect, it } from "vitest";
import { isValidIsbn13 } from "./isbn";

describe("isValidIsbn13", () => {
  it("accepts a valid ISBN-13", () => {
    expect(isValidIsbn13("9784873115658")).toBe(true);
  });

  it("accepts a valid ISBN-13 with hyphens", () => {
    expect(isValidIsbn13("978-4-87311-565-8")).toBe(true);
  });

  it("rejects a wrong check digit", () => {
    expect(isValidIsbn13("9784873115657")).toBe(false);
  });

  it("rejects a string with fewer than 13 digits", () => {
    expect(isValidIsbn13("12345")).toBe(false);
  });

  it("rejects a string with more than 13 digits", () => {
    expect(isValidIsbn13("97848731156588")).toBe(false);
  });

  it("rejects an empty string", () => {
    expect(isValidIsbn13("")).toBe(false);
  });
});
