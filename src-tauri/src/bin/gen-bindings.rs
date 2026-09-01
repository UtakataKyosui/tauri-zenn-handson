//! `bindings.ts` の生成物専用バイナリ。GUI を起動せず型定義だけを書き出す。
//! 実行: `cargo run --bin gen-bindings`（`pnpm generate:bindings` から呼ばれる）。

fn main() {
    let builder = tauri_app_template_lib::specta_bindings::typed_builder();

    builder
        .export(
            specta_typescript::Typescript::default()
                .header(
                    "// @ts-nocheck\n\
                     // このファイルは自動生成されます。手編集しないでください（GEN-03）。\n\
                     // 生成: `pnpm generate:bindings`\n\
                     // イベント未使用時に生じる未使用シンボルの警告を避けるため型チェック対象から外す。\n",
                )
                // sqlite の INTEGER PRIMARY KEY は i64 になるが、JS の Number で十分な範囲
                // でしか使わない前提のサンプルのため BigInt ではなく number として出力する。
                .bigint(specta_typescript::BigIntExportBehavior::Number),
            "../src/lib/bindings.ts",
        )
        .expect("failed to export typescript bindings");

    println!("generated src/lib/bindings.ts");
}
