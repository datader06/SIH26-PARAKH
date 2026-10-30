// Adapted from shadcn/ui (MIT). See THIRD_PARTY_NOTICES.md.
import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Skeleton({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "rounded-lg bg-sand-200 motion-safe:animate-pulse",
        className,
      )}
      {...props}
    />
  );
}
