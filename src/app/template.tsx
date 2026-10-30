"use client";

export default function Template({ children }: { children: React.ReactNode }) {
  // Navigation stays immediate; individual surfaces own their purposeful motion.
  return <>{children}</>;
}
