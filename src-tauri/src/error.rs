use serde::Serialize;

/// コマンド層の統一エラー型。`app_core::CoreError` をそのまま包み、フロントには
/// serde を通じて型付きで伝わる（RS-04）。コマンド内で `unwrap()` / `expect()` は使わず、
/// 必ずこの型に変換して `Result` として返すこと（レビュー観点 §2）。
#[derive(Debug, thiserror::Error, Serialize, specta::Type)]
#[serde(tag = "kind", content = "message")]
pub enum AppError {
    #[error(transparent)]
    Core(#[from] app_core::CoreError),

    #[error("io error: {0}")]
    Io(String),
}

pub type AppResult<T> = Result<T, AppError>;
