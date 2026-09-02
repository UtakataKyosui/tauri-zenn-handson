import i18n from "@/app/i18n";
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
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { BookNew } from "./books.new";

// `BookNew` は保存成功後に `/books/$bookId` へ遷移するため、`index.test.tsx` と同じく
// テスト専用の最小限のルートツリーを組む。
function renderBookNew(queryClient: QueryClient) {
  const rootRoute = createRootRoute();
  const newBookRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/books/new",
    component: BookNew,
  });
  const bookDetailRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/books/$bookId",
    component: () => <p>book detail</p>,
  });
  const router = createRouter({
    routeTree: rootRoute.addChildren([newBookRoute, bookDetailRoute]),
    history: createMemoryHistory({ initialEntries: ["/books/new"] }),
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );
}

describe("BookNew", () => {
  it("disables the submit button while the title is empty", async () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    renderBookNew(queryClient);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: i18n.t("books.form.submit") })).toBeDisabled();
    });
  });

  it("shows a validation error once the title field has been touched", async () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const user = userEvent.setup();
    renderBookNew(queryClient);

    const titleInput = await screen.findByLabelText(i18n.t("books.form.title"));
    await user.click(titleInput);
    await user.tab();

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(i18n.t("books.form.titleError"));
    });
  });

  it("shows a validation error when the isbn has an invalid format", async () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const user = userEvent.setup();
    renderBookNew(queryClient);

    const isbnInput = await screen.findByLabelText(i18n.t("books.form.isbn"));
    await user.type(isbnInput, "1234567890123");

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(i18n.t("books.form.isbnError"));
    });
  });

  it("creates a book and navigates to its detail page on submit", async () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const user = userEvent.setup();
    mockCommand("create_book", () => ({
      id: 42,
      title: "Readable Code",
      author: "Dustin Boswell",
      status: "unread",
      note: "",
      genre: "other",
      isbn: "",
      created_at: "2024-01-01T00:00:00Z",
    }));
    renderBookNew(queryClient);

    await user.type(await screen.findByLabelText(i18n.t("books.form.title")), "Readable Code");
    await user.type(screen.getByLabelText(i18n.t("books.form.author")), "Dustin Boswell");

    await waitFor(() => {
      expect(screen.getByRole("button", { name: i18n.t("books.form.submit") })).toBeEnabled();
    });
    await user.click(screen.getByRole("button", { name: i18n.t("books.form.submit") }));

    await waitFor(() => {
      expect(screen.getByText("book detail")).toBeInTheDocument();
    });
  });
});
