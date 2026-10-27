"use client";

import React, { useState, useEffect } from "react";
import { Navbar } from "./Navbar";
import { Sidebar } from "./Sidebar";
import Link from "next/link";
import { Lock, LogIn } from "lucide-react";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    fetch("/api/auth/session")
      .then((r) => r.json())
      .then((d) => {
        setIsAuthenticated(Boolean(d.authenticated && d.user));
      })
      .catch(() => setIsAuthenticated(false));
  }, []);

  return (
    <div className="min-h-screen bg-background text-ink flex flex-col">
      <Navbar onMenuClick={() => setMobileNavOpen(true)} />
      {isAuthenticated === false && (
        <div className="bg-dusk-50 border-b border-dusk-100 px-3 sm:px-4 py-2 text-xs text-dusk-600 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Lock className="h-3.5 w-3.5 text-dusk-500 shrink-0" />
            <span>Operational Console Preview Mode — No authenticated operator session detected.</span>
          </div>
          <Link
            href="/"
            className="px-2.5 py-1 rounded-lg bg-clay-500 hover:bg-clay-600 text-white font-semibold text-[11px] transition-colors duration-200 flex items-center gap-1 shrink-0"
          >
            <LogIn className="h-3 w-3" />
            <span>Sign In</span>
          </Link>
        </div>
      )}
      <div className="flex-1 flex">
        <Sidebar mobileOpen={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />
        <main className="flex-1 p-3 sm:p-6 lg:p-8 overflow-y-auto w-full min-w-0">
          {children}
        </main>
      </div>
    </div>
  );
}
