import { create } from "zustand";

export interface Toast {
  id: string;
  title: string;
  variant?: "default" | "destructive";
}

/** トーストが自動で消えるまでの時間。 */
export const TOAST_DURATION_MS = 5000;
/** 同時に表示できるトーストの最大件数。超えた分は古いものから捨てる。 */
export const TOAST_LIMIT = 5;

interface ToastState {
  toasts: Toast[];
  push: (toast: Omit<Toast, "id">) => void;
  dismiss: (id: string) => void;
}

const dismissTimers = new Map<string, ReturnType<typeof setTimeout>>();

function clearDismissTimer(id: string) {
  const timer = dismissTimers.get(id);
  if (timer) clearTimeout(timer);
  dismissTimers.delete(id);
}

/**
 * FE-05: Rust 側エラーの共通表示先。`src/lib/api/**` で捕まえた例外や
 * ErrorBoundary はここに push し、`src/components/toaster.tsx` が描画する。
 */
export const useToastStore = create<ToastState>((set, get) => {
  function scheduleDismiss(id: string) {
    clearDismissTimer(id);
    dismissTimers.set(
      id,
      setTimeout(() => {
        get().dismiss(id);
      }, TOAST_DURATION_MS),
    );
  }

  return {
    toasts: [],
    push: (toast) =>
      set((state) => {
        const last = state.toasts[state.toasts.length - 1];
        if (last && last.title === toast.title && last.variant === toast.variant) {
          scheduleDismiss(last.id);
          return state;
        }

        const id = crypto.randomUUID();
        const toasts = [...state.toasts, { ...toast, id }];
        const overflow = Math.max(0, toasts.length - TOAST_LIMIT);
        for (const dropped of toasts.slice(0, overflow)) {
          clearDismissTimer(dropped.id);
        }

        scheduleDismiss(id);
        return { toasts: toasts.slice(overflow) };
      }),
    dismiss: (id) => {
      clearDismissTimer(id);
      set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
    },
  };
});
