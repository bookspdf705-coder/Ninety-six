"use client";

import { useEffect, useState } from "react";

const KEY = "96-display-name";

export function useDisplayName(): [string, (name: string) => void] {
  const [name, setNameState] = useState("");

  useEffect(() => {
    try {
      const stored = localStorage.getItem(KEY);
      if (stored) setNameState(stored);
    } catch {
      // localStorage unavailable — falls back to session-only state
    }
  }, []);

  const setName = (value: string) => {
    setNameState(value);
    try {
      localStorage.setItem(KEY, value);
    } catch {
      // ignore
    }
  };

  return [name, setName];
}
