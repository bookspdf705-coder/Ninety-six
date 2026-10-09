import { supabase } from "./supabase-client";
import type { Comment, Photo } from "./types";

const BUCKET = "photos";
export const MAX_IMAGE_BYTES = 15 * 1024 * 1024; // 15MB
// 50MB is Supabase's free-tier global storage ceiling. Raising this
// further requires upgrading the Supabase project's plan first; the
// number here won't matter until that platform-level limit moves.
export const MAX_VIDEO_BYTES = 50 * 1024 * 1024; // 50MB

const EXT_CONTENT_TYPES: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  gif: "image/gif",
  webp: "image/webp",
  heic: "image/heic",
  heif: "image/heif",
  bmp: "image/bmp",
  avif: "image/avif",
  tif: "image/tiff",
  tiff: "image/tiff",
  mp4: "video/mp4",
  mov: "video/quicktime",
  webm: "video/webm",
  mkv: "video/x-matroska",
  m4v: "video/x-m4v",
};

const VIDEO_EXTENSIONS = new Set(["mp4", "mov", "webm", "mkv", "m4v"]);

function detectMediaType(file: File, ext: string): "image" | "video" {
  if (file.type.startsWith("video/")) return "video";
  if (file.type.startsWith("image/")) return "image";
  return VIDEO_EXTENSIONS.has(ext) ? "video" : "image";
}

type PhotoRow = {
  id: string;
  url: string;
  name: string | null;
  caption: string | null;
  uploaded_at: string;
  visibility: "public" | "private";
  media_type: "image" | "video";
};

type CommentRow = {
  id: string;
  photo_id: string;
  author: string;
  text: string;
  created_at: string;
};

export async function getPhotos(): Promise<Photo[]> {
  const { data: photoRows, error: photoError } = await supabase
    .from("photos")
    .select("id, url, name, caption, uploaded_at, visibility, media_type")
    .order("uploaded_at", { ascending: false });

  if (photoError) throw photoError;
  if (!photoRows || photoRows.length === 0) return [];

  const { data: commentRows, error: commentError } = await supabase
    .from("comments")
    .select("id, photo_id, author, text, created_at")
    .in(
      "photo_id",
      photoRows.map((p) => p.id)
    )
    .order("created_at", { ascending: true });

  if (commentError) throw commentError;

  const commentsByPhoto = new Map<string, Comment[]>();
  for (const row of (commentRows as CommentRow[] | null) ?? []) {
    const list = commentsByPhoto.get(row.photo_id) ?? [];
    list.push({ id: row.id, author: row.author, text: row.text, createdAt: row.created_at });
    commentsByPhoto.set(row.photo_id, list);
  }

  return (photoRows as PhotoRow[]).map((row) => ({
    id: row.id,
    url: row.url,
    name: row.name,
    caption: row.caption,
    uploadedAt: row.uploaded_at,
    visibility: row.visibility,
    mediaType: row.media_type,
    comments: commentsByPhoto.get(row.id) ?? [],
  }));
}

export async function uploadPhoto(
  file: File,
  meta: { name?: string; caption?: string; visibility?: "public" | "private" }
): Promise<Photo> {
  const extMatch = file.name.match(/\.([a-zA-Z0-9]+)$/);
  const ext = extMatch ? extMatch[1].toLowerCase() : "jpg";
  const mediaType = detectMediaType(file, ext);

  const maxBytes = mediaType === "video" ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES;
  if (file.size > maxBytes) {
    throw new Error(
      mediaType === "video" ? "Videos must be under 50MB." : "Photos must be under 15MB."
    );
  }

  const contentType = file.type || EXT_CONTENT_TYPES[ext] || "application/octet-stream";
  const path = `${crypto.randomUUID()}.${ext}`;

  const { error: uploadError } = await supabase.storage.from(BUCKET).upload(path, file, {
    contentType,
    upsert: false,
  });
  if (uploadError) throw uploadError;

  const {
    data: { publicUrl },
  } = supabase.storage.from(BUCKET).getPublicUrl(path);

  const { data: row, error: insertError } = await supabase
    .from("photos")
    .insert({
      storage_path: path,
      url: publicUrl,
      name: meta.name?.trim() || null,
      caption: meta.caption?.trim() || null,
      visibility: meta.visibility ?? "private",
      media_type: mediaType,
    })
    .select("id, url, name, caption, uploaded_at, visibility, media_type")
    .single();

  if (insertError) throw insertError;

  const photoRow = row as PhotoRow;
  return {
    id: photoRow.id,
    url: photoRow.url,
    name: photoRow.name,
    caption: photoRow.caption,
    uploadedAt: photoRow.uploaded_at,
    visibility: photoRow.visibility,
    mediaType: photoRow.media_type,
    comments: [],
  };
}

export async function postComment(
  photoId: string,
  author: string,
  text: string
): Promise<Comment> {
  const { data: row, error } = await supabase
    .from("comments")
    .insert({
      photo_id: photoId,
      author: author.trim() || "Anonymous",
      text: text.trim(),
    })
    .select("id, author, text, created_at")
    .single();

  if (error) throw error;

  const commentRow = row as CommentRow;
  return {
    id: commentRow.id,
    author: commentRow.author,
    text: commentRow.text,
    createdAt: commentRow.created_at,
  };
}
