use std::time::Duration;

use tauri::{AppHandle, Manager, State};
use tauri_specta::Event;

use crate::error::AppResult;
use crate::state::AppState;
use crate::tasks::{TaskProgress, TaskStatus};

/// RS-10: 進捗イベントを伴う長時間処理のサンプル。即座にタスク ID を返し、
/// 実処理はバックグラウンドで進める。フロントは `TaskProgress` イベントを購読して
/// 進捗バーを更新し、`cancel_long_task` でキャンセルできる。
#[tauri::command]
#[specta::specta]
pub async fn start_long_task(
    app: AppHandle,
    state: State<'_, AppState>,
    steps: u32,
) -> AppResult<String> {
    let (task_id, cancel_token) = state.register_task().await;
    let app_for_task = app.clone();
    let id_for_task = task_id.clone();
    // AppState は Clone できない設計だが、tauri::State は 'static ハンドルではないため、
    // タスク完了通知には AppHandle 経由で再取得する（tauri::State を spawn 先に持ち込まない）。

    tokio::spawn(async move {
        for step in 1..=steps {
            if cancel_token.is_cancelled() {
                let _ = TaskProgress {
                    task_id: id_for_task.clone(),
                    completed: step - 1,
                    total: steps,
                    status: TaskStatus::Cancelled,
                }
                .emit(&app_for_task);
                let state = app_for_task.state::<AppState>();
                state.finish_task(&id_for_task).await;
                return;
            }

            tokio::time::sleep(Duration::from_millis(150)).await;

            let _ = TaskProgress {
                task_id: id_for_task.clone(),
                completed: step,
                total: steps,
                status: TaskStatus::Running,
            }
            .emit(&app_for_task);
        }

        let _ = TaskProgress {
            task_id: id_for_task.clone(),
            completed: steps,
            total: steps,
            status: TaskStatus::Completed,
        }
        .emit(&app_for_task);

        let state = app_for_task.state::<AppState>();
        state.finish_task(&id_for_task).await;
    });

    Ok(task_id)
}

#[tauri::command]
#[specta::specta]
pub async fn cancel_long_task(task_id: String, state: State<'_, AppState>) -> AppResult<()> {
    state.cancel_task(&task_id).await;
    Ok(())
}
