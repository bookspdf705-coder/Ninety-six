"use client";

import { useRef, useState } from "react";
import type { Photo } from "@/lib/types";

const MAX_TILT = 10;

export function PhotoTile({
  photo,
  index,
  onOpen,
}: {
  photo: Photo;
  index: number;
  onOpen: () => void;
}) {
  const ref = useRef<HTMLButtonElement>(null);
  const [tilt, setTilt] = useState({ rx: 0, ry: 0, gx: 50, gy: 50, active: false });
  // Videos have no intrinsic height until their metadata loads, which
  // would make the masonry layout jump. Give them a placeholder height
  // until then, and drop it once the real aspect ratio is known.
  const [videoReady, setVideoReady] = useState(false);
  const isVideo = photo.mediaType === "video";

  function handlePointerMove(e: React.PointerEvent<HTMLButtonElement>) {
    if (e.pointerType !== "mouse") return;
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    const px = (e.clientX - rect.left) / rect.width;
    const py = (e.clientY - rect.top) / rect.height;
    setTilt({
      rx: (0.5 - py) * MAX_TILT * 2,
      ry: (px - 0.5) * MAX_TILT * 2,
      gx: px * 100,
      gy: py * 100,
      active: true,
    });
  }

  function handlePointerLeave() {
    setTilt((t) => ({ ...t, rx: 0, ry: 0, active: false }));
  }

  return (
    <div
      className="mb-3 break-inside-avoid animate-materialize"
      style={{ animationDelay: `${Math.min(index, 12) * 40}ms` }}
    >
      <button
        ref={ref}
        onClick={onOpen}
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
        style={{
          transform: `perspective(800px) rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg) scale(${
            tilt.active ? 1.025 : 1
          })`,
          transition: tilt.active
            ? "transform 90ms linear"
            : "transform 550ms cubic-bezier(0.22, 1, 0.36, 1)",
        }}
        className="glass-edge group relative block w-full overflow-hidden rounded-squircle text-left"
      >
        {isVideo ? (
          // preload="metadata" fetches just enough to show a frame, not
          // the whole file. The #t=0.1 fragment makes iOS Safari actually
          // paint that frame as a thumbnail instead of a blank box.
          <video
            src={`${photo.url}#t=0.1`}
            muted
            playsInline
            preload="metadata"
            onLoadedMetadata={() => setVideoReady(true)}
            className={`block w-full bg-black/30 object-cover ${videoReady ? "" : "min-h-[160px]"}`}
          />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={photo.url}
            alt={photo.caption || "Memory"}
            loading="lazy"
            className="block w-full object-cover"
          />
        )}

        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 transition-opacity duration-300"
          style={{
            opacity: tilt.active ? 1 : 0,
            background: `radial-gradient(220px circle at ${tilt.gx}% ${tilt.gy}%, rgba(255,255,255,0.35), transparent 60%)`,
            mixBlendMode: "overlay",
          }}
        />

        {isVideo && (
          // Decorative only — the whole tile is already the button that
          // opens the player, so this doesn't need its own click target.
          <span
            aria-hidden
            className="chip-on-image pointer-events-none absolute left-1/2 top-1/2 flex h-12 w-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-white/25 shadow-lg"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" className="ml-0.5">
              <path d="M8 5.5v13a1 1 0 001.5.86l10.5-6.5a1 1 0 000-1.72L9.5 4.64A1 1 0 008 5.5z" />
            </svg>
          </span>
        )}

        {(photo.caption || photo.name) && (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/15 to-transparent p-3 pt-9 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
            {photo.caption && (
              <p className="line-clamp-2 text-[12.5px] font-medium text-white">{photo.caption}</p>
            )}
            {photo.name && <p className="mt-0.5 text-[11px] text-white/70">{photo.name}</p>}
          </div>
        )}

        <span
          onClick={(e) => {
            e.stopPropagation();
            onOpen();
          }}
          className="chip-on-image press absolute bottom-2.5 right-2.5 flex items-center gap-1 rounded-full px-2.5 py-1"
          aria-label={`Open Pathivu — ${photo.comments.length} comment${photo.comments.length === 1 ? "" : "s"}`}
          role="button"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
            <path
              d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span className="text-[11px] font-semibold">{photo.comments.length}</span>
        </span>
      </button>
    </div>
  );
}
