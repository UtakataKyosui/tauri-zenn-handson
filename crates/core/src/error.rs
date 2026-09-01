use serde::Serialize;

/// アプリ全体で共有する統一エラー型（RS-04）。
///
/// `crates/core` の全ての公開関数はこの型（または個別の `thiserror` 型を経由してこの型へ
/// 変換されるもの）を返す。`src-tauri` のコマンド層はこれを `serde` でフロントへシリアライズする。
#[derive(Debug, thiserror::Error, Serialize, specta::Type)]
#[serde(tag = "kind", content = "message")]
pub enum CoreError {
    #[error("invalid input: {0}")]
    InvalidInput(String),

    #[error("not found: {0}")]
    NotFound(String),

    #[error("internal error")]
    Internal,
}

pub type CoreResult<T> = Result<T, CoreError>;
