# アイコン一式の生成手順（GEN-07）

正本は 1 枚の元画像（`src-tauri/icons/icon.png`。1024x1024 以上の正方形 PNG を推奨）。
そこから各プラットフォーム向けのアイコン一式を Tauri CLI が生成する。

```sh
pnpm tauri icon path/to/source-icon.png
```

生成される主なファイル（`src-tauri/icons/`）。

- `32x32.png` / `128x128.png` / `128x128@2x.png` — Linux / 各種 UI
- `icon.icns` — macOS
- `icon.ico` — Windows
- `android/` 配下の各解像度 — Android（`tauri android init` 済みの場合）
- `ios/` 配下の各解像度 — iOS（`tauri ios init` 済みの場合）

## このテンプレート同梱のプレースホルダについて

`src-tauri/icons/` には単色のプレースホルダ画像が同梱されている（開発用にとりあえず
ビルドが通る状態にするためのもの）。実際のプロジェクトでは `docs/setup.md` の手順に沿って
必ず差し替えること。

`tauri.conf.json` の `bundle.icon` はこのディレクトリの生成物を参照しているため、
`pnpm tauri icon` を実行するだけで反映される（パスの変更は不要）。
