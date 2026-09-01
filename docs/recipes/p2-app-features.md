# P2 のアプリ機能の追加手順（APP-10〜13）

いずれも初版では見送り、必要になった時点で以下の方針で追加する。

## APP-10: グローバルショートカット（Desktop）

最小権限の原則（レビュー観点 §1）により、使わないプラグイン・権限は初期状態では
登録しない。実際に追加する場合は次の3箇所を編集する。

```sh
cargo add tauri-plugin-global-shortcut --target 'cfg(not(any(target_os = "android", target_os = "ios")))' -p tauri-app-template
```

```rust
// src-tauri/src/lib.rs の #[cfg(desktop)] ブロック内
.plugin(tauri_plugin_global_shortcut::Builder::new().build())
```

```rust
// src-tauri/src/desktop/mod.rs::setup() 相当の箇所
use tauri_plugin_global_shortcut::{Code, GlobalShortcutExt, Modifiers, Shortcut};

let shortcut = Shortcut::new(Some(Modifiers::CONTROL | Modifiers::SHIFT), Code::KeyK);
app.global_shortcut().register(shortcut)?;
```

`capabilities/desktop.json` に `global-shortcut:default` を追加する。特定のショートカット
のみ許可する場合は `global-shortcut:allow-register` 等に絞る。

## APP-11: 自動起動（ログイン時起動, Desktop）

同様に未登録。追加する場合:

```sh
cargo add tauri-plugin-autostart --target 'cfg(not(any(target_os = "android", target_os = "ios")))' -p tauri-app-template
```

```rust
// src-tauri/src/lib.rs の #[cfg(desktop)] ブロック内
.plugin(tauri_plugin_autostart::init(
    tauri_plugin_autostart::MacosLauncher::LaunchAgent,
    None,
))
```

```rust
use tauri_plugin_autostart::ManagerExt;

app.autolaunch().enable()?;
```

`capabilities/desktop.json` に `autostart:default` を追加する。
設定画面にトグルを追加し、`RS-08`（tauri-plugin-store）でユーザーの選択を永続化するとよい。

## APP-12: クリップボード連携（両プラットフォーム）

`@tauri-apps/plugin-clipboard-manager` を追加する。

```sh
pnpm add @tauri-apps/plugin-clipboard-manager
```

```rust
// src-tauri/src/lib.rs
.plugin(tauri_plugin_clipboard_manager::init())
```

`capabilities/default.json` に `clipboard-manager:default` を追加する（両プラットフォームで
使うため）。

## APP-13: 生体認証（Mobile 専用）

同様に未登録。追加する場合:

```sh
cargo add tauri-plugin-biometric --target 'cfg(any(target_os = "android", target_os = "ios"))' -p tauri-app-template
pnpm add @tauri-apps/plugin-biometric
```

```rust
// src-tauri/src/lib.rs の #[cfg(mobile)] ブロック内
.plugin(tauri_plugin_biometric::init())
```

`capabilities/mobile.json` に `biometric:default` を追加し、フロントから
`@tauri-apps/plugin-biometric` の `authenticate()` を呼ぶ。
デスクトップでは意味を持たないため、`src/lib/platform.ts` の `isMobile()` で UI を出し分けること
（レビュー観点 §3）。
