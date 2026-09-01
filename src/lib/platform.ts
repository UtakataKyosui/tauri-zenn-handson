import { platform } from "@tauri-apps/plugin-os";

export type PlatformKind = "desktop" | "mobile";

const MOBILE_PLATFORMS = new Set(["android", "ios"]);

/**
 * デスクトップ／モバイル判定（§3, レビュー観点 §3）。
 * トレイ・メニュー等デスクトップ専用 UI と、タッチ前提のモバイル UI をここで出し分ける。
 */
export function getPlatformKind(): PlatformKind {
  return MOBILE_PLATFORMS.has(platform()) ? "mobile" : "desktop";
}

export function isDesktop(): boolean {
  return getPlatformKind() === "desktop";
}

export function isMobile(): boolean {
  return getPlatformKind() === "mobile";
}
