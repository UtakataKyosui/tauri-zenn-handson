// GEN-04/GEN-06: 機能追加のスキャフォールド。core・コマンド・フロントの型・テスト一式を
// Red 状態（失敗するテストを含む状態）で生成する 1 コマンド。
//
// 実行例: pnpm scaffold:feature widget
//
// 生成後にやること（自動化しきれない配線。理由は下記参照）:
//   1. src-tauri/src/specta_bindings.rs の collect_commands! に `crate::commands::<name>::get_<name>` を追加
//   2. `pnpm generate:bindings` を実行して bindings.ts を更新
//   3. crates/core/src/domain/<name>.rs の TODO を実装し、テストを Green にする
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = fileURLToPath(new URL(".", import.meta.url));
const root = resolve(scriptDir, "..");

const rawName = process.argv[2];
if (!rawName || !/^[a-z][a-z0-9-]*$/.test(rawName)) {
  console.error("Usage: pnpm scaffold:feature <kebab-case-name>");
  process.exit(1);
}

const kebab = rawName;
const snake = kebab.replace(/-/g, "_");
const pascal = kebab
  .split("-")
  .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
  .join("");

function write(path: string, content: string) {
  const full = resolve(root, path);
  mkdirSync(resolve(full, ".."), { recursive: true });
  if (existsSync(full)) {
    console.error(`skip (already exists): ${path}`);
    return;
  }
  writeFileSync(full, content);
  console.log(`created ${path}`);
}

// 1. crates/core: ドメインロジック + 失敗するテスト（Red）
write(
  `crates/core/src/domain/${snake}.rs`,
  `use crate::error::CoreResult;

/// TODO(${kebab}): 実装する。まずはこのテストを Green にすることから始める。
pub fn get_${snake}() -> CoreResult<String> {
    todo!("implement ${snake}")
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn todo_replace_with_a_real_behavior_test() {
        // Red: このテストは意図的に失敗する。実装を進めたら書き換えること。
        let _ = get_${snake}();
        panic!("TODO: implement ${snake} and replace this test");
    }
}
`,
);

// 2. crates/core/src/domain/mod.rs にモジュールを登録
const domainModPath = resolve(root, "crates/core/src/domain/mod.rs");
const domainMod = readFileSync(domainModPath, "utf-8");
if (!domainMod.includes(`mod ${snake};`)) {
  const updated = domainMod.replace(/^(mod greeting;)/m, `$1\npub mod ${snake};`);
  writeFileSync(domainModPath, updated);
  console.log(`updated crates/core/src/domain/mod.rs (added pub mod ${snake};)`);
}

// 3. src-tauri: コマンドのアダプタ + 統合テスト（Red）
write(
  `src-tauri/src/commands/${snake}.rs`,
  `use crate::error::AppResult;

#[tauri::command]
#[specta::specta]
pub fn get_${snake}() -> AppResult<String> {
    Ok(app_core::domain::${snake}::get_${snake}()?)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    #[ignore = "TODO(${kebab}): app_core::domain::${snake} を実装してから有効化する"]
    fn todo_replace_with_a_real_behavior_test() {
        get_${snake}().unwrap();
    }
}
`,
);

const commandsModPath = resolve(root, "src-tauri/src/commands/mod.rs");
const commandsMod = readFileSync(commandsModPath, "utf-8");
if (!commandsMod.includes(`mod ${snake};`)) {
  const updated = `${commandsMod}pub mod ${snake};\npub use ${snake}::get_${snake};\n`;
  writeFileSync(commandsModPath, updated);
  console.log(`updated src-tauri/src/commands/mod.rs (added ${snake})`);
}

// 4. フロント: API ラッパ + hook + 失敗するテスト（Red）
write(
  `src/lib/api/${kebab}.ts`,
  `import { commands } from "@/lib/bindings";

export async function get${pascal}(): Promise<string> {
  const result = await commands.get${pascal}();
  if (result.status === "error") throw new Error(JSON.stringify(result.error));
  return result.data;
}
`,
);

write(
  `src/hooks/use-${kebab}.ts`,
  `import { useQuery } from "@tanstack/react-query";
import { get${pascal} } from "@/lib/api/${kebab}";

export function use${pascal}() {
  return useQuery({ queryKey: ["${kebab}"], queryFn: get${pascal} });
}
`,
);

write(
  `src/lib/api/${kebab}.test.ts`,
  `import { describe, expect, it } from "vitest";
import { mockCommand } from "@/test/mocks/tauri";
import { get${pascal} } from "./${kebab}";

describe("get${pascal}", () => {
  it.todo("TODO(${kebab}): mock the get_${snake} command and assert the wrapped result");

  it("fails until the command is implemented (Red)", async () => {
    mockCommand("get_${snake}", () => {
      throw new Error("not implemented yet");
    });
    await expect(get${pascal}()).rejects.toThrow();
  });
});
`,
);

console.log(`
--- 次にやること ---
1. src-tauri/src/specta_bindings.rs の collect_commands! に
   crate::commands::${snake}::get_${snake} を追加する
2. pnpm generate:bindings を実行する
3. crates/core/src/domain/${snake}.rs と src-tauri/src/commands/${snake}.rs の
   TODO を実装し、テストを Green にする（Red → Green → Refactor）
4. 必要なら src-tauri/capabilities/*.json に権限を追加する
`);
