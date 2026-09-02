//! tauri に依存しない純粋ロジック層。
//!
//! `src-tauri` のコマンドはこのクレートの関数を呼び出すだけの薄いアダプタに保つ
//! （docs/testing.md §3, レビュー観点 §2）。

pub mod db;
pub mod domain;
pub mod error;
pub mod isbn;
pub mod net;
pub mod openbd;

pub use error::CoreError;
