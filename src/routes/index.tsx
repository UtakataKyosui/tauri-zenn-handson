import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { bookListQuery, useCreateBook } from "@/hooks/use-books";
import { useDefaultSort } from "@/hooks/use-default-sort";
import { useTauriEvent } from "@/hooks/use-tauri-event";
import { scanIsbn } from "@/lib/api/barcode";
import { exportBooks } from "@/lib/api/books";
import { lookupByIsbn } from "@/lib/api/isbn";
import { getExportDir, setExportDir } from "@/lib/api/settings";
import type { Book } from "@/lib/bindings";
import { notifyRegistrationHaptic } from "@/lib/haptics";
import { notify } from "@/lib/notify";
import { dirname } from "@/lib/path";
import { isMobile } from "@/lib/platform";
import { useToastStore } from "@/stores/toast-store";
import { useQuery } from "@tanstack/react-query";
import { Link, createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import {
  type ColumnFiltersState,
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { confirm, save } from "@tauri-apps/plugin-dialog";
import { revealItemInDir } from "@tauri-apps/plugin-opener";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

// #10: 絞り込みのキーワードをURLの検索パラメータに載せる。戻る操作で条件ごと復元される。
type BookSearch = { keyword?: string };

export const Route = createFileRoute("/")({
  validateSearch: (search: Record<string, unknown>): BookSearch => ({
    keyword: typeof search.keyword === "string" ? search.keyword : undefined,
  }),
  component: BookList,
});

const columnHelper = createColumnHelper<Book>();

// #9: 仮データ（#8）を TanStack Query 経由の実データ取得に置き換える。
// #10: 一覧を並び替え・絞り込みのできる表に変える。
export function BookList() {
  const { t } = useTranslation();
  const { data: books, isPending, error } = useQuery(bookListQuery());
  // `Route.useSearch()`/`Route.useNavigate()` は単体テストが組む簡易ルータでは
  // ルートIDが一致せずエラーになるため、ルートに縛られない汎用フックを使う。
  const { keyword = "" } = useSearch({ strict: false }) as BookSearch;
  const navigate = useNavigate();
  // #15: 一覧の既定の並び順を利用者ごとの設定として保存する（tauri-plugin-store）。
  const [sorting, setSorting] = useDefaultSort();
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [exporting, setExporting] = useState(false);
  const [scanning, setScanning] = useState(false);
  const pushToast = useToastStore((s) => s.push);
  const createBook = useCreateBook();

  const setKeyword = (value: string) => {
    navigate({ to: ".", search: { keyword: value || undefined }, replace: true });
  };

  // #12: 全ての本を CSV に書き出す。保存先の選択をキャンセルした場合（`path === null`）は
  // 何もしない。書き出し後の通知失敗・場所を開く操作の失敗は、書き出し自体は成功しているため
  // エラー表示せず無視する。
  // #15: 書き出しボタンとメニュー（`CmdOrCtrl+E`）の両方から呼ばれる。ボタンは
  // `disabled={exporting}`で連打を防いでいるが、メニューのショートカットはボタンの
  // disabled状態を経由しないため、ここでも進行中の呼び出しを弾く。
  // 直前に選んだ保存先ディレクトリを`export_dir`（メモリ上のみ、次回起動では復元しない）
  // として覚えておき、次回のダイアログの初期表示に使う。
  const handleExport = async () => {
    if (exporting) return;
    setExporting(true);
    try {
      const defaultDir = await getExportDir().catch(() => null);
      const path = await save({
        defaultPath: defaultDir ?? undefined,
        filters: [{ name: t("books.list.csvFilterName"), extensions: ["csv"] }],
      });
      if (path === null) return;

      const count = await exportBooks(path);
      const dir = dirname(path);
      if (dir) await setExportDir(dir).catch(() => {});
      await notify(
        t("books.list.exportSuccessTitle"),
        t("books.list.exportSuccessBody", { count }),
      ).catch(() => {});
      await revealItemInDir(path).catch(() => {});
    } catch (e) {
      pushToast({
        title: t("books.list.exportError", { message: String(e) }),
        variant: "destructive",
      });
    } finally {
      setExporting(false);
    }
  };

  // #15: デスクトップのメニュー「読書ログを書き出す」（`CmdOrCtrl+E`）から送られる
  // イベントを受け取り、既存の書き出し処理を呼ぶ。
  useTauriEvent("menu://export", () => {
    handleExport();
  });

  // #14: スキャン → ISBN取得 → 書誌情報API → 確認ダイアログ → 登録 → 通知・ハプティクス、
  // の流れ。スキャンの取り消しやカメラ権限拒否時は例外が起きるので、ISBN手入力の画面
  // （/books/new）へフォールバックし、アプリが落ちないようにする。書誌情報の取得や
  // 登録自体の失敗は `useCreateBook` の `onError` が既存のトースト通知で伝える。
  const handleScan = async () => {
    setScanning(true);
    let isbn: string;
    let info: { title: string; author: string };
    try {
      isbn = await scanIsbn();
      info = await lookupByIsbn(isbn);
    } catch {
      setScanning(false);
      navigate({ to: "/books/new" });
      return;
    }
    try {
      const confirmed = await confirm(
        t("books.list.scanConfirm", { title: info.title || isbn, author: info.author }),
      );
      if (!confirmed) return;

      const book = await createBook.mutateAsync({
        title: info.title,
        author: info.author,
        status: "unread",
        note: "",
        genre: "other",
        isbn,
      });
      await notify(
        t("books.list.scanSuccessTitle"),
        t("books.list.scanSuccessBody", { title: book.title }),
      ).catch(() => {});
      await notifyRegistrationHaptic();
    } finally {
      setScanning(false);
    }
  };

  const genreLabel: Record<Book["genre"], string> = {
    novel: t("books.genre.novel"),
    non_fiction: t("books.genre.non_fiction"),
    business: t("books.genre.business"),
    technology: t("books.genre.technology"),
    other: t("books.genre.other"),
  };

  const columns = useMemo(
    () => [
      columnHelper.accessor("title", {
        header: t("books.form.title"),
        cell: (info) => (
          <Link
            to="/books/$bookId"
            params={{ bookId: String(info.row.original.id) }}
            className="font-medium [&.active]:text-primary"
          >
            {info.getValue()}
          </Link>
        ),
      }),
      columnHelper.accessor("author", { header: t("books.form.author") }),
      columnHelper.accessor("status", {
        header: t("books.form.status"),
        cell: (info) => t(`books.status.${info.getValue()}`),
      }),
      columnHelper.accessor("genre", {
        header: t("books.form.genre"),
        cell: (info) => t(`books.genre.${info.getValue()}`),
      }),
      columnHelper.accessor("created_at", {
        header: t("books.list.createdAt"),
        cell: (info) => new Date(info.getValue()).toLocaleDateString(),
      }),
    ],
    [t],
  );

  const table = useReactTable({
    data: books ?? [],
    columns,
    state: { sorting, globalFilter: keyword, columnFilters },
    onSortingChange: setSorting,
    onGlobalFilterChange: (updater) => {
      const next = typeof updater === "function" ? updater(keyword) : updater;
      setKeyword(next);
    },
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  const genreFilter = (table.getColumn("genre")?.getFilterValue() as string) ?? "all";

  if (isPending) {
    return <p className="text-sm text-muted-foreground">{t("books.list.loading")}</p>;
  }
  if (error) {
    return (
      <p className="text-sm text-destructive">
        {t("books.list.error", { message: error.message })}
      </p>
    );
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">{t("books.list.title")}</h1>
        <div className="flex gap-2">
          {/* #14: バーコードスキャンはカメラを使うモバイル専用機能のため、
              `isDesktop()` と対になる `isMobile()` で絞る（`demo.tsx` と同じ判定パターン）。 */}
          {isMobile() && (
            <Button type="button" variant="outline" onClick={handleScan} disabled={scanning}>
              {scanning ? t("books.list.scanning") : t("books.list.scanButton")}
            </Button>
          )}
          <Button type="button" variant="outline" onClick={handleExport} disabled={exporting}>
            {exporting ? t("books.list.exporting") : t("books.list.exportButton")}
          </Button>
        </div>
      </div>
      <Input
        value={keyword}
        onChange={(e) => setKeyword(e.target.value)}
        placeholder={t("books.list.keywordPlaceholder")}
      />
      <Select
        value={genreFilter}
        onValueChange={(value) =>
          table.getColumn("genre")?.setFilterValue(value === "all" ? undefined : value)
        }
      >
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t("books.list.allGenres")}</SelectItem>
          {(Object.keys(genreLabel) as Book["genre"][]).map((genre) => (
            <SelectItem key={genre} value={genre}>
              {genreLabel[genre]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((group) => (
            <TableRow key={group.id}>
              {group.headers.map((header) => (
                <TableHead
                  key={header.id}
                  onClick={header.column.getToggleSortingHandler()}
                  className="cursor-pointer"
                >
                  {flexRender(header.column.columnDef.header, header.getContext())}
                  {header.column.getIsSorted() === "asc" && " ▲"}
                  {header.column.getIsSorted() === "desc" && " ▼"}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.map((row) => (
            <TableRow key={row.id}>
              {row.getVisibleCells().map((cell) => (
                <TableCell key={cell.id}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
