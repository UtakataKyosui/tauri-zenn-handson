import { getSettingsStore } from "@/lib/settings-store";
import type { SortingState } from "@tanstack/react-table";
import { useEffect, useRef, useState } from "react";

const DEFAULT_SORT_KEY = "defaultSort";
const FALLBACK_SORT: SortingState = [{ id: "created_at", desc: true }];

/**
 * #15: 一覧の既定の並び順を`tauri-plugin-store`（`settings.json`）に保存する。
 * マウント直後は`FALLBACK_SORT`で描画し、保存済みの値が読み込めたらそれに差し替える。
 * 保存済みの値の読み込みが終わる前に利用者が並び替えると、読み込みの結果で
 * 上書きしてしまうため、読み込みが完了するまでは書き込みを行わない。
 */
export function useDefaultSort() {
  const [sorting, setSorting] = useState<SortingState>(FALLBACK_SORT);
  const hydratedRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    getSettingsStore()
      .then((store) => store.get<SortingState>(DEFAULT_SORT_KEY))
      .then((saved) => {
        if (cancelled) return;
        if (saved) setSorting(saved);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) hydratedRef.current = true;
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!hydratedRef.current) return;
    getSettingsStore()
      .then((store) => store.set(DEFAULT_SORT_KEY, sorting))
      .catch(() => {});
  }, [sorting]);

  return [sorting, setSorting] as const;
}
