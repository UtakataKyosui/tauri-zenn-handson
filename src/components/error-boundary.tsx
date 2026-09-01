import i18n from "@/app/i18n";
import * as React from "react";

interface Props {
  children: React.ReactNode;
  fallback?: (error: Error, reset: () => void) => React.ReactNode;
}

interface State {
  error: Error | null;
}

/**
 * FE-05: 画面全体の予期しない例外を捕まえる最後の砦。個々の Rust 呼び出しのエラーは
 * `src/hooks/use-greeting.ts` のように TanStack Query の `error` から Toaster へ出す方が
 * 望ましく、これは主にレンダリング中の例外を対象とする。
 *
 * クラスコンポーネントのため `useTranslation()` フックではなく `i18n` シングルトンの
 * `t()` を直接呼ぶ（i18n.ts のデフォルトエクスポート）。
 */
export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  reset = () => this.setState({ error: null });

  render() {
    if (this.state.error) {
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.reset);
      }
      return (
        <div role="alert" className="flex flex-col items-center gap-4 p-8 text-center">
          <p className="text-sm text-muted-foreground">
            {i18n.t("errorBoundary.message", { message: this.state.error.message })}
          </p>
          <button
            type="button"
            onClick={this.reset}
            className="rounded-md border border-border px-3 py-1.5 text-sm"
          >
            {i18n.t("errorBoundary.retry")}
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
