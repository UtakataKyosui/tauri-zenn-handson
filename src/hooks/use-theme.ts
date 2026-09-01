import { useUiStore } from "@/stores/ui-store";
import { useEffect } from "react";

/**
 * FE-02: ライト／ダーク／OS 追従のテーマ切替。`.dark` クラスの付与だけを行い、
 * 実際の色はトークン（src/styles/globals.css）が持つ。
 */
export function useTheme() {
  const theme = useUiStore((s) => s.theme);
  const setTheme = useUiStore((s) => s.setTheme);

  useEffect(() => {
    const root = document.documentElement;
    const media = window.matchMedia("(prefers-color-scheme: dark)");

    const apply = () => {
      const isDark = theme === "dark" || (theme === "system" && media.matches);
      root.classList.toggle("dark", isDark);
    };

    apply();

    if (theme === "system") {
      media.addEventListener("change", apply);
      return () => media.removeEventListener("change", apply);
    }
    return undefined;
  }, [theme]);

  return { theme, setTheme };
}
