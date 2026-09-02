import { type Store, load } from "@tauri-apps/plugin-store";

let storePromise: Promise<Store> | null = null;

/**
 * #15: 利用者ごとの設定を保存するストア。本の記録用SQLite（`app.sqlite`）とは別の
 * `settings.json` に分ける。記録データを書き出したり移したりするときに設定が
 * 混ざらない、設定が壊れても記録データに影響しないため。`autoSave` を有効にして、
 * 値を変えるたびにファイルへ書く。設定の項目は多くないので、書き込みの回数は
 * 問題にならない。
 */
export function getSettingsStore(): Promise<Store> {
  if (!storePromise) {
    storePromise = load("settings.json", { autoSave: true });
  }
  return storePromise;
}
