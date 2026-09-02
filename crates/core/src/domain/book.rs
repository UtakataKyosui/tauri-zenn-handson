//! 読書ログのドメイン型と CRUD ロジック（#5, #6）。
//! ここでは永続化される形（`Book`）と新規登録時の入力（`NewBook`）を分けて定義する。
//! `id` と `created_at` はデータベース側が決めるため `NewBook` は持たない。

use serde::{Deserialize, Serialize};
use sqlx::SqlitePool;

use crate::error::{CoreError, CoreResult};

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

/// SQL は `sqlx::query_as!` 系マクロで組み立て、コンパイル時に検証する
/// （文字列連結で組まない。レビュー観点 §2）。`status` / `genre` / `created_at` は
/// SQLite 側が TEXT 列のため、型注釈（`as "status: ReadingStatus"` 等）を付けないと
/// マクロが `String` に推論してしまう点に注意する。
pub async fn create(pool: &SqlitePool, input: NewBook) -> CoreResult<Book> {
    if input.title.trim().is_empty() {
        return Err(CoreError::InvalidInput("title must not be empty".into()));
    }

    let book = sqlx::query_as!(
        Book,
        r#"INSERT INTO books (title, author, status, note, genre)
           VALUES (?1, ?2, ?3, ?4, ?5)
           RETURNING id, title, author, status as "status: ReadingStatus", note,
                     genre as "genre: Genre", created_at as "created_at: chrono::DateTime<chrono::Utc>""#,
        input.title,
        input.author,
        input.status,
        input.note,
        input.genre,
    )
    .fetch_one(pool)
    .await
    .map_err(|e| {
        tracing::error!(error = %e, "failed to insert book");
        CoreError::Internal
    })?;

    Ok(book)
}

pub async fn list(pool: &SqlitePool) -> CoreResult<Vec<Book>> {
    let books = sqlx::query_as!(
        Book,
        r#"SELECT id, title, author, status as "status: ReadingStatus", note,
                  genre as "genre: Genre", created_at as "created_at: chrono::DateTime<chrono::Utc>"
           FROM books ORDER BY created_at DESC, id DESC"#,
    )
    .fetch_all(pool)
    .await
    .map_err(|e| {
        tracing::error!(error = %e, "failed to list books");
        CoreError::Internal
    })?;

    Ok(books)
}

pub async fn get(pool: &SqlitePool, id: i64) -> CoreResult<Book> {
    sqlx::query_as!(
        Book,
        r#"SELECT id, title, author, status as "status: ReadingStatus", note,
                  genre as "genre: Genre", created_at as "created_at: chrono::DateTime<chrono::Utc>"
           FROM books WHERE id = ?1"#,
        id,
    )
    .fetch_optional(pool)
    .await
    .map_err(|e| {
        tracing::error!(error = %e, "failed to fetch book");
        CoreError::Internal
    })?
    .ok_or_else(|| CoreError::NotFound(format!("book {id}")))
}

pub async fn update(pool: &SqlitePool, id: i64, input: NewBook) -> CoreResult<Book> {
    if input.title.trim().is_empty() {
        return Err(CoreError::InvalidInput("title must not be empty".into()));
    }

    sqlx::query_as!(
        Book,
        r#"UPDATE books SET title = ?1, author = ?2, status = ?3, note = ?4, genre = ?5
           WHERE id = ?6
           RETURNING id, title, author, status as "status: ReadingStatus", note,
                     genre as "genre: Genre", created_at as "created_at: chrono::DateTime<chrono::Utc>""#,
        input.title,
        input.author,
        input.status,
        input.note,
        input.genre,
        id,
    )
    .fetch_optional(pool)
    .await
    .map_err(|e| {
        tracing::error!(error = %e, "failed to update book");
        CoreError::Internal
    })?
    .ok_or_else(|| CoreError::NotFound(format!("book {id}")))
}

pub async fn delete(pool: &SqlitePool, id: i64) -> CoreResult<()> {
    let result = sqlx::query!("DELETE FROM books WHERE id = ?1", id)
        .execute(pool)
        .await
        .map_err(|e| {
            tracing::error!(error = %e, "failed to delete book");
            CoreError::Internal
        })?;

    if result.rows_affected() == 0 {
        return Err(CoreError::NotFound(format!("book {id}")));
    }
    Ok(())
}

impl ReadingStatus {
    fn as_str(self) -> &'static str {
        match self {
            ReadingStatus::Unread => "unread",
            ReadingStatus::Reading => "reading",
            ReadingStatus::Finished => "finished",
        }
    }
}

impl Genre {
    fn as_str(self) -> &'static str {
        match self {
            Genre::Novel => "novel",
            Genre::NonFiction => "non_fiction",
            Genre::Business => "business",
            Genre::Technology => "technology",
            Genre::Other => "other",
        }
    }
}

/// CSV のフィールドをダブルクォートで囲み、内部の `"` は `""` に置換する（RFC 4180）。
fn csv_field(value: &str) -> String {
    format!("\"{}\"", value.replace('"', "\"\""))
}

/// #12: 全ての本を CSV にして `path` へ書き出す。列は
/// `title,author,status,note,genre,created_at` の順で固定する。既存の `list` を再利用するため
/// 新規の SQL クエリは追加していない（`cargo sqlx prepare` の再実行は不要）。
/// ファイル I/O は `src-tauri/src/lib.rs` の起動時セットアップと同じく同期 API を使う
/// （crates/core はこの用途向けの非同期 fs 依存を追加していないため）。
pub async fn export_csv(pool: &SqlitePool, path: &std::path::Path) -> CoreResult<u64> {
    let books = list(pool).await?;

    let mut csv = String::from("title,author,status,note,genre,created_at\n");
    for book in &books {
        csv.push_str(&csv_field(&book.title));
        csv.push(',');
        csv.push_str(&csv_field(&book.author));
        csv.push(',');
        csv.push_str(&csv_field(book.status.as_str()));
        csv.push(',');
        csv.push_str(&csv_field(&book.note));
        csv.push(',');
        csv.push_str(&csv_field(book.genre.as_str()));
        csv.push(',');
        csv.push_str(&csv_field(&book.created_at.to_rfc3339()));
        csv.push('\n');
    }

    std::fs::write(path, csv).map_err(|e| {
        tracing::error!(error = %e, "failed to write books csv");
        CoreError::Internal
    })?;

    Ok(books.len() as u64)
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::db::connect_in_memory;

    fn sample_book() -> NewBook {
        NewBook {
            title: "Sample book".to_string(),
            author: "Sample author".to_string(),
            status: ReadingStatus::Unread,
            note: String::new(),
            genre: Genre::Other,
        }
    }

    #[tokio::test]
    async fn creates_and_lists_a_book() {
        let pool = connect_in_memory().await.unwrap();

        create(&pool, sample_book()).await.unwrap();
        let books = list(&pool).await.unwrap();

        assert_eq!(books.len(), 1);
        assert_eq!(books[0].title, "Sample book");
    }

    #[tokio::test]
    async fn rejects_an_empty_title_on_create() {
        let pool = connect_in_memory().await.unwrap();
        let mut input = sample_book();
        input.title = "  ".to_string();

        let err = create(&pool, input).await.unwrap_err();

        assert!(matches!(err, CoreError::InvalidInput(_)));
    }

    #[tokio::test]
    async fn gets_an_existing_book_by_id() {
        let pool = connect_in_memory().await.unwrap();
        let created = create(&pool, sample_book()).await.unwrap();

        let fetched = get(&pool, created.id).await.unwrap();

        assert_eq!(fetched, created);
    }

    #[tokio::test]
    async fn returns_not_found_when_getting_a_missing_book() {
        let pool = connect_in_memory().await.unwrap();

        let err = get(&pool, 999).await.unwrap_err();

        assert!(matches!(err, CoreError::NotFound(_)));
    }

    #[tokio::test]
    async fn updates_an_existing_book() {
        let pool = connect_in_memory().await.unwrap();
        let created = create(&pool, sample_book()).await.unwrap();
        let mut input = sample_book();
        input.title = "Updated title".to_string();
        input.status = ReadingStatus::Finished;

        let updated = update(&pool, created.id, input).await.unwrap();

        assert_eq!(updated.title, "Updated title");
        assert_eq!(updated.status, ReadingStatus::Finished);
    }

    #[tokio::test]
    async fn rejects_an_empty_title_on_update() {
        let pool = connect_in_memory().await.unwrap();
        let created = create(&pool, sample_book()).await.unwrap();
        let mut input = sample_book();
        input.title = " ".to_string();

        let err = update(&pool, created.id, input).await.unwrap_err();

        assert!(matches!(err, CoreError::InvalidInput(_)));
    }

    #[tokio::test]
    async fn returns_not_found_when_updating_a_missing_book() {
        let pool = connect_in_memory().await.unwrap();

        let err = update(&pool, 999, sample_book()).await.unwrap_err();

        assert!(matches!(err, CoreError::NotFound(_)));
    }

    #[tokio::test]
    async fn deletes_an_existing_book() {
        let pool = connect_in_memory().await.unwrap();
        let created = create(&pool, sample_book()).await.unwrap();

        delete(&pool, created.id).await.unwrap();

        assert_eq!(list(&pool).await.unwrap().len(), 0);
    }

    #[tokio::test]
    async fn returns_not_found_when_deleting_a_missing_book() {
        let pool = connect_in_memory().await.unwrap();

        let err = delete(&pool, 999).await.unwrap_err();

        assert!(matches!(err, CoreError::NotFound(_)));
    }

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

    /// テスト用に一意な一時ファイルパスを作る。`tempfile` crate は依存に無いため
    /// `std::env::temp_dir()` を使い、テスト終了時に自分で削除する。
    fn temp_csv_path(label: &str) -> std::path::PathBuf {
        std::env::temp_dir().join(format!(
            "book_export_test_{label}_{}.csv",
            std::process::id()
        ))
    }

    #[tokio::test]
    async fn exports_books_as_csv_with_header_and_row_count() {
        let pool = connect_in_memory().await.unwrap();
        create(&pool, sample_book()).await.unwrap();
        let path = temp_csv_path("basic");

        let count = export_csv(&pool, &path).await.unwrap();

        assert_eq!(count, 1);
        let content = std::fs::read_to_string(&path).unwrap();
        assert!(content.starts_with("title,author,status,note,genre,created_at\n"));
        assert!(content.contains("\"Sample book\",\"Sample author\",\"unread\",\"\",\"other\","));
        std::fs::remove_file(&path).unwrap();
    }

    #[tokio::test]
    async fn exports_zero_rows_when_there_are_no_books() {
        let pool = connect_in_memory().await.unwrap();
        let path = temp_csv_path("empty");

        let count = export_csv(&pool, &path).await.unwrap();

        assert_eq!(count, 0);
        let content = std::fs::read_to_string(&path).unwrap();
        assert_eq!(content, "title,author,status,note,genre,created_at\n");
        std::fs::remove_file(&path).unwrap();
    }

    #[tokio::test]
    async fn escapes_double_quotes_in_csv_fields() {
        let pool = connect_in_memory().await.unwrap();
        let mut input = sample_book();
        input.title = "A \"quoted\" title".to_string();
        create(&pool, input).await.unwrap();
        let path = temp_csv_path("quotes");

        export_csv(&pool, &path).await.unwrap();

        let content = std::fs::read_to_string(&path).unwrap();
        assert!(content.contains("\"A \"\"quoted\"\" title\""));
        std::fs::remove_file(&path).unwrap();
    }
}
