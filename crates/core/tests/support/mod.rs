//! QA-13: 統合テスト用のファクトリ。「テストに必要な最小限のデフォルト値」を返し、
//! 個々のテストは差分だけ上書きする（docs/testing.md §8）。
//!
//! `tests/` 配下の各ファイルは独立したバイナリとしてコンパイルされ、`mod support;` で
//! このモジュール全体を取り込む。そのため各バイナリからは一部のフィクスチャしか
//! 使われず、未使用として lint されてしまう。共有フィクスチャという性質上のものなので
//! 抑制する。
#![allow(dead_code)]

use app_core::db::connect_in_memory;
use app_core::domain::book::{Genre, NewBook, ReadingStatus};
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

pub struct BookFixture {
    pub title: String,
    pub author: String,
    pub status: ReadingStatus,
    pub note: String,
    pub genre: Genre,
}

impl Default for BookFixture {
    fn default() -> Self {
        Self {
            title: "Sample book".to_string(),
            author: "Sample author".to_string(),
            status: ReadingStatus::Unread,
            note: String::new(),
            genre: Genre::Other,
        }
    }
}

impl BookFixture {
    pub fn with_title(mut self, title: impl Into<String>) -> Self {
        self.title = title.into();
        self
    }

    pub fn with_status(mut self, status: ReadingStatus) -> Self {
        self.status = status;
        self
    }

    pub fn into_new_book(self) -> NewBook {
        NewBook {
            title: self.title,
            author: self.author,
            status: self.status,
            note: self.note,
            genre: self.genre,
        }
    }
}
