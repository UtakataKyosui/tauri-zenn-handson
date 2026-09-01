import { greet } from "@/lib/api/greeting";
import { useMutation } from "@tanstack/react-query";

/**
 * FE-04: Rust 呼び出しは TanStack Query（ローディング・エラー・キャッシュを一元化）、
 * UI のみの状態は Zustand（`src/stores/`）を使う、という使い分け規約のサンプル。
 */
export function useGreet() {
  return useMutation({
    mutationFn: (name: string) => greet(name),
  });
}
