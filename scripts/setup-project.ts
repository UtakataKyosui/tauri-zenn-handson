// BASE-05: アプリ名・識別子・アイコンを一括で差し替えるセットアップスクリプト。
// このテンプレートから新規プロジェクトを始めるときに 1 回だけ実行する（DOC-03 参照）。
//
// 実行例:
//   pnpm tsx scripts/setup-project.ts --name "My App" --identifier com.example.my-app
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const scriptDir = fileURLToPath(new URL(".", import.meta.url));
const root = new URL("../", `file://${scriptDir}`);

function arg(name: string): string | undefined {
  const idx = process.argv.indexOf(`--${name}`);
  return idx === -1 ? undefined : process.argv[idx + 1];
}

const name = arg("name");
const identifier = arg("identifier");

if (!name || !identifier) {
  console.error(
    'Usage: pnpm tsx scripts/setup-project.ts --name "My App" --identifier com.example.my-app',
  );
  process.exit(1);
}

function replaceInFile(path: string, replacements: [RegExp, string][]) {
  const full = new URL(path, root);
  let content = readFileSync(full, "utf-8");
  for (const [pattern, replacement] of replacements) {
    content = content.replace(pattern, replacement);
  }
  writeFileSync(full, content);
  console.log(`updated ${path}`);
}

replaceInFile("src-tauri/tauri.conf.json", [
  [/"productName":\s*".*?"/, `"productName": "${name}"`],
  [/"identifier":\s*".*?"/, `"identifier": "${identifier}"`],
]);

replaceInFile("package.json", [[/"name":\s*".*?"/, `"name": "${slugify(name)}"`]]);

replaceInFile("index.html", [[/<title>.*?<\/title>/, `<title>${name}</title>`]]);

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

console.log(
  "\nアイコンの差し替えは `pnpm tauri icon path/to/icon.png` を実行してください（GEN-07）。",
);
