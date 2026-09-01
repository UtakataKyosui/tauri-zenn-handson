# CLAUDE.md

AI エージェント（Claude Code 等）がこのリポジトリで作業する際の規約と禁止事項。
観点の正本は `docs/review-checklist.md`。ここはその要約と、エージェント向けの補足。

## 技術スタック

Tauri v2 / React + TypeScript (strict) / Vite / Tailwind + shadcn/ui / TanStack Router /
Zustand + TanStack Query / tauri-specta / sqlx + SQLite / Rust ワークスペース
（`crates/core` + `src-tauri`）。詳細は `docs/architecture.md`。

## 絶対にしないこと

- `src/lib/bindings.ts`、`src/routeTree.gen.ts`、`src/locales/keys.gen.ts`、
  `src/components/ui/**`、`pnpm-lock.yaml`、`Cargo.lock` の手編集（生成物。GEN-03）
- ビジネスロジックを `#[tauri::command]` 関数に直接書くこと。ロジックは `crates/core` に置く
- コマンド経路での `unwrap()` / `expect()` / `panic!`
- `crates/core` への `tauri` クレートの依存追加（tauri 非依存が設計上の前提）
- `src-tauri/capabilities/**` への必要最小限を超える権限追加
- フロントから受け取ったパス・文字列を検証せずファイル操作やシェル実行に渡すこと
- `tauri.conf.json` の `app.withGlobalTauri` の有効化、CSP の緩和
- 機密情報（トークン・鍵・パスワード）をフロントへ返す、またはログに出力すること
  （`docs/architecture.md` §5, SEC-04）
- デスクトップ専用 API（トレイ・グローバルショートカット等）を `#[cfg(desktop)]` の外や
  `crates/core` に書くこと（モバイルビルドが壊れる。リスク R-6）
- Git の force push、`--no-verify`、テストのスキップ/無効化での「グリーン化」

## 実装前に確認すること

1. 既存のパターンがあるか — 似た機能が `crates/core/src/domain/`、
   `src-tauri/src/commands/`、`src/lib/api/` にすでにあれば、それに合わせる
2. テストを先に書く（TDD, `docs/testing.md`）。`crates/core` のドメインロジックと DB アクセスは
   必須、コマンド層とコンポーネントは推奨
3. コマンドを追加する場合は `docs/architecture.md` §2 の手順（core → command →
   `specta_bindings.rs` 登録 → `pnpm generate:bindings` → `src/lib/api/`）に従う

## Hooks による強制

`.claude/settings.json` の Hooks が以下を行う（詳細は `docs/automation.md`）。

- `crates/core` のソースを編集した直後に `cargo test -p app-core` を自動実行する
- テストが無い新規実装ファイルの作成を警告する（現状は警告のみ、ブロックしない）
- 応答を終える前に高速テスト一式を実行し、失敗していれば知らせる

Hooks が失敗を報告したら、無視せずその場で修正すること。

## コミット前の確認

```sh
pnpm lint && pnpm typecheck && pnpm test
cargo fmt --all -- --check && cargo clippy --workspace --all-targets -- -D warnings
```

生成物を更新した場合は `pnpm generate` を実行してからコミットする。

## 参照

`docs/requirements.md`（要件）、`docs/architecture.md`（設計）、`docs/testing.md`（TDD 規約）、
`docs/automation.md`（強制の仕組み）、`docs/review-checklist.md`（レビュー観点の正本）。
