import { create } from "zustand";

export type Theme = "light" | "dark" | "system";

interface UiState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

/**
 * FE-04: Zustand は UI の状態のみを持つ（Rust から取得するデータは TanStack Query
 * `src/hooks/` 側に置く）。
 */
export const useUiStore = create<UiState>((set) => ({
  theme: "system",
  setTheme: (theme) => set({ theme }),
}));
