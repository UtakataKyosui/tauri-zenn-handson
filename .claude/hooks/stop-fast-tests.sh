#!/usr/bin/env bash
# QA-18: 応答を終える前に高速テスト一式を実行し、失敗していれば知らせる。
# アプリの起動を伴う重いテスト（tauri build 等）はここに含めない（docs/testing.md §6）。
set -uo pipefail

cd "$(dirname "$0")/../.."
failures=""

if [ -f package.json ] && [ -d node_modules ]; then
  if ! pnpm exec vitest run >/tmp/stop-hook-frontend-test.log 2>&1; then
    failures="${failures}\n--- pnpm test (frontend) ---\n$(tail -40 /tmp/stop-hook-frontend-test.log)"
  fi
fi

if [ -f crates/core/Cargo.toml ]; then
  if ! cargo test -p app-core >/tmp/stop-hook-core-test.log 2>&1; then
    failures="${failures}\n--- cargo test -p app-core ---\n$(tail -40 /tmp/stop-hook-core-test.log)"
  fi
fi

if [ -n "$failures" ]; then
  echo -e "高速テストが失敗しています（QA-18）。応答を終える前に確認してください:${failures}" >&2
  exit 2
fi

exit 0
