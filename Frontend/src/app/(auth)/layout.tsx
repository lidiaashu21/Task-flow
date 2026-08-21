import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-1 flex-col lg:flex-row">
      {/* Image panel — hidden on small screens, shown from lg breakpoint up */}
      <div className="relative hidden overflow-hidden lg:flex lg:w-[42%] lg:min-w-[420px] xl:w-1/2">
        <Image
          src="/Image/p3.png"
          alt=""
          fill
          priority
          sizes="(min-width: 1280px) 50vw, 42vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/75 via-zinc-950/25 to-zinc-950/10" />

        <div className="relative flex flex-1 flex-col justify-between p-10 xl:p-14">
          <Link href="/" className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-base font-bold text-white">
              T
            </span>
            <span className="text-lg font-semibold text-white">TaskFlow</span>
          </Link>

          <div className="max-w-md">
            <h2 className="text-3xl font-semibold leading-tight text-white">
              Plan, track, and ship work together.
            </h2>
            <p className="mt-3 text-sm text-zinc-300">
              Projects, tasks, and real-time team chat — all in one place.
            </p>
          </div>
        </div>
      </div>

      {/* Form panel */}
      <div className="flex flex-1 flex-col items-center justify-center bg-zinc-50 px-4 py-12 dark:bg-black">
        <Link href="/" className="mb-8 flex items-center gap-2 lg:hidden">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-base font-bold text-white">
            T
          </span>
          <span className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">TaskFlow</span>
        </Link>
        <div className="w-full max-w-sm">{children}</div>
      </div>
    </div>
  );
}
