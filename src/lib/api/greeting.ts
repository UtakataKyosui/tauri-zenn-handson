import { commands } from "@/lib/bindings";

/**
 * `bindings.ts` を直接呼ばず、ここで一段ラップする（docs/testing.md §3）。
 * テストではこのモジュールを差し替える。エラーは呼び出し側で扱いやすい形（例外）に正規化する。
 */
export async function greet(name: string): Promise<string> {
  const result = await commands.greet(name);
  if (result.status === "error") {
    throw new Error(describeError(result.error));
  }
  return result.data;
}

function describeError(error: unknown): string {
  if (
    typeof error === "object" &&
    error !== null &&
    "kind" in error &&
    (error as { kind: unknown }).kind === "Core"
  ) {
    const core = (error as unknown as { message: { kind: string; message: unknown } }).message;
    return `${core.kind}: ${core.message ?? ""}`;
  }
  return "unexpected error";
}
