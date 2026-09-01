const IMAGE_EXTENSIONS = new Set(["png", "jpg", "jpeg", "gif", "webp", "bmp", "ico"]);

/**
 * パスの拡張子から画像かどうかを判定する。バイナリ内容は見ず拡張子のみで
 * 判定するため、拡張子が偽装されたファイルは誤判定しうる（デモ用途のため許容）。
 */
export function isImagePath(path: string): boolean {
  const ext = path.split(".").pop()?.toLowerCase();
  return ext !== undefined && IMAGE_EXTENSIONS.has(ext);
}

const MIME_BY_EXTENSION: Record<string, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  gif: "image/gif",
  webp: "image/webp",
  bmp: "image/bmp",
  ico: "image/x-icon",
};

export function mimeTypeForImagePath(path: string): string {
  const ext = path.split(".").pop()?.toLowerCase() ?? "";
  return MIME_BY_EXTENSION[ext] ?? "application/octet-stream";
}
