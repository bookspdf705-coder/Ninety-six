"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

// The animation's own timing: 300ms start delay + 4200ms drawing +
// ~300ms glow fade-out + 1200ms background fade + 1200ms logo fade-in +
// 1800ms hold = ~9000ms before it posts "signature-animation-done".
// This fallback only fires if that message never arrives for some
// reason (e.g. postMessage blocked) so the site is never stuck behind
// a frozen intro.
const FALLBACK_MS = 11000;

export function IntroGate({ children }: { children: ReactNode }) {
  const [introDone, setIntroDone] = useState(false);
  const [fading, setFading] = useState(false);
  const finishedRef = useRef(false);

  useEffect(() => {
    function finish() {
      if (finishedRef.current) return;
      finishedRef.current = true;
      setFading(true);
      // Matches the CSS transition duration below so the fade-out
      // actually finishes before the intro unmounts.
      setTimeout(() => setIntroDone(true), 500);
    }

    function handleMessage(e: MessageEvent) {
      if (e.data === "signature-animation-done") finish();
    }

    window.addEventListener("message", handleMessage);
    const fallback = setTimeout(finish, FALLBACK_MS);

    return () => {
      window.removeEventListener("message", handleMessage);
      clearTimeout(fallback);
    };
  }, []);

  if (introDone) {
    return <>{children}</>;
  }

  return (
    <div
      className="fixed inset-0 z-[300] bg-black transition-opacity duration-500"
      style={{ opacity: fading ? 0 : 1 }}
    >
      <iframe
        src="/signature-animation.html"
        title="Intro animation"
        className="h-full w-full border-0"
      />
    </div>
  );
}
