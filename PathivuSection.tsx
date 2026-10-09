"use client";

import { useState } from "react";
import type { Comment } from "@/lib/types";
import { usePhotos } from "@/lib/photos-context";
import { useDisplayName } from "@/lib/use-display-name";
import { initials, formatDate } from "@/lib/format";

export function PathivuSection({
  photoId,
  comments,
  variant = "panel",
}: {
  photoId: string;
  comments: Comment[];
  variant?: "panel" | "card";
}) {
  const { addComment } = usePhotos();
  const [name, setName] = useDisplayName();
  const [editingName, setEditingName] = useState(false);
  const [text, setText] = useState("");
  const [expanded, setExpanded] = useState(false);
  const [posting, setPosting] = useState(false);
  const [postError, setPostError] = useState<string | null>(null);

  const truncate = variant === "card";
  const visibleComments = truncate ? (expanded ? comments : comments.slice(-2)) : comments;
  const hiddenCount = truncate ? comments.length - visibleComments.length : 0;

  async function handlePost() {
    const trimmed = text.trim();
    if (!trimmed || posting) return;
    setPosting(true);
    setPostError(null);
    try {
      await addComment(photoId, name || "Anonymous", trimmed);
      setText("");
    } catch (err) {
      console.error("[96] Failed to post a Pathivu:", err);
      setPostError("That didn't send — try again.");
    } finally {
      setPosting(false);
    }
  }

  return (
    <div className={variant === "card" ? "border-t border-black/[0.06] px-5 py-4 dark:border-white/10" : "px-5 py-4"}>
      <div className="mb-3 flex items-center gap-1.5">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="text-gold">
          <path
            d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <span className="type-caption font-semibold uppercase tracking-wide text-ink/70 dark:text-white/60">
          Pathivu{comments.length > 0 ? ` · ${comments.length}` : ""}
        </span>
      </div>

      {hiddenCount > 0 && (
        <button
          onClick={() => setExpanded(true)}
          className="type-caption mb-3 text-smoke hover:text-ink dark:hover:text-white"
        >
          View {hiddenCount} more {hiddenCount === 1 ? "pathivu" : "pathivus"}
        </button>
      )}

      {comments.length === 0 && (
        <p className="type-caption mb-3 text-smoke/70">Be the first to leave a pathivu.</p>
      )}

      <ul className="mb-3 space-y-3">
        {visibleComments.map((c) => (
          <li key={c.id} className="flex gap-2.5">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gold/15 text-[10px] font-semibold text-gold">
              {initials(c.author)}
            </span>
            <div className="min-w-0">
              <p className="type-body text-ink dark:text-white">
                <span className="font-semibold">{c.author}</span>{" "}
                <span className="text-ink/90 dark:text-white/90">{c.text}</span>
              </p>
              <p className="type-caption text-smoke/70">{formatDate(c.createdAt)}</p>
            </div>
          </li>
        ))}
      </ul>

      <div className="glass-thin flex items-center gap-2 rounded-full border border-black/5 px-2 py-1.5 dark:border-white/10">
        {editingName ? (
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={() => setEditingName(false)}
            onKeyDown={(e) => e.key === "Enter" && setEditingName(false)}
            placeholder="Your name"
            maxLength={40}
            className="w-20 shrink-0 bg-transparent text-[12px] font-medium text-ink outline-none placeholder:text-smoke dark:text-white"
          />
        ) : (
          <button
            onClick={() => setEditingName(true)}
            className="shrink-0 text-[12px] font-medium text-smoke hover:text-ink dark:hover:text-white"
          >
            {name || "Anonymous"}
          </button>
        )}
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handlePost()}
          placeholder="Add your pathivu…"
          maxLength={280}
          className="min-w-0 flex-1 bg-transparent text-[13px] text-ink outline-none placeholder:text-smoke dark:text-white"
        />
        <button
          onClick={handlePost}
          disabled={!text.trim() || posting}
          className="press flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gold text-white transition-opacity disabled:opacity-30"
          aria-label="Post"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
            <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
      {postError && <p className="type-caption mt-2 text-red-500">{postError}</p>}
    </div>
  );
}
