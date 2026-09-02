/**
 * パスの末尾のファイル名部分を取り除き、親ディレクトリを返す。`save()`で選んだ
 * 保存先から、次回のダイアログの初期表示に使うディレクトリを求める用途のための
 * 軽量な実装で、`/`・`\`どちらの区切りにも対応する。OSのパス解決には依存しない
 * （`@tauri-apps/api/path`の`dirname`はIPCを経るため、この用途には重い）。
 */
export function dirname(path: string): string {
  const lastSlash = Math.max(path.lastIndexOf("/"), path.lastIndexOf("\\"));
  return lastSlash <= 0 ? "" : path.slice(0, lastSlash);
}
