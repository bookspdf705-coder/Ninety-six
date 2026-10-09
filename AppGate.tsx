"use client";

import { useState, type ReactNode } from "react";
import { LockScreen } from "./LockScreen";

// Deliberately simple: `unlocked` starts false and the ONLY way it
// becomes true is the onUnlock callback, which LockScreen calls only
// after a correct 4-digit match. No localStorage, no effects, nothing
// that could set it true on its own.
export function AppGate({ children }: { children: ReactNode }) {
  const [unlocked, setUnlocked] = useState(false);

  if (!unlocked) {
    return <LockScreen onUnlock={() => setUnlocked(true)} />;
  }

  return <>{children}</>;
}
