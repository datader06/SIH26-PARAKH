"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  Shield,
  Bell,
  ChevronDown,
  User,
  LogOut,
  Scan,
  Radio,
  ExternalLink,
  Menu,
} from "lucide-react";

interface UserProfile {
  name: string;
  email: string;
  role: string;
  organization: {
    name: string;
    code: string;
  };
}

const dropdownMotion = {
  initial: { opacity: 0, y: -6, scale: 0.98 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: -6, scale: 0.98 },
  transition: { duration: 0.16, ease: [0.16, 1, 0.3, 1] as const },
};

export function Navbar({ onMenuClick }: { onMenuClick?: () => void } = {}) {
  const [user, setUser] = useState<UserProfile | null>(null);

  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [statusHover, setStatusHover] = useState(false);

  useEffect(() => {
    fetch("/api/auth/session")
      .then((res) => res.json())
      .then((data) => {
        if (data.authenticated && data.user) {
          setUser(data.user);
        } else {
          setUser(null);
        }
      })
      .catch(() => {});
  }, []);

  const handleSwitchRole = async (newRole: string) => {
    if (!user) return;
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: user.email, roleOverride: newRole }),
      });
      if (res.ok) {
        window.location.reload();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const notifications = [
    {
      id: "1",
      title: "Screening Completed",
      desc: "Aadhaar Card screening TR-2026-89012 verified as Low Risk.",
      time: "4m ago",
    },
    {
      id: "2",
      title: "Review Required",
      desc: "Passport screening TR-2026-89041 flagged for MRZ check digit discrepancy.",
      time: "28m ago",
    },
    {
      id: "3",
      title: "PARAKH Hub Sync",
      desc: "Cryptographic evidence ledger synchronized with Central Platform.",
      time: "1h ago",
    },
  ];

  return (
    <header className="sticky top-0 z-40 h-16 w-full border-b border-border bg-background/90 backdrop-blur-md supports-[backdrop-filter]:bg-background/75">
      <div className="flex h-full items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-2 sm:gap-4">
          {onMenuClick && (
            <button
              onClick={onMenuClick}
              aria-label="Open navigation menu"
              className="p-2 -ml-1.5 rounded-xl text-ink-soft hover:text-ink hover:bg-sand-200 transition-colors duration-200 md:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>
          )}
          <Link href="/dashboard" className="flex items-center gap-2 sm:gap-3 group shrink-0">
            <div className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-xl bg-clay-500 text-white shadow-soft transition-transform group-hover:scale-105 shrink-0">
              <Shield className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-display tracking-tight text-sm sm:text-base font-bold text-ink">
                  PARAKH
                </span>
                <span className="hidden sm:inline text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded-full bg-clay-50 text-clay-600 border border-clay-200 tracking-wider">
                  Enterprise
                </span>
              </div>
              <p className="hidden sm:block text-[11px] text-ink-faint font-medium tracking-tight -mt-0.5">
                Document Intelligence Platform
              </p>
            </div>
          </Link>

          <div className="hidden lg:flex items-center pl-4 border-l border-border">
            <span className="text-xs text-ink-soft font-medium truncate max-w-xs">
              {user?.organization?.name || "Apex Verification Hub"}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 sm:gap-4">
          <div
            className="relative hidden sm:block"
            onMouseEnter={() => setStatusHover(true)}
            onMouseLeave={() => setStatusHover(false)}
          >
            <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-sage-50 border border-sage-200 text-[11px] text-sage-600 font-medium cursor-pointer">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sage-400 opacity-60" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-sage-500" />
              </span>
              <span>System Operational</span>
            </div>

            <AnimatePresence>
              {statusHover && (
                <motion.div
                  {...dropdownMotion}
                  className="absolute right-0 mt-2 w-72 p-3 bg-surface border border-border rounded-2xl shadow-lift text-xs space-y-2 z-50"
                >
                  <div className="flex items-center justify-between pb-1.5 border-b border-border text-ink font-semibold">
                    <span>Subsystem Status</span>
                    <span className="text-[10px] text-ink-faint font-mono">Real-time</span>
                  </div>
                  <div className="flex items-center justify-between text-ink-soft">
                    <span className="flex items-center gap-1.5">
                      <Radio className="h-3.5 w-3.5 text-sage-500" /> OCR Engine
                    </span>
                    <span className="text-sage-600 text-[11px] font-mono">Active (Tesseract/Cloud)</span>
                  </div>
                  <div className="flex items-center justify-between text-ink-soft">
                    <span className="flex items-center gap-1.5">
                      <Radio className="h-3.5 w-3.5 text-sage-500" /> Risk Assessment
                    </span>
                    <span className="text-sage-600 text-[11px] font-mono">Online</span>
                  </div>
                  <div className="flex items-center justify-between text-ink-soft">
                    <span className="flex items-center gap-1.5">
                      <Radio className="h-3.5 w-3.5 text-dusk-500" /> PARAKH Hub
                    </span>
                    <span className="text-dusk-600 text-[11px] font-mono">Connected</span>
                  </div>
                  <div className="flex items-center justify-between text-ink-soft">
                    <span className="flex items-center gap-1.5">
                      <Radio className="h-3.5 w-3.5 text-amber-500" /> Verification Gateway
                    </span>
                    <span className="text-amber-600 text-[11px] font-mono">Institutional Sandbox</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <Link
            href="/scanner"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-clay-500 hover:bg-clay-600 text-white text-xs font-semibold shadow-soft hover:shadow-card transition-all duration-200"
          >
            <Scan className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">New Screening</span>
          </Link>

          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 rounded-xl text-ink-soft hover:text-ink hover:bg-sand-200 transition-colors duration-200"
              aria-label="Notifications"
            >
              <Bell className="h-4 w-4" />
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-clay-500 ring-2 ring-background" />
            </button>

            <AnimatePresence>
              {showNotifications && (
                <motion.div
                  {...dropdownMotion}
                  className="absolute right-0 mt-2 w-80 sm:w-96 p-3 bg-surface border border-border rounded-2xl shadow-lift z-50"
                >
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-border">
                    <h4 className="text-xs font-semibold text-ink">Operational Notifications</h4>
                    <span className="text-[10px] text-clay-600 font-medium cursor-pointer">Mark all read</span>
                  </div>
                  <div className="space-y-2">
                    {notifications.map((n) => (
                      <div
                        key={n.id}
                        className="p-2 rounded-xl bg-sand-100 hover:bg-sand-200 text-xs transition-colors duration-200"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-ink">{n.title}</span>
                          <span className="text-[10px] text-ink-faint">{n.time}</span>
                        </div>
                        <p className="text-[11px] text-ink-soft mt-0.5 leading-snug">{n.desc}</p>
                      </div>
                    ))}
                  </div>
                  <div className="mt-2.5 pt-2 border-t border-border text-center">
                    <Link
                      href="/activity"
                      onClick={() => setShowNotifications(false)}
                      className="text-[11px] text-clay-600 hover:underline inline-flex items-center gap-1"
                    >
                      View complete activity audit log <ExternalLink className="h-3 w-3" />
                    </Link>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {user ? (
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-sand-200 text-left transition-colors duration-200"
              >
                <div className="h-7 w-7 rounded-full bg-clay-100 border border-clay-200 flex items-center justify-center text-xs font-semibold text-clay-700">
                  {user.name.charAt(0)}
                </div>
                <div className="hidden md:block">
                  <p className="text-xs font-semibold text-ink leading-none">{user.name}</p>
                  <p className="text-[10px] text-ink-faint mt-0.5">{user.role}</p>
                </div>
                <ChevronDown className="h-3.5 w-3.5 text-ink-faint hidden md:block" />
              </button>

              <AnimatePresence>
                {showUserMenu && (
                  <motion.div
                    {...dropdownMotion}
                    className="absolute right-0 mt-2 w-64 p-2 bg-surface border border-border rounded-2xl shadow-lift z-50"
                  >
                    <div className="p-2 border-b border-border">
                      <p className="text-xs font-bold text-ink">{user.name}</p>
                      <p className="text-[11px] text-ink-faint font-mono truncate">{user.email}</p>
                      <div className="mt-1.5 flex items-center gap-1.5">
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold bg-clay-50 text-clay-600 border border-clay-200">
                          {user.role}
                        </span>
                        <span className="text-[10px] text-ink-faint font-mono truncate">
                          {user.organization?.code}
                        </span>
                      </div>
                    </div>

                    <div className="p-2 border-b border-border">
                      <p className="text-[10px] uppercase font-semibold tracking-wider text-ink-faint mb-1.5">
                        Simulate Access Role
                      </p>
                      <div className="grid grid-cols-2 gap-1">
                        {(["OPERATOR", "INVESTIGATOR", "REVIEWER", "ADMINISTRATOR"] as const).map((r) => (
                          <button
                            key={r}
                            onClick={() => {
                              handleSwitchRole(r);
                              setShowUserMenu(false);
                            }}
                            className={`text-[10px] font-mono px-2 py-1 rounded-lg text-left transition-colors duration-200 ${
                              user.role === r
                                ? "bg-clay-500 text-white font-bold"
                                : "text-ink-soft hover:text-ink hover:bg-sand-200"
                            }`}
                          >
                            {r}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="p-1">
                      <Link
                        href="/settings"
                        onClick={() => setShowUserMenu(false)}
                        className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs text-ink-soft hover:bg-sand-200 transition-colors duration-200"
                      >
                        <User className="h-3.5 w-3.5 text-ink-faint" />
                        <span>Organization Settings</span>
                      </Link>
                      <button
                        onClick={async () => {
                          await fetch("/api/auth/logout", { method: "POST" });
                          window.location.href = "/";
                        }}
                        className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs text-rose-500 hover:bg-rose-50 transition-colors duration-200"
                      >
                        <LogOut className="h-3.5 w-3.5" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <Link
              href="/"
              className="px-3 py-1.5 rounded-xl bg-clay-500 hover:bg-clay-600 text-white font-semibold text-xs transition-colors duration-200 flex items-center gap-1.5"
            >
              <User className="h-3.5 w-3.5" />
              <span>Sign In</span>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
