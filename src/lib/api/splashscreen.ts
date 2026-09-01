import { commands } from "@/lib/bindings";

/**
 * `bindings.ts` を直接呼ばず、ここで一段ラップする（docs/testing.md §3）。
 * Tauri 外（ブラウザプレビュー等）で呼ばれた場合は呼び出し側で無視できるよう例外を投げる。
 */
export async function closeSplashscreen(): Promise<void> {
  const result = await commands.closeSplashscreen();
  if (result.status === "error") {
    throw new Error(JSON.stringify(result.error));
  }
}
