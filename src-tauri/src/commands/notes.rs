use sqlx::SqlitePool;
use tauri::State;

use crate::error::AppResult;
use app_core::domain::notes::Note;

/// RS-09 のサンプルコマンド。SQL 組み立てとコンパイル時検証は `app_core::domain::notes` 側
/// （`sqlx::query!`）に閉じ、ここでは呼び出しと State からの取得のみを行う。
#[tauri::command]
#[specta::specta]
pub async fn create_note(
    pool: State<'_, SqlitePool>,
    title: String,
    body: String,
) -> AppResult<Note> {
    Ok(app_core::domain::notes::create(&pool, &title, &body).await?)
}

#[tauri::command]
#[specta::specta]
pub async fn list_notes(pool: State<'_, SqlitePool>) -> AppResult<Vec<Note>> {
    Ok(app_core::domain::notes::list(&pool).await?)
}

#[tauri::command]
#[specta::specta]
pub async fn delete_note(pool: State<'_, SqlitePool>, id: i64) -> AppResult<()> {
    Ok(app_core::domain::notes::delete(&pool, id).await?)
}
