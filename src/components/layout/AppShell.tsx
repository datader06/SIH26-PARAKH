"use client";
import React, { useState } from "react";
import Link from "next/link";
import { LogIn } from "lucide-react";
import { Navbar } from "./Navbar";
import { Sidebar } from "./Sidebar";
import { useSession } from "@/components/providers/SessionProvider";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const { user, loading, error } = useSession();
  return (
    <div className="app-shell flex min-h-screen bg-[#f5f7f6] text-ink">
      <a
        href="#workspace-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-white focus:p-3 focus:text-ink"
      >
        Skip to workspace
      </a>
      <Sidebar
        mobileOpen={mobileNavOpen}
        onClose={() => setMobileNavOpen(false)}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <Navbar onMenuClick={() => setMobileNavOpen(true)} />
        {!loading && !user && (
          <div
            role="status"
            className="flex flex-wrap items-center justify-between gap-2 border-b border-border bg-white px-5 py-2.5 text-xs text-ink-soft"
          >
            <span>
              {error || "Sign in to access your organization’s workspace."}
            </span>
            <Link
              href="/?signin=true"
              className="inline-flex items-center gap-1.5 font-semibold text-clay-700 hover:underline"
            >
              <LogIn className="h-3.5 w-3.5" />
              Sign in
            </Link>
          </div>
        )}
        <main
          id="workspace-content"
          tabIndex={-1}
          className="app-main mx-auto w-full min-w-0 flex-1 p-4 outline-none sm:p-6 xl:p-9"
        >
          {children}
        </main>
        <footer className="no-print flex flex-wrap justify-between gap-2 border-t border-border px-5 py-3 text-[10px] text-ink-faint sm:px-6 xl:px-9">
          <span>PARAKH · Institutional intelligence</span>
          <span>
            Advisory signals. Final decisions remain with authorized reviewers.
          </span>
        </footer>
      </div>
    </div>
  );
}
