import { Button } from "@/components/ui/button";
import { type Note, createNote, deleteNote, listNotes } from "@/lib/api/notes";
import { type TaskProgress, cancelLongTask, onTaskProgress, startLongTask } from "@/lib/api/tasks";
import { checkForUpdate, installUpdate } from "@/lib/api/updater";
import { isImagePath, mimeTypeForImagePath } from "@/lib/file-preview";
import { isDesktop } from "@/lib/platform";
import { type UpdaterStatus, toUpdaterStatus } from "@/lib/updater-status";
import { useToastStore } from "@/stores/toast-store";
import { createFileRoute } from "@tanstack/react-router";
import { open as openDialog } from "@tauri-apps/plugin-dialog";
import { readFile, readTextFile } from "@tauri-apps/plugin-fs";
import {
  isPermissionGranted,
  requestPermission,
  sendNotification,
} from "@tauri-apps/plugin-notification";
import { openUrl } from "@tauri-apps/plugin-opener";
import { platform } from "@tauri-apps/plugin-os";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

export const Route = createFileRoute("/demo")({
  component: DemoPage,
});

/**
 * Phase 3 の基盤機能（APP-01〜03, RS-09, RS-10）を実演するページ。
 * 実プロジェクトでは不要になった機能ごとこのファイルを削除できる（リスク R-7）。
 */
function DemoPage() {
  const { t } = useTranslation();
  const pushToast = useToastStore((s) => s.push);

  return (
    <div className="mx-auto flex max-w-md flex-col gap-8">
      <h1 className="text-2xl font-semibold">{t("demo.title")}</h1>
      <FileDemo onError={(m) => pushToast({ title: m, variant: "destructive" })} />
      <NotificationDemo onError={(m) => pushToast({ title: m, variant: "destructive" })} />
      <OpenLinkDemo onError={(m) => pushToast({ title: m, variant: "destructive" })} />
      <LongTaskDemo onError={(m) => pushToast({ title: m, variant: "destructive" })} />
      <NotesDemo onError={(m) => pushToast({ title: m, variant: "destructive" })} />
      {isDesktop() && (
        <UpdaterDemo onError={(m) => pushToast({ title: m, variant: "destructive" })} />
      )}
    </div>
  );
}

interface DemoSectionProps {
  onError: (message: string) => void;
}

type FilePreview = { kind: "text"; content: string } | { kind: "image"; objectUrl: string };

// APP-01: ファイル選択ダイアログ / ファイル読み書き
function FileDemo({ onError }: DemoSectionProps) {
  const { t } = useTranslation();
  const [preview, setPreview] = useState<FilePreview | null>(null);

  // Blob URL はページ内でしか有効でないため、選択し直す・アンマウントする際に
  // 明示的に revoke しないとメモリリークする（#34）。
  useEffect(() => {
    return () => {
      if (preview?.kind === "image") {
        URL.revokeObjectURL(preview.objectUrl);
      }
    };
  }, [preview]);

  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-sm font-medium">{t("demo.file.title")}</h2>
      <Button
        variant="outline"
        onClick={async () => {
          try {
            const path = await openDialog({
              multiple: false,
              filters: [
                { name: "Text", extensions: ["txt", "md", "json", "toml", "yaml", "csv", "log"] },
                { name: "Image", extensions: ["png", "jpg", "jpeg", "gif", "webp", "bmp", "ico"] },
              ],
            });
            if (!path || Array.isArray(path)) return;
            // フロントから受け取ったパスをそのまま渡すが、これはダイアログが返した
            // 検証済みの値であり、ユーザー入力の任意文字列ではない点に注意
            // （レビュー観点 §1、任意文字列を渡す場合は別途検証すること）。
            if (isImagePath(path)) {
              const bytes = await readFile(path);
              const blob = new Blob([bytes], { type: mimeTypeForImagePath(path) });
              setPreview({ kind: "image", objectUrl: URL.createObjectURL(blob) });
            } else {
              const content = await readTextFile(path);
              setPreview({ kind: "text", content: content.slice(0, 200) });
            }
          } catch (e) {
            onError(String(e));
          }
        }}
      >
        {t("demo.file.open")}
      </Button>
      <p className="text-xs text-muted-foreground">{t("demo.file.hint")}</p>
      {preview?.kind === "text" && (
        <pre className="whitespace-pre-wrap text-xs text-muted-foreground">{preview.content}</pre>
      )}
      {preview?.kind === "image" && (
        <img
          src={preview.objectUrl}
          alt={t("demo.file.imageAlt")}
          className="max-h-48 w-auto rounded-md border border-input object-contain"
        />
      )}
    </section>
  );
}

// APP-02: ネイティブ通知
export function NotificationDemo({ onError }: DemoSectionProps) {
  const { t } = useTranslation();
  const [permissionGranted, setPermissionGranted] = useState<boolean | null>(null);

  useEffect(() => {
    isPermissionGranted().then(setPermissionGranted);
  }, []);

  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-sm font-medium">{t("demo.notification.title")}</h2>
      <Button
        variant="outline"
        onClick={async () => {
          try {
            let granted = await isPermissionGranted();
            if (!granted) {
              // モバイルでは要求フローがデスクトップと異なる（OS のダイアログに委譲される）
              granted = (await requestPermission()) === "granted";
            }
            setPermissionGranted(granted);
            if (granted) {
              sendNotification({
                title: t("demo.notification.title"),
                body: t("demo.notification.body"),
              });
            } else {
              onError(t("demo.notification.denied"));
            }
          } catch (e) {
            onError(String(e));
          }
        }}
      >
        {t("demo.notification.send")}
      </Button>
      <p className="text-xs text-muted-foreground">
        {permissionGranted === null
          ? t("demo.notification.permissionChecking")
          : permissionGranted
            ? t("demo.notification.permissionGranted")
            : t("demo.notification.permissionNotGranted")}
      </p>
      <p className="text-xs text-muted-foreground">{t("demo.notification.devNote")}</p>
    </section>
  );
}

const DEMO_URL = "https://tauri.app";

// APP-03: 外部リンクを OS 既定ブラウザで開く
export function OpenLinkDemo({ onError }: DemoSectionProps) {
  const { t } = useTranslation();
  // 既定ブラウザ（例: Arc）が URL を握り潰しても /usr/bin/open の終了コードは
  // 0 のままでアプリ側からは検知できない（#38）。Safari を明示指定すれば
  // この既定ブラウザ側の問題を回避できるため、macOS でのみ選択肢を出す。
  const [isMacos, setIsMacos] = useState(false);

  useEffect(() => {
    if (isDesktop()) {
      setIsMacos(platform() === "macos");
    }
  }, []);

  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-sm font-medium">{t("demo.openLink.title")}</h2>
      <div className="flex gap-2">
        <Button
          variant="outline"
          onClick={async () => {
            try {
              await openUrl(DEMO_URL);
            } catch (e) {
              onError(String(e));
            }
          }}
        >
          {t("demo.openLink.open")}
        </Button>
        {isMacos && (
          <Button
            variant="outline"
            onClick={async () => {
              try {
                await openUrl(DEMO_URL, "Safari");
              } catch (e) {
                onError(String(e));
              }
            }}
          >
            {t("demo.openLink.openWithSafari")}
          </Button>
        )}
      </div>
      <p className="text-xs text-muted-foreground">{t("demo.openLink.notice")}</p>
    </section>
  );
}

// RS-10: 進捗イベントを伴う長時間処理
function LongTaskDemo({ onError }: DemoSectionProps) {
  const { t } = useTranslation();
  const [progress, setProgress] = useState<TaskProgress | null>(null);
  const [taskId, setTaskId] = useState<string | null>(null);

  useEffect(() => {
    const unlisten = onTaskProgress((p) => setProgress(p));
    return () => {
      unlisten.then((f) => f());
    };
  }, []);

  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-sm font-medium">{t("demo.longTask.title")}</h2>
      <div className="flex gap-2">
        <Button
          variant="outline"
          onClick={async () => {
            try {
              setTaskId(await startLongTask(10));
            } catch (e) {
              onError(String(e));
            }
          }}
        >
          {t("demo.longTask.start")}
        </Button>
        <Button
          variant="ghost"
          disabled={!taskId}
          onClick={async () => {
            if (!taskId) return;
            try {
              await cancelLongTask(taskId);
            } catch (e) {
              onError(String(e));
            }
          }}
        >
          {t("demo.longTask.cancel")}
        </Button>
      </div>
      {progress && (
        <p className="text-xs text-muted-foreground">
          {progress.status}: {progress.completed}/{progress.total}
        </p>
      )}
    </section>
  );
}

// RS-09: SQLite 永続化のサンプル
function NotesDemo({ onError }: DemoSectionProps) {
  const { t } = useTranslation();
  const [notes, setNotes] = useState<Note[]>([]);
  const [title, setTitle] = useState("");
  const [adding, setAdding] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const refresh = useCallback(async () => {
    try {
      setNotes(await listNotes());
    } catch (e) {
      onError(String(e));
    }
  }, [onError]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-sm font-medium">{t("demo.notes.title")}</h2>
      <div className="flex gap-2">
        <input
          className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={t("demo.notes.placeholder")}
        />
        <Button
          disabled={adding}
          onClick={async () => {
            if (!title.trim()) return;
            setAdding(true);
            try {
              await createNote(title, "");
              setTitle("");
              await refresh();
            } catch (e) {
              onError(String(e));
            } finally {
              setAdding(false);
            }
          }}
        >
          {t("demo.notes.add")}
        </Button>
      </div>
      <ul className="flex flex-col gap-1">
        {notes.map((note) => (
          <li key={note.id} className="flex items-center justify-between text-sm">
            <span>{note.title}</span>
            <button
              type="button"
              disabled={deletingId === note.id}
              className="text-xs text-muted-foreground underline disabled:opacity-50"
              onClick={async () => {
                setDeletingId(note.id);
                try {
                  await deleteNote(note.id);
                  await refresh();
                } catch (e) {
                  onError(String(e));
                } finally {
                  setDeletingId(null);
                }
              }}
            >
              {t("demo.notes.delete")}
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

// APP-08: 自動アップデート（デスクトップ専用）
function UpdaterDemo({ onError }: DemoSectionProps) {
  const { t } = useTranslation();
  const [status, setStatus] = useState<UpdaterStatus>({ kind: "idle" });
  const [installing, setInstalling] = useState(false);

  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-sm font-medium">{t("demo.updater.title")}</h2>
      <div className="flex gap-2">
        <Button
          variant="outline"
          disabled={status.kind === "checking"}
          onClick={async () => {
            setStatus({ kind: "checking" });
            try {
              const info = await checkForUpdate();
              setStatus(toUpdaterStatus(info));
            } catch (e) {
              const message = String(e);
              setStatus({ kind: "failed", message });
              onError(message);
            }
          }}
        >
          {t("demo.updater.check")}
        </Button>
        {status.kind === "available" && (
          <Button
            disabled={installing}
            onClick={async () => {
              setInstalling(true);
              try {
                await installUpdate();
              } catch (e) {
                onError(String(e));
              } finally {
                setInstalling(false);
              }
            }}
          >
            {t("demo.updater.install", { version: status.version })}
          </Button>
        )}
      </div>
      {status.kind === "checking" && (
        <p className="text-xs text-muted-foreground">{t("demo.updater.checking")}</p>
      )}
      {status.kind === "upToDate" && (
        <p className="text-xs text-muted-foreground">{t("demo.updater.upToDate")}</p>
      )}
      {status.kind === "failed" && (
        <p className="text-xs text-destructive">
          {t("demo.updater.failed", { message: status.message })}
        </p>
      )}
    </section>
  );
}
