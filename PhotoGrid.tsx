"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { usePhotos } from "@/lib/photos-context";
import { PhotoTile } from "./PhotoTile";
import { PhotoDetailModal } from "./PhotoDetailModal";

type Section = "public" | "private";
const PRIVATE_PASSCODE = "nagaram";

export function PhotoGrid() {
  const { photos, loading, error, refetch } = usePhotos();
  const [activeId, setActiveId] = useState<string | null>(null);
  // Private first — that's where every photo uploaded before this
  // feature existed, so opening here shows people their existing wall
  // instead of an empty "Public" tab.
  const [section, setSection] = useState<Section>("private");

  // Private section has its own passcode gate, separate from the
  // site-wide lock screen. Unlocked state lives only in this
  // component's state (no localStorage) — same reasoning as the main
  // lock screen: nothing that could persist incorrectly or leak
  // across sessions, resets cleanly on reload.
  const [privateUnlocked, setPrivateUnlocked] = useState(false);
  const [privatePassword, setPrivatePassword] = useState("");
  const [privateError, setPrivateError] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const publicRef = useRef<HTMLButtonElement>(null);
  const privateRef = useRef<HTMLButtonElement>(null);
  const [pill, setPill] = useState<{ left: number; width: number } | null>(null);

  useEffect(() => {
    const activeEl = section === "public" ? publicRef.current : privateRef.current;
    const containerEl = containerRef.current;
    if (activeEl && containerEl) {
      const containerRect = containerEl.getBoundingClientRect();
      const activeRect = activeEl.getBoundingClientRect();
      setPill({ left: activeRect.left - containerRect.left, width: activeRect.width });
    }
  }, [section, loading, privateUnlocked]);

  const activePhoto = activeId ? photos.find((p) => p.id === activeId) ?? null : null;
  const sectionPhotos = photos.filter((p) => p.visibility === section);

  // Neighbours within the section being browsed, for prev/next in the viewer.
  const activeIndex = activeId ? sectionPhotos.findIndex((p) => p.id === activeId) : -1;
  const prevPhoto = activeIndex > 0 ? sectionPhotos[activeIndex - 1] : null;
  const nextPhoto =
    activeIndex >= 0 && activeIndex < sectionPhotos.length - 1 ? sectionPhotos[activeIndex + 1] : null;

  function handlePrivateSubmit(e: FormEvent) {
    e.preventDefault();
    if (privatePassword.trim().toLowerCase() === PRIVATE_PASSCODE) {
      setPrivateUnlocked(true);
      setPrivateError(false);
      setPrivatePassword("");
    } else {
      setPrivateError(true);
      setPrivatePassword("");
    }
  }

  const toggle = (
    <div className="mb-8 flex justify-center">
      <div
        ref={containerRef}
        className="glass-thin glass-edge relative inline-flex items-center gap-1 rounded-full p-1"
      >
        {pill && (
          <span
            aria-hidden
            className="absolute inset-y-1 rounded-full bg-white shadow-sm dark:bg-white/15"
            style={{
              left: pill.left,
              width: pill.width,
              transition:
                "left 420ms cubic-bezier(0.22, 1, 0.36, 1), width 420ms cubic-bezier(0.22, 1, 0.36, 1)",
            }}
          />
        )}
        <button
          ref={publicRef}
          onClick={() => setSection("public")}
          className={`press relative z-10 rounded-full px-5 py-1.5 text-[13px] font-medium transition-colors duration-300 ${
            section === "public"
              ? "text-ink dark:text-white"
              : "text-smoke hover:text-ink dark:text-white/50 dark:hover:text-white"
          }`}
        >
          Public
        </button>
        <button
          ref={privateRef}
          onClick={() => setSection("private")}
          className={`press relative z-10 rounded-full px-5 py-1.5 text-[13px] font-medium transition-colors duration-300 ${
            section === "private"
              ? "text-ink dark:text-white"
              : "text-smoke hover:text-ink dark:text-white/50 dark:hover:text-white"
          }`}
        >
          Private
        </button>
      </div>
    </div>
  );

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center">
        <p className="type-body text-smoke">{error}</p>
        <button
          onClick={refetch}
          className="press mt-4 rounded-full bg-ink px-5 py-2 text-[13px] font-medium text-white dark:bg-white dark:text-ink"
        >
          Try again
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="columns-2 gap-3 sm:columns-3 md:columns-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="glass-card mb-3 animate-pulse rounded-squircle"
            style={{ height: 140 + ((i * 47) % 160) }}
          />
        ))}
      </div>
    );
  }

  if (section === "private" && !privateUnlocked) {
    return (
      <>
        {toggle}
        <div className="mx-auto flex max-w-xs flex-col items-center py-20 text-center">
          <div className="glass-card glass-edge mb-5 flex h-16 w-16 items-center justify-center rounded-full text-gold">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <rect x="5" y="11" width="14" height="9" rx="2" stroke="currentColor" strokeWidth="1.7" />
              <path d="M8 11V7a4 4 0 018 0v4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
            </svg>
          </div>
          <p className="type-headline text-ink dark:text-white">This section is locked</p>
          <p className="type-body mt-1.5 text-smoke">Enter the passcode to see private photos and videos.</p>

          <form
            onSubmit={handlePrivateSubmit}
            className="glass-thin mt-6 flex w-full items-center gap-2 rounded-full border border-black/5 px-2 py-1.5 dark:border-white/10"
          >
            <input
              type="password"
              value={privatePassword}
              onChange={(e) => {
                setPrivatePassword(e.target.value);
                setPrivateError(false);
              }}
              placeholder="Passcode"
              autoFocus
              className="min-w-0 flex-1 bg-transparent px-3 py-1.5 text-[14px] text-ink outline-none placeholder:text-smoke dark:text-white"
            />
            <button
              type="submit"
              disabled={!privatePassword.trim()}
              className="press flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gold text-white transition-opacity disabled:opacity-30"
              aria-label="Unlock"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </form>
          {privateError && <p className="type-caption mt-3 text-red-500">That&apos;s not right — try again.</p>}
        </div>
      </>
    );
  }

  if (sectionPhotos.length === 0) {
    return (
      <>
        {toggle}
        <div className="flex flex-col items-center justify-center py-32 text-center">
          <div className="glass-card glass-edge mb-5 flex h-16 w-16 items-center justify-center rounded-full text-gold">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
              <rect x="3" y="5" width="18" height="14" rx="2.5" stroke="currentColor" strokeWidth="1.7" />
              <circle cx="8.5" cy="10" r="1.6" fill="currentColor" />
              <path
                d="M4 17l5-5 3.5 3.5L16 12l4 4.5"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <p className="type-headline text-ink dark:text-white">
            {section === "public" ? "Nothing public yet" : "The private wall is empty, for now"}
          </p>
          <p className="type-body mt-1.5 max-w-xs text-smoke">
            {section === "public"
              ? "Photos and videos marked Public when uploading will show up here."
              : "Head to Home and be the first to add a memory."}
          </p>
        </div>
      </>
    );
  }

  return (
    <>
      {toggle}
      <div className="columns-2 gap-3 sm:columns-3 md:columns-4">
        {sectionPhotos.map((photo, i) => (
          <PhotoTile key={photo.id} photo={photo} index={i} onOpen={() => setActiveId(photo.id)} />
        ))}
      </div>

      {activePhoto && (
        <PhotoDetailModal
          photo={activePhoto}
          onClose={() => setActiveId(null)}
          onPrev={prevPhoto ? () => setActiveId(prevPhoto.id) : undefined}
          onNext={nextPhoto ? () => setActiveId(nextPhoto.id) : undefined}
        />
      )}
    </>
  );
}
