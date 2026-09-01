# E2E テスト（WebDriver ベース）の追加手順（QA-14, P2）

初版のテンプレートには含めていない。理由は 2 点。

- macOS では WebDriver ベースの E2E（`tauri-driver`）が動作しない制約があり、CI マトリクスの
  一部でしか実行できない
- アプリの起動を伴うため TDD の高速なサイクル（`docs/testing.md` §6）に入れられない。
  別ワークフローとして切り離す前提が要る

## 追加する場合の構成

- `e2e/` ディレクトリに [WebdriverIO](https://webdriver.io/) + `tauri-driver` を使ったテストを置く
- `.github/workflows/e2e.yml` を新設し、`pull_request` ではなく `workflow_dispatch` や
  `main` への push 等、頻度を抑えたトリガーにする（Linux/Windows のみで動かす）
- 既存の `docs/testing.md` §2 の表に「フロント: 画面全体の結線 → 対象外 → E2E で担保する」
  とある通り、ユニット/統合テストで担保できない「実際に画面が繋がって動くか」だけを見る
  範囲に絞る（多く書きすぎない）

## 参考

- https://v2.tauri.app/develop/tests/webdriver/
