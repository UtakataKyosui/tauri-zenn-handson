// GEN-05: ロケール JSON（正本: src/locales/ja.json）から翻訳キーの型を生成し、
// ロケール間で欠落しているキー（未翻訳キー）を検出する。
// 実行: `pnpm generate:i18n-types`
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = fileURLToPath(new URL(".", import.meta.url));
const localesDir = resolve(scriptDir, "../src/locales");

const LOCALES = ["ja", "en"] as const;
const BASE_LOCALE = "ja";

function flattenKeys(obj: Record<string, unknown>, prefix = ""): string[] {
  return Object.entries(obj).flatMap(([key, value]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    return typeof value === "object" && value !== null
      ? flattenKeys(value as Record<string, unknown>, path)
      : [path];
  });
}

const locales = Object.fromEntries(
  LOCALES.map((locale) => [
    locale,
    JSON.parse(readFileSync(resolve(localesDir, `${locale}.json`), "utf-8")),
  ]),
) as Record<(typeof LOCALES)[number], Record<string, unknown>>;

const baseKeys = new Set(flattenKeys(locales[BASE_LOCALE]));

let hasMissingKeys = false;
for (const locale of LOCALES) {
  if (locale === BASE_LOCALE) continue;
  const keys = new Set(flattenKeys(locales[locale]));

  const missing = [...baseKeys].filter((k) => !keys.has(k));
  const extra = [...keys].filter((k) => !baseKeys.has(k));

  if (missing.length > 0) {
    hasMissingKeys = true;
    console.error(`[i18n] ${locale}.json is missing keys: ${missing.join(", ")}`);
  }
  if (extra.length > 0) {
    hasMissingKeys = true;
    console.error(
      `[i18n] ${locale}.json has keys not present in ${BASE_LOCALE}.json: ${extra.join(", ")}`,
    );
  }
}

const output = `// このファイルは自動生成されます。手編集しないでください（GEN-03）。
// 生成: \`pnpm generate:i18n-types\`（正本: src/locales/${BASE_LOCALE}.json）
export type TranslationKey =
${[...baseKeys].map((k) => `  | "${k}"`).join("\n")};
`;

writeFileSync(resolve(scriptDir, "../src/locales/keys.gen.ts"), output);
console.log(`generated ${baseKeys.size} translation keys -> src/locales/keys.gen.ts`);

if (hasMissingKeys) {
  console.error("\n未翻訳キーが見つかりました（GEN-05）。上記を修正してください。");
  process.exit(1);
}
