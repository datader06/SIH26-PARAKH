"use client";

// Adapted from Magic UI Border Beam (MIT). See THIRD_PARTY_NOTICES.md.
// Tailwind 3 CSS replaces upstream v4 utilities. Motion runs only in view.
import { motion, useInView, useReducedMotion } from "framer-motion";
import { useRef } from "react";

export function BorderBeam() {
  const ref = useRef<HTMLDivElement>(null);
  const visible = useInView(ref);
  const reduced = useReducedMotion();
  return (
    <div ref={ref} aria-hidden="true" className="border-beam">
      {visible && !reduced && (
        <motion.div
          className="border-beam-light"
          style={{ offsetPath: "rect(0 auto auto 0 round 24px)" }}
          initial={{ offsetDistance: "0%" }}
          animate={{ offsetDistance: ["0%", "100%"] }}
          transition={{ repeat: Infinity, ease: "linear", duration: 14 }}
        />
      )}
    </div>
  );
}
