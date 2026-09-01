import { onOpenUrl } from "@tauri-apps/plugin-deep-link";
import { useEffect } from "react";

// tauri.conf.json の plugins."deep-link".schemes と一致させること。
const EXPECTED_SCHEME = "tauri-app-template:";

/**
 * APP-09: ディープリンク（カスタム URL スキーム `tauri-app-template://`）。
 * OAuth コールバック等を受けるための土台。実際の処理（トークン交換など）を追加する場合は
 * ここでパースして `src/lib/api/**` 経由でコマンドに渡す。
 *
 * 呼び出し元に渡す前にスキームを検証する（レビュー観点 §1「外部から受け取った URL・パスの
 * 検証があるか」）。想定外のスキームは無視し、ペイロード（ホスト・パス・クエリ）自体の
 * 検証は用途ごとに呼び出し元で行うこと。
 */
export function useDeepLink(onUrl: (url: string) => void) {
  useEffect(() => {
    const unlisten = onOpenUrl((urls) => {
      for (const url of urls) {
        let parsed: URL;
        try {
          parsed = new URL(url);
        } catch {
          continue;
        }
        if (parsed.protocol !== EXPECTED_SCHEME) continue;
        onUrl(url);
      }
    });
    return () => {
      unlisten.then((f) => f());
    };
  }, [onUrl]);
}
