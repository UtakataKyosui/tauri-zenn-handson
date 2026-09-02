import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

export const Route = createFileRoute("/books/$bookId")({
  component: BookDetail,
});

function BookDetail() {
  const { t } = useTranslation();
  const { bookId } = Route.useParams();

  return (
    <div className="mx-auto flex max-w-md flex-col gap-4">
      <h1 className="text-2xl font-semibold">{t("books.detail.title")}</h1>
      <p className="text-sm text-muted-foreground">{t("books.detail.id", { bookId })}</p>
    </div>
  );
}
