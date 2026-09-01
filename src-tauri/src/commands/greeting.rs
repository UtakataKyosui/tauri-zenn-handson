use tauri::State;

use crate::error::AppResult;
use crate::state::AppState;

/// サンプルコマンド。フロントの型付き呼び出し（tauri-specta, RS-05）を実演する。
#[tauri::command]
#[specta::specta]
pub async fn greet(name: String, state: State<'_, AppState>) -> AppResult<String> {
    let message = app_core::domain::greet(&name)?;
    let count = state.record_greeting().await;
    Ok(format!("{message} (call #{count})"))
}

#[cfg(test)]
mod tests {
    use super::*;
    use tauri::test::{mock_builder, mock_context, noop_assets};
    use tauri::Manager;

    #[tokio::test]
    async fn greet_command_returns_greeting_via_mock_app() {
        let app = mock_builder()
            .manage(AppState::default())
            .build(mock_context(noop_assets()))
            .expect("failed to build mock app");

        let state = app.state::<AppState>();
        let result = greet("Ada".into(), state).await;

        assert_eq!(result.unwrap(), "Hello, Ada! (call #1)");
    }

    #[tokio::test]
    async fn greet_command_propagates_validation_error_for_empty_name() {
        let app = mock_builder()
            .manage(AppState::default())
            .build(mock_context(noop_assets()))
            .expect("failed to build mock app");

        let state = app.state::<AppState>();
        let result = greet("".into(), state).await;

        assert!(result.is_err());
    }
}
