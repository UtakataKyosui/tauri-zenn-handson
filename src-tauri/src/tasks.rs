//! RS-10: 長時間処理の雛形（非同期コマンド、進捗イベント通知、キャンセル機構）。

use serde::Serialize;
use specta::Type;
use tauri_specta::Event;

#[derive(Clone, Copy, Serialize, Type, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum TaskStatus {
    Running,
    Completed,
    Cancelled,
}

#[derive(Clone, Serialize, Type, Event)]
pub struct TaskProgress {
    pub task_id: String,
    pub completed: u32,
    pub total: u32,
    pub status: TaskStatus,
}
