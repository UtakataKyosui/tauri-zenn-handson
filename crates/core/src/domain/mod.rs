//! 純粋ロジック（ドメイン層）。副作用を持たず、ユニットテストで検証する（docs/testing.md §2）。

mod greeting;
pub mod notes;

pub use greeting::greet;
