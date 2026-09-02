use std::path::PathBuf;
use std::sync::Mutex;

use tauri::State;

use crate::error::{AppError, AppResult};
use crate::settings::Settings;

/// #15: 書き出し先ダイアログの初期表示に使う直近の保存先ディレクトリを覚える。
/// ロックの取得は、別のスレッドがロックを持ったままパニックしたときにだけ失敗する。
#[tauri::command]
#[specta::specta]
pub fn set_export_dir(dir: PathBuf, settings: State<'_, Mutex<Settings>>) -> AppResult<()> {
    let mut settings = settings
        .lock()
        .map_err(|_| AppError::Lock("設定の状態が壊れています".into()))?;
    settings.export_dir = Some(dir);
    Ok(())
}

#[tauri::command]
#[specta::specta]
pub fn get_export_dir(settings: State<'_, Mutex<Settings>>) -> AppResult<Option<PathBuf>> {
    let settings = settings
        .lock()
        .map_err(|_| AppError::Lock("設定の状態が壊れています".into()))?;
    Ok(settings.export_dir.clone())
}

#[cfg(test)]
mod tests {
    use super::*;
    use tauri::test::{mock_builder, mock_context, noop_assets};
    use tauri::Manager;

    #[test]
    fn get_export_dir_returns_none_before_any_set() {
        let app = mock_builder()
            .manage(Mutex::new(Settings::default()))
            .build(mock_context(noop_assets()))
            .expect("failed to build mock app");

        let state = app.state::<Mutex<Settings>>();
        let result = get_export_dir(state);

        assert_eq!(result.unwrap(), None);
    }

    #[test]
    fn set_export_dir_is_visible_to_a_later_get_export_dir() {
        let app = mock_builder()
            .manage(Mutex::new(Settings::default()))
            .build(mock_context(noop_assets()))
            .expect("failed to build mock app");

        let state = app.state::<Mutex<Settings>>();
        set_export_dir(PathBuf::from("/tmp/exports"), state).unwrap();

        let state = app.state::<Mutex<Settings>>();
        let result = get_export_dir(state);

        assert_eq!(result.unwrap(), Some(PathBuf::from("/tmp/exports")));
    }
}
