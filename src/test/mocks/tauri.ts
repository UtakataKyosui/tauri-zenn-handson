import { mockIPC } from "@tauri-apps/api/mocks";

/**
 * QA-05: `invoke("greet", ...)` 等の IPC 呼び出しをアプリを起動せずにモックする。
 * 使用例は `src/lib/api/greeting.test.ts` を参照。
 */
export function mockCommand<T>(name: string, handler: (args: Record<string, unknown>) => T) {
  mockIPC((cmd, args) => {
    if (cmd === name) {
      return handler((args ?? {}) as Record<string, unknown>);
    }
    throw new Error(`unmocked command: ${cmd}`);
  });
}
