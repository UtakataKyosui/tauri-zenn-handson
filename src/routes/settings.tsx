import { useTheme } from "@/hooks/use-theme";
import type { Theme } from "@/stores/ui-store";
import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

export const Route = createFileRoute("/settings")({
  component: SettingsPage,
});

const THEMES: Theme[] = ["light", "dark", "system"];

const LANGUAGES = ["ja", "en"] as const;

function SettingsPage() {
  const { t, i18n } = useTranslation();
  const { theme, setTheme } = useTheme();

  return (
    <div className="mx-auto flex max-w-md flex-col gap-4">
      <h1 className="text-2xl font-semibold">{t("settings.title")}</h1>
      <fieldset className="flex flex-col gap-2">
        <legend className="text-sm font-medium">{t("settings.theme")}</legend>
        {THEMES.map((option) => (
          <label key={option} className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              name="theme"
              checked={theme === option}
              onChange={() => setTheme(option)}
            />
            {t(`settings.themes.${option}`)}
          </label>
        ))}
      </fieldset>
      <fieldset className="flex flex-col gap-2">
        <legend className="text-sm font-medium">{t("settings.language")}</legend>
        <select
          className="w-fit rounded-md border border-input bg-background px-2 py-1 text-sm"
          value={i18n.resolvedLanguage}
          onChange={(e) => i18n.changeLanguage(e.target.value)}
        >
          {LANGUAGES.map((lng) => (
            <option key={lng} value={lng}>
              {lng.toUpperCase()}
            </option>
          ))}
        </select>
      </fieldset>
    </div>
  );
}
