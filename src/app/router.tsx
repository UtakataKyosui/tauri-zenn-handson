import { createRouter } from "@tanstack/react-router";
// GEN-01 系と同様に一方向生成: ルートファイル (src/routes/**) → routeTree.gen.ts。
// `pnpm generate:routes` または `pnpm dev`/`pnpm build` 実行時に自動生成される（手編集禁止）。
import { routeTree } from "../routeTree.gen";

export const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
