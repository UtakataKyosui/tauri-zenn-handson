//! アプリのビルダー本体。デスクトップ（main.rs）とモバイル（`mobile_entry_point`）の
//! 両方からここを呼び出す（RS-01）。

pub mod commands;
pub mod credentials;
#[cfg(desktop)]
pub mod desktop;
pub mod error;
pub mod http_client;
pub mod logging;
#[cfg(mobile)]
pub mod mobile;
pub mod panic_handler;
pub mod specta_bindings;
pub mod state;
pub mod tasks;

use tauri::Manager;

use state::AppState;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    panic_handler::install();

    let builder = specta_bindings::typed_builder();

    let mut app_builder = tauri::Builder::default()
        // RS-07: Rust 側 Builder 登録のみで完結し、フロントから
        // @tauri-apps/plugin-log を呼ぶ経路が無い（IPC を経由しない）ため、
        // capabilities に log:default は追加しない（#41）。
        .plugin(logging::plugin())
        // RS-08: フロントから @tauri-apps/plugin-store を使い始めるまでは
        // capabilities に store:default を追加しない（投機的な権限追加の禁止、
        // CLAUDE.md）。使い始める時点で該当 capability に追加すること（#41）。
        .plugin(tauri_plugin_store::Builder::new().build())
        // APP-09: ディープリンク（カスタム URL スキーム）。両プラットフォーム対応。
        // スキームは tauri.conf.json の plugins."deep-link".schemes で定義する。
        .plugin(tauri_plugin_deep_link::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_os::init())
        .manage(AppState::default())
        .invoke_handler(builder.invoke_handler());

    #[cfg(desktop)]
    {
        app_builder = app_builder
            .plugin(tauri_plugin_single_instance::init(|app, _args, _cwd| {
                #[cfg(desktop)]
                desktop::focus_main_window_from_app(app);
            }))
            .plugin(tauri_plugin_window_state::Builder::default().build())
            .plugin(tauri_plugin_updater::Builder::new().build());
    }

    app_builder
        .setup(move |app| {
            builder.mount_events(app);

            // RS-08/RS-09: DB 接続は OS 標準のアプリデータディレクトリ配下に作る。
            // setup は同期クロージャのため、接続とマイグレーション適用は block_on する。
            let app_handle = app.handle().clone();
            let pool = tauri::async_runtime::block_on(async move {
                let data_dir = app_handle.path().app_data_dir()?;
                std::fs::create_dir_all(&data_dir)?;
                let db_path = data_dir.join("app.sqlite");
                let pool =
                    app_core::db::connect_persistent(db_path.to_string_lossy().as_ref()).await?;
                Ok::<_, Box<dyn std::error::Error>>(pool)
            })?;
            app.manage(pool);

            #[cfg(desktop)]
            desktop::setup(app)?;
            #[cfg(mobile)]
            mobile::setup(app)?;

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
