//! `#[tauri::command]` 群。入力の変換・検証と `app_core` の呼び出しのみを行う薄いアダプタ層。
//! ビジネスロジックはここに書かず `crates/core` に置くこと（docs/testing.md §3）。

pub mod credentials;
pub mod greeting;
pub mod long_task;
pub mod notes;
#[cfg(desktop)]
pub mod updater;
pub mod window;

pub use credentials::{delete_credential, has_credential, save_credential};
pub use greeting::greet;
pub use long_task::{cancel_long_task, start_long_task};
pub use notes::{create_note, delete_note, list_notes};
#[cfg(desktop)]
pub use updater::{check_for_update, install_update};
pub use window::close_splashscreen;
