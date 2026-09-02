import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

export const Route = createFileRoute("/books/new")({
  component: BookNew,
});

// RT-08: 見出しのみの骨組み。登録フォームの実装は #10 の範囲。
function BookNew() {
  const { t } = useTranslation();

  return (
    <div className="mx-auto flex max-w-md flex-col gap-4">
      <h1 className="text-2xl font-semibold">{t("books.new.title")}</h1>
    </div>
  );
}
