import { commands } from "@/lib/bindings";

/**
 * #15: 直近の書き出し先ディレクトリ。今回のセッションのためだけの値で、
 * `Mutex<Settings>`にメモリ上だけ持つ。次回の起動では復元されない。
 */
export async function getExportDir(): Promise<string | null> {
  const result = await commands.getExportDir();
  if (result.status === "error") throw new Error(JSON.stringify(result.error));
  return result.data;
}

export async function setExportDir(dir: string): Promise<void> {
  const result = await commands.setExportDir(dir);
  if (result.status === "error") throw new Error(JSON.stringify(result.error));
}
