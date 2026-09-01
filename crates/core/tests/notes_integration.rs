//! QA-13 のファクトリ（`tests/support/`）を使った統合テストのサンプル。

mod support;

use app_core::domain::notes;
use support::{test_pool, NoteFixture};

#[tokio::test]
async fn notes_are_listed_in_creation_order() {
    let pool = test_pool().await;
    let first = NoteFixture::default().with_title("First");
    let second = NoteFixture::default().with_title("Second");

    notes::create(&pool, &first.title, &first.body)
        .await
        .unwrap();
    notes::create(&pool, &second.title, &second.body)
        .await
        .unwrap();

    let all = notes::list(&pool).await.unwrap();

    assert_eq!(
        all.iter().map(|n| &n.title).collect::<Vec<_>>(),
        vec!["First", "Second"]
    );
}
