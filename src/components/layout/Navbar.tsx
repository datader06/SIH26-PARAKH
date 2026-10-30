"use client";
import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowRight,
  ChevronRight,
  LogOut,
  Menu,
  Search,
  Settings2,
  X,
} from "lucide-react";
import { useSession } from "@/components/providers/SessionProvider";
import { workspaceNavigation } from "./Sidebar";

export function Navbar({ onMenuClick }: { onMenuClick?: () => void } = {}) {
  const pathname = usePathname();
  const { user, loading } = useSession();
  const [query, setQuery] = useState("");
  const [signingOut, setSigningOut] = useState(false);
  const [logoutError, setLogoutError] = useState("");
  const searchDialog = useRef<HTMLDialogElement>(null);
  const searchInput = useRef<HTMLInputElement>(null);
  const current = [...workspaceNavigation]
    .sort((a, b) => b.href.length - a.href.length)
    .find(
      (item) => pathname === item.href || pathname.startsWith(item.href + "/"),
    );
  const results = workspaceNavigation.filter((item) =>
    `${item.label} ${item.group}`
      .toLowerCase()
      .includes(query.toLowerCase().trim()),
  );
  const openSearch = () => {
    setQuery("");
    searchDialog.current?.showModal();
    searchInput.current?.focus();
  };
  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        if (searchDialog.current?.open) searchDialog.current.close();
        else openSearch();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);
  const logout = async () => {
    setSigningOut(true);
    setLogoutError("");
    try {
      const response = await fetch("/api/auth/logout", { method: "POST" });
      if (!response.ok) throw new Error();
      window.location.assign("/");
    } catch {
      setLogoutError("Could not sign out. Please try again.");
      setSigningOut(false);
    }
  };
  return (
    <>
      <header className="app-navbar no-print sticky top-0 z-30 flex h-[76px] shrink-0 items-center justify-between gap-3 border-b border-border bg-[#f5f7f6]/95 px-4 backdrop-blur-md sm:px-6 xl:px-9">
        <div className="flex min-w-0 items-center gap-3">
          <button
            onClick={onMenuClick}
            aria-label="Open workspace navigation"
            className="rounded-lg p-2 text-ink-soft hover:bg-white md:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="min-w-0">
            <p className="mb-1 hidden text-[9px] font-semibold uppercase tracking-[0.18em] text-ink-faint sm:block">
              Your operational workspace
            </p>
            <div
              aria-label="Breadcrumb"
              className="flex min-w-0 items-center gap-2 text-xs"
            >
              <Link
                href="/dashboard"
                className="hidden text-ink-soft hover:text-clay-700 sm:inline"
              >
                Workspace
              </Link>
              <ChevronRight className="hidden h-3 w-3 text-ink-faint sm:block" />
              <span className="truncate font-semibold text-ink">
                {current?.label || "Overview"}
              </span>
              {current && pathname !== current.href && (
                <>
                  <ChevronRight className="h-3 w-3 shrink-0 text-ink-faint" />
                  <span className="truncate text-ink-soft">Case detail</span>
                </>
              )}
            </div>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2 sm:gap-5">
          <button
            onClick={openSearch}
            aria-label="Search workspace navigation"
            aria-keyshortcuts="Control+k Meta+k"
            className="flex items-center gap-2 rounded-lg border border-border bg-white px-2.5 py-2 text-xs text-ink-soft shadow-sm hover:border-clay-300"
          >
            <Search className="h-4 w-4" />
            <span className="hidden lg:inline">Jump to…</span>
            <kbd className="hidden rounded border border-border px-1 text-[9px] text-ink-faint lg:inline">
              ⌘ K
            </kbd>
          </button>
          <Link
            href="/applications"
            className="hidden items-center gap-2 text-xs font-semibold text-clay-700 hover:underline xl:inline-flex"
          >
            Application workspace
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
          {loading ? (
            <span className="text-xs text-ink-faint">Checking session…</span>
          ) : user ? (
            <details className="relative">
              <summary className="flex cursor-pointer list-none items-center gap-2.5 rounded-lg py-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-clay-500">
                <span className="flex h-9 w-9 items-center justify-center rounded-full border border-clay-200 bg-clay-50 text-xs font-bold text-clay-700">
                  {user.name
                    .split(" ")
                    .map((part) => part[0])
                    .slice(0, 2)
                    .join("")}
                </span>
                <span className="hidden text-left sm:block">
                  <span className="block max-w-[150px] truncate text-xs font-semibold text-ink">
                    {user.name}
                  </span>
                  <span className="mt-0.5 block text-[9px] capitalize tracking-wide text-ink-soft">
                    {user.role.toLowerCase()}
                  </span>
                </span>
              </summary>
              <div className="absolute right-0 top-full mt-3 w-64 rounded-xl border border-border bg-white p-2 shadow-lift">
                <div className="border-b border-border px-3 py-2">
                  <p className="truncate text-xs font-semibold text-ink">
                    {user.organizationName}
                  </p>
                  <p className="mt-1 truncate text-[10px] text-ink-soft">
                    {user.email}
                  </p>
                </div>
                <Link
                  href="/settings"
                  className="mt-1 flex items-center gap-2 rounded-lg px-3 py-2.5 text-xs text-ink-soft hover:bg-surface-100"
                >
                  <Settings2 className="h-3.5 w-3.5" />
                  Workspace settings
                </Link>
                <button
                  disabled={signingOut}
                  onClick={logout}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-xs text-rose-600 hover:bg-rose-50 disabled:opacity-50"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  {signingOut ? "Signing out…" : "Sign out"}
                </button>
                {logoutError && (
                  <p role="alert" className="px-3 py-2 text-xs text-rose-600">
                    {logoutError}
                  </p>
                )}
              </div>
            </details>
          ) : (
            <Link
              href="/?signin=true"
              className="rounded-lg bg-clay-600 px-3 py-2 text-xs font-semibold text-white hover:bg-clay-700"
            >
              Sign in
            </Link>
          )}
        </div>
      </header>
      <dialog
        ref={searchDialog}
        aria-labelledby="workspace-search-title"
        onClick={(event) => {
          if (event.target === event.currentTarget)
            searchDialog.current?.close();
        }}
        className="fixed top-[12vh] m-auto max-h-[76vh] w-[calc(100%-2rem)] max-w-lg overflow-y-auto rounded-2xl border border-border bg-white p-0 text-ink shadow-lift backdrop:bg-[#111d21]/50 backdrop:backdrop-blur-sm"
      >
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 id="workspace-search-title" className="text-sm font-semibold">
            Jump to a workspace
          </h2>
          <button
            onClick={() => searchDialog.current?.close()}
            aria-label="Close navigation search"
            className="rounded-lg p-1.5 text-ink-soft hover:bg-surface-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="px-4 pt-4">
          <label htmlFor="workspace-nav-search" className="sr-only">
            Search pages
          </label>
          <input
            ref={searchInput}
            id="workspace-nav-search"
            type="search"
            placeholder="Search applications, reports, settings…"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="w-full rounded-lg border border-border bg-surface-100 px-3 py-2.5 text-sm outline-none focus:border-clay-500 focus:ring-2 focus:ring-clay-100"
          />
        </div>
        <nav aria-label="Search results" className="space-y-1 p-4">
          {results.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => searchDialog.current?.close()}
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm hover:bg-surface-100"
              >
                <Icon className="h-4 w-4 text-ink-soft" />
                <span>{item.label}</span>
                <span className="ml-auto text-[10px] text-ink-faint">
                  {item.group}
                </span>
              </Link>
            );
          })}
          {!results.length && (
            <p role="status" className="py-8 text-center text-sm text-ink-soft">
              No matching pages. Try a different name.
            </p>
          )}
        </nav>
      </dialog>
    </>
  );
}
