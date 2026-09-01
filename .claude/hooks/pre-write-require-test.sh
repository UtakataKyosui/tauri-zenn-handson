#!/usr/bin/env bash
# QA-17: 対応するテストが存在しない実装ファイルの新規作成を検知する。
#
# 未決事項 6（docs/requirements.md §7, docs/automation.md §2）の結論に従い、
# 現段階では「警告」のみで「ブロック」はしない。ブロックへ引き上げる場合は
# permissionDecision を "deny" に変更する。
set -euo pipefail

input="$(cat)"
py() { python3 -c "$1" 2>/dev/null || true; }

file_path="$(echo "$input" | python3 -c 'import json,sys; d=json.load(sys.stdin); print(d.get("tool_input",{}).get("file_path",""))' 2>/dev/null || true)"
[ -z "$file_path" ] && exit 0
[ -e "$file_path" ] && exit 0  # 既存ファイルの上書きは対象外。新規作成のみ判定する

reason=""
case "$file_path" in
  *.test.ts|*.test.tsx|*_test.rs|*/tests/*.rs)
    exit 0 ;; # テストファイル自身は対象外
  */crates/core/src/*.rs|crates/core/src/*.rs)
    base="${file_path%.rs}"
    name="$(basename "$base")"
    dir="$(dirname "$file_path")"
    crate_root="${file_path%/src/*}"
    if ! find "$(dirname "$dir")" "$crate_root/tests" -name "${name}*" -path "*tests*" 2>/dev/null | grep -q . && \
       ! grep -rq "mod tests" "$file_path" 2>/dev/null; then
      reason="警告(QA-17): ${file_path} に対応するテストが見当たりません。crates/core は TDD 必須層です（docs/testing.md §2）。#[cfg(test)] mod tests を同ファイルに書くか、crates/core/tests/ に統合テストを追加してから実装することを推奨します。"
    fi
    ;;
  *src/*.ts|*src/*.tsx)
    case "$file_path" in
      */routes/*|*/app/*|*/components/ui/*|*/lib/bindings.ts|*/*.gen.ts)
        exit 0 ;; # ルート結線・生成物・shadcn コピーはテスト対象外（docs/testing.md §2）
    esac
    test_ts="${file_path%.ts}.test.ts"
    test_tsx="${file_path%.tsx}.test.tsx"
    if [ ! -e "$test_ts" ] && [ ! -e "$test_tsx" ]; then
      reason="警告(QA-17): ${file_path} に対応するテストファイル（*.test.ts(x)）が見当たりません。hooks・stores・変換ロジックは TDD 必須層です（docs/testing.md §2）。"
    fi
    ;;
esac

if [ -n "$reason" ]; then
  python3 - "$reason" <<'PYEOF'
import json, sys
print(json.dumps({
    "hookSpecificOutput": {
        "hookEventName": "PreToolUse",
        "permissionDecision": "allow",
        "permissionDecisionReason": sys.argv[1],
    }
}))
PYEOF
fi

exit 0
