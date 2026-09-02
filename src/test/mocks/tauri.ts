import { mockIPC } from "@tauri-apps/api/mocks";

/**
 * QA-05: `invoke("greet", ...)` 等の IPC 呼び出しをアプリを起動せずにモックする。
 * 使用例は `src/lib/api/greeting.test.ts` を参照。
 * `mockIPC` はハンドラを丸ごと差し替えるため、1テスト内で複数回呼ぶと先に登録した
 * コマンドのモックが失われる。1テストで複数コマンドをモックする場合は `mockCommands` を使う。
 */
export function mockCommand<T>(name: string, handler: (args: Record<string, unknown>) => T) {
  mockCommands({ [name]: handler });
}

/**
 * #10: `books.$bookId.tsx` のように、1画面で複数のコマンド（`get_book` と
 * `update_book`/`delete_book`）を同時にモックする必要があるテスト向け。
 */
export function mockCommands(handlers: Record<string, (args: Record<string, unknown>) => unknown>) {
  mockIPC((cmd, args) => {
    const handler = handlers[cmd];
    if (handler) {
      return handler((args ?? {}) as Record<string, unknown>);
    }
    throw new Error(`unmocked command: ${cmd}`);
  });
}
