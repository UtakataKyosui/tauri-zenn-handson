---
applyTo: "crates/core/**"
---

# crates/core 向けレビュー指示

正本: `docs/review-checklist.md` §2, §5。ここは `crates/core` 固有の観点を優先して見る。

- `tauri` クレートへの依存が追加されていないか（このクレートは tauri 非依存が設計上の前提。
  `docs/architecture.md` §1）
- `sqlx::query!` / `query_as!` がコンパイル時検証を通っているか。SQL が文字列連結で
  組まれていないか
- マイグレーション（`crates/core/migrations/`）が既存データを壊さない追加のみになっているか
- ドメインロジックにはユニットテストが、DB アクセスにはインメモリ SQLite を使った統合テストが
  付いているか（`docs/testing.md` §2）
- エラーは `CoreError` に変換されているか。`unwrap()` / `expect()` / `panic!` が
  本番コードパスに残っていないか（`#[cfg(test)]` 内は対象外）
- `.sqlx/` オフラインメタデータの再生成が必要な変更（クエリの追加・変更）であれば、
  `cargo sqlx prepare` を実行してコミットされているか
