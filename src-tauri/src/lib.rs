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
pub mod settings;
pub mod specta_bindings;
pub mod state;
pub mod tasks;

use std::sync::Mutex;

use tauri::Manager;

use settings::Settings;
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
        // RS-08/#15: 一覧の既定の並び順のような利用者ごとの設定を settings.json に保存する。
        // フロントは @tauri-apps/plugin-store で読み書きする（`src/lib/settings-store.ts`）。
        // 対応する capability は `store:default`（`capabilities/default.json`）。
        .plugin(tauri_plugin_store::Builder::new().build())
        // APP-09: ディープリンク（カスタム URL スキーム）。両プラットフォーム対応。
        // スキームは tauri.conf.json の plugins."deep-link".schemes で定義する。
        .plugin(tauri_plugin_deep_link::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_os::init())
        // #14: ISBNや書誌情報を他アプリへコピーする用途。デスクトップ・モバイル両対応。
        .plugin(tauri_plugin_clipboard_manager::init())
        .manage(AppState::default())
        // #15: `export_dir` は書き出すたびにダイアログで選び直す設計のため、次回の起動でも
        // 使いたい値ではない。tauri_plugin_store では永続化せずメモリ上だけに置く。
        .manage(Mutex::new(Settings::default()))
        .invoke_handler(builder.invoke_handler());

    #[cfg(desktop)]
    {
        app_builder = app_builder
            .plugin(tauri_plugin_single_instance::init(|app, _args, _cwd| {
                #[cfg(desktop)]
                desktop::focus_main_window_from_app(app);
            }))
            .plugin(tauri_plugin_window_state::Builder::default().build())
            .plugin(tauri_plugin_updater::Builder::new().build())
            // #15: 起動と終了のときの処理の骨組み。読書ログは書き込みのたびに保存する設計
            // のため、閉じる前の確認ダイアログは出さない（`api.prevent_close()` を呼ばない）。
            // 未保存の状態を持つ画面を追加したときは、ここで確認フローを挟むこと。
            .on_window_event(|window, event| {
                if let tauri::WindowEvent::CloseRequested { .. } = event {
                    log::debug!("close requested for window '{}'", window.label());
                }
            });
    }

    #[cfg(mobile)]
    {
        // #14: バーコードでISBNを読み取る（barcode-scanner）、登録完了を振動で伝える
        // （haptics）。どちらもOS側の機能に依存するためモバイル専用（Cargo.toml の
        // target cfg 参照）。
        app_builder = app_builder
            .plugin(tauri_plugin_barcode_scanner::init())
            .plugin(tauri_plugin_haptics::init());
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
