import en from "@/locales/en.json";
import ja from "@/locales/ja.json";
import i18n from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { initReactI18next } from "react-i18next";

// FE-08: 日英 2 ロケール、OS ロケール追従。言語切替 UI と未翻訳キー検出は
// Phase 3（#19, GEN-05）で拡張する。
i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      ja: { translation: ja },
    },
    fallbackLng: "en",
    supportedLngs: ["en", "ja"],
    interpolation: { escapeValue: false },
  });

export default i18n;
