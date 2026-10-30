"use client";
import React, { useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  ArrowUpRight,
  Building2,
  ChartNoAxesCombined,
  FileBarChart,
  Files,
  GraduationCap,
  KeyRound,
  LayoutDashboard,
  Network,
  ScanLine,
  Settings2,
  ShieldCheck,
  Users,
  X,
} from "lucide-react";
import { useSession } from "@/components/providers/SessionProvider";

export const workspaceNavigation = [
  {
    label: "Overview",
    href: "/dashboard",
    icon: LayoutDashboard,
    group: "Workspace",
  },
  {
    label: "Applications",
    href: "/applications",
    icon: GraduationCap,
    group: "Workspace",
  },
  {
    label: "Portfolio insights",
    href: "/applications/insights",
    icon: ChartNoAxesCombined,
    group: "Workspace",
  },
  {
    label: "Document scanner",
    href: "/scanner",
    icon: ScanLine,
    group: "Intelligence",
  },
  {
    label: "Document registry",
    href: "/documents",
    icon: Files,
    group: "Intelligence",
  },
  {
    label: "Verification",
    href: "/verification",
    icon: ShieldCheck,
    group: "Intelligence",
  },
  {
    label: "Reports",
    href: "/reports",
    icon: FileBarChart,
    group: "Intelligence",
  },
  {
    label: "Activity log",
    href: "/activity",
    icon: Activity,
    group: "Governance",
  },
  {
    label: "Integrations",
    href: "/integrations",
    icon: Network,
    group: "Governance",
  },
  {
    label: "API access",
    href: "/api-access",
    icon: KeyRound,
    group: "Governance",
  },
  { label: "Team & roles", href: "/team", icon: Users, group: "Governance" },
  {
    label: "Security & privacy",
    href: "/security",
    icon: ShieldCheck,
    group: "Governance",
  },
  {
    label: "Settings",
    href: "/settings",
    icon: Settings2,
    group: "Governance",
  },
];
function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const { user } = useSession();
  return (
    <>
      <Link
        href="/dashboard"
        onClick={onNavigate}
        className="flex items-center gap-3 px-3 py-2 text-ink"
      >
        <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#b9cdb7] bg-white/70">
          <ShieldCheck className="h-5 w-5 text-clay-600" />
        </span>
        <span>
          <span className="block font-display text-lg font-bold tracking-[0.12em]">
            PARAKH
          </span>
          <span className="block text-[9px] uppercase tracking-[0.2em] text-[#566e5d]">
            Institutional intelligence
          </span>
        </span>
      </Link>
      <div className="mx-2 mb-5 mt-7 flex items-center gap-2.5 rounded-xl border border-[#c8d8c5] bg-white/60 p-3">
        <Building2 className="h-4 w-4 shrink-0 text-[#875e3d]" />
        <div className="min-w-0">
          <p className="text-[9px] uppercase tracking-[0.16em] text-[#566e5d]">
            Organization
          </p>
          <p
            className="mt-1 truncate text-xs font-medium text-[#304c3a]"
            title={user?.organizationName}
          >
            {user?.organizationName || "Your workspace"}
          </p>
        </div>
      </div>
      <nav aria-label="Workspace navigation" className="flex-1 space-y-6">
        {["Workspace", "Intelligence", "Governance"].map((group) => (
          <div key={group}>
            <p className="mb-2 px-3 text-[9px] font-semibold uppercase tracking-[0.2em] text-[#607866]">
              {group}
            </p>
            <div className="space-y-1">
              {workspaceNavigation
                .filter((item) => item.group === group)
                .map((item) => {
                  const active =
                    item.href === "/applications"
                      ? pathname === item.href ||
                        (pathname.startsWith("/applications/") &&
                          !pathname.startsWith("/applications/insights"))
                      : pathname === item.href ||
                        pathname.startsWith(item.href + "/");
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={onNavigate}
                      aria-current={active ? "page" : undefined}
                      className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 text-xs font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#d69b79] ${active ? "bg-white text-clay-700" : "text-[#4b6555] hover:bg-white/70 hover:text-ink"}`}
                    >
                      <Icon
                        className={`h-4 w-4 shrink-0 ${active ? "text-clay-700" : "text-[#607866] group-hover:text-ink"}`}
                      />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
            </div>
          </div>
        ))}
      </nav>
      <div className="mt-7 border-t border-[#c8d8c5] px-3 pt-4">
        <p className="text-[10px] leading-relaxed text-[#607866]">
          Evidence informs.
          <br />
          <span className="text-[#3c5944]">People decide.</span>
        </p>
        <Link
          href="/"
          onClick={onNavigate}
          className="mt-3 inline-flex items-center gap-1 text-[10px] text-[#875e3d] hover:text-ink"
        >
          About PARAKH
          <ArrowUpRight className="h-3 w-3" />
        </Link>
      </div>
    </>
  );
}
export function Sidebar({
  mobileOpen = false,
  onClose,
}: {
  mobileOpen?: boolean;
  onClose?: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const element = dialog.current;
    if (!element) return;
    if (mobileOpen && !element.open) element.showModal();
    if (!mobileOpen && element.open) element.close();
  }, [mobileOpen]);
  useEffect(() => {
    if (!mobileOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [mobileOpen]);
  return (
    <>
      <aside className="app-sidebar no-print border-r border-border sticky top-0 hidden h-screen w-[248px] shrink-0 flex-col overflow-y-auto bg-[#e8efe6] px-4 py-6 md:flex">
        <SidebarContent />
      </aside>
      <dialog
        ref={dialog}
        aria-label="Workspace navigation"
        onCancel={onClose}
        onClose={onClose}
        onClick={(event) => {
          if (event.target === event.currentTarget) onClose?.();
        }}
        className="workspace-drawer fixed inset-y-0 left-0 right-auto m-0 h-dvh max-h-none w-[288px] max-w-[90vw] border-0 bg-[#e8efe6] p-0 text-ink backdrop:bg-[#e8efe6]/60 backdrop:backdrop-blur-sm"
      >
        <div className="flex min-h-full flex-col px-4 pb-6 pt-5">
          <button
            autoFocus
            aria-label="Close navigation"
            onClick={onClose}
            className="mb-3 self-end rounded-lg p-2 text-[#4b6555] hover:bg-white/10"
          >
            <X className="h-5 w-5" />
          </button>
          <SidebarContent onNavigate={onClose} />
        </div>
      </dialog>
    </>
  );
}
