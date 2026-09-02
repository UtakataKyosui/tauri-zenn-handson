use app_core::openbd::{self, BookInfo};

use crate::error::AppResult;
use crate::http_client;

/// openBDのエンドポイント。認証不要の公開API（<https://api.openbd.jp/>）。
const OPENBD_ENDPOINT: &str = "https://api.openbd.jp/v1/get";

/// #14: スキャンまたは手入力したISBNから書名・著者を引く。実際のHTTP通信（タイムアウト・
/// リトライ）は `http_client` に委ね、レスポンスの解釈は `app_core::openbd`（純粋関数、
/// ネットワークなしでテスト済み）に委ねる。該当するISBNが見つからない場合も
/// エラーにはせず、`title`/`author` が空の `BookInfo` を返す（呼び出し側で手入力に
/// フォールバックできるようにするため）。
#[tauri::command]
#[specta::specta]
pub async fn lookup_isbn(isbn: String) -> AppResult<BookInfo> {
    let client = http_client::build_client()?;
    // クエリパラメータは `Url::parse_with_params` に組み立てさせ、文字列連結で
    // URLを組まない（レビュー観点 §2 の「文字列連結で組まない」をURL構築にも適用する）。
    let url = reqwest::Url::parse_with_params(OPENBD_ENDPOINT, &[("isbn", isbn.as_str())])
        .map_err(|e| crate::error::AppError::Network(e.to_string()))?;
    let body = http_client::get_with_retry(&client, url.as_str()).await?;
    Ok(openbd::parse_book_info(&body))
}
