import i18n from "@/app/i18n";
import { buildBook } from "@/test/factories/book";
import { mockCommand } from "@/test/mocks/tauri";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  RouterProvider,
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";
import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { BookList } from "./index";

// `BookList` は内部で `<Link to="/books/$bookId" />` を使うため、単体でレンダーすると
// ルータコンテキストが無くエラーになる。テスト専用の最小限のルートツリーを組んで、
// 実際のアプリのルートツリー（i18n・ナビ等を含む `RootLayout`）を持ち込まずに検証する。
function renderBookList(queryClient: QueryClient) {
  const rootRoute = createRootRoute();
  const indexRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/",
    component: BookList,
  });
  const bookDetailRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/books/$bookId",
    component: () => null,
  });
  const router = createRouter({
    routeTree: rootRoute.addChildren([indexRoute, bookDetailRoute]),
    history: createMemoryHistory({ initialEntries: ["/"] }),
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );
}

describe("BookList", () => {
  it("shows the loading state before the command resolves", async () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    let resolveBooks: (books: ReturnType<typeof buildBook>[]) => void = () => {};
    const pending = new Promise<ReturnType<typeof buildBook>[]>((resolve) => {
      resolveBooks = resolve;
    });
    mockCommand("list_books", () => pending);

    renderBookList(queryClient);

    await waitFor(() => {
      expect(screen.getByText(i18n.t("books.list.loading"))).toBeInTheDocument();
    });

    resolveBooks([buildBook()]);

    await waitFor(() => {
      expect(screen.queryByText(i18n.t("books.list.loading"))).not.toBeInTheDocument();
    });
  });

  it("renders the books returned by the command", async () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const book = buildBook({ id: 1, title: "Readable Code", author: "Dustin Boswell" });
    mockCommand("list_books", () => [book]);

    renderBookList(queryClient);

    await waitFor(() => {
      expect(screen.getByText("Readable Code")).toBeInTheDocument();
    });
    expect(screen.getByText("Dustin Boswell")).toBeInTheDocument();
  });

  it("shows an error message when the command rejects", async () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const appError = { kind: "Core", message: { kind: "Internal" } };
    mockCommand("list_books", () => {
      throw appError;
    });

    renderBookList(queryClient);

    await waitFor(() => {
      expect(
        screen.getByText(i18n.t("books.list.error", { message: JSON.stringify(appError) })),
      ).toBeInTheDocument();
    });
  });
});
