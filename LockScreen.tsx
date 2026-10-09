"use client";

import { useCallback, useRef, useState } from "react";

const PASSCODE = "1985";
const PASSCODE_LENGTH = 4;

const KEYS = [
  { digit: "1", letters: "" },
  { digit: "2", letters: "ABC" },
  { digit: "3", letters: "DEF" },
  { digit: "4", letters: "GHI" },
  { digit: "5", letters: "JKL" },
  { digit: "6", letters: "MNO" },
  { digit: "7", letters: "PQRS" },
  { digit: "8", letters: "TUV" },
  { digit: "9", letters: "WXYZ" },
];

export function LockScreen({ onUnlock }: { onUnlock: () => void }) {
  const [digits, setDigits] = useState("");
  const [shake, setShake] = useState(false);
  const [pressedKey, setPressedKey] = useState<string | null>(null);
  const checking = useRef(false);

  const handleKey = useCallback(
    (digit: string) => {
      if (checking.current || digits.length >= PASSCODE_LENGTH) return;

      setPressedKey(digit);
      setTimeout(() => setPressedKey((k) => (k === digit ? null : k)), 120);

      const next = digits + digit;
      setDigits(next);

      if (next.length === PASSCODE_LENGTH) {
        checking.current = true;
        setTimeout(() => {
          if (next === PASSCODE) {
            onUnlock();
          } else {
            setShake(true);
            setTimeout(() => {
              setShake(false);
              setDigits("");
              checking.current = false;
            }, 500);
          }
        }, 150);
      }
    },
    [digits, onUnlock]
  );

  return (
    <div className="fixed inset-0 z-[200] flex flex-col items-center bg-black px-6 pt-28 text-white">
      <p className="text-[17px] font-semibold">Enter Passcode</p>
      <p className="mt-2 text-[13px] text-white/45">Password is not 1978</p>

      <div className={`mt-9 flex gap-5 ${shake ? "animate-shake" : ""}`} aria-hidden>
        {Array.from({ length: PASSCODE_LENGTH }).map((_, i) => {
          const filled = i < digits.length;
          return (
            <span
              key={i}
              className={`h-3.5 w-3.5 rounded-full border transition-colors duration-150 ${
                filled
                  ? shake
                    ? "border-red-500 bg-red-500"
                    : "border-white bg-white"
                  : "border-white/35 bg-transparent"
              }`}
            />
          );
        })}
      </div>

      <div className="mt-16 grid grid-cols-3 gap-x-7 gap-y-5">
        {KEYS.map((k) => (
          <button
            key={k.digit}
            type="button"
            onPointerDown={() => handleKey(k.digit)}
            aria-label={k.letters ? `${k.digit} ${k.letters}` : k.digit}
            className={`glass-edge press flex h-[72px] w-[72px] flex-col items-center justify-center rounded-full border border-white/10 bg-white/10 backdrop-blur-xl transition-colors duration-150 ${
              pressedKey === k.digit ? "bg-white/25" : ""
            }`}
          >
            <span className="text-[28px] font-normal leading-none">{k.digit}</span>
            {k.letters && (
              <span className="mt-1 text-[9px] font-medium tracking-[0.15em] text-white/70">
                {k.letters}
              </span>
            )}
          </button>
        ))}

        <span aria-hidden />
        <button
          type="button"
          onPointerDown={() => handleKey("0")}
          aria-label="0"
          className={`glass-edge press flex h-[72px] w-[72px] items-center justify-center rounded-full border border-white/10 bg-white/10 backdrop-blur-xl transition-colors duration-150 ${
            pressedKey === "0" ? "bg-white/25" : ""
          }`}
        >
          <span className="text-[28px] font-normal leading-none">0</span>
        </button>
        <span aria-hidden />
      </div>
    </div>
  );
}
