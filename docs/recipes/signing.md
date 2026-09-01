# 署名証明書の準備手順（CI-04 / CI-05 / CI-06）

`.github/workflows/release.yml` は証明書・鍵が未設定でもビルド自体は失敗しない
（署名ステップだけがスキップされる。リスク R-3）。実際に署名済みインストーラを配布する
には、以下の GitHub Secrets を登録する。

## 1. アップデータ用の署名鍵（必須。RS-12/CI-05）

```sh
pnpm tauri signer generate -w ~/.tauri/tauri-app-template.key
```

- 生成された公開鍵を `src-tauri/tauri.conf.json` の `plugins.updater.pubkey` に貼り付ける
- 秘密鍵の中身を Secrets `TAURI_SIGNING_PRIVATE_KEY` に登録する
- パスフレーズを設定した場合は `TAURI_SIGNING_PRIVATE_KEY_PASSWORD` にも登録する

これが無いと自動アップデート（APP-08）の署名検証ができない。

## 2. macOS: Developer ID 署名 + 公証（CI-04）

Apple Developer Program（有償）への加入が前提。加入から実際に使えるまで
日数がかかることがあるため、Phase 4 に入る前に状況を確認しておくこと
（`docs/requirements.md` §7 未決事項 3）。

1. Xcode の Developer ID Application 証明書を書き出し、base64 化する
   ```sh
   base64 -i DeveloperIDApplication.p12 | pbcopy
   ```
2. 以下の Secrets を登録する
   - `APPLE_CERTIFICATE`（上記 base64）
   - `APPLE_CERTIFICATE_PASSWORD`
   - `APPLE_SIGNING_IDENTITY`（証明書の Common Name）
   - `APPLE_ID` / `APPLE_PASSWORD`（App 用 Apple ID とアプリ用パスワード）
   - `APPLE_TEAM_ID`

## 3. Windows: コード署名（CI-04）

1. コードサイニング証明書（.pfx）を base64 化する
2. Secrets `WINDOWS_CERTIFICATE`（base64）と `WINDOWS_CERTIFICATE_PASSWORD` を登録する

## 4. Android: APK 署名（CI-06）

1. アップロード用キーストアを生成する
   ```sh
   keytool -genkeypair -v -keystore upload-keystore.jks -keyalg RSA \
     -keysize 2048 -validity 10000 -alias upload
   ```
2. base64 化して Secrets `ANDROID_KEYSTORE_BASE64` に登録する
   ```sh
   base64 -i upload-keystore.jks | pbcopy
   ```
3. Secrets `ANDROID_KEYSTORE_PASSWORD` / `ANDROID_KEY_ALIAS` / `ANDROID_KEY_PASSWORD` を登録する

未設定の場合は `.github/workflows/release.yml` の `android` ジョブがデバッグ署名の APK を
生成するだけに留まる（R-3 と同じ考え方）。**Google Play への配信はスコープに含めない**
（`docs/requirements.md` §7 未決事項 5。CI は成果物生成までを担当する）。

## 5. iOS ビルドについて（CI-07, P2）

iOS のビルドは実行環境（macOS ランナー）と証明書・プロビジョニングプロファイルの管理コストが
重いため、初版のテンプレートには含めていない（リスク R-4。`docs/requirements.md` §6）。
Android を先行させ、iOS は必要になった時点で以下の方針で追加することを推奨する。

- Apple Developer Program への加入（Apple のもう一つの証明書要件。§2 と同じ注意点）
- `pnpm tauri ios init` で Xcode プロジェクトを生成し、Fastlane や
  `xcodebuild -exportArchive` で `.ipa` を生成する
- 署名は `fastlane match` 等でチーム内共有する運用が一般的

## 6. クラッシュレポートの外部送信について

現時点ではローカルログ（RS-07, RS-13）のみに留めている。外部送信サービスを追加する場合は
`docs/requirements.md` §7 未決事項 4 を参照し、収集する情報の範囲を SEC-04 の観点で見直すこと。
