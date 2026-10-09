"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { Photo } from "./types";
import { getPhotos, postComment, uploadPhoto } from "./api";

type PhotosContextValue = {
  photos: Photo[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
  addPhoto: (
    file: File,
    meta: { name?: string; caption?: string; visibility?: "public" | "private" }
  ) => Promise<void>;
  addComment: (photoId: string, author: string, text: string) => Promise<void>;
};

const PhotosContext = createContext<PhotosContextValue | null>(null);

export function PhotosProvider({ children }: { children: ReactNode }) {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refetchToken, setRefetchToken] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    getPhotos()
      .then((data) => {
        if (cancelled) return;
        setPhotos(data);
        setLoading(false);
      })
      .catch((err) => {
        if (cancelled) return;
        console.error("[96] Failed to load photos from Supabase:", err);
        setError("The wall couldn't load. Check your connection and try again.");
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [refetchToken]);

  const refetch = useCallback(() => setRefetchToken((t) => t + 1), []);

  const addPhoto = useCallback(
    async (file: File, meta: { name?: string; caption?: string; visibility?: "public" | "private" }) => {
      const photo = await uploadPhoto(file, meta);
      setPhotos((prev) => [photo, ...prev]);
    },
    []
  );

  const addComment = useCallback(async (photoId: string, author: string, text: string) => {
    const comment = await postComment(photoId, author, text);
    setPhotos((prev) =>
      prev.map((p) => (p.id === photoId ? { ...p, comments: [...p.comments, comment] } : p))
    );
  }, []);

  return (
    <PhotosContext.Provider value={{ photos, loading, error, refetch, addPhoto, addComment }}>
      {children}
    </PhotosContext.Provider>
  );
}

export function usePhotos() {
  const ctx = useContext(PhotosContext);
  if (!ctx) throw new Error("usePhotos must be used within PhotosProvider");
  return ctx;
}
