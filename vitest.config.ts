import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

const srcDir = fileURLToPath(new URL("./src", import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": srcDir,
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    css: false,
    // 既定の除外パターンに加え、Claude Code のエージェント用一時ワークツリー
    // （.claude/worktrees/）配下に存在しうる src/ のコピーを二重に拾わないようにする。
    exclude: [
      "**/node_modules/**",
      "**/dist/**",
      "**/cypress/**",
      "**/.{idea,git,cache,output,temp}/**",
      "**/{karma,rollup,webpack,vite,vitest,jest,ava,babel,nyc,cypress,tsup,build}.config.*",
      ".claude/worktrees/**",
    ],
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "lcov"],
      include: ["src/**/*.{ts,tsx}"],
      exclude: [
        "src/lib/bindings.ts",
        "src/routeTree.gen.ts",
        "src/components/ui/**",
        "src/test/**",
      ],
      // QA-15: 閾値は既定で無効（テンプレート段階では形骸化しやすいため）。
      // 派生プロジェクト側で `COVERAGE_THRESHOLDS=true pnpm test:coverage` のように
      // 有効化できる。数値は導入時の実測値に合わせて調整すること。
      thresholds:
        process.env.COVERAGE_THRESHOLDS === "true"
          ? { lines: 80, functions: 80, branches: 70, statements: 80 }
          : undefined,
    },
  },
});
