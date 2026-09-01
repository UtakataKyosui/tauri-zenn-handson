import { useToastStore } from "@/stores/toast-store";

export function Toaster() {
  const toasts = useToastStore((s) => s.toasts);
  const dismiss = useToastStore((s) => s.dismiss);

  if (toasts.length === 0) return null;

  return (
    <output className="fixed bottom-safe-bottom right-4 z-50 flex flex-col gap-2 p-4">
      {toasts.map((toast) => (
        <button
          type="button"
          key={toast.id}
          onClick={() => dismiss(toast.id)}
          className={
            toast.variant === "destructive"
              ? "rounded-md border border-destructive bg-destructive px-4 py-2 text-left text-sm text-destructive-foreground shadow-lg"
              : "rounded-md border border-border bg-card px-4 py-2 text-left text-sm text-card-foreground shadow-lg"
          }
        >
          {toast.title}
        </button>
      ))}
    </output>
  );
}
