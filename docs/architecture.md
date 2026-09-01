# アーキテクチャ

層構成、コマンドの追加手順、型生成の流れをまとめる。`docs/requirements.md` §5 のディレクトリ構成が前提。

## 1. 層構成

```
crates/core   … tauri に依存しない純粋ロジック + DB アクセス。TDD の主戦場
src-tauri     … Tauri アプリ本体。commands/ は core を呼ぶ薄いアダプタのみ
src/lib/api   … bindings.ts (生成物) を一段ラップしたフロントの呼び出し口
src/          … React (UI・状態・ルーティング)
```

依存の向きは一方向。`crates/core` は `src-tauri` や `tauri` クレートに依存しない
（Cargo.toml のコメントおよびレビュー観点 §2 で強制する）。フロントは `src/lib/bindings.ts`
を直接使わず、必ず `src/lib/api/**` を経由する（docs/testing.md §3）。

## 2. コマンドを 1 つ追加する手順

1. `crates/core/src/domain/` にロジックとユニットテストを追加する（Red→Green→Refactor）
2. `src-tauri/src/commands/` に薄いアダプタを追加する。中身は入力の変換・検証と
   `app_core::domain::...` の呼び出しのみ。`#[tauri::command]` と `#[specta::specta]` を付ける
3. `src-tauri/src/specta_bindings.rs` の `collect_commands![...]` に登録する
4. `src-tauri/src/lib.rs` の `invoke_handler` は `specta_bindings::typed_builder()` 経由なので
   変更不要
5. `pnpm generate:bindings` を実行し `src/lib/bindings.ts` を再生成する
6. `src/lib/api/` に薄いラッパー関数を追加する（エラーを呼び出し側が扱いやすい形に正規化）
7. 必要なら `src-tauri/capabilities/*.json` に権限を追加する（最小権限。RS-03/SEC-03）

機能追加一式（core・コマンド・フロント・テスト）をまとめて生成するジェネレータは
Phase 3（#14, GEN-04）で追加する。

## 3. 型生成の流れ（RS-05 / GEN-01）

```
src-tauri/src/specta_bindings.rs  (正本: コマンド定義)
        │  tauri-specta (`cargo run --bin gen-bindings`)
        ▼
src/lib/bindings.ts                (生成物・手編集禁止)
        │  一段ラップ
        ▼
src/lib/api/**                     (フロントが実際に呼ぶ層)
```

CI は `pnpm generate:bindings` を実行後 `git diff --exit-code` で差分を検出し、
ずれたまま動く状態を防ぐ（GEN-02、`.github/workflows/ci.yml`）。

## 4. 状態管理の使い分け（FE-04）

| 対象 | 手段 | 置き場所 |
|---|---|---|
| Rust 呼び出しの結果（ローディング・エラー・キャッシュ） | TanStack Query | `src/hooks/` |
| UI のみの状態（テーマ、開閉状態など） | Zustand | `src/stores/` |

Rust から取得するデータを Zustand に手動でコピーしない。TanStack Query のキャッシュを
正とする。

## 5. 機密情報の扱い（SEC-04）

- トークン・鍵・パスワードは Rust 側（`src-tauri` / `crates/core`）でのみ保持する
- OS キーチェーン連携（RS-12, Phase 3）を経由して保存し、平文でディスクに書かない
- フロントには「必要な操作の実行結果」だけを command 経由で返す。トークンそのものは
  絶対にフロントへ返さない・ログへ出さない（レビュー観点 §1）
- 環境変数はフロントに公開するものだけ `VITE_` 接頭辞を付ける（BASE-04, `.env.example`）

## 6. エラーの伝搬

```
app_core::CoreError  →  src-tauri::AppError (#[from])  →  serde  →  フロント (bindings.ts)
```

コマンド経路で `unwrap()` / `expect()` / `panic!` を使わない。全て `Result<T, AppError>` を返す
（レビュー観点 §2）。フロントは `src/lib/api/**` で例外に正規化し、
`src/stores/toast-store.ts` → `src/components/toaster.tsx` でユーザーに伝える（FE-05）。

## 7. プラットフォーム分岐

- Rust: `#[cfg(desktop)]` → `src-tauri/src/desktop/`、`#[cfg(mobile)]` → `src-tauri/src/mobile/`
- TS: `src/lib/platform.ts` の `isDesktop()` / `isMobile()` で実行時分岐する
- デスクトップ専用 API を `crates/core` や共通コマンドに混入させない（CI のモバイルコンパイル確認で検出、リスク R-6）

## 8. Phase 3 で追加した土台機能（#14〜#19）

| 機能 | 正本 | 備考 |
|---|---|---|
| ロギング（RS-07） | `src-tauri/src/logging.rs` | `tauri-plugin-log`。`RUST_LOG` でレベル制御、OS 標準のログディレクトリに出力 |
| パニックハンドラ（RS-13） | `src-tauri/src/panic_handler.rs` | パニック内容をログへ退避してからデフォルトの挙動に委ねる |
| 設定永続化（RS-08） | `tauri_plugin_store::Builder` (`lib.rs`) | 軽量な KV ストア。フロントから `@tauri-apps/plugin-store` で直接読み書きする |
| SQLite（RS-09） | `crates/core/migrations/`, `crates/core/src/domain/notes.rs` | `sqlx::query!` でコンパイル時検証。オフラインメタデータは `crates/core/.sqlx/`（コミット済み、`SQLX_OFFLINE=true` で CI から利用） |
| 長時間処理（RS-10） | `src-tauri/src/tasks.rs`, `commands/long_task.rs` | `TaskProgress` イベントで進捗通知、`CancellationToken` でキャンセル |
| HTTP リトライ（RS-11） | `crates/core/src/net/mod.rs`, `src-tauri/src/http_client.rs` | リトライ制御は `crates/core` でユニットテスト、`reqwest::Client` の構築は `src-tauri` |
| 資格情報（RS-12） | `src-tauri/src/credentials.rs` | `keyring` クレートで OS キーチェーンに保存。値そのものはコマンドから返さない（SEC-04） |
| 基本プラグイン（APP-01〜03） | `src/routes/demo.tsx` | ファイルダイアログ・通知・外部リンクは custom command を介さずプラグインの JS API を直接呼ぶ。外部リンクは既定ブラウザが URL を握り潰しても成功扱いになり、アプリからは検知できない（R-16） |
| スプラッシュ（FE-06） | `public/splashscreen.html`, `commands::window::close_splashscreen` | メインウィンドウを `visible: false` で起動し、フロント初期化後にコマンドで表示切替 |
| i18n 型生成（GEN-05） | `scripts/gen-i18n-types.ts` | ロケール間の欠落キーを検出したら CI を失敗させる |
| スキャフォールド（GEN-04/06） | `scripts/scaffold-feature.ts` | `pnpm scaffold:feature <name>` で core・コマンド・フロント一式を Red 状態で生成する |

`src/routes/demo.tsx` はこれらのサンプル実装をまとめて確認するためのページで、実プロジェクトでは
不要になった機能ごと削除してよい（リスク R-7、`docs/recipes/` に削除手順を追って追記する）。

## 9. Phase 4 で追加したデスクトップ機能とリリース（#20, #21）

| 機能 | 正本 | 備考 |
|---|---|---|
| トレイ・メニュー（APP-04/05） | `src-tauri/src/desktop/mod.rs` | `#[cfg(desktop)]` 配下。モバイルビルドには含まれない |
| ウィンドウ状態の記憶（APP-06） | `tauri_plugin_window_state`（`lib.rs`） | Phase 1 から登録済み。`capabilities/desktop.json` の `window-state:default` が必要 |
| 単一インスタンス制御（APP-07） | `tauri_plugin_single_instance`（`lib.rs`）, `desktop::focus_main_window_from_app` | 二重起動時に既存ウィンドウを前面化する |
| 自動アップデート（APP-08） | `commands/updater.rs`, `src/lib/api/updater.ts` | `#[cfg(desktop)]` 限定。`specta_bindings.rs` はデスクトップ/モバイルで別の `typed_builder()` を持ち、モバイルには含まれない（R-6 対策） |
| リリースワークフロー（CI-03〜05） | `.github/workflows/release.yml` | タグ push（`v*.*.*`）で 3 OS のインストーラをビルドし GitHub Releases に添付。署名系の secrets が無くてもビルドは失敗しない（R-3, `docs/recipes/signing.md`） |
| バージョン・CHANGELOG（CI-08） | `.github/workflows/release-please.yml`, `release-please-config.json` | Conventional Commits（QA-12）からリリース PR を自動生成する |

証明書・署名鍵の準備手順は `docs/recipes/signing.md` を参照。

## 10. Phase 5 で追加したモバイル対応（#22）

| 機能 | 正本 | 備考 |
|---|---|---|
| レスポンシブ設計（FE-07） | `src/routes/__root.tsx` | `sm`（640px）を境に上部ナビ／下部タブバーを切り替える。`pb-safe-bottom` 等でセーフエリアに対応 |
| ディープリンク（APP-09） | `tauri_plugin_deep_link`（`lib.rs`）, `src/hooks/use-deep-link.ts` | カスタム URL スキームは `tauri.conf.json` の `plugins."deep-link".schemes` が正本。両プラットフォーム対応 |
| Android ビルド（CI-06） | `.github/workflows/release.yml` の `android` ジョブ | 署名鍵が無くてもデバッグ署名 APK の生成までは失敗しない。ストア配信はスコープ外（`docs/requirements.md` §7 未決事項 5） |
| iOS ビルド（CI-07, P2） | — | 初版では見送り。手順は `docs/recipes/signing.md` §5 に記載（リスク R-4） |

## 11. プラットフォーム別に意味を持たない機能の出し分け（レビュー観点 §3）

- `src/lib/platform.ts` の `isDesktop()` / `isMobile()` で UI を出し分ける
  （例: `src/routes/demo.tsx` の自動アップデートセクションは `isDesktop()` の場合のみ表示）
- Rust 側は `src-tauri/src/specta_bindings.rs` が `#[cfg(desktop)]` / `#[cfg(mobile)]` で
  別々の `typed_builder()` を持ち、デスクトップ専用コマンド（`updater`）はモバイル向け
  バイナリに含まれない

## 12. 既知の制約

- **macOS の dev 実行ではネイティブ通知が表示されないことがある（#37）** — `pnpm tauri dev` は
  `.app` バンドルではなく `target/debug/` の生バイナリを直接起動する。macOS の通知センターは
  バンドル ID を持たないプロセスからの通知をエラーを返さずに破棄するため、
  `notification:default` の capabilities が正しくても通知が出ない。動作確認は
  `pnpm tauri build` で生成した `.app` から起動して行う。`src/routes/demo.tsx` の
  `NotificationDemo` は `isPermissionGranted()` の結果を画面に表示し、この注記も併記する
