use std::path::PathBuf;

use sqlx::SqlitePool;
use tauri::State;

use crate::error::AppResult;
use app_core::domain::book::{Book, NewBook};

/// #6 のコマンド。SQL 組み立てとコンパイル時検証は `app_core::domain::book` 側
/// （`sqlx::query_as!`）に閉じ、ここでは呼び出しと State からの取得のみを行う
/// （`notes` コマンドと同じ薄いアダプタ層のパターン。docs/testing.md §3）。
#[tauri::command]
#[specta::specta]
pub async fn list_books(pool: State<'_, SqlitePool>) -> AppResult<Vec<Book>> {
    Ok(app_core::domain::book::list(&pool).await?)
}

#[tauri::command]
#[specta::specta]
pub async fn get_book(id: i64, pool: State<'_, SqlitePool>) -> AppResult<Book> {
    Ok(app_core::domain::book::get(&pool, id).await?)
}

#[tauri::command]
#[specta::specta]
pub async fn create_book(input: NewBook, pool: State<'_, SqlitePool>) -> AppResult<Book> {
    Ok(app_core::domain::book::create(&pool, input).await?)
}

#[tauri::command]
#[specta::specta]
pub async fn update_book(id: i64, input: NewBook, pool: State<'_, SqlitePool>) -> AppResult<Book> {
    Ok(app_core::domain::book::update(&pool, id, input).await?)
}

#[tauri::command]
#[specta::specta]
pub async fn delete_book(id: i64, pool: State<'_, SqlitePool>) -> AppResult<()> {
    Ok(app_core::domain::book::delete(&pool, id).await?)
}

/// #12 のコマンド。全ての本を CSV にして `path` へ書き出し、書き出した件数を返す。
/// 実際の CSV 組み立てとファイル I/O は `app_core::domain::book::export_csv` に閉じる。
#[tauri::command]
#[specta::specta]
pub async fn export_books(path: PathBuf, pool: State<'_, SqlitePool>) -> AppResult<u64> {
    Ok(app_core::domain::book::export_csv(&pool, &path).await?)
}
