//! モバイル専用機能（`#[cfg(mobile)]`）。ディープリンク・生体認証は Phase 5（#22）で実装する。

use tauri::App;

/// モバイル固有のセットアップを `lib.rs::run()` から呼び出すためのフック。
pub fn setup(_app: &mut App) -> tauri::Result<()> {
    log::debug!("mobile setup placeholder (see #22)");
    Ok(())
}
