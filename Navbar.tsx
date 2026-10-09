"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ThemeToggle } from "./ThemeToggle";

const LINKS = [
  { href: "/", label: "Home" },
  { href: "/wall", label: "The Wall" },
];

export function Navbar() {
  const pathname = usePathname();
  const containerRef = useRef<HTMLDivElement>(null);
  const linkRefs = useRef<Record<string, HTMLAnchorElement | null>>({});
  const [pill, setPill] = useState<{ left: number; width: number } | null>(null);

  useEffect(() => {
    const activeEl = linkRefs.current[pathname];
    const containerEl = containerRef.current;
    if (activeEl && containerEl) {
      const containerRect = containerEl.getBoundingClientRect();
      const activeRect = activeEl.getBoundingClientRect();
      setPill({ left: activeRect.left - containerRect.left, width: activeRect.width });
    }
  }, [pathname]);

  return (
    <header className="fixed inset-x-0 top-0 z-50 flex justify-center px-4 pt-4">
      <nav
        className="glass-thick glass-edge glass-specular flex w-full max-w-2xl items-center justify-between rounded-squircle-lg px-2 py-2"
        aria-label="Primary"
      >
        <Link
          href="/"
          className="press flex items-center pl-3 pr-2 font-display text-[15px] font-semibold tracking-tighter text-ink dark:text-mist"
        >
          96
        </Link>

        <div
          ref={containerRef}
          className="relative flex items-center gap-1 rounded-full bg-black/5 p-1 dark:bg-white/5"
        >
          {pill && (
            <span
              aria-hidden
              className="absolute inset-y-1 rounded-full bg-white shadow-sm dark:bg-white/15"
              style={{
                left: pill.left,
                width: pill.width,
                transition: "left 420ms cubic-bezier(0.22, 1, 0.36, 1), width 420ms cubic-bezier(0.22, 1, 0.36, 1)",
              }}
            />
          )}
          {LINKS.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                ref={(el) => {
                  linkRefs.current[link.href] = el;
                }}
                className={`press relative z-10 rounded-full px-4 py-1.5 text-[13px] font-medium transition-colors duration-300 ${
                  active
                    ? "text-ink dark:text-white"
                    : "text-smoke hover:text-ink dark:text-white/50 dark:hover:text-white"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </div>

        <div className="pr-1">
          <ThemeToggle />
        </div>
      </nav>
    </header>
  );
}
