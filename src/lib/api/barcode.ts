import { Format, scan } from "@tauri-apps/plugin-barcode-scanner";

// TODO(#16): `tauri-plugin-barcode-scanner` はiOS/Android専用で、カメラの利用許可は
// OS側のマニフェスト（Info.plist の NSCameraUsageDescription、AndroidManifest.xml の
// android.permission.CAMERA）に宣言する必要がある。このリポジトリはまだ
// `pnpm tauri android init` / `pnpm tauri ios init` を実行しておらず `src-tauri/gen/`
// が無いため、宣言先のファイル自体が存在しない。宣言すべき内容は
// `docs/recipes/mobile-permissions.md` にまとめてあるので、モバイルプロジェクトを
// 生成したらそこに従って追加し、実機・シミュレータでの動作確認を行う。

/**
 * #14: バーコードをスキャンしてISBNを取得する。ISBNのバーコードはEAN-13の形式のため、
 * `formats` をEAN-13だけに絞り、書籍以外のバーコードに反応しないようにする。
 */
export async function scanIsbn(): Promise<string> {
  const result = await scan({ windowed: false, formats: [Format.EAN13] });
  return result.content;
}
