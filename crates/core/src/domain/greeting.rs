use crate::error::{CoreError, CoreResult};

/// サンプルのドメインロジック。TDD のサイクル（docs/testing.md §1）を実演するための
/// 最小の例として、コマンド層（`src-tauri/src/commands/greeting.rs`）から呼び出される。
pub fn greet(name: &str) -> CoreResult<String> {
    let trimmed = name.trim();
    if trimmed.is_empty() {
        return Err(CoreError::InvalidInput("name must not be empty".into()));
    }
    Ok(format!("Hello, {trimmed}!"))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn greets_the_given_name() {
        assert_eq!(greet("World").unwrap(), "Hello, World!");
    }

    #[test]
    fn trims_surrounding_whitespace_before_greeting() {
        assert_eq!(greet("  Ada  ").unwrap(), "Hello, Ada!");
    }

    #[test]
    fn returns_invalid_input_error_when_name_is_empty() {
        let err = greet("").unwrap_err();
        assert!(matches!(err, CoreError::InvalidInput(_)));
    }

    #[test]
    fn returns_invalid_input_error_when_name_is_only_whitespace() {
        let err = greet("   ").unwrap_err();
        assert!(matches!(err, CoreError::InvalidInput(_)));
    }
}
