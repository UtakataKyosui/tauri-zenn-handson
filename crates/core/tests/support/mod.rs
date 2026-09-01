//! QA-13: 統合テスト用のファクトリ。「テストに必要な最小限のデフォルト値」を返し、
//! 個々のテストは差分だけ上書きする（docs/testing.md §8）。

use app_core::db::connect_in_memory;
use sqlx::SqlitePool;

/// テストごとに独立したインメモリ DB（マイグレーション適用済み）を用意する。
pub async fn test_pool() -> SqlitePool {
    connect_in_memory()
        .await
        .expect("failed to create test pool")
}

pub struct NoteFixture {
    pub title: String,
    pub body: String,
}

impl Default for NoteFixture {
    fn default() -> Self {
        Self {
            title: "Sample note".to_string(),
            body: String::new(),
        }
    }
}

impl NoteFixture {
    pub fn with_title(mut self, title: impl Into<String>) -> Self {
        self.title = title.into();
        self
    }
}
