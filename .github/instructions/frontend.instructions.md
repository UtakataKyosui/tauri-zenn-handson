---
applyTo: "src/**"
---

# フロントエンド（src/）向けレビュー指示

正本: `docs/review-checklist.md` §4〜5。除外対象（`src/lib/bindings.ts`、
`src/routeTree.gen.ts`、`src/locales/keys.gen.ts`、`src/components/ui/**`）は
レビュー対象外（REV-05）。

- `src/lib/bindings.ts` を直接呼ばず、`src/lib/api/**` を経由しているか
  （`docs/testing.md` §3）
- Rust 呼び出しのエラーがハンドリングされ、ユーザーに伝わっているか
  （`src/stores/toast-store.ts` 等）
- ローディング状態が表現されているか（ネイティブ処理は数秒かかりうる）
- デスクトップ幅・モバイル幅の双方で崩れないか。セーフエリア（`pb-safe-bottom` 等）を
  考慮しているか（`src/routes/__root.tsx` が参考実装）
- 色を直接書かず、テーマトークン（`src/styles/globals.css` の CSS 変数）を使っているか
- ハードコードされた文言が i18n（`src/locales/{ja,en}.json`）の対象になっているか。
  両ロケールにキーが揃っているか（`pnpm generate:i18n-types` が検出する）
- hooks・ストア・変換ロジックにテストがあるか（`*.test.ts(x)`, Vitest）
- デスクトップ専用機能（例: 自動アップデート）は `src/lib/platform.ts` の `isDesktop()` /
  `isMobile()` で出し分けているか
