# 96

A private-ish memory wall: photos **and videos**, Pathivu comments, a
Public/Private split, and a few layers of "soft" locks.

## Flow

1. **Intro animation** (`public/signature-animation.html`, played by
   `components/IntroGate.tsx`) — a hand-drawn ink signature reveal. It posts
   `signature-animation-done` to the page when finished; an 11s fallback
   timer guarantees the site is never stuck behind it.
2. **Lock screen** (`components/LockScreen.tsx`) — iOS-style passcode `1985`.
3. **Home** — upload photos or videos (photos ≤ 15MB, videos ≤ 50MB), choose
   Private/Public, add a name and caption.
4. **The Wall** — Public / Private toggle. Private has its own passcode
   (`nagaram`). Tap any item to open it (videos get a real player) and leave
   a Pathivu.

## Videos

- Upload accepts MP4, MOV, WEBM, MKV, M4V up to **50MB**. That number is
  Supabase's free-tier global storage ceiling — raising it further requires
  upgrading the Supabase plan first, then bumping `MAX_VIDEO_BYTES` in
  `lib/api.ts` and the bucket's `file_size_limit`.
- Grid tiles show a lightweight first-frame preview with a glass play badge
  (no autoplay, `preload="metadata"`, so a wall full of videos doesn't
  download them all up front). The full file loads only when opened.
- The decorative photo fan on Home only uses photos, not videos.
- **Upload progress**: a compact list (icon · name · size · thin track ·
  status) shows each file as Waiting / Uploading / Added / Failed with an
  exact "Uploading 2 of 5" count. The pattern is adapted from 21st.dev's
  "File Upload Progress List", rebuilt without its shadcn/ui + lucide
  dependencies. `supabase-js` can't report byte-level upload progress, so
  the file in flight shows an indeterminate sweep rather than a fake
  percentage. Uploads run one at a time on purpose.
- **Viewer navigation**: prev/next glass chevrons and ← → keys move through
  the section you're browsing. Arrow keys are ignored while typing a Pathivu
  or when a video has focus, so they never fight caret movement or seeking.
- **Format note**: MP4 (H.264) plays everywhere. iPhone `.mov` files are
  often HEVC, which some desktop browsers can't decode — if a friend sees a
  blank player, re-exporting as MP4 fixes it.

## Honest note on the locks

All of the passcodes (`1985`, `nagaram`) are checked in the browser and live
in the JavaScript bundle. They keep casual visitors out; they are not real
security. The Supabase tables and bucket allow public read/insert by design.
Real access control would need actual auth (e.g. Supabase Auth).

## Backend

Supabase Postgres (`photos`, `comments`) + Storage (`photos` bucket). Full
schema and follow-up migrations are in `supabase/migration.sql`. All reads
and writes go through `lib/api.ts`.

## Deploying

This project includes a ~1.5MB intro animation in `public/`. Deploy via
GitHub → Vercel (import the repo, no settings or env vars needed).
