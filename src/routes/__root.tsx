import { Link, Outlet, createRootRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

export const Route = createRootRoute({
  component: RootLayout,
});

const NAV_ITEMS = [
  { to: "/", key: "nav.home" },
  { to: "/settings", key: "nav.settings" },
  { to: "/demo", key: "nav.demo" },
] as const;

// FE-07: レスポンシブ設計。`sm`（640px）を境に、デスクトップ幅では上部の横並びナビ、
// モバイル幅ではタッチ操作しやすい下部タブバーに切り替える。`isDesktop()`/`isMobile()`
// による実行時プラットフォーム分岐（src/lib/platform.ts）とは独立した、画面幅ベースの
// 切り替えであり、デスクトップウィンドウを狭めた場合にも同じ恩恵がある。
function RootLayout() {
  const { t } = useTranslation();

  return (
    <div className="flex min-h-screen flex-col">
      <nav className="hidden gap-4 border-b border-border px-4 py-3 pt-safe-top sm:flex">
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            activeOptions={item.to === "/" ? { exact: true } : undefined}
            className="text-sm font-medium [&.active]:text-primary"
          >
            {t(item.key)}
          </Link>
        ))}
      </nav>
      <main className="flex-1 p-4 pb-24 sm:pb-safe-bottom">
        <Outlet />
      </main>
      <nav className="fixed inset-x-0 bottom-0 flex justify-around border-t border-border bg-background pb-safe-bottom sm:hidden">
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            activeOptions={item.to === "/" ? { exact: true } : undefined}
            className="flex-1 py-3 text-center text-sm font-medium [&.active]:text-primary"
          >
            {t(item.key)}
          </Link>
        ))}
      </nav>
    </div>
  );
}
