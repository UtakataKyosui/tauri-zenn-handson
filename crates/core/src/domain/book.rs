//! 読書ログのドメイン型（#5）。CRUD ロジックは Tauri コマンド層と合わせて後続 Issue で追加する。
//! ここでは永続化される形（`Book`）と新規登録時の入力（`NewBook`）を分けて定義する。
//! `id` と `created_at` はデータベース側が決めるため `NewBook` は持たない。

use serde::{Deserialize, Serialize};

/// 本を読み終えているかどうかの状態。文字列ではなく列挙型にすることで、
/// 打ち間違いをコンパイルで止める。
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize, sqlx::Type, specta::Type)]
#[serde(rename_all = "snake_case")]
#[sqlx(rename_all = "snake_case")]
pub enum ReadingStatus {
    Unread,
    Reading,
    Finished,
}

/// 本のジャンル。
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize, sqlx::Type, specta::Type)]
#[serde(rename_all = "snake_case")]
#[sqlx(rename_all = "snake_case")]
pub enum Genre {
    Novel,
    NonFiction,
    Business,
    Technology,
    Other,
}

/// データベースから読み出した本のレコード。
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, sqlx::FromRow, specta::Type)]
pub struct Book {
    pub id: i64,
    pub title: String,
    pub author: String,
    pub status: ReadingStatus,
    pub note: String,
    pub genre: Genre,
    pub created_at: chrono::DateTime<chrono::Utc>,
}

/// 新規登録時にフロントエンドから受け取る入力。
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, specta::Type)]
pub struct NewBook {
    pub title: String,
    pub author: String,
    pub status: ReadingStatus,
    pub note: String,
    pub genre: Genre,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn serializes_reading_status_in_snake_case() {
        assert_eq!(
            serde_json::to_string(&ReadingStatus::Unread).unwrap(),
            "\"unread\""
        );
        assert_eq!(
            serde_json::to_string(&ReadingStatus::Reading).unwrap(),
            "\"reading\""
        );
        assert_eq!(
            serde_json::to_string(&ReadingStatus::Finished).unwrap(),
            "\"finished\""
        );
    }

    #[test]
    fn serializes_genre_in_snake_case() {
        assert_eq!(
            serde_json::to_string(&Genre::NonFiction).unwrap(),
            "\"non_fiction\""
        );
        assert_eq!(serde_json::to_string(&Genre::Other).unwrap(), "\"other\"");
    }

    #[test]
    fn deserializes_new_book_from_snake_case_json() {
        let json =
            r#"{"title":"t","author":"a","status":"reading","note":"","genre":"technology"}"#;

        let new_book: NewBook = serde_json::from_str(json).unwrap();

        assert_eq!(new_book.status, ReadingStatus::Reading);
        assert_eq!(new_book.genre, Genre::Technology);
    }
}
