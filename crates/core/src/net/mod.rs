//! RS-11: 外部 API 連携の足回り（リトライ）。
//!
//! HTTP クライアントそのもの（タイムアウト設定込みの `reqwest::Client`）は副作用の境界として
//! `src-tauri`（呼び出し元）側に置く。ここには純粋なリトライ制御だけを置き、
//! 任意の失敗しうる非同期処理に対してユニットテストできるようにする（docs/testing.md §3）。

use std::future::Future;
use std::time::Duration;

/// `operation` を最大 `max_attempts` 回まで実行し、成功したら即座に返す。
/// 失敗するたびに指数バックオフ（`base_delay * 2^attempt`）で待つ。
pub async fn with_retry<T, E, F, Fut>(
    max_attempts: u32,
    base_delay: Duration,
    mut operation: F,
) -> Result<T, E>
where
    F: FnMut() -> Fut,
    Fut: Future<Output = Result<T, E>>,
{
    let mut attempt = 0;
    loop {
        match operation().await {
            Ok(value) => return Ok(value),
            Err(err) => {
                attempt += 1;
                if attempt >= max_attempts {
                    return Err(err);
                }
                tokio::time::sleep(base_delay * 2u32.pow(attempt - 1)).await;
            }
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::sync::atomic::{AtomicU32, Ordering};

    #[tokio::test]
    async fn returns_ok_immediately_when_the_first_attempt_succeeds() {
        let calls = AtomicU32::new(0);

        let result = with_retry(3, Duration::from_millis(0), || {
            calls.fetch_add(1, Ordering::SeqCst);
            async { Ok::<_, &str>("done") }
        })
        .await;

        assert_eq!(result, Ok("done"));
        assert_eq!(calls.load(Ordering::SeqCst), 1);
    }

    #[tokio::test]
    async fn retries_until_success_within_the_attempt_budget() {
        let calls = AtomicU32::new(0);

        let result = with_retry(3, Duration::from_millis(0), || {
            let n = calls.fetch_add(1, Ordering::SeqCst);
            async move {
                if n < 2 {
                    Err("temporary failure")
                } else {
                    Ok("done")
                }
            }
        })
        .await;

        assert_eq!(result, Ok("done"));
        assert_eq!(calls.load(Ordering::SeqCst), 3);
    }

    #[tokio::test]
    async fn returns_the_last_error_once_attempts_are_exhausted() {
        let calls = AtomicU32::new(0);

        let result = with_retry(2, Duration::from_millis(0), || {
            calls.fetch_add(1, Ordering::SeqCst);
            async { Err::<&str, _>("always fails") }
        })
        .await;

        assert_eq!(result, Err("always fails"));
        assert_eq!(calls.load(Ordering::SeqCst), 2);
    }
}
