use serde::Serialize;
use specta::Type;
use tauri::AppHandle;
use tauri_plugin_updater::UpdaterExt;

use crate::error::{AppError, AppResult};

#[derive(Serialize, Type)]
pub struct UpdateInfo {
    pub available: bool,
    pub version: Option<String>,
}

/// APP-08: 自動アップデート。署名検証は tauri-plugin-updater が config の pubkey に基づき
/// 行う（CI-05 で鍵と配信マニフェストを生成する）。デスクトップのみで意味を持つ機能
/// （§3, レビュー観点 §3）。
#[tauri::command]
#[specta::specta]
pub async fn check_for_update(app: AppHandle) -> AppResult<UpdateInfo> {
    let updater = app.updater().map_err(|e| AppError::Io(e.to_string()))?;

    // 初回リリース前など配信マニフェストが存在しない場合、プラグインは
    // ReleaseNotFound を返す。これは「取得失敗」ではなく「更新なし」として扱う
    // （Issue #36）。それ以外のエラーは従来どおりフロントに伝える。
    let update = match updater.check().await {
        Ok(update) => update,
        Err(tauri_plugin_updater::Error::ReleaseNotFound) => None,
        Err(e) => return Err(AppError::Io(e.to_string())),
    };

    Ok(match update {
        Some(update) => UpdateInfo {
            available: true,
            version: Some(update.version),
        },
        None => UpdateInfo {
            available: false,
            version: None,
        },
    })
}

/// アップデートをダウンロードして適用する。呼び出し後はアプリの再起動が必要。
#[tauri::command]
#[specta::specta]
pub async fn install_update(app: AppHandle) -> AppResult<()> {
    let update = app
        .updater()
        .map_err(|e| AppError::Io(e.to_string()))?
        .check()
        .await
        .map_err(|e| AppError::Io(e.to_string()))?
        .ok_or_else(|| AppError::Io("no update available".into()))?;

    update
        .download_and_install(|_chunk, _total| {}, || {})
        .await
        .map_err(|e| AppError::Io(e.to_string()))?;

    Ok(())
}
