import { useEffect, useState } from "react";

const NARROW_QUERY = "(max-width: 640px)";

/**
 * #16: 画面幅が`sm`（640px）未満かどうかを購読する。一覧画面で表とカード表示を
 * 切り替えるために使う。`__root.tsx`のナビ切替（CSSの`sm:`）と揃えて、同じ640pxを
 * 判定の境目にする。CSSではなくJSでの分岐が必要なのは、表とカードでDOM構造自体が
 * 異なり、`display`の出し分けだけでは済まないため。
 */
export function useIsNarrow(): boolean {
  const [isNarrow, setIsNarrow] = useState(
    () => typeof window !== "undefined" && window.matchMedia(NARROW_QUERY).matches,
  );

  useEffect(() => {
    const media = window.matchMedia(NARROW_QUERY);
    const apply = (e: MediaQueryList | MediaQueryListEvent) => setIsNarrow(e.matches);

    apply(media);
    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, []);

  return isNarrow;
}
