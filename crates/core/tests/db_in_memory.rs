//! QA-07: DB を含むテストの雛形。インメモリ SQLite を使い、テストごとに独立した
//! 接続・スキーマを構築する。`connect_in_memory` は埋め込みマイグレーション
//! （`crates/core/migrations/`, RS-09）を毎回適用するため、テストは実スキーマに対して動く。

use app_core::db::connect_in_memory;
use app_core::domain::book::{Book, Genre, ReadingStatus};

#[tokio::test]
async fn migrations_are_applied_to_a_fresh_in_memory_database() {
    let pool = connect_in_memory().await.expect("failed to connect");

    let count: (i64,) = sqlx::query_as("SELECT COUNT(*) FROM notes")
        .fetch_one(&pool)
        .await
        .expect("notes table should exist after migrations run");

    assert_eq!(count.0, 0);
}

#[tokio::test]
async fn books_table_is_created_by_migrations_with_expected_defaults() {
    let pool = connect_in_memory().await.expect("failed to connect");

    sqlx::query("INSERT INTO books (title, author) VALUES ('Sample', 'Author')")
        .execute(&pool)
        .await
        .expect("books table should exist after migrations run");

    let row: (String, String) = sqlx::query_as("SELECT status, genre FROM books")
        .fetch_one(&pool)
        .await
        .unwrap();

    assert_eq!(row, ("unread".to_string(), "other".to_string()));
}

#[tokio::test]
async fn a_book_row_decodes_into_the_book_domain_type_with_defaults() {
    let pool = connect_in_memory().await.expect("failed to connect");

    sqlx::query("INSERT INTO books (title, author) VALUES ('Sample', 'Author')")
        .execute(&pool)
        .await
        .unwrap();

    let book: Book =
        sqlx::query_as("SELECT id, title, author, status, note, genre, created_at FROM books")
            .fetch_one(&pool)
            .await
            .expect("a books row should decode into Book via sqlx::FromRow");

    assert_eq!(book.title, "Sample");
    assert_eq!(book.author, "Author");
    assert_eq!(book.status, ReadingStatus::Unread);
    assert_eq!(book.note, "");
    assert_eq!(book.genre, Genre::Other);
}

#[tokio::test]
async fn each_test_gets_an_independent_database() {
    let pool_a = connect_in_memory().await.expect("failed to connect");
    sqlx::query("INSERT INTO notes (title, body) VALUES ('a', '')")
        .execute(&pool_a)
        .await
        .unwrap();

    let pool_b = connect_in_memory().await.expect("failed to connect");
    let count: (i64,) = sqlx::query_as("SELECT COUNT(*) FROM notes")
        .fetch_one(&pool_b)
        .await
        .unwrap();

    assert_eq!(
        count.0, 0,
        "a fresh connection must not see another test's data"
    );
}
