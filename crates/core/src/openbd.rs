//! #14: openBD（<https://api.openbd.jp/>）のレスポンスから書名と著者を取り出す。
//!
//! 実際のHTTP通信（reqwestの構築とリトライ）は副作用の境界として `src-tauri` 側に置き
//! （`docs/architecture.md` §1、`crates/core/src/net/mod.rs` の冒頭コメント参照）、
//! ここにはレスポンス文字列を受け取って解釈するだけの純粋な関数を置く。ネットワークなしで
//! テストできる。

use serde::{Deserialize, Serialize};

/// 書誌情報APIから引いた書名と著者。該当するISBNが見つからない場合は両方とも
/// 空文字のまま返し、利用者が手で埋められるようにする（スキャンは入力の手間を
/// 減らす手段であって、登録できる条件を狭める手段にしてはいけないため）。
#[derive(Debug, Clone, Default, PartialEq, Serialize, Deserialize, specta::Type)]
pub struct BookInfo {
    pub title: String,
    pub author: String,
}

/// openBDの `GET /v1/get?isbn=...` のレスポンス本文（JSON配列、要求した順に1件ずつ、
/// 見つからなければ `null`）から書名と著者を取り出す。JSONとして解釈できない場合や、
/// 期待した形が無い場合も panic せず空の `BookInfo` を返す。
pub fn parse_book_info(response_body: &str) -> BookInfo {
    let Ok(value) = serde_json::from_str::<serde_json::Value>(response_body) else {
        return BookInfo::default();
    };

    let summary = value
        .get(0)
        .filter(|entry| !entry.is_null())
        .and_then(|entry| entry.get("summary"));

    let field = |name: &str| {
        summary
            .and_then(|s| s.get(name))
            .and_then(|v| v.as_str())
            .unwrap_or_default()
            .to_string()
    };

    BookInfo {
        title: field("title"),
        author: field("author"),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn extracts_title_and_author_from_a_found_response() {
        let body = r#"[{"summary":{"isbn":"9784798148026","title":"リーダブルコード","author":"Dustin Boswell/Trevor Foucher","publisher":"オライリー・ジャパン"}}]"#;

        let info = parse_book_info(body);

        assert_eq!(info.title, "リーダブルコード");
        assert_eq!(info.author, "Dustin Boswell/Trevor Foucher");
    }

    #[test]
    fn returns_empty_fields_when_the_isbn_is_not_found() {
        let body = "[null]";

        let info = parse_book_info(body);

        assert_eq!(info, BookInfo::default());
    }

    #[test]
    fn returns_empty_fields_when_the_response_is_not_valid_json() {
        let info = parse_book_info("not json");

        assert_eq!(info, BookInfo::default());
    }

    #[test]
    fn returns_empty_fields_when_the_summary_is_missing() {
        let body = r#"[{"onix":{}}]"#;

        let info = parse_book_info(body);

        assert_eq!(info, BookInfo::default());
    }
}
