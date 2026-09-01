import { mockCommand } from "@/test/mocks/tauri";
import { describe, expect, it } from "vitest";
import { greet } from "./greeting";

describe("greet", () => {
  it("returns the message from the Rust command", async () => {
    mockCommand("greet", ({ name }) => `Hello, ${name}! (call #1)`);

    await expect(greet("Ada")).resolves.toBe("Hello, Ada! (call #1)");
  });

  it("throws a readable error when the command rejects with a core error", async () => {
    mockCommand("greet", () => {
      throw { kind: "Core", message: { kind: "InvalidInput", message: "name must not be empty" } };
    });

    await expect(greet("")).rejects.toThrow("InvalidInput: name must not be empty");
  });
});
