import { Button } from "@/components/ui/button";
import { useGreet } from "@/hooks/use-greeting";
import { useToastStore } from "@/stores/toast-store";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";

export const Route = createFileRoute("/")({
  component: HomePage,
});

function HomePage() {
  const { t } = useTranslation();
  const [name, setName] = useState("World");
  const greet = useGreet();
  const pushToast = useToastStore((s) => s.push);

  return (
    <div className="mx-auto flex max-w-md flex-col gap-4">
      <h1 className="text-2xl font-semibold">{t("home.title")}</h1>
      <input
        className="rounded-md border border-input bg-background px-3 py-2 text-sm"
        value={name}
        onChange={(e) => setName(e.target.value)}
        aria-label={t("home.nameInput")}
      />
      <Button
        onClick={() =>
          greet.mutate(name, {
            onError: (error) => pushToast({ title: error.message, variant: "destructive" }),
          })
        }
        disabled={greet.isPending}
      >
        {greet.isPending ? t("home.loading") : t("home.greet")}
      </Button>
      {greet.data && <p className="text-sm text-muted-foreground">{greet.data}</p>}
    </div>
  );
}
