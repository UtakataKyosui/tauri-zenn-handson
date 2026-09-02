//! #15: リクエスト単位・セッション単位でしか使わない一時的な値の置き場。
//!
//! `export_dir` は書き出すたびにダイアログで選び直す設計のため、次回の起動でも
//! 同じ値を使いたいわけではない。`tauri_plugin_store` で永続化するのはこの意図に
//! 反するため、`app.manage(Mutex<Settings>)` でメモリ上だけに置く。

use std::path::PathBuf;

#[derive(Default)]
pub struct Settings {
    pub export_dir: Option<PathBuf>,
}
