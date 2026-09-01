import { beforeEach, describe, expect, it } from "vitest";
import { useUiStore } from "./ui-store";

describe("useUiStore", () => {
  beforeEach(() => {
    useUiStore.setState({ theme: "system" });
  });

  it("defaults to the system theme", () => {
    expect(useUiStore.getState().theme).toBe("system");
  });

  it("updates the theme when setTheme is called", () => {
    useUiStore.getState().setTheme("dark");

    expect(useUiStore.getState().theme).toBe("dark");
  });
});
