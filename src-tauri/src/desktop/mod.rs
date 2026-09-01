//! デスクトップ専用機能（`#[cfg(desktop)]`）。トレイ・メニュー・ウィンドウ状態・単一インスタンス・
//! 自動更新。このモジュールへ `#[cfg(mobile)]` 側からは到達不可能であることをコンパイル時に
//! 強制する（レビュー観点 §3）。ウィンドウ状態の記憶（APP-06）と単一インスタンス制御（APP-07）
//! は `lib.rs::run()` でのプラグイン登録のみで完結するため、ここではトレイ（APP-04）と
//! ネイティブメニュー（APP-05）を扱う。

use tauri::menu::{Menu, MenuItem, PredefinedMenuItem};
use tauri::tray::TrayIconBuilder;
use tauri::{App, AppHandle, Manager};

/// デスクトップ固有のセットアップを `lib.rs::run()` から呼び出すためのフック。
pub fn setup(app: &mut App) -> tauri::Result<()> {
    setup_menu(app)?;
    setup_tray(app)?;
    Ok(())
}

// APP-05: ネイティブメニューバー。
fn setup_menu(app: &App) -> tauri::Result<()> {
    let quit = MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)?;
    let menu = Menu::with_items(app, &[&PredefinedMenuItem::separator(app)?, &quit])?;
    app.set_menu(menu)?;

    app.on_menu_event(|app, event| {
        if event.id() == "quit" {
            app.exit(0);
        }
    });

    Ok(())
}

// APP-04: システムトレイ常駐 + トレイメニュー。
fn setup_tray(app: &App) -> tauri::Result<()> {
    let show = MenuItem::with_id(app, "show", "Show", true, None::<&str>)?;
    let quit = MenuItem::with_id(app, "tray_quit", "Quit", true, None::<&str>)?;
    let menu = Menu::with_items(app, &[&show, &quit])?;

    let icon = app
        .default_window_icon()
        .cloned()
        .ok_or_else(|| tauri::Error::AssetNotFound("default window icon".into()))?;

    TrayIconBuilder::new()
        .icon(icon)
        .menu(&menu)
        .show_menu_on_left_click(true)
        .on_menu_event(|app, event| match event.id().as_ref() {
            "show" => focus_main_window_from_app(app),
            "tray_quit" => app.exit(0),
            _ => {}
        })
        .build(app)?;

    Ok(())
}

/// APP-07: 単一インスタンス制御 — 二重起動時に既存ウィンドウを前面化する。
pub fn focus_main_window_from_app(app: &AppHandle) {
    if let Some(window) = app.get_webview_window("main") {
        let _ = window.show();
        let _ = window.set_focus();
    }
}
