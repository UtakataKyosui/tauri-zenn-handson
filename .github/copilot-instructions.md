# Copilot 向けリポジトリ指示

このファイルは GitHub Copilot のコードレビュー・コード補完に適用される、リポジトリ全体の指示です。
観点の正本は `docs/review-checklist.md` です。矛盾がある場合はそちらを正とします。
パス別の詳細指示は `.github/instructions/*.instructions.md` を参照してください。

## 技術スタック

- フレームワーク: Tauri v2（Windows / macOS / Linux / iOS / Android）
- フロントエンド: React + TypeScript (strict) + Vite
- スタイリング: Tailwind CSS + shadcn/ui（`src/components/ui/` はコピー生成物）
- ルーティング: TanStack Router
- 状態管理: Zustand（UI 状態）/ TanStack Query（Rust 呼び出し）
- Rust ↔ TS 型共有: tauri-specta（`src/lib/bindings.ts` は生成物、手編集禁止）
- Rust: ワークスペース分割（`crates/core` は tauri 非依存、`src-tauri` はアダプタ層）
- DB: sqlx + SQLite（Rust 側で完結。フロントには command 経由でのみ公開）
- Lint/Format: Biome（JS/TS）、rustfmt + clippy（Rust、`-D warnings`）

## 禁止事項

- `src/lib/bindings.ts`、`src/routeTree.gen.ts`、`src/locales/keys.gen.ts`、
  lockfile（`pnpm-lock.yaml`、`Cargo.lock`）、`src/components/ui/**` の手編集
- コマンド関数（`#[tauri::command]`）へのビジネスロジックの直書き。ロジックは `crates/core` に置く
- コマンド経路での `unwrap()` / `expect()` / `panic!`
- `capabilities/**` への必要最小限を超える権限追加
- フロントから受け取ったパス・文字列を検証せずファイル操作やシェル実行に渡すこと
- `tauri.conf.json` の `app.withGlobalTauri` の有効化、CSP の緩和
- 機密情報（トークン・鍵）をフロントに返す、またはログに出力すること

## レビュー観点

`docs/review-checklist.md` の全項目を適用する。特に以下を優先する。

1. セキュリティ / Tauri 固有（capabilities の最小権限、CSP、機密情報の扱い）
2. Rust の安全性（`unwrap()` 不在、エラー変換、ロック中の `await` 禁止）
3. プラットフォーム分岐（デスクトップ専用 API の共通コードへの混入）
4. テスト（振る舞いの検証、失敗ケース・境界値）

## レビュー対象外

- `src/lib/bindings.ts`、`src/routeTree.gen.ts`、`src/locales/keys.gen.ts`
- `src/components/ui/**`
- `pnpm-lock.yaml`, `Cargo.lock`
- `crates/core/.sqlx/**`（sqlx オフラインクエリメタデータ）

## 参照

- パス別の詳細指示: `.github/instructions/*.instructions.md`（REV-03）
- PR の自己チェック項目: `.github/pull_request_template.md`（REV-06）
- AI エージェント向けの同一観点: `CLAUDE.md`（REV-07）
