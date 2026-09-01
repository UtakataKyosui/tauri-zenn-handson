//! RS-12: 資格情報の安全な保管（OS キーチェーン連携）。
//!
//! OS 連携のため TDD の対象外とする（docs/testing.md §2）。トークンはここでのみ扱い、
//! フロントへは絶対に返さない（SEC-04）。コマンド越しに公開するのは「保存済みか」
//! （bool）や「削除できたか」のような操作結果のみとする。

use keyring::Entry;

use crate::error::{AppError, AppResult};

const SERVICE: &str = "com.example.tauri-app-template";

fn entry(account: &str) -> AppResult<Entry> {
    Entry::new(SERVICE, account).map_err(|e| AppError::Io(e.to_string()))
}

pub fn save(account: &str, secret: &str) -> AppResult<()> {
    entry(account)?
        .set_password(secret)
        .map_err(|e| AppError::Io(e.to_string()))
}

/// 値そのものを返す関数はフロント公開コマンドから直接呼ばないこと。
/// 必要な操作（例: 認証済み HTTP リクエストの実行）の内部でのみ使う（SEC-04）。
pub fn get(account: &str) -> AppResult<Option<String>> {
    match entry(account)?.get_password() {
        Ok(secret) => Ok(Some(secret)),
        Err(keyring::Error::NoEntry) => Ok(None),
        Err(e) => Err(AppError::Io(e.to_string())),
    }
}

pub fn delete(account: &str) -> AppResult<()> {
    match entry(account)?.delete_credential() {
        Ok(()) | Err(keyring::Error::NoEntry) => Ok(()),
        Err(e) => Err(AppError::Io(e.to_string())),
    }
}
