#!/usr/bin/env bash
# QA-16: crates/core の実装ファイルを編集した直後に該当クレートのテストを実行し、
# 結果をエージェントに返す。stdin から PostToolUse のフックイベント JSON を受け取る。
set -euo pipefail

input="$(cat)"
file_path="$(echo "$input" | python3 -c 'import json,sys; d=json.load(sys.stdin); print(d.get("tool_input",{}).get("file_path",""))' 2>/dev/null || true)"

case "$file_path" in
  */crates/core/src/*.rs|crates/core/src/*.rs)
    ;;
  *)
    exit 0
    ;;
esac

cd "$(dirname "$0")/../.."
if ! output="$(cargo test -p app-core 2>&1)"; then
  {
    echo "crates/core のテストが失敗しています（QA-16）。修正してから続けてください:"
    echo "$output" | tail -60
  } >&2
  # exit code 2: Claude Code はこれをブロッキングフィードバックとして扱い、
  # stderr の内容をエージェントに返す
  exit 2
fi

echo "crates/core: cargo test -p app-core OK"
