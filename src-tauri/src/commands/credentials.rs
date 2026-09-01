use crate::credentials;
use crate::error::AppResult;

/// フロントから渡された秘密情報を OS キーチェーンに保存する。保存後は破棄され、
/// 二度とフロントへは返らない（SEC-04, RS-12）。
#[tauri::command]
#[specta::specta]
pub fn save_credential(account: String, secret: String) -> AppResult<()> {
    credentials::save(&account, &secret)
}

/// 値そのものではなく「保存されているか」だけをフロントに返す。
#[tauri::command]
#[specta::specta]
pub fn has_credential(account: String) -> AppResult<bool> {
    Ok(credentials::get(&account)?.is_some())
}

#[tauri::command]
#[specta::specta]
pub fn delete_credential(account: String) -> AppResult<()> {
    credentials::delete(&account)
}
