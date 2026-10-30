"use client";

// Adapted from shadcn/ui (MIT). See THIRD_PARTY_NOTICES.md.
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRef, type ReactNode } from "react";

export interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
}

export function Dialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  className,
}: DialogProps) {
  const opener = useRef<HTMLElement | null>(null);
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="dialog-backdrop fixed inset-0 z-[80] bg-ink/30 backdrop-blur-sm" />
        <DialogPrimitive.Content
          onOpenAutoFocus={() => {
            opener.current =
              document.activeElement instanceof HTMLElement
                ? document.activeElement
                : null;
          }}
          onCloseAutoFocus={(event) => {
            if (opener.current?.isConnected) {
              event.preventDefault();
              opener.current.focus();
            }
          }}
          className={cn(
            "dialog-panel fixed left-1/2 top-1/2 z-[81] max-h-[90vh] w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl border border-border bg-surface p-6 text-ink shadow-lift focus:outline-none sm:p-8",
            className,
          )}
        >
          <div className="mb-6 pr-8">
            <DialogPrimitive.Title className="font-display text-xl font-semibold tracking-tight text-ink">
              {title}
            </DialogPrimitive.Title>
            <DialogPrimitive.Description
              className={
                description
                  ? "mt-2 text-sm leading-relaxed text-ink-soft"
                  : "sr-only"
              }
            >
              {description || "Use the close button or press Escape to return."}
            </DialogPrimitive.Description>
          </div>
          {children}
          <DialogPrimitive.Close
            className="absolute right-4 top-4 inline-flex h-9 w-9 items-center justify-center rounded-lg text-ink-soft transition-colors hover:bg-sand-100 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            aria-label="Close dialog"
          >
            <X size={18} aria-hidden="true" />
          </DialogPrimitive.Close>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
