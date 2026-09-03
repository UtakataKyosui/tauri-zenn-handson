# モバイルのOS権限宣言（#16）

`tauri-plugin-barcode-scanner`（カメラ）と`tauri-plugin-notification`（通知）は、
`src-tauri/capabilities/mobile.json`のTauri側権限だけでなく、OS側のマニフェストにも
利用目的の宣言が必要になる。宣言先のファイルは`pnpm tauri android init` /
`pnpm tauri ios init`を実行して`src-tauri/gen/`を生成しないと存在しない。このリポジトリは
まだそれらのコマンドを実行しておらず`gen/`をコミットしていないため、このドキュメントに
宣言すべき内容をまとめておき、生成後にこの内容を転記する。

## iOS: `src-tauri/gen/apple/<name>_iOS/Info.plist`

| キー | 値 | 用途 |
| --- | --- | --- |
| `NSCameraUsageDescription` | 「ISBNバーコードを読み取って本を登録するために使います。」 | `tauri-plugin-barcode-scanner`（`src/lib/api/barcode.ts`の`scanIsbn`） |

通知（`tauri-plugin-notification`）はiOSでは初回送信時にOSが許可ダイアログを出すため、
Info.plistへの事前宣言は不要。

## Android: `src-tauri/gen/android/app/src/main/AndroidManifest.xml`

| `<uses-permission>` | 用途 |
| --- | --- |
| `android.permission.CAMERA` | `tauri-plugin-barcode-scanner` |
| `android.permission.POST_NOTIFICATIONS` | `tauri-plugin-notification`。Android 13（API 33）以降は実行時許可が必須（`isPermissionGranted`/`requestPermission`は`src/routes/demo.tsx`の`NotificationDemo`が既に呼んでいる） |

Tauriのモバイルプラグインは、Cargoの依存先にある各プラグインの`build.rs`が
`AndroidManifest.xml`へ権限を自動注入することが多い。`gen/android`を生成したら、まず
`cargo tauri android build`を一度走らせて実際に注入された内容を確認し、上記が既に含まれて
いれば追記不要。含まれていなければ手動で追加する。

## 生成後にやること

1. `pnpm tauri android init` / `pnpm tauri ios init`を実行し`src-tauri/gen/`を生成する
2. 生成された`AndroidManifest.xml` / `Info.plist`に上記の権限宣言があるか確認し、
   無ければ追加する
3. `src/lib/api/barcode.ts`のTODOコメント（`TODO(#16)`）を、実際に追加した宣言箇所への
   参照に更新する
4. 実機かエミュレータでカメラ・通知の許可ダイアログが出ることを確認する
