# ストア申請の前提（参考情報）

このテンプレート・CI がカバーするのは成果物（インストーラ / APK）の生成までで、
ストアへの申請作業そのものはスコープ外（`docs/requirements.md` §1）。申請時に必要になる
前提だけをここにまとめる。

## Microsoft Store

- Partner Center アカウント（法人 or 個人、審査あり）
- MSIX パッケージが必要な場合がある（`tauri.conf.json` の `bundle.targets` に `msix` を追加）

## Mac App Store

- Apple Developer Program（`docs/recipes/signing.md` §2 と同じアカウント）
- サンドボックス対応（entitlements の見直しが要る場合がある）
- App Store Connect でのメタデータ登録

## Google Play

- Google Play Console アカウント（登録料が一度だけ要る）
- AAB（Android App Bundle）形式での提出が必須
  （現在の CI-06 は APK のみを生成。AAB が要る場合は `pnpm tauri android build --aab` を追加する）
- Play App Signing の設定（アップロード鍵と配信鍵を分離する運用が推奨）

## 共通の注意

- バージョン番号の一意性（各ストアの採番規則を CI-08 の自動バージョニングと整合させる）
- プライバシーポリシーの URL（DB・ネットワーク通信を使う場合はほぼ必須）
