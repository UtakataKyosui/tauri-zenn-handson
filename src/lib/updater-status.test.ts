import { describe, expect, it } from "vitest";
import { toUpdaterStatus } from "./updater-status";

describe("toUpdaterStatus", () => {
  it("returns upToDate when no update is available", () => {
    expect(toUpdaterStatus({ available: false, version: null })).toEqual({ kind: "upToDate" });
  });

  it("returns available with the version when an update is available", () => {
    expect(toUpdaterStatus({ available: true, version: "1.2.3" })).toEqual({
      kind: "available",
      version: "1.2.3",
    });
  });

  it("falls back to upToDate when available is true but version is missing", () => {
    expect(toUpdaterStatus({ available: true, version: null })).toEqual({ kind: "upToDate" });
  });
});
