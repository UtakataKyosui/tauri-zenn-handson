export type UpdaterStatus =
  | { kind: "idle" }
  | { kind: "checking" }
  | { kind: "upToDate" }
  | { kind: "available"; version: string }
  | { kind: "installing" }
  // #18: ダウンロード・適用は終わったが、再起動はまだ利用者が選んでいない状態。
  // 自動で即座に入れ替えないための中間状態（Issue #18）。
  | { kind: "installed"; version: string }
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
