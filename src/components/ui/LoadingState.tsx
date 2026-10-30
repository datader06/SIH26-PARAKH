import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function LoadingState({
  label = "Loading workspace…",
  className,
}: {
  label?: string;
  className?: string;
}) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "flex min-h-[220px] flex-col items-center justify-center gap-3 px-6 py-12 text-ink-soft",
        className,
      )}
    >
      <Loader2
        size={22}
        className="text-clay-600 motion-safe:animate-spin"
        aria-hidden="true"
      />
      <p className="text-sm">{label}</p>
    </div>
  );
}
