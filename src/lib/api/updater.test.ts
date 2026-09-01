import { mockCommand } from "@/test/mocks/tauri";
import { describe, expect, it } from "vitest";
import { checkForUpdate, installUpdate } from "./updater";

describe("updater api", () => {
  it("reports when no update is available", async () => {
    mockCommand("check_for_update", () => ({ available: false, version: null }));

    await expect(checkForUpdate()).resolves.toEqual({ available: false, version: null });
  });

  it("reports the version when an update is available", async () => {
    mockCommand("check_for_update", () => ({ available: true, version: "1.2.3" }));

    await expect(checkForUpdate()).resolves.toEqual({ available: true, version: "1.2.3" });
  });

  it("throws when checking for updates fails", async () => {
    mockCommand("check_for_update", () => {
      throw { kind: "Core", message: { kind: "Internal", message: "network error" } };
    });

    await expect(checkForUpdate()).rejects.toThrow();
  });

  it("installs an update", async () => {
    mockCommand("install_update", () => null);

    await expect(installUpdate()).resolves.toBeUndefined();
  });

  it("throws when installing an update fails", async () => {
    mockCommand("install_update", () => {
      throw { kind: "Core", message: { kind: "Internal", message: "download failed" } };
    });

    await expect(installUpdate()).rejects.toThrow();
  });
});
