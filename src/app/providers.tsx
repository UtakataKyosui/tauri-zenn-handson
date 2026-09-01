import { ErrorBoundary } from "@/components/error-boundary";
import { Toaster } from "@/components/toaster";
import { useDeepLink } from "@/hooks/use-deep-link";
import { useTheme } from "@/hooks/use-theme";
import { closeSplashscreen } from "@/lib/api/splashscreen";
import { useToastStore } from "@/stores/toast-store";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { router } from "./router";
import "./i18n";

export function AppProviders() {
  const [queryClient] = useState(() => new QueryClient());
  useTheme();
  const pushToast = useToastStore((s) => s.push);

  // FE-06: フロントの初期化（Provider のマウント）が終わったらスプラッシュを閉じる。
  // ブラウザプレビュー等 Tauri 外で動かした場合は invoke が失敗するだけなので無視する。
  useEffect(() => {
    closeSplashscreen().catch(() => {});
  }, []);

  // APP-09: ディープリンクを受けたことをここでは可視化するだけ。実際のルーティングや
  // OAuth コールバック処理を追加する場合はこのコールバックの中で行う。
  useDeepLink(useCallback((url) => pushToast({ title: `Deep link: ${url}` }), [pushToast]));

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
        <Toaster />
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
