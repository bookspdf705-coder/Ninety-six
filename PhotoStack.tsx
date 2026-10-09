"use client";

import { useRef, useState } from "react";
import { usePhotos } from "@/lib/photos-context";

const BASE_TRANSFORMS = [
  { rotate: -9, x: -74, y: 12, z: 0 },
  { rotate: -3, x: -25, y: -8, z: 10 },
  { rotate: 4, x: 27, y: -5, z: 20 },
  { rotate: 11, x: 76, y: 14, z: 30 },
];

export function PhotoStack() {
  const { photos } = usePhotos();
  const ref = useRef<HTMLDivElement>(null);
  const [pointer, setPointer] = useState({ x: 0, y: 0, active: false });

  // This is a decorative fan of still photos, so it only draws from
  // images — a video can't render inside an <img> tag.
  const shown = photos.filter((p) => p.mediaType === "image").slice(0, BASE_TRANSFORMS.length);
  if (shown.length === 0) return null;

  function handleMove(e: React.PointerEvent<HTMLDivElement>) {
    if (e.pointerType !== "mouse") return;
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    setPointer({
      x: (e.clientX - rect.left) / rect.width - 0.5,
      y: (e.clientY - rect.top) / rect.height - 0.5,
      active: true,
    });
  }
  function handleLeave() {
    setPointer((p) => ({ ...p, active: false }));
  }

  return (
    <div
      ref={ref}
      onPointerMove={handleMove}
      onPointerLeave={handleLeave}
      className="relative mx-auto h-[220px] w-full max-w-md"
      style={{ perspective: "1000px" }}
    >
      {shown.map((photo, i) => {
        const base = BASE_TRANSFORMS[i];
        const depth = (i + 1) / BASE_TRANSFORMS.length;
        const tx = base.x + (pointer.active ? pointer.x * 26 * depth : 0);
        const ty = base.y + (pointer.active ? pointer.y * 16 * depth : 0);
        const rotateY = pointer.active ? pointer.x * 14 * depth : 0;
        const rotateX = pointer.active ? -pointer.y * 10 * depth : 0;

        return (
          <div
            key={photo.id}
            className="glass-edge absolute left-1/2 top-1/2 h-40 w-32 overflow-hidden rounded-2xl shadow-xl"
            style={{
              transform: `translate(-50%, -50%) translate(${tx}px, ${ty}px) translateZ(${base.z}px) rotate(${base.rotate}deg) rotateY(${rotateY}deg) rotateX(${rotateX}deg)`,
              transition: pointer.active
                ? "transform 120ms linear"
                : "transform 600ms cubic-bezier(0.22, 1, 0.36, 1)",
              zIndex: i,
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={photo.url} alt="" className="h-full w-full object-cover" />
          </div>
        );
      })}
    </div>
  );
}
