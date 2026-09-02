//! #14: ISBN-13の形式検証。
//!
//! ISBN-13の最後の桁はチェックデジットで、前の12桁から計算した値と一致していないと、
//! どこか1桁を打ち間違えたか読み取りが失敗したと分かる。ハイフンや空白が混じっていても
//! 数字だけを拾って判定するため、`"978-4-798-14803-9"` のような表記もそのまま渡せる。

/// 文字列がISBN-13として正しい形式かどうかを判定する。数字が13桁ぴったり含まれ、
/// かつチェックデジットが一致する場合だけ `true` を返す。
pub fn is_valid_isbn13(isbn: &str) -> bool {
    let digits: Vec<u32> = isbn.chars().filter_map(|c| c.to_digit(10)).collect();
    if digits.len() != 13 {
        return false;
    }

    let sum: u32 = digits[..12]
        .iter()
        .enumerate()
        .map(|(i, d)| if i % 2 == 0 { *d } else { d * 3 })
        .sum();
    let check_digit = (10 - sum % 10) % 10;

    check_digit == digits[12]
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn accepts_a_valid_isbn13() {
        assert!(is_valid_isbn13("9784873115658"));
    }

    #[test]
    fn accepts_a_valid_isbn13_with_hyphens() {
        assert!(is_valid_isbn13("978-4-87311-565-8"));
    }

    #[test]
    fn rejects_a_wrong_check_digit() {
        assert!(!is_valid_isbn13("9784873115657"));
    }

    #[test]
    fn rejects_a_string_with_fewer_than_13_digits() {
        assert!(!is_valid_isbn13("12345"));
    }

    #[test]
    fn rejects_a_string_with_more_than_13_digits() {
        assert!(!is_valid_isbn13("97847981480267"));
    }

    #[test]
    fn rejects_an_empty_string() {
        assert!(!is_valid_isbn13(""));
    }

    #[test]
    fn rejects_non_digit_characters_only() {
        assert!(!is_valid_isbn13("abcdefghijklm"));
    }
}
