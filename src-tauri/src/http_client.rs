//! RS-11: HTTP クライアントの構築（タイムアウト設定）。リトライ制御そのものは
//! `app_core::net::with_retry`（純粋なロジックとしてユニットテスト済み）を利用する。

use std::time::Duration;

pub fn build_client() -> Result<reqwest::Client, reqwest::Error> {
    reqwest::Client::builder()
        .timeout(Duration::from_secs(10))
        .connect_timeout(Duration::from_secs(5))
        .build()
}

/// GET リクエストをリトライ付きで実行するサンプル。実際の外部 API 連携を追加する際は
/// このパターンに倣う（レスポンスボディはログに出さない。SEC-04）。
pub async fn get_with_retry(client: &reqwest::Client, url: &str) -> Result<String, reqwest::Error> {
    app_core::net::with_retry(3, Duration::from_millis(200), || async {
        client
            .get(url)
            .send()
            .await?
            .error_for_status()?
            .text()
            .await
    })
    .await
}
