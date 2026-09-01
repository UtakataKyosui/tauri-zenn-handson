# Contributing

## 開発の始め方

`README.md` の「セットアップ」を参照。`pnpm install` で Git hooks（lefthook）も自動的に
有効化される。

## 開発フロー（TDD）

このリポジトリはテスト駆動開発を前提にする。`docs/testing.md` を先に読むこと。
Red（失敗するテストを書く）→ Green（最小限の実装で通す）→ Refactor のサイクルを回す。

## コミットメッセージ

[Conventional Commits](https://www.conventionalcommits.org/) 形式を使う（`feat:`, `fix:`,
`docs:`, `refactor:`, `test:`, `chore:` 等）。`commit-msg` hook（commitlint）が強制する。
CHANGELOG とバージョンはここから自動生成される（release-please, CI-08）。

## プルリクエストを出す前に

```sh
pnpm lint && pnpm typecheck && pnpm test && pnpm build
cargo fmt --all -- --check
cargo clippy --workspace --all-targets -- -D warnings
cargo test --workspace
```

生成物（`bindings.ts` 等）に変更が要る場合は `pnpm generate` を実行してからコミットすること
（GEN-02 が CI で差分を検出する）。

## レビュー観点

`docs/review-checklist.md` を参照。同じ観点が `.github/copilot-instructions.md` /
`.github/instructions/*.instructions.md` / `CLAUDE.md` にも反映されている。

## 強制の仕組みを一時的に無効化したい場合

`docs/automation.md` §4 を参照（`LEFTHOOK=0`、`--no-verify` 等）。
