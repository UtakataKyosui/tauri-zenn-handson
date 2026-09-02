//! QA-13 のファクトリ（`tests/support/`）を使った統合テストのサンプル。

mod support;

use app_core::domain::book::{self, ReadingStatus};
use support::{test_pool, BookFixture};

#[tokio::test]
async fn books_are_listed_newest_first() {
    let pool = test_pool().await;
    let first = BookFixture::default().with_title("First").into_new_book();
    let second = BookFixture::default().with_title("Second").into_new_book();

    book::create(&pool, first).await.unwrap();
    book::create(&pool, second).await.unwrap();

    let all = book::list(&pool).await.unwrap();

    assert_eq!(
        all.iter().map(|b| &b.title).collect::<Vec<_>>(),
        vec!["Second", "First"]
    );
}

#[tokio::test]
async fn a_created_book_can_be_fetched_by_id() {
    let pool = test_pool().await;
    let created = book::create(&pool, BookFixture::default().into_new_book())
        .await
        .unwrap();

    let fetched = book::get(&pool, created.id).await.unwrap();

    assert_eq!(fetched, created);
}

#[tokio::test]
async fn an_updated_book_reflects_the_new_status() {
    let pool = test_pool().await;
    let created = book::create(&pool, BookFixture::default().into_new_book())
        .await
        .unwrap();
    let update_input = BookFixture::default()
        .with_status(ReadingStatus::Finished)
        .into_new_book();

    let updated = book::update(&pool, created.id, update_input).await.unwrap();

    assert_eq!(updated.status, ReadingStatus::Finished);
}

#[tokio::test]
async fn a_deleted_book_no_longer_appears_in_the_list() {
    let pool = test_pool().await;
    let created = book::create(&pool, BookFixture::default().into_new_book())
        .await
        .unwrap();

    book::delete(&pool, created.id).await.unwrap();

    assert_eq!(book::list(&pool).await.unwrap().len(), 0);
}
