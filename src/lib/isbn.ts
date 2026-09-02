/**
 * #14: ISBN-13の形式検証。`crates/core/src/isbn.rs` の `is_valid_isbn13` と同じ計算を
 * 画面側でも行い、その場でエラーを示す。保存してよいかどうかの最終判断は
 * Rust側（`crates/core/src/domain/book.rs`）がすでに行っている。
 */
export function isValidIsbn13(isbn: string): boolean {
  const digits = isbn.replace(/[^0-9]/g, "");
  if (digits.length !== 13) return false;

  const sum = [...digits.slice(0, 12)]
    .map(Number)
    .reduce((total, digit, i) => total + digit * (i % 2 === 0 ? 1 : 3), 0);
  const checkDigit = (10 - (sum % 10)) % 10;

  return checkDigit === Number(digits[12]);
}
