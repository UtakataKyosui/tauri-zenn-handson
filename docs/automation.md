# 自動化の運用（Hooks・コード生成）

規約として書くだけでは守られないため、本テンプレートは強制の仕組みを 4 層に分けて持つ。
**手元では強く介入し、CI では落ちたテストだけを理由にブロックする** という配分にする。
手元の介入は誤検知しても即座に無視・修正できるが、CI のブロックは誤検知のコストが高いため。

## 1. 強制の 4 層

| 層 | 手段 | 介入の強さ | 効く範囲 |
|---|---|---|---|
| 実装中（AI エージェント） | Claude Code の Hooks（`.claude/settings.json`） | 強い。テスト不在の実装ファイル作成を止め、編集直後にテストを自動実行する | Claude Code 経由の編集のみ |
| コミット / プッシュ時 | Git hooks（lefthook, `lefthook.yml`） | 中。変更範囲の format/lint/型チェック/テストを実行し、落ちていれば止める | 全ての commit / push |
| CI | GitHub Actions（`.github/workflows/ci.yml`） | テストの失敗のみでブロックする | リモートの全 push / PR |
| レビュー | 観点チェック（`docs/review-checklist.md`） | 人間と Copilot が判断する | PR |

**Hooks は Claude Code 経由の編集にしか効かない。** 人間がエディタで直接書く場合は素通りするため、
Git hooks と必ず対で用意する。どちらか一方では穴が残る（リスク R-12）。

## 2. Claude Code Hooks（`.claude/settings.json`）

以下を実装する。

- **PostToolUse (Edit/Write on `crates/core/src/**/*.rs`)** — 編集直後に `cargo test -p app-core` を実行し、結果をエージェントに返す（QA-16）
- **PreToolUse (Write on 新規 `*.rs` / `*.ts(x)`)** — 対応するテストファイルが存在しない実装ファイルの新規作成を検知したら警告する（QA-17）。**まず警告として運用し、無視される実績が出てからブロックへ引き上げることを推奨する**（未決事項 6、requirements.md §7）
- **Stop** — 応答を終える前に高速テスト一式（`pnpm exec vitest run` と `cargo test -p app-core`）を実行し、失敗していれば知らせる（QA-18）

Hooks の設定はリポジトリにコミットし、テンプレート利用者にも同じ強制がかかるようにする（QA-20）。

## 3. Git hooks（lefthook）

`lefthook.yml` に以下を定義する。

- `pre-commit`: 変更ファイルに対する Biome の format/lint、rustfmt
- `pre-push`: 変更範囲に対応するテスト（フロント: 変更 workspace の vitest、Rust: `cargo test -p app-core` および変更のあった crate）

## 4. 一時的な無効化手順（QA-21）

**逃げ道の無い強制は回避されるだけ**（リスク R-13）であるため、正規の無効化手順を用意する。

- Git hooks 全体をスキップ: `LEFTHOOK=0 git commit ...` / `LEFTHOOK=0 git push ...`
- 特定の hook のみスキップ: `git commit --no-verify`（レビューで理由の説明を求める運用とする）
- Claude Code Hooks を一時停止: `.claude/settings.local.json` で該当 Hook を上書き無効化する（gitignore 対象、個人環境限定）
- CI をスキップすることはできない。CI はテスト失敗のみでブロックするため、原則としてスキップの必要は生じない設計にしている

無効化は「詰まったときに一時的に外す」ためのものであり、常用しないこと。多用されている場合は
Hooks の介入強度（警告 / ブロック）を見直すシグナルとして扱う。

## 5. コード生成の運用

正本を一箇所に定め、そこから一方向に生成する。

| 正本 | 生成物 | 手段 |
|---|---|---|
| Rust のコマンド・イベント定義 | TS の型付きクライアント（`src/lib/bindings.ts`） | tauri-specta |
| マイグレーション SQL（`crates/core/migrations/`） | クエリのコンパイル時検証（`crates/core/.sqlx/`） | sqlx |
| ルートファイルの配置（`src/routes/`） | ルート定義（`src/routeTree.gen.ts`） | TanStack Router のプラグイン |
| ロケール JSON（`src/locales/`） | 翻訳キーの型 | `scripts/gen-i18n-types.ts` |
| プラグインの権限定義 | capabilities の記述候補 | Tauri CLI (`tauri permission`) |
| アプリアイコン 1 枚（`src-tauri/icons/icon.png`） | 各プラットフォームのアイコン一式 | `tauri icon` |
| コミット履歴（Conventional Commits） | CHANGELOG・バージョン | release-please |

原則:

1. **生成物は手編集しない。** ヘッダにその旨を明示する
2. **生成物はコミットする。** CI で再生成し、差分が出たら失敗させる（`pnpm generate` → `git diff --exit-code`）
3. **生成物はレビュー・lint の対象から外す**（`docs/review-checklist.md` の「Copilot に任せないもの」、`biome.json` の `overrides`）
4. **生成の向きは常に一方向にし、循環させない**

全生成物は `pnpm generate` で一括更新できる（GEN-06）。個別コマンドは `package.json` の `scripts` を参照。

## 6. CI（Phase 2, #11）

`.github/workflows/ci.yml` で以下を実行する。

- フロントの lint / typecheck / test（カバレッジ計測込み、QA-10）/ build
- Rust（`crates/core`）の fmt / clippy / test — 軽量なので専用ジョブで高速に回す
- デスクトップ 3 OS（Ubuntu/macOS/Windows）でのビルド（CI-02）。合わせて `pnpm generate:*` を
  再実行し `git diff --exit-code` で生成物のずれを検出する（GEN-02）
- Android 向けのクロスコンパイル確認（R-6 対策。CI-06 の本実装は Phase 5）
- Rust のカバレッジ計測（`cargo-llvm-cov`、QA-10。閾値では失敗させない）

CI は §9.5 の方針どおり「テストが落ちたこと」だけでブロックする。

## 7. Copilot レビューの自動リクエスト（REV-04）

GitHub の Copilot コードレビュー自動リクエストはリポジトリの Ruleset（Settings > Rules >
Rulesets）で設定する機能で、リポジトリ設定側の操作が必要なため Git 管理下のファイルだけでは
完結しない。`.github/rulesets/require-copilot-review.json` に設定内容を定義してあるので、
リポジトリ管理者は以下の手順で適用する。

1. GitHub の対象リポジトリ → Settings → Rules → Rulesets → New ruleset → Import a ruleset
2. `.github/rulesets/require-copilot-review.json` を選択してインポート
3. Enforcement status が `Active` になっていることを確認する

`required_approving_review_count: 0` としているとおり、Copilot レビューは**マージ条件に含めない**
（一次フィルタと位置づける。レビュー観点 §「Copilot に任せないもの」）。
