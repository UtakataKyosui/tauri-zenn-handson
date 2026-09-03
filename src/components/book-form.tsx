import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { Genre, NewBook, ReadingStatus } from "@/lib/bindings";
import { isValidIsbn13 } from "@/lib/isbn";
import { useForm } from "@tanstack/react-form";
import { useTranslation } from "react-i18next";

const STATUS_OPTIONS: ReadingStatus[] = ["unread", "reading", "finished"];
const GENRE_OPTIONS: Genre[] = ["novel", "non_fiction", "business", "technology", "other"];

/**
 * #10: 登録と編集で共有するフォーム。題名の検証は `onMount` と `onChange` の両方に置く。
 * `onChange` だけだと画面を開いた直後は一度も入力していないため検証が走らず、
 * `canSubmit` が `true` のまま空の題名でも送信できてしまう。
 * エラーの表示は `field.state.meta.isTouched` で絞り、まだ触れていない入力欄には出さない。
 * 画面側の検証はその場での案内にすぎず、保存してよいかどうかの最終判断は
 * `crates/core` 側（`domain/book.rs` の `create`/`update`）がすでに行っている。
 */
export function BookForm({
  defaultValues,
  onSubmit,
  submitLabel,
}: {
  defaultValues: NewBook;
  onSubmit: (value: NewBook) => Promise<void>;
  submitLabel: string;
}) {
  const { t } = useTranslation();

  const form = useForm({
    defaultValues,
    onSubmit: async ({ value }) => {
      await onSubmit(value);
    },
  });

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();
        form.handleSubmit();
      }}
    >
      <form.Field
        name="title"
        validators={{
          onMount: ({ value }) =>
            value.trim().length === 0 ? t("books.form.titleError") : undefined,
          onChange: ({ value }) =>
            value.trim().length === 0 ? t("books.form.titleError") : undefined,
        }}
      >
        {(field) => (
          <div className="flex flex-col gap-2">
            <Label htmlFor={field.name}>{t("books.form.title")}</Label>
            <Input
              id={field.name}
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
              onBlur={field.handleBlur}
            />
            {field.state.meta.isTouched && field.state.meta.errors.length > 0 && (
              <span role="alert" className="text-sm text-destructive">
                {field.state.meta.errors[0]}
              </span>
            )}
          </div>
        )}
      </form.Field>

      <form.Field name="author">
        {(field) => (
          <div className="flex flex-col gap-2">
            <Label htmlFor={field.name}>{t("books.form.author")}</Label>
            <Input
              id={field.name}
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
            />
          </div>
        )}
      </form.Field>

      <form.Field name="status">
        {(field) => (
          <div className="flex flex-col gap-2">
            <Label htmlFor={field.name}>{t("books.form.status")}</Label>
            <Select
              value={field.state.value}
              onValueChange={(value) => field.handleChange(value as ReadingStatus)}
            >
              <SelectTrigger id={field.name}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((status) => (
                  <SelectItem key={status} value={status}>
                    {t(`books.status.${status}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </form.Field>

      <form.Field name="genre">
        {(field) => (
          <div className="flex flex-col gap-2">
            <Label htmlFor={field.name}>{t("books.form.genre")}</Label>
            <Select
              value={field.state.value}
              onValueChange={(value) => field.handleChange(value as Genre)}
            >
              <SelectTrigger id={field.name}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {GENRE_OPTIONS.map((genre) => (
                  <SelectItem key={genre} value={genre}>
                    {t(`books.genre.${genre}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </form.Field>

      <form.Field name="note">
        {(field) => (
          <div className="flex flex-col gap-2">
            <Label htmlFor={field.name}>{t("books.form.note")}</Label>
            <Textarea
              id={field.name}
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
            />
          </div>
        )}
      </form.Field>

      {/* #14: ISBNは分かっているときだけ入れる項目のため空欄を許し、値があるときだけ
          ISBN-13の形式を検証する。保存してよいかどうかの最終判断は
          `crates/core` 側（`domain/book.rs` の `create`/`update`）が行う。 */}
      <form.Field
        name="isbn"
        validators={{
          onChange: ({ value }) =>
            value.length > 0 && !isValidIsbn13(value) ? t("books.form.isbnError") : undefined,
        }}
      >
        {(field) => (
          <div className="flex flex-col gap-2">
            <Label htmlFor={field.name}>{t("books.form.isbn")}</Label>
            {/* #16: ISBNは数字のみのためモバイルでは数字キーパッドを出す。
                桁数の検証自体は`isValidIsbn13`が行うため、ここでは入力補助に留める。 */}
            <Input
              id={field.name}
              inputMode="numeric"
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
              onBlur={field.handleBlur}
            />
            {field.state.meta.isTouched && field.state.meta.errors.length > 0 && (
              <span role="alert" className="text-sm text-destructive">
                {field.state.meta.errors[0]}
              </span>
            )}
          </div>
        )}
      </form.Field>

      <form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting] as const}>
        {([canSubmit, isSubmitting]) => (
          // #16: タッチで押しやすいよう、既存の Button バリアントのうち最大の `lg`
          // （h-10）を使う。`button.tsx`はshadcn生成物のため手編集しない（レビュー観点§4）。
          <Button type="submit" size="lg" disabled={!canSubmit}>
            {isSubmitting ? t("books.form.submitting") : submitLabel}
          </Button>
        )}
      </form.Subscribe>
    </form>
  );
}
