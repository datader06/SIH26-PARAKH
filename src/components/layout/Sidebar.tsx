"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  Scan,
  Files,
  CheckSquare,
  FileBarChart,
  History,
  Network,
  Key,
  Users,
  Settings,
  ShieldCheck,
  GraduationCap,
} from "lucide-react";

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  badge?: string;
}

function NavLink({ item, isActive }: { item: NavItem; isActive: boolean }) {
  const Icon = item.icon;
  return (
    <Link href={item.href} className="relative block">
      {isActive && (
        <motion.span
          layoutId="sidebar-active"
          className="absolute inset-0 rounded-xl bg-clay-500 shadow-soft"
          transition={{ type: "spring", stiffness: 420, damping: 32 }}
        />
      )}
      <span
        className={`relative flex items-center justify-between px-3 py-2.5 rounded-xl text-[13px] font-medium transition-colors duration-200 ${
          isActive ? "text-white font-semibold" : "text-ink-soft hover:text-ink hover:bg-sand-200"
        }`}
      >
        <span className="flex items-center gap-2.5">
          <Icon className={`h-4 w-4 ${isActive ? "text-white" : "text-ink-faint"}`} />
          <span>{item.label}</span>
        </span>
        {item.badge && (
          <span
            className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${
              isActive
                ? "bg-white/20 text-white"
                : item.badge === "Live"
                ? "bg-sage-100 text-sage-600"
                : "bg-dusk-50 text-dusk-600"
            }`}
          >
            {item.badge}
          </span>
        )}
      </span>
    </Link>
  );
}

export function Sidebar() {
  const pathname = usePathname();

  const mainNav: NavItem[] = [
    { label: "Overview", href: "/dashboard", icon: LayoutDashboard },
    { label: "New Screening", href: "/scanner", icon: Scan, badge: "Live" },
    { label: "Applications", href: "/applications", icon: GraduationCap, badge: "AICTE" },
    { label: "Documents", href: "/documents", icon: Files },
    { label: "Verification", href: "/verification", icon: CheckSquare },
    { label: "Reports", href: "/reports", icon: FileBarChart },
    { label: "Activity Logs", href: "/activity", icon: History },
  ];

  const adminNav: NavItem[] = [
    { label: "Integrations", href: "/integrations", icon: Network, badge: "PARAKH" },
    { label: "API Access", href: "/api-access", icon: Key },
    { label: "Team & Roles", href: "/team", icon: Users },
    { label: "Security & Privacy", href: "/security", icon: ShieldCheck },
    { label: "Settings", href: "/settings", icon: Settings },
  ];

  return (
    <aside className="w-64 shrink-0 border-r border-border bg-surface-100 hidden md:flex flex-col justify-between min-h-[calc(100vh-4rem)] p-4">
      <div className="space-y-6">
        <div>
          <p className="px-3 text-[11px] font-semibold uppercase tracking-wider text-ink-faint mb-2">
            Operations
          </p>
          <nav className="space-y-1">
            {mainNav.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
              return <NavLink key={item.href} item={item} isActive={isActive} />;
            })}
          </nav>
        </div>

        <div>
          <p className="px-3 text-[11px] font-semibold uppercase tracking-wider text-ink-faint mb-2">
            Governance &amp; Integrations
          </p>
          <nav className="space-y-1">
            {adminNav.map((item) => {
              const isActive = pathname === item.href;
              return <NavLink key={item.href} item={item} isActive={isActive} />;
            })}
          </nav>
        </div>
      </div>

      <div className="p-3.5 rounded-2xl bg-sage-50 border border-sage-200 text-xs space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sage-400 opacity-60" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-sage-500" />
            </span>
            <span className="text-[11px] font-semibold text-sage-600">PARAKH Hub Active</span>
          </div>
          <span className="text-[10px] font-mono text-ink-faint">v1.0.4</span>
        </div>
        <p className="text-[10px] text-ink-faint leading-tight">
          Evidence records cryptographically linked to central analysis cluster.
        </p>
      </div>
    </aside>
  );
}
