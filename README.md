# tauri-app-template

Tauri v2 + React + TypeScript (strict) + Rust で新規アプリを立ち上げるためのテンプレート。
ビルド基盤・型共有・Lint・CI・ロギング・DB・署名付きリリースといった「どのアプリでも要る」
土台を最初から備え、動作するサンプル実装（`src/routes/demo.tsx`）付きで検証できる状態にしてある。

- Windows / macOS / Linux / Android の 4 ターゲット（iOS は初版では未対応。`docs/recipes/signing.md` §5）
- テスト駆動開発（TDD）を前提としたテスト基盤と、それを規約で終わらせないための強制の仕組み
- 詳しい設計は `docs/architecture.md`、要件は `docs/requirements.md` を参照

## 前提パッケージ

### 共通

- [Rust](https://www.rust-lang.org/tools/install)（`rust-toolchain.toml` が固定するバージョンを rustup が自動取得する）
- [Node.js](https://nodejs.org/)（`.node-version` 参照）
- [pnpm](https://pnpm.io/installation)（`package.json` の `packageManager` が固定するバージョン）

### Linux

Tauri のビルドに以下のシステムパッケージが要る（Debian/Ubuntu 系の例）。

```sh
sudo apt-get update
sudo apt-get install -y libwebkit2gtk-4.1-dev libgtk-3-dev librsvg2-dev \
  libsoup-3.0-dev libjavascriptcoregtk-4.1-dev libayatana-appindicator3-dev \
  patchelf build-essential
```

他ディストリビューションの場合は [Tauri 公式の前提パッケージ一覧](https://v2.tauri.app/start/prerequisites/) を参照。

### macOS

Xcode Command Line Tools（`xcode-select --install`）があれば追加パッケージは不要。

### Windows

[Microsoft C++ Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/) と
WebView2（Windows 10/11 には標準搭載）が要る。

### モバイル（Android）開発の前提

- Android Studio または Android SDK/NDK 一式
- JDK 17
- `ANDROID_HOME` / `NDK_HOME` を設定した上で `pnpm tauri android init` を実行する

## セットアップ

```sh
pnpm install
pnpm generate       # bindings.ts / routeTree.gen.ts / i18n 型を生成する（GEN-06）
pnpm tauri dev       # デスクトップアプリを起動
```

フロントエンドだけを Vite の開発サーバーで確認する場合は `pnpm dev` を使う
（Tauri のネイティブ機能は動かない）。

## よく使うコマンド

| コマンド | 内容 |
|---|---|
| `pnpm tauri dev` | デスクトップアプリを開発モードで起動 |
| `pnpm tauri build` | デスクトップ向けにビルド（インストーラ生成） |
| `pnpm tauri android dev` | Android 実機/エミュレータで起動（要 `tauri android init`） |
| `pnpm lint` / `pnpm lint:fix` | Biome による lint（フロント） |
| `pnpm typecheck` | TypeScript の型チェック |
| `pnpm test` / `pnpm test:watch` | フロントのテスト（Vitest） |
| `cargo test -p app-core` | Rust ドメインロジックのテスト（tauri のビルドを伴わず高速） |
| `cargo clippy --workspace --all-targets -- -D warnings` | Rust の静的解析 |
| `pnpm generate` | 生成物（bindings.ts 等）を一括更新 |
| `pnpm scaffold:feature <name>` | 機能追加一式を Red 状態で生成（GEN-04） |
| `pnpm setup:project -- --name "My App" --identifier com.example.my-app` | アプリ名・識別子を一括差し替え（DOC-03） |

## ドキュメント

| ドキュメント | 内容 |
|---|---|
| [`docs/requirements.md`](docs/requirements.md) | このテンプレートの要件定義（スコープの合意） |
| [`docs/architecture.md`](docs/architecture.md) | 層構成、コマンド追加の手順、型生成の流れ |
| [`docs/testing.md`](docs/testing.md) | TDD の進め方とテストの配置・命名規約 |
| [`docs/automation.md`](docs/automation.md) | Hooks・Git hooks・CI による強制の仕組みと無効化手順 |
| [`docs/review-checklist.md`](docs/review-checklist.md) | レビュー観点の正本 |
| [`docs/setup.md`](docs/setup.md) | このテンプレートから新規プロジェクトを始める手順 |
| [`docs/recipes/`](docs/recipes/) | P2 機能の追加手順、署名証明書の準備手順など |
| [`CLAUDE.md`](CLAUDE.md) | AI エージェント（Claude Code 等）向けの規約と禁止事項 |

## テストと品質チェック

```sh
pnpm lint && pnpm typecheck && pnpm test && pnpm build
cargo fmt --all -- --check
cargo clippy --workspace --all-targets -- -D warnings
cargo test --workspace
```

CI（`.github/workflows/ci.yml`）は上記に加え、3 OS でのデスクトップビルドと Android の
クロスコンパイル確認、生成物の差分検出（GEN-02）を行う。詳細は `docs/testing.md` と
`docs/automation.md` を参照。

## ライセンス

[MIT-0](LICENSE) — 生成先プロジェクトに著作権表示の保持義務を負わせない。
