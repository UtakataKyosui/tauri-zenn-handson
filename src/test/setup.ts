import "@testing-library/jest-dom/vitest";
import { clearMocks } from "@tauri-apps/api/mocks";
import { cleanup } from "@testing-library/react";
import { afterEach, beforeEach } from "vitest";

// QA-05: Tauri IPC のモック層。Rust を起動せずコマンド呼び出しをテストできる。
// 個々のテストは `src/test/mocks/tauri.ts` の `mockCommand` でハンドラを登録する。
beforeEach(() => {
  // jsdom には crypto.randomUUID が無い場合があるため補う（stores/toast-store.ts で使用）
  if (!globalThis.crypto?.randomUUID) {
    // @ts-expect-error jsdom polyfill
    globalThis.crypto = { ...globalThis.crypto, randomUUID: () => Math.random().toString(36) };
  }
  // #16: jsdom は window.matchMedia を実装しないため、`useIsNarrow`/`useTheme` が
  // 未モックのテストでも例外にならないよう既定値（該当しない）を補う。個別テストが
  // `vi.stubGlobal("matchMedia", ...)` すれば、この既定値を一時的に上書きできる。
  if (typeof window.matchMedia !== "function") {
    window.matchMedia = ((query: string) =>
      ({
        matches: false,
        media: query,
        addEventListener: () => {},
        removeEventListener: () => {},
      }) as unknown as MediaQueryList) as typeof window.matchMedia;
  }
});

afterEach(() => {
  cleanup();
  clearMocks();
});
