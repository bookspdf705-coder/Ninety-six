"use client";

import { useEffect, useRef, useState } from "react";
import type { Photo } from "@/lib/types";
import { formatFullDate } from "@/lib/format";
import { PathivuSection } from "./PathivuSection";

const DISMISS_DISTANCE = 120;
const DISMISS_VELOCITY = 0.6;
const EXIT_DURATION = 320;

function rubberband(overshoot: number, dimension = 300, constant = 0.55) {
  return (overshoot * dimension * constant) / (dimension + constant * Math.abs(overshoot));
}

export function PhotoDetailModal({
  photo,
  onClose,
  onPrev,
  onNext,
}: {
  photo: Photo;
  onClose: () => void;
  onPrev?: () => void;
  onNext?: () => void;
}) {
  const [dragY, setDragY] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [closing, setClosing] = useState(false);
  const dragState = useRef<{ startY: number; lastY: number; lastT: number; velocity: number } | null>(
    null
  );

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
      // Arrow keys already mean something while typing a Pathivu (moving
      // the caret) or when a video has focus (seeking) — don't hijack them.
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.tagName === "VIDEO" || t.isContentEditable)) {
        return;
      }
      if (e.key === "ArrowLeft" && onPrev) onPrev();
      if (e.key === "ArrowRight" && onNext) onNext();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose, onPrev, onNext]);

  function handlePointerDown(e: React.PointerEvent<HTMLDivElement>) {
    e.currentTarget.setPointerCapture(e.pointerId);
    dragState.current = { startY: e.clientY, lastY: e.clientY, lastT: performance.now(), velocity: 0 };
    setDragging(true);
  }

  function handlePointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!dragState.current) return;
    const now = performance.now();
    const dy = e.clientY - dragState.current.lastY;
    const dt = Math.max(now - dragState.current.lastT, 1);
    dragState.current.velocity = dy / dt;
    dragState.current.lastY = e.clientY;
    dragState.current.lastT = now;

    const totalDelta = e.clientY - dragState.current.startY;
    setDragY(totalDelta > 0 ? totalDelta : rubberband(totalDelta));
  }

  function handlePointerUp() {
    if (!dragState.current) return;
    const { velocity } = dragState.current;
    dragState.current = null;
    setDragging(false);

    if (dragY > DISMISS_DISTANCE || velocity > DISMISS_VELOCITY) {
      setClosing(true);
      setTimeout(onClose, EXIT_DURATION);
    } else {
      setDragY(0);
    }
  }

  const transform = closing
    ? "translateY(100%)"
    : `translateY(${dragY}px) scale(${1 - Math.min(Math.max(dragY, 0), 200) / 4000})`;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-3 backdrop-blur-md sm:p-6"
      style={{
        opacity: closing ? 0 : 1,
        transition: closing ? `opacity ${EXIT_DURATION}ms ease` : undefined,
      }}
      onClick={onClose}
    >
      <button
        onClick={onClose}
        aria-label="Close"
        className="press glass-thin absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full text-white sm:right-6 sm:top-6"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
          <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </button>

      <div
        className="glass-card glass-edge flex h-full max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-squircle-lg sm:flex-row"
        style={{
          transform,
          transition: dragging ? "none" : `transform ${EXIT_DURATION}ms cubic-bezier(0.22, 1, 0.36, 1)`,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          className="flex shrink-0 cursor-grab touch-none items-center justify-center py-2 active:cursor-grabbing sm:hidden"
        >
          <span className="h-1 w-9 rounded-full bg-white/30" />
        </div>

        <div className="relative flex min-h-[38vh] flex-1 items-center justify-center bg-black sm:min-h-0 sm:max-w-[60%]">
          {photo.mediaType === "video" ? (
            // Unmounting this element when the modal closes stops playback
            // on its own — no manual pause needed. Keyed by id so moving
            // to the next item mounts a fresh player instead of reusing one.
            <video
              key={photo.id}
              src={photo.url}
              controls
              autoPlay
              playsInline
              className="max-h-[38vh] w-full object-contain sm:max-h-[92vh]"
            />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={photo.id}
              src={photo.url}
              alt={photo.caption || "Memory"}
              className="max-h-[38vh] w-full object-contain sm:max-h-[92vh]"
            />
          )}

          {onPrev && (
            <button
              type="button"
              onClick={onPrev}
              aria-label="Previous"
              className="chip-on-image press absolute left-2 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-white/20"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M15 5l-7 7 7 7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          )}
          {onNext && (
            <button
              type="button"
              onClick={onNext}
              aria-label="Next"
              className="chip-on-image press absolute right-2 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-white/20"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M9 5l7 7-7 7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          )}
        </div>

        <div className="flex min-h-0 flex-1 flex-col sm:max-w-[40%]">
          {(photo.caption || photo.name) && (
            <div className="border-b border-black/[0.06] px-5 py-4 dark:border-white/10">
              {photo.caption && (
                <p className="type-headline text-balance text-ink dark:text-white">{photo.caption}</p>
              )}
              <p className="type-caption mt-1 text-smoke">
                {photo.name ? `${photo.name} · ` : ""}
                {formatFullDate(photo.uploadedAt)}
              </p>
            </div>
          )}
          <div className="scroll-fade-top min-h-0 flex-1 overflow-y-auto">
            <PathivuSection key={photo.id} photoId={photo.id} comments={photo.comments} variant="panel" />
          </div>
        </div>
      </div>
    </div>
  );
}
