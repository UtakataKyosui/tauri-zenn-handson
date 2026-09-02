import { type EventCallback, listen } from "@tauri-apps/api/event";
import { useEffect, useRef } from "react";

/**
 * #15: Tauriのイベント購読と解除をまとめる汎用フック。メニューのイベント
 * （`menu://export`）に限らず、Tauriのイベントを受け取る場所ならどこでも使う。
 *
 * `handler` を直接 `useEffect` の依存配列に入れると、呼び出す側が毎回新しい関数を
 * 渡した場合に購読の解除と登録を繰り返してしまう。`handlerRef` に最新の関数を
 * 持たせておき、`useEffect` 自体は `event` が変わったときだけ動くようにすることで、
 * 呼び出す側は関数を `useCallback` で包む必要がない。
 */
export function useTauriEvent<T>(event: string, handler: EventCallback<T>) {
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  useEffect(() => {
    const unlisten = listen<T>(event, (e) => handlerRef.current(e));

    return () => {
      unlisten.then((f) => f());
    };
  }, [event]);
}
