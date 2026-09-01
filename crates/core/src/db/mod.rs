//! DB アクセス層。SQLite への接続は呼び出し側から `SqlitePool` を引数で受け取り、
//! グローバル状態からは取得しない（docs/testing.md §3「DB 接続は引数で受け取る」）。
//!
//! マイグレーションは `crates/core/migrations/` に置き、バイナリへ埋め込む（RS-09）。
//! `sqlx::query!` 系マクロのコンパイル時検証には DB かオフラインクエリメタデータ
//! （`crates/core/.sqlx/`, `cargo sqlx prepare` で生成）のいずれかが要る（リスク R-1）。

use sqlx::sqlite::{SqlitePool, SqlitePoolOptions};

static MIGRATOR: sqlx::migrate::Migrator = sqlx::migrate!("./migrations");

/// テスト・開発用にインメモリ SQLite への接続プールを作り、マイグレーションを適用する。
pub async fn connect_in_memory() -> Result<SqlitePool, sqlx::Error> {
    let pool = SqlitePoolOptions::new()
        .max_connections(1)
        .connect("sqlite::memory:")
        .await?;
    MIGRATOR.run(&pool).await?;
    Ok(pool)
}

/// 本番用の永続 DB 接続。`path` は OS 標準のアプリデータディレクトリ配下のファイルパスを
/// 呼び出し元（src-tauri）が解決して渡す。
pub async fn connect_persistent(path: &str) -> Result<SqlitePool, sqlx::Error> {
    let pool = SqlitePoolOptions::new()
        .max_connections(5)
        .connect(&format!("sqlite://{path}?mode=rwc"))
        .await?;
    MIGRATOR.run(&pool).await?;
    Ok(pool)
}
