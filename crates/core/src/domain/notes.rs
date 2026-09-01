use sqlx::SqlitePool;

use crate::error::{CoreError, CoreResult};

#[derive(Debug, PartialEq, Eq, serde::Serialize, specta::Type)]
pub struct Note {
    pub id: i64,
    pub title: String,
    pub body: String,
}

/// SQL は `sqlx::query!` 系マクロで組み立て、コンパイル時に検証する
/// （文字列連結で組まない。レビュー観点 §2）。
pub async fn create(pool: &SqlitePool, title: &str, body: &str) -> CoreResult<Note> {
    if title.trim().is_empty() {
        return Err(CoreError::InvalidInput("title must not be empty".into()));
    }

    let rec = sqlx::query!(
        "INSERT INTO notes (title, body) VALUES (?1, ?2) RETURNING id, title, body",
        title,
        body,
    )
    .fetch_one(pool)
    .await
    .map_err(|e| {
        tracing::error!(error = %e, "failed to insert note");
        CoreError::Internal
    })?;

    Ok(Note {
        id: rec.id,
        title: rec.title,
        body: rec.body,
    })
}

pub async fn list(pool: &SqlitePool) -> CoreResult<Vec<Note>> {
    let rows = sqlx::query!("SELECT id, title, body FROM notes ORDER BY id")
        .fetch_all(pool)
        .await
        .map_err(|e| {
            tracing::error!(error = %e, "failed to list notes");
            CoreError::Internal
        })?;

    Ok(rows
        .into_iter()
        .map(|r| Note {
            id: r.id,
            title: r.title,
            body: r.body,
        })
        .collect())
}

pub async fn delete(pool: &SqlitePool, id: i64) -> CoreResult<()> {
    let result = sqlx::query!("DELETE FROM notes WHERE id = ?1", id)
        .execute(pool)
        .await
        .map_err(|e| {
            tracing::error!(error = %e, "failed to delete note");
            CoreError::Internal
        })?;

    if result.rows_affected() == 0 {
        return Err(CoreError::NotFound(format!("note {id}")));
    }
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::db::connect_in_memory;

    #[tokio::test]
    async fn creates_and_lists_a_note() {
        let pool = connect_in_memory().await.unwrap();

        create(&pool, "First", "body").await.unwrap();
        let notes = list(&pool).await.unwrap();

        assert_eq!(notes.len(), 1);
        assert_eq!(notes[0].title, "First");
    }

    #[tokio::test]
    async fn rejects_an_empty_title() {
        let pool = connect_in_memory().await.unwrap();

        let err = create(&pool, "  ", "body").await.unwrap_err();

        assert!(matches!(err, CoreError::InvalidInput(_)));
    }

    #[tokio::test]
    async fn deletes_an_existing_note() {
        let pool = connect_in_memory().await.unwrap();
        let note = create(&pool, "To delete", "").await.unwrap();

        delete(&pool, note.id).await.unwrap();

        assert_eq!(list(&pool).await.unwrap().len(), 0);
    }

    #[tokio::test]
    async fn returns_not_found_when_deleting_a_missing_note() {
        let pool = connect_in_memory().await.unwrap();

        let err = delete(&pool, 999).await.unwrap_err();

        assert!(matches!(err, CoreError::NotFound(_)));
    }
}
