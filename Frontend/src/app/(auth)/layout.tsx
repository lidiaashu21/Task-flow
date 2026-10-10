import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

/** A bright photo fills the whole screen behind the form; the form card floats above it. */
export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative flex flex-1 flex-col items-center justify-center px-4 py-8 sm:py-12">
      <div className="fixed inset-0 -z-10">
        <Image
          src={encodeURI("/Login page/Screenshot 2026-10-07 021910.png")}
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
        />
        <div className="absolute inset-0 bg-[#4F46E5]/25 backdrop-blur-[2px]" />
      </div>

      <Link href="/" className="mb-6 flex items-center gap-2 rounded-xl bg-white/90 px-3 py-2 shadow-sm">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#4F46E5] text-base font-bold text-white">
          T
        </span>
        <span className="text-lg font-semibold text-zinc-900">TaskFlow</span>
      </Link>
      <div className="w-full max-w-sm">{children}</div>
    </div>
  );
}
