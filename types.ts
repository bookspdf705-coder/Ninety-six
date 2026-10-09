export type Comment = {
  id: string;
  author: string;
  text: string;
  createdAt: string;
};

export type Photo = {
  id: string;
  url: string;
  name: string | null;
  caption: string | null;
  uploadedAt: string;
  visibility: "public" | "private";
  mediaType: "image" | "video";
  comments: Comment[];
};
