//! RS-13: パニックハンドラ。パニック発生時にログへ退避してからデフォルトの挙動に委ねる。
//! `logging::plugin` 経由でファイルにも出力されるため、クラッシュ時の手がかりが残る。

use std::panic;

pub fn install() {
    let default_hook = panic::take_hook();
    panic::set_hook(Box::new(move |info| {
        log::error!("panic: {info}");
        default_hook(info);
    }));
}
