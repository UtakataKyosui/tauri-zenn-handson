export type UpdaterStatus =
  | { kind: "idle" }
  | { kind: "checking" }
  | { kind: "upToDate" }
  | { kind: "available"; version: string }
  | { kind: "failed"; message: string };

/**
 * checkForUpdate の結果を UpdaterStatus へ変換する。「未確認」(idle) と
 * 「確認したが更新なし」(upToDate) を区別するため、呼び出し側で常に
 * checking → (upToDate | available) の順に遷移させる（Issue #36）。
 */
export function toUpdaterStatus(info: {
  available: boolean;
  version: string | null;
}): UpdaterStatus {
  return info.available && info.version
    ? { kind: "available", version: info.version }
    : { kind: "upToDate" };
}
