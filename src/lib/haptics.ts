import { isMobile } from "@/lib/platform";
import { vibrate } from "@tauri-apps/plugin-haptics";

/**
 * #14: スキャン登録が完了したことを振動で伝える。デスクトップには振動デバイスが無いため
 * `isMobile()` で明示的に絞る（`demo.tsx` の `isDesktop()` と同じ判定パターン）。
 * 振動に失敗しても登録処理自体は継続する（ハプティクスは補助的な合図のため）。
 */
export async function notifyRegistrationHaptic(): Promise<void> {
  if (!isMobile()) return;
  try {
    await vibrate(200);
  } catch {
    // 振動デバイスが無い・権限が無い等の失敗は無視する。
  }
}
