# このテンプレートから新規プロジェクトを始める手順（DOC-03）

## 1. リポジトリを作成する

GitHub の「Use this template」（または `git clone` してリモートを付け替える）でリポジトリを
作成する。

## 2. アプリ名・識別子を差し替える

```sh
pnpm install
pnpm setup:project -- --name "My App" --identifier com.example.my-app
```

`scripts/setup-project.ts`（BASE-05）が以下を更新する。

- `src-tauri/tauri.conf.json` の `productName` / `identifier`
- `package.json` の `name`
- `index.html` の `<title>`

## 3. アイコンを差し替える

1 枚の元画像（1024x1024 以上推奨）から各プラットフォーム向けアイコン一式を生成する
（GEN-07。手順は `docs/recipes/icons.md`）。

```sh
pnpm tauri icon path/to/icon.png
```

## 4. 不要な機能を削除する（リスク R-7）

このテンプレートは「実用フル装備」を初版のスコープにしているため、使わない機能は
削除してよい。目安として以下の単位でまとまっている。

| 機能 | 削除すると良い場所 |
|---|---|
| デモページ全体 | `src/routes/demo.tsx`、`src/lib/api/{notes,tasks,updater}.ts`、対応する Rust コマンド（`src-tauri/src/commands/`） |
| SQLite（notes サンプル） | `crates/core/src/domain/notes.rs`、`crates/core/migrations/`、`src-tauri/src/commands/notes.rs`。DB 自体を使わないなら `db/` モジュールと `lib.rs` の接続処理も |
| 自動アップデート | `src-tauri/src/commands/updater.rs`、`lib.rs` の `tauri_plugin_updater` 登録、`tauri.conf.json` の `plugins.updater`、`release.yml` の署名 env |
| ディープリンク | `lib.rs` の `tauri_plugin_deep_link` 登録、`src/hooks/use-deep-link.ts`、`tauri.conf.json` の `plugins."deep-link"` |
| Android 対応 | `.github/workflows/ci.yml` の `mobile-compile-check` ジョブ、`release.yml` の `android` ジョブ、`src-tauri/capabilities/mobile.json`、`src-tauri/src/mobile/` |

削除後は `pnpm generate` を実行し、`bindings.ts` から不要な型・コマンドを取り除くこと。

## 5. `.env.example` を元に `.env` を作る

```sh
cp .env.example .env
```

フロントに公開する値だけ `VITE_` 接頭辞で追加する（BASE-04）。機密情報は Rust 側
（`docs/architecture.md` §5）に置く。

## 6. Git hooks を有効化する

`pnpm install` の `prepare` スクリプトで自動的に `lefthook install` が走るため、
追加の手順は不要（QA-11）。

## 7. リリース（署名）の準備

初回リリースまでに `docs/recipes/signing.md` を参照して GitHub Secrets を登録する。
未登録でもビルド自体は失敗しない（署名だけスキップされる）ので、後回しにしてもよい。
