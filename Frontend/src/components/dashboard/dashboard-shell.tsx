"use client";

import { ArrowLeft, Menu, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import { SidebarNav } from "./sidebar-nav";
import { NotificationBell } from "./notification-bell";
import { UserMenu } from "./user-menu";

/** Each section gets its own backdrop; anything not listed falls back to the default. */
function backgroundFor(pathname: string): string {
  if (pathname.startsWith("/messages")) return "/Image/p1.png";
  if (pathname.startsWith("/projects") || pathname.startsWith("/tasks")) return encodeURI("/start/Screenshot 2026-10-07 012303.png");
  if (pathname === "/dashboard") return encodeURI("/Login page/abebe.png");
  return "/Image/p2.png";
}

export function DashboardShell({ children }: { children: ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const isHome = pathname === "/dashboard";
  const isProjects = pathname.startsWith("/projects") || pathname.startsWith("/tasks");

  return (
    <div className="on-photo relative flex min-h-full flex-1" data-section={isProjects ? "projects" : undefined}>
      {/* Fixed background image — sits behind the whole shell; foreground surfaces below are
          transparent containers sit directly on it with white text. */}
      <div className="fixed inset-0 -z-10">
        <Image key={backgroundFor(pathname)} src={backgroundFor(pathname)} alt="" fill priority sizes="100vw" className="object-cover" />
        {/* A light brand-coloured haze with a slight blur over the photo. */}
        <div className="absolute inset-0 bg-[#4F46E5]/10 backdrop-blur-[2px]" />
      </div>

      {/* Desktop sidebar */}
      <aside className="solid-white hidden w-60 shrink-0 border-r border-zinc-200 bg-white py-5 md:flex md:flex-col">
        <Link href="/dashboard" className="mb-6 flex items-center gap-2 px-4">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-sm font-bold text-white">
            T
          </span>
          <span className="text-base font-semibold text-zinc-900 dark:text-zinc-50">TaskFlow</span>
        </Link>
        <SidebarNav />
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <button
            aria-label="Close menu"
            className="absolute inset-0 bg-[#4F46E5]/30"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="relative flex h-full w-64 max-w-[80vw] flex-col solid-white bg-white py-5 shadow-xl">
            <div className="mb-6 flex items-center justify-between px-4">
              <Link href="/dashboard" className="flex items-center gap-2" onClick={() => setMobileOpen(false)}>
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-sm font-bold text-white">
                  T
                </span>
                <span className="text-base font-semibold text-zinc-900 dark:text-zinc-50">TaskFlow</span>
              </Link>
              <button onClick={() => setMobileOpen(false)} aria-label="Close">
                <X className="h-5 w-5 text-zinc-500" />
              </button>
            </div>
            <SidebarNav onNavigate={() => setMobileOpen(false)} />
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="solid-white flex h-14 items-center justify-between border-b border-zinc-200 bg-white px-4 dark:border-zinc-800 dark:bg-zinc-950/70 md:px-6">
          <button
            className="rounded-md p-1.5 text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800 md:hidden"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          {isHome ? (
            <div className="hidden md:block" />
          ) : (
            <Link
              href="/dashboard"
              aria-label="Back to home"
              className="flex items-center gap-1.5 rounded-md p-1.5 text-sm font-medium text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              <ArrowLeft className="h-5 w-5" />
              <span className="hidden sm:inline">Home</span>
            </Link>
          )}
          <div className="flex items-center gap-1">
            <NotificationBell />
            <UserMenu />
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8">{children}</main>
      </div>
    </div>
  );
}
