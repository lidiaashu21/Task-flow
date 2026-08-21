"use client";

import { Menu, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState, type ReactNode } from "react";
import { SidebarNav } from "./sidebar-nav";
import { UserMenu } from "./user-menu";

export function DashboardShell({ children }: { children: ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="relative flex min-h-full flex-1">
      {/* Fixed background image — sits behind the whole shell; foreground surfaces below are
          opaque or blurred so content stays fully legible on top of it. */}
      <div className="fixed inset-0 -z-10">
        <Image src="/Image/p2.png" alt="" fill priority sizes="100vw" className="object-cover" />
        <div className="absolute inset-0 bg-zinc-50/70 dark:bg-black/75" />
      </div>

      {/* Desktop sidebar */}
      <aside className="hidden w-60 shrink-0 border-r border-zinc-200 bg-white/80 py-5 backdrop-blur-xl md:flex md:flex-col dark:border-zinc-800 dark:bg-zinc-950/70">
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
            className="absolute inset-0 bg-black/40"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="relative flex h-full w-64 max-w-[80vw] flex-col bg-white py-5 shadow-xl dark:bg-zinc-950">
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
        <header className="flex h-14 items-center justify-between border-b border-zinc-200 bg-white/80 px-4 backdrop-blur-xl dark:border-zinc-800 dark:bg-zinc-950/70 md:px-6">
          <button
            className="rounded-md p-1.5 text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800 md:hidden"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="hidden md:block" />
          <UserMenu />
        </header>

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8">{children}</main>
      </div>
    </div>
  );
}
