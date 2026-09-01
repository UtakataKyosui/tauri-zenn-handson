---
applyTo: ".github/workflows/**"
---

# GitHub Actions ワークフロー向けレビュー指示

正本: `docs/automation.md` §6〜7、`docs/recipes/signing.md`。

- CI は「テストが落ちたこと」だけでブロックしているか。「テストが無いこと」を理由に
  失敗させていないか（`docs/testing.md` §7）
- 署名・証明書系の secrets を必須にしていないか。未設定でもビルド自体は失敗しない構成に
  なっているか（リスク R-3。`env` を空文字のまま渡し、ツール側のスキップに任せる）
- 複数 OS で動くジョブに bash 専用の構文（`||`, ヒアドキュメント等）を使う場合、
  `shell: bash` を明示しているか（Windows ランナーの既定シェルは pwsh）
- 生成物（`bindings.ts` 等）を使うステップの前に、その生成コマンド
  （`pnpm generate:bindings` 等）を実行しているか
- 新しい GitHub Action を追加する場合、バージョンをタグ（できれば SHA）で固定しているか
- secrets をログに出力するステップになっていないか
