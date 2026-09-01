## 概要

<!-- 何を、なぜ変更したか -->

## テスト

<!-- 実行したコマンドと結果 -->

- [ ] `pnpm lint && pnpm typecheck && pnpm test && pnpm build`
- [ ] `cargo fmt --all -- --check && cargo clippy --workspace --all-targets -- -D warnings && cargo test --workspace`
- [ ] 生成物に変更がある場合、`pnpm generate` を実行してコミット済み

## セルフチェック（`docs/review-checklist.md` 対応）

該当する項目のみ確認してください。

- [ ] セキュリティ: capabilities に追加した権限は最小限か。フロントから受け取った値を
      検証せずファイルパス/シェル引数に渡していないか。機密情報をフロントに返して/ログに
      出していないか
- [ ] Rust: `unwrap()`/`expect()`/`panic!` をコマンド経路に入れていないか。ロジックを
      `crates/core` に置き、コマンドは薄いアダプタのままか
- [ ] プラットフォーム分岐: デスクトップ専用 API が共通コード・モバイルビルドに
      混入していないか
- [ ] フロントエンド: `bindings.ts` 等の生成物を手編集していないか。エラーハンドリングと
      ローディング状態があるか
- [ ] テスト: 変更した振る舞いに対応するテストがあるか

## 関連 Issue

<!-- Closes #123 -->
