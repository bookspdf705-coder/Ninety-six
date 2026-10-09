import { PhotoGrid } from "@/components/PhotoGrid";

export default function WallPage() {
  return (
    <div className="mx-auto max-w-6xl px-5 pb-32 pt-6 sm:px-8 sm:pt-10">
      <div className="mx-auto mb-14 max-w-2xl text-center">
        <h1 className="type-title animate-fade-up text-ink dark:text-white">The Wall</h1>
        <p
          className="type-body mt-3 animate-fade-up text-[16px] text-smoke sm:text-[17px]"
          style={{ animationDelay: "80ms" }}
        >
          Every photo and video, from everyone. Tap one — or the Pathivu
          icon — to open it up and see the comments.
        </p>
      </div>

      <PhotoGrid />
    </div>
  );
}
