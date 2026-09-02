import {
  isPermissionGranted,
  requestPermission,
  sendNotification,
} from "@tauri-apps/plugin-notification";

/**
 * #12: 書き出し成功などの結果をネイティブ通知で知らせる。`demo.tsx` の
 * `NotificationDemo`（APP-02）と同じ許可フローを共有する。許可されなかった場合は
 * 通知を送らないだけで、呼び出し元の処理は止めない（Issue #12 の要件）。
 */
export async function notify(title: string, body: string): Promise<void> {
  let granted = await isPermissionGranted();
  if (!granted) {
    granted = (await requestPermission()) === "granted";
  }
  if (!granted) return;

  sendNotification({ title, body });
}
