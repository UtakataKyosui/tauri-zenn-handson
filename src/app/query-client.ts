import { QueryClient } from "@tanstack/react-query";

/**
 * ルータの `context`（`router.tsx`）と `QueryClientProvider`（`providers.tsx`）が同じ
 * インスタンスを参照できるよう、モジュールスコープの単一インスタンスとして定義する。
 * ルートの `loader` から `context.queryClient.ensureQueryData` で先読みするには、
 * ルータ生成時点でこのインスタンスが確定している必要がある（#9）。
 */
export const queryClient = new QueryClient();
