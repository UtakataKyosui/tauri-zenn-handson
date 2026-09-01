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
