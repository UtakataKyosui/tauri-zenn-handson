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
import { bookListQuery } from "@/hooks/use-books";
import type { Book } from "@/lib/bindings";
import { useQuery } from "@tanstack/react-query";
import { Link, createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import {
  type ColumnFiltersState,
  type SortingState,
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
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
  const [sorting, setSorting] = useState<SortingState>([{ id: "created_at", desc: true }]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

  const setKeyword = (value: string) => {
    navigate({ to: ".", search: { keyword: value || undefined }, replace: true });
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
      <h1 className="text-2xl font-semibold">{t("books.list.title")}</h1>
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
