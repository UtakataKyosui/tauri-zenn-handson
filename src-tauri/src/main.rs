// デスクトップのエントリポイント。ロジックは lib.rs の run() に置き、
// モバイル（mobile_entry_point）と共有する（RS-01）。
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    tauri_app_template_lib::run();
}
