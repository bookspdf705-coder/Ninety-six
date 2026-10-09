"use client";

import { useCallback, useRef, useState } from "react";
import { usePhotos } from "@/lib/photos-context";
import { MAX_IMAGE_BYTES, MAX_VIDEO_BYTES } from "@/lib/api";

type QueueItem = {
  key: string;
  file: File;
  preview: string;
  kind: "image" | "video";
  status: "pending" | "uploading" | "done" | "error";
  error?: string;
  // Set when the file can never be uploaded as-is (too large). Unlike a
  // network error, retrying won't help, so these get a Remove button
  // instead of "tap to retry".
  rejected?: boolean;
};

const IMAGE_EXT = /\.(jpe?g|png|gif|webp|heic|heif|bmp|avif|tiff?)$/i;
const VIDEO_EXT = /\.(mp4|mov|webm|mkv|m4v)$/i;

function classify(f: File): "image" | "video" | null {
  if (f.type.startsWith("video/") || VIDEO_EXT.test(f.name)) return "video";
  if (f.type.startsWith("image/") || IMAGE_EXT.test(f.name)) return "image";
  return null;
}

function formatMB(bytes: number) {
  const mb = bytes / (1024 * 1024);
  return mb >= 10 ? `${mb.toFixed(0)} MB` : `${mb.toFixed(1)} MB`;
}

// Compact upload list: icon, truncated name, thin progress track, status.
// Pattern adapted from 21st.dev's "File Upload Progress List", rebuilt
// without its shadcn/ui + lucide dependencies to match this site's glass
// styling. Uploads run one at a time, so overall progress ("2 of 5") is
// exact; only the file currently in flight is indeterminate.
function UploadProgressList({ items, uploading }: { items: QueueItem[]; uploading: boolean }) {
  const rows = items.filter((i) => !i.rejected);
  if (rows.length === 0) return null;

  const total = rows.length;
  const doneCount = rows.filter((i) => i.status === "done").length;
  const failedCount = rows.filter((i) => i.status === "error").length;

  let heading: string;
  if (uploading) {
    heading = `Uploading ${Math.min(doneCount + failedCount + 1, total)} of ${total}`;
  } else if (doneCount === total) {
    heading = total === 1 ? "Added to the wall" : `All ${total} added to the wall`;
  } else {
    heading = `${doneCount} of ${total} added${failedCount > 0 ? ` · ${failedCount} failed` : ""}`;
  }

  return (
    <div className="glass-thin mb-4 rounded-2xl border border-black/5 px-4 py-3 dark:border-white/10">
      <p className="type-caption mb-1 font-semibold uppercase tracking-wide text-ink/70 dark:text-white/60">
        {heading}
      </p>
      <ul className="max-h-56 divide-y divide-black/[0.06] overflow-y-auto dark:divide-white/10">
        {rows.map((item) => {
          const isActive = item.status === "uploading";
          const isDone = item.status === "done";
          const isError = item.status === "error";
          const statusText = isDone ? "Added ✓" : isError ? "Failed" : isActive ? "Uploading" : "Waiting";
          const statusColor = isDone ? "text-gold" : isError ? "text-red-500" : "text-smoke";
          const fillClass = isDone ? "bg-gold" : isError ? "bg-red-500" : "bg-transparent";
          const fillWidth = isDone || isError ? "100%" : "0%";

          return (
            <li key={item.key} className="flex items-center gap-3 py-2">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gold/15 text-gold">
                {item.kind === "video" ? (
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden>
                    <rect x="3" y="6" width="18" height="12" rx="2.5" stroke="currentColor" strokeWidth="1.7" />
                    <path d="M10.5 9.5v5l4-2.5-4-2.5z" fill="currentColor" />
                  </svg>
                ) : (
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden>
                    <rect x="3" y="5" width="18" height="14" rx="2.5" stroke="currentColor" strokeWidth="1.7" />
                    <circle cx="8.5" cy="10" r="1.6" fill="currentColor" />
                    <path d="M4 17l5-5 3.5 3.5L16 12l4 4.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </span>

              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-medium text-ink dark:text-white">{item.file.name}</p>
                <p className="type-caption text-smoke">{formatMB(item.file.size)}</p>
              </div>

              <div
                role="progressbar"
                aria-label={`${item.file.name}: ${statusText}`}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={isActive ? undefined : isDone || isError ? 100 : 0}
                className={`h-1 w-16 shrink-0 overflow-hidden rounded-full bg-black/10 dark:bg-white/10 sm:w-28 ${
                  isActive ? "progress-indeterminate" : ""
                }`}
              >
                <div
                  className={`h-full rounded-full transition-[width] duration-500 ${fillClass}`}
                  style={{ width: fillWidth }}
                />
              </div>

              <span className={`type-caption w-[4.25rem] shrink-0 text-right ${statusColor}`}>{statusText}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function UploadZone() {
  const { addPhoto } = usePhotos();
  const [items, setItems] = useState<QueueItem[]>([]);
  const [dragging, setDragging] = useState(false);
  const [name, setName] = useState("");
  const [caption, setCaption] = useState("");
  const [visibility, setVisibility] = useState<"public" | "private">("private");
  const [uploadingAll, setUploadingAll] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const addFiles = useCallback((fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    const accepted: QueueItem[] = [];
    for (const file of Array.from(fileList)) {
      const kind = classify(file);
      if (!kind) continue;
      const limit = kind === "video" ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES;
      const tooLarge = file.size > limit;
      accepted.push({
        key: `${file.name}-${file.size}-${Math.random().toString(36).slice(2)}`,
        file,
        preview: URL.createObjectURL(file),
        kind,
        status: tooLarge ? "error" : "pending",
        error: tooLarge
          ? kind === "video"
            ? "Over 50MB"
            : "Over 15MB"
          : undefined,
        rejected: tooLarge,
      });
    }
    if (accepted.length === 0) return;
    setItems((prev) => [...prev, ...accepted]);
  }, []);

  const upload = useCallback(
    async (item: QueueItem) => {
      setItems((prev) => prev.map((i) => (i.key === item.key ? { ...i, status: "uploading" } : i)));
      try {
        await addPhoto(item.file, { name, caption, visibility });
        setItems((prev) => prev.map((i) => (i.key === item.key ? { ...i, status: "done" } : i)));
      } catch (err) {
        setItems((prev) =>
          prev.map((i) =>
            i.key === item.key
              ? { ...i, status: "error", error: (err as Error).message || "That file couldn't be added." }
              : i
          )
        );
      }
    },
    [addPhoto, caption, name, visibility]
  );

  const uploadable = (i: QueueItem) =>
    !i.rejected && (i.status === "pending" || i.status === "error");

  // Uploads run ONE AT A TIME on purpose — firing every upload
  // simultaneously can saturate a phone's connection and cause some to
  // fail outright rather than just going slowly. That matters even more
  // now that videos can be up to 50MB each.
  const uploadAll = useCallback(async () => {
    setUploadingAll(true);
    const pending = items.filter(uploadable);
    for (const item of pending) {
      await upload(item);
    }
    setUploadingAll(false);
  }, [items, upload]);

  const removeItem = (key: string) => setItems((prev) => prev.filter((i) => i.key !== key));
  const pendingCount = items.filter(uploadable).length;
  const showProgress =
    uploadingAll || items.some((i) => i.status === "uploading" || i.status === "done");

  return (
    <div className="w-full">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          addFiles(e.dataTransfer.files);
        }}
        onClick={() => inputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
        }}
        className={`glass-card glass-edge group relative flex min-h-[240px] cursor-pointer flex-col items-center justify-center rounded-squircle transition-all duration-500 ease-settle ${
          dragging ? "scale-[1.01] ring-1 ring-gold/50" : ""
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*,video/*"
          multiple
          className="hidden"
          onChange={(e) => {
            addFiles(e.target.files);
            // Let the same file be picked again after removing it.
            e.target.value = "";
          }}
        />
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gold/15 text-gold transition-transform duration-500 ease-spring group-hover:scale-110">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M12 16V4M12 4l-4.5 4.5M12 4l4.5 4.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <p className="type-headline mt-4 px-4 text-ink dark:text-white">
          Drop photos or videos here, or click to choose
        </p>
        <p className="type-caption mt-1 px-4 text-smoke">
          Photos up to 15MB · Videos (MP4, MOV, WEBM) up to 50MB
        </p>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="type-caption mb-1.5 block uppercase text-smoke">Your name (optional)</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Who's adding these?"
            maxLength={60}
            className="glass-thin w-full rounded-2xl border border-black/5 px-4 py-3 text-[15px] text-ink outline-none transition-colors placeholder:text-smoke/70 focus:border-gold/60 dark:border-white/10 dark:text-white"
          />
        </label>
        <label className="block">
          <span className="type-caption mb-1.5 block uppercase text-smoke">Caption (optional)</span>
          <input
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="What's the memory?"
            maxLength={200}
            className="glass-thin w-full rounded-2xl border border-black/5 px-4 py-3 text-[15px] text-ink outline-none transition-colors placeholder:text-smoke/70 focus:border-gold/60 dark:border-white/10 dark:text-white"
          />
        </label>
      </div>

      <div className="mt-4 flex items-center gap-3">
        <span className="type-caption uppercase text-smoke">Visibility</span>
        <div className="glass-thin inline-flex gap-1 rounded-full p-1">
          <button
            type="button"
            onClick={() => setVisibility("private")}
            className={`press rounded-full px-4 py-1 text-[12px] font-medium transition-colors duration-200 ${
              visibility === "private"
                ? "bg-white text-ink shadow-sm dark:bg-white/15 dark:text-white"
                : "text-smoke hover:text-ink dark:hover:text-white"
            }`}
          >
            Private
          </button>
          <button
            type="button"
            onClick={() => setVisibility("public")}
            className={`press rounded-full px-4 py-1 text-[12px] font-medium transition-colors duration-200 ${
              visibility === "public"
                ? "bg-white text-ink shadow-sm dark:bg-white/15 dark:text-white"
                : "text-smoke hover:text-ink dark:hover:text-white"
            }`}
          >
            Public
          </button>
        </div>
      </div>

      {items.length > 0 && (
        <div className="mt-8">
          <div className="mb-4 flex items-center justify-between">
            <p className="type-caption text-smoke">
              {items.length} file{items.length > 1 ? "s" : ""} selected
            </p>
            {pendingCount > 0 && (
              <button
                onClick={uploadAll}
                disabled={uploadingAll}
                className="press rounded-full bg-ink px-5 py-2 text-[13px] font-medium text-white disabled:opacity-50 dark:bg-white dark:text-ink"
              >
                {uploadingAll ? "Adding…" : `Add ${pendingCount} to the wall`}
              </button>
            )}
          </div>

          {showProgress && <UploadProgressList items={items} uploading={uploadingAll} />}

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {items.map((item) => (
              <div key={item.key} className="group relative aspect-square animate-pop overflow-hidden rounded-2xl bg-black/5 dark:bg-white/5">
                {item.kind === "video" ? (
                  <video
                    src={`${item.preview}#t=0.1`}
                    muted
                    playsInline
                    preload="metadata"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.preview} alt="" className="h-full w-full object-cover" />
                )}

                {item.kind === "video" && (
                  <span
                    aria-hidden
                    className="chip-on-image pointer-events-none absolute left-2 top-2 flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold"
                  >
                    <svg width="9" height="9" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M8 5.5v13a1 1 0 001.5.86l10.5-6.5a1 1 0 000-1.72L9.5 4.64A1 1 0 008 5.5z" />
                    </svg>
                    Video
                  </span>
                )}

                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/0 transition-colors group-hover:bg-black/40">
                  {item.status === "pending" && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeItem(item.key);
                      }}
                      className="hidden rounded-full bg-white/90 px-3 py-1 text-[12px] font-medium text-ink group-hover:block"
                    >
                      Remove
                    </button>
                  )}
                  {item.status === "uploading" && (
                    <span className="rounded-full bg-black/60 px-3 py-1 text-[12px] font-medium text-white">Adding…</span>
                  )}
                  {item.status === "done" && (
                    <span className="animate-pop rounded-full bg-gold px-3 py-1 text-[12px] font-medium text-white">Added ✓</span>
                  )}
                  {item.status === "error" && item.rejected && (
                    <>
                      <span className="rounded-full bg-red-500/90 px-3 py-1 text-center text-[11px] font-medium text-white">
                        {item.error}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeItem(item.key);
                        }}
                        className="rounded-full bg-white/90 px-3 py-1 text-[11px] font-medium text-ink"
                      >
                        Remove
                      </button>
                    </>
                  )}
                  {item.status === "error" && !item.rejected && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        upload(item);
                      }}
                      className="rounded-full bg-red-500/90 px-3 py-1 text-center text-[11px] font-medium text-white"
                    >
                      {item.error || "Failed"} — tap to retry
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
