import { fileURLToPath } from "node:url";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const host = process.env.TAURI_DEV_HOST;
const srcDir = fileURLToPath(new URL("./src", import.meta.url));

// https://vite.dev/config/
export default defineConfig(async () => ({
  plugins: [tanstackRouter({ target: "react", autoCodeSplitting: true }), react()],

  resolve: {
    alias: {
      "@": srcDir,
    },
  },

  // Tauri が期待する固定ポートでの起動 (README/docs/setup.md 参照)
  clearScreen: false,
  server: {
    port: 1420,
    strictPort: true,
    host: host || false,
    hmr: host
      ? {
          protocol: "ws",
          host,
          port: 1421,
        }
      : undefined,
    watch: {
      // src-tauri の変更でフロントの dev server を再起動しない
      ignored: ["**/src-tauri/**", "**/crates/**"],
    },
  },

  envPrefix: ["VITE_"],
}));
