---
applyTo: "src-tauri/**"
---

# src-tauri 向けレビュー指示

正本: `docs/review-checklist.md` §1〜3。ここは `src-tauri`（コマンド層・アプリシェル）
固有の観点を優先して見る。

- コマンド（`#[tauri::command]`）にビジネスロジックが直書きされていないか。
  入力の変換・検証と `app_core::domain::...` の呼び出しだけになっているか
- `capabilities/*.json` への権限追加は、その window・その機能に本当に必要な最小限か
  （`default.json` は全プラットフォーム共通、`desktop.json` / `mobile.json` は
  各プラットフォーム専用の権限だけを持つ）
- デスクトップ専用コード（`src-tauri/src/desktop/`）が `#[cfg(desktop)]` の外や
  モバイルからも呼ばれる場所に漏れていないか。同様にモバイル専用は `#[cfg(mobile)]`
- `AppError` への変換経路が保たれているか（`unwrap()` / `expect()` / `panic!` 禁止）
- ロックを保持したまま `await` していないか。ブロッキング I/O を直接 async コンテキストで
  呼んでいないか
- 新規コマンドを `src-tauri/src/specta_bindings.rs` に登録し、`pnpm generate:bindings` を
  実行済みか（CI の GEN-02 差分チェックで検出されるが、レビュー時点でも確認する）
- 機密情報（トークン等）を持つコマンドが、値そのものをフロントへ返していないか（SEC-04）
