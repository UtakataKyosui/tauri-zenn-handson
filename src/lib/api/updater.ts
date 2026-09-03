import { commands } from "@/lib/bindings";

/**
 * APP-08: 自動アップデート。デスクトップ専用（`src-tauri/src/commands/updater.rs` が
 * `#[cfg(desktop)]`）。モバイルでは `commands.checkForUpdate` 自体が存在しないため、
 * 呼び出し側は `isDesktop()`（`src/lib/platform.ts`）で出し分けること。
 */
export async function checkForUpdate() {
  const result = await commands.checkForUpdate();
  if (result.status === "error") throw new Error(JSON.stringify(result.error));
  return result.data;
}

export async function installUpdate(): Promise<void> {
  const result = await commands.installUpdate();
  if (result.status === "error") throw new Error(JSON.stringify(result.error));
}

/**
 * ダウンロード済みのアップデートを反映するため、アプリを再起動する。
 * `installUpdate` の完了後、利用者が明示的に選んだタイミングで呼び出すこと
 * （自動で即座に入れ替えない。Issue #18）。呼び出しに成功すると
 * プロセスが終了するため戻り値には意味がない。
 */
export async function relaunchApp(): Promise<void> {
  await commands.relaunchApp();
}
