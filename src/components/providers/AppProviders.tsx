"use client";

import { MotionConfig } from "framer-motion";
import { useEffect } from "react";
import { SessionProvider } from "./SessionProvider";

export function AppProviders({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const markPointer = () => {
      document.documentElement.dataset.input = "pointer";
    };
    const markKeyboard = () => {
      document.documentElement.dataset.input = "keyboard";
    };
    window.addEventListener("pointerdown", markPointer, true);
    window.addEventListener("keydown", markKeyboard, true);
    return () => {
      window.removeEventListener("pointerdown", markPointer, true);
      window.removeEventListener("keydown", markKeyboard, true);
      delete document.documentElement.dataset.input;
    };
  }, []);
  return (
    <MotionConfig reducedMotion="user">
      <SessionProvider>{children}</SessionProvider>
    </MotionConfig>
  );
}
