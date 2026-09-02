import i18n from "@/app/i18n";
import { bookQuery } from "@/hooks/use-books";
import { buildBook } from "@/test/factories/book";
import { mockCommand, mockCommands } from "@/test/mocks/tauri";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  RouterProvider,
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Route as BookDetailFileRoute } from "./books.$bookId";

// #11: `window.confirm` の代わりに `@tauri-apps/plugin-dialog` の `confirm` を使うため、
// demo.test.tsx と同じ vi.mock + vi.hoisted のパターンでモックする。
const { confirmMock } = vi.hoisted(() => ({
  confirmMock: vi.fn(),
}));

vi.mock("@tauri-apps/plugin-dialog", () => ({ confirm: confirmMock }));

// `BookDetail` の `Route.useParams()`/`Route.useNavigate()` はルートIDの文字列一致で
// 解決されるため、`index.test.tsx` と違い実ファイルルートのコンポーネントをそのまま使う。
function renderBookDetail(queryClient: QueryClient, bookId: number) {
  const rootRoute = createRootRoute();
  const bookDetailRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/books/$bookId",
    component: BookDetailFileRoute.options.component,
    loader: () => queryClient.ensureQueryData(bookQuery(bookId)),
  });
  const indexRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/",
    component: () => <p>book list</p>,
  });
  const router = createRouter({
    routeTree: rootRoute.addChildren([indexRoute, bookDetailRoute]),
    history: createMemoryHistory({ initialEntries: [`/books/${bookId}`] }),
    context: { queryClient },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );
}

describe("BookDetail", () => {
  beforeEach(() => {
    confirmMock.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("pre-fills the edit form with the existing book", async () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const book = buildBook({ id: 1, title: "Readable Code", author: "Dustin Boswell" });
    mockCommand("get_book", () => book);

    renderBookDetail(queryClient, 1);

    const titleInput = (await screen.findByLabelText(
      i18n.t("books.form.title"),
    )) as HTMLInputElement;
    expect(titleInput.value).toBe("Readable Code");
  });

  it("updates the book on submit", async () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const book = buildBook({ id: 1, title: "Readable Code" });
    mockCommands({
      get_book: () => book,
      update_book: () => ({ ...book, title: "Refactoring" }),
    });
    const user = userEvent.setup();

    renderBookDetail(queryClient, 1);

    const titleInput = await screen.findByLabelText(i18n.t("books.form.title"));
    await user.clear(titleInput);
    await user.type(titleInput, "Refactoring");
    await user.click(screen.getByRole("button", { name: i18n.t("books.detail.edit") }));

    await waitFor(() => {
      expect(screen.getByRole("button", { name: i18n.t("books.detail.edit") })).toBeEnabled();
    });
  });

  it("deletes the book after confirmation and navigates to the list", async () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const book = buildBook({ id: 1, title: "Readable Code" });
    mockCommands({
      get_book: () => book,
      delete_book: () => null,
    });
    confirmMock.mockResolvedValue(true);
    const user = userEvent.setup();

    renderBookDetail(queryClient, 1);

    await user.click(await screen.findByRole("button", { name: i18n.t("books.detail.delete") }));

    expect(confirmMock).toHaveBeenCalledWith(
      i18n.t("books.detail.deleteConfirm", { title: "Readable Code" }),
    );
    await waitFor(() => {
      expect(screen.getByText("book list")).toBeInTheDocument();
    });
  });

  it("does not delete the book when the confirmation is declined", async () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const book = buildBook({ id: 1, title: "Readable Code" });
    let deleteCalled = false;
    mockCommands({
      get_book: () => book,
      delete_book: () => {
        deleteCalled = true;
        return null;
      },
    });
    confirmMock.mockResolvedValue(false);
    const user = userEvent.setup();

    renderBookDetail(queryClient, 1);

    await user.click(await screen.findByRole("button", { name: i18n.t("books.detail.delete") }));

    expect(deleteCalled).toBe(false);
    expect(screen.getByRole("button", { name: i18n.t("books.detail.delete") })).toBeInTheDocument();
  });
});
