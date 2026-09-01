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
});

afterEach(() => {
  cleanup();
  clearMocks();
});
