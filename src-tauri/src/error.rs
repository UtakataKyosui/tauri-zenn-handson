use serde::Serialize;

/// コマンド層の統一エラー型。`app_core::CoreError` をそのまま包み、フロントには
/// serde を通じて型付きで伝わる（RS-04）。コマンド内で `unwrap()` / `expect()` は使わず、
/// 必ずこの型に変換して `Result` として返すこと（レビュー観点 §2）。
///
/// `Database` / `Migration` / `Path` は `sqlx::Error` / `sqlx::migrate::MigrateError` /
/// `tauri::Error` をそれぞれ表す（#5）。これら3つは `Serialize` を実装しないため
/// `#[from]` で直接包めず、メッセージを文字列化した上で保持する。DB 接続自体のエラーは
/// `app_core::CoreError::Internal` に正規化されるため（`crates/core/src/domain/notes.rs`
/// 参照）、ここでの `Database` / `Migration` / `Path` は起動時のセットアップや今後の
/// コマンド実装が `?` でそのまま伝搬できるようにするための受け皿である。
#[derive(Debug, thiserror::Error, Serialize, specta::Type)]
#[serde(tag = "kind", content = "message")]
pub enum AppError {
    #[error(transparent)]
    Core(#[from] app_core::CoreError),

    #[error("io error: {0}")]
    Io(String),

    #[error("database error: {0}")]
    Database(String),

    #[error("migration error: {0}")]
    Migration(String),

    #[error("path resolution error: {0}")]
    Path(String),

    /// #14: `lookup_isbn` が openBD を呼ぶ際のHTTP通信の失敗（タイムアウト・DNS解決失敗等）。
    #[error("network error: {0}")]
    Network(String),
}

impl From<sqlx::Error> for AppError {
    fn from(err: sqlx::Error) -> Self {
        Self::Database(err.to_string())
    }
}

impl From<sqlx::migrate::MigrateError> for AppError {
    fn from(err: sqlx::migrate::MigrateError) -> Self {
        Self::Migration(err.to_string())
    }
}

impl From<tauri::Error> for AppError {
    fn from(err: tauri::Error) -> Self {
        Self::Path(err.to_string())
    }
}

impl From<reqwest::Error> for AppError {
    fn from(err: reqwest::Error) -> Self {
        Self::Network(err.to_string())
    }
}

pub type AppResult<T> = Result<T, AppError>;
