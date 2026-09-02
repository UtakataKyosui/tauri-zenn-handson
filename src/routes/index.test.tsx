import i18n from "@/app/i18n";
import { useToastStore } from "@/stores/toast-store";
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
import { beforeEach, describe, expect, it, vi } from "vitest";
import { BookList } from "./index";

// #12: 書き出しボタンは `@tauri-apps/plugin-dialog`（保存先選択）、
// `@tauri-apps/plugin-notification`（完了通知）、`@tauri-apps/plugin-opener`
// （保存先を開く）を呼ぶため、`books.$bookId.test.tsx`/`demo.test.tsx` と同じ
// `vi.hoisted` + `vi.mock` パターンでモックする。
// #14: `isMobile()`（`@tauri-apps/plugin-os` の `platform()`）を呼ぶため、
// `demo.test.tsx` と同じくモックしないと未定義呼び出しで例外になる。既定値は
// デスクトップ（"windows"）にし、スキャン系のテストだけモバイルに切り替える。
const {
  saveMock,
  isPermissionGranted,
  requestPermission,
  sendNotification,
  revealItemInDir,
  platformMock,
  confirmMock,
  scanMock,
  lookupIsbnMock,
  vibrateMock,
} = vi.hoisted(() => ({
  saveMock: vi.fn(),
  isPermissionGranted: vi.fn(),
  requestPermission: vi.fn(),
  sendNotification: vi.fn(),
  revealItemInDir: vi.fn(),
  platformMock: vi.fn().mockReturnValue("windows"),
  confirmMock: vi.fn(),
  scanMock: vi.fn(),
  lookupIsbnMock: vi.fn(),
  vibrateMock: vi.fn(),
}));

vi.mock("@tauri-apps/plugin-dialog", () => ({ save: saveMock, confirm: confirmMock }));
vi.mock("@tauri-apps/plugin-notification", () => ({
  isPermissionGranted,
  requestPermission,
  sendNotification,
}));
vi.mock("@tauri-apps/plugin-opener", () => ({ revealItemInDir }));
vi.mock("@tauri-apps/plugin-os", () => ({ platform: platformMock }));
vi.mock("@tauri-apps/plugin-barcode-scanner", () => ({
  scan: scanMock,
  Format: { EAN13: "EAN_13" },
}));
vi.mock("@tauri-apps/plugin-haptics", () => ({ vibrate: vibrateMock }));
vi.mock("@/lib/api/isbn", () => ({ lookupByIsbn: lookupIsbnMock }));

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
  // #14: スキャン取り消し時のフォールバック先（`/books/new`）を検証するために必要。
  const bookNewRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/books/new",
    component: () => <p>{i18n.t("books.new.title")}</p>,
  });
  const router = createRouter({
    routeTree: rootRoute.addChildren([indexRoute, bookDetailRoute, bookNewRoute]),
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

  describe("export", () => {
    beforeEach(() => {
      saveMock.mockReset();
      isPermissionGranted.mockReset().mockResolvedValue(true);
      requestPermission.mockReset();
      sendNotification.mockReset();
      revealItemInDir.mockReset().mockResolvedValue(undefined);
      useToastStore.setState({ toasts: [] });
    });

    it("does not export when the save dialog is canceled", async () => {
      const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
      mockCommand("list_books", () => [buildBook()]);
      saveMock.mockResolvedValue(null);
      const user = userEvent.setup();

      renderBookList(queryClient);
      await user.click(
        await screen.findByRole("button", { name: i18n.t("books.list.exportButton") }),
      );

      expect(saveMock).toHaveBeenCalled();
      expect(sendNotification).not.toHaveBeenCalled();
      expect(revealItemInDir).not.toHaveBeenCalled();
    });

    it("exports the books, notifies, and reveals the saved file on success", async () => {
      const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
      let exportedPath: unknown;
      mockCommands({
        list_books: () => [buildBook()],
        export_books: (args) => {
          exportedPath = args.path;
          return 1;
        },
      });
      saveMock.mockResolvedValue("/tmp/books.csv");
      const user = userEvent.setup();

      renderBookList(queryClient);
      await user.click(
        await screen.findByRole("button", { name: i18n.t("books.list.exportButton") }),
      );

      await waitFor(() => {
        expect(sendNotification).toHaveBeenCalledWith({
          title: i18n.t("books.list.exportSuccessTitle"),
          body: i18n.t("books.list.exportSuccessBody", { count: 1 }),
        });
      });
      expect(exportedPath).toBe("/tmp/books.csv");
      expect(revealItemInDir).toHaveBeenCalledWith("/tmp/books.csv");
    });

    it("pushes a destructive toast when the export command fails", async () => {
      const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
      mockCommands({
        list_books: () => [buildBook()],
        export_books: () => {
          throw { kind: "Io", message: "disk full" };
        },
      });
      saveMock.mockResolvedValue("/tmp/books.csv");
      const user = userEvent.setup();

      renderBookList(queryClient);
      await user.click(
        await screen.findByRole("button", { name: i18n.t("books.list.exportButton") }),
      );

      await waitFor(() => {
        expect(
          useToastStore.getState().toasts.some((toast) => toast.variant === "destructive"),
        ).toBe(true);
      });
      expect(sendNotification).not.toHaveBeenCalled();
    });
  });

  describe("scan", () => {
    beforeEach(() => {
      platformMock.mockReset().mockReturnValue("windows");
      confirmMock.mockReset();
      scanMock.mockReset();
      lookupIsbnMock.mockReset();
      vibrateMock.mockReset().mockResolvedValue(undefined);
      isPermissionGranted.mockReset().mockResolvedValue(true);
      sendNotification.mockReset();
      useToastStore.setState({ toasts: [] });
    });

    it("does not show the scan button on desktop", async () => {
      const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
      mockCommand("list_books", () => [buildBook()]);

      renderBookList(queryClient);

      await screen.findByRole("button", { name: i18n.t("books.list.exportButton") });
      expect(
        screen.queryByRole("button", { name: i18n.t("books.list.scanButton") }),
      ).not.toBeInTheDocument();
    });

    it("scans, confirms, registers, notifies, and vibrates on a mobile platform", async () => {
      platformMock.mockReturnValue("android");
      const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
      mockCommands({
        list_books: () => [buildBook()],
        create_book: () => buildBook({ id: 9, title: "Readable Code", isbn: "9784873115658" }),
      });
      scanMock.mockResolvedValue({ content: "9784873115658", format: "EAN_13", bounds: {} });
      lookupIsbnMock.mockResolvedValue({ title: "Readable Code", author: "Dustin Boswell" });
      confirmMock.mockResolvedValue(true);
      const user = userEvent.setup();

      renderBookList(queryClient);
      await user.click(
        await screen.findByRole("button", { name: i18n.t("books.list.scanButton") }),
      );

      await waitFor(() => {
        expect(confirmMock).toHaveBeenCalledWith(
          i18n.t("books.list.scanConfirm", { title: "Readable Code", author: "Dustin Boswell" }),
        );
      });
      await waitFor(() => {
        expect(sendNotification).toHaveBeenCalledWith({
          title: i18n.t("books.list.scanSuccessTitle"),
          body: i18n.t("books.list.scanSuccessBody", { title: "Readable Code" }),
        });
      });
      expect(vibrateMock).toHaveBeenCalledWith(200);
    });

    it("does not register when the confirmation is declined", async () => {
      platformMock.mockReturnValue("android");
      const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
      let createCalled = false;
      mockCommands({
        list_books: () => [buildBook()],
        create_book: () => {
          createCalled = true;
          return buildBook();
        },
      });
      scanMock.mockResolvedValue({ content: "9784873115658", format: "EAN_13", bounds: {} });
      lookupIsbnMock.mockResolvedValue({ title: "Readable Code", author: "Dustin Boswell" });
      confirmMock.mockResolvedValue(false);
      const user = userEvent.setup();

      renderBookList(queryClient);
      await user.click(
        await screen.findByRole("button", { name: i18n.t("books.list.scanButton") }),
      );

      await waitFor(() => expect(confirmMock).toHaveBeenCalled());
      expect(createCalled).toBe(false);
    });

    it("falls back to the manual entry screen when the scan is canceled", async () => {
      platformMock.mockReturnValue("android");
      const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
      mockCommand("list_books", () => [buildBook()]);
      scanMock.mockRejectedValue(new Error("scan canceled"));
      const user = userEvent.setup();

      renderBookList(queryClient);
      await user.click(
        await screen.findByRole("button", { name: i18n.t("books.list.scanButton") }),
      );

      await waitFor(() => {
        expect(screen.getByText(i18n.t("books.new.title"))).toBeInTheDocument();
      });
      expect(lookupIsbnMock).not.toHaveBeenCalled();
    });
  });
});
