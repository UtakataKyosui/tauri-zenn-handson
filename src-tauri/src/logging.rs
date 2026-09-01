//! RS-07: 構造化ロギング。ファイル出力 + ローテーション + レベルの環境変数制御。
//!
//! ログは OS 標準のアプリデータディレクトリ配下に出力される（tauri-plugin-log の
//! `Target::LogDir` が `app.path().app_log_dir()` を使う）。レベルは `RUST_LOG`
//! （未設定時は `info`）で制御する。機密情報（トークン・鍵）は絶対にログに出さないこと
//! （レビュー観点 §1, SEC-04）。

use tauri_plugin_log::{Target, TargetKind};

pub fn plugin<R: tauri::Runtime>() -> tauri::plugin::TauriPlugin<R> {
    let level = std::env::var("RUST_LOG")
        .ok()
        .and_then(|v| v.parse::<log::LevelFilter>().ok())
        .unwrap_or(log::LevelFilter::Info);

    tauri_plugin_log::Builder::new()
        .level(level)
        .targets([
            Target::new(TargetKind::Stdout),
            Target::new(TargetKind::LogDir { file_name: None }),
        ])
        .max_file_size(5 * 1024 * 1024)
        .rotation_strategy(tauri_plugin_log::RotationStrategy::KeepAll)
        .build()
}
