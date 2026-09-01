use tauri::{AppHandle, Manager};

use crate::error::{AppError, AppResult};

/// FE-06: フロントの初期化が完了したらメイン画面から呼び出す。スプラッシュを閉じて
/// メインウィンドウを表示する。デスクトップ・モバイル双方の window 構成で動作する。
#[tauri::command]
#[specta::specta]
pub fn close_splashscreen(app: AppHandle) -> AppResult<()> {
    if let Some(splash) = app.get_webview_window("splashscreen") {
        splash.close().map_err(|e| AppError::Io(e.to_string()))?;
    }
    if let Some(main) = app.get_webview_window("main") {
        main.show().map_err(|e| AppError::Io(e.to_string()))?;
    }
    Ok(())
}
