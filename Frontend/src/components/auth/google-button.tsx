import { googleAuthUrl } from "@/lib/auth/api";
import { GoogleIcon } from "./google-icon";

export function GoogleButton({ label }: { label: string }) {
  return (
    <a
      href={googleAuthUrl()}
      className="inline-flex h-11 w-full items-center justify-center gap-2.5 rounded-lg border border-zinc-300 bg-white text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:border-zinc-700 dark:bg-transparent dark:text-zinc-200 dark:hover:bg-zinc-900"
    >
      <GoogleIcon className="h-4.5 w-4.5" />
      {label}
    </a>
  );
}
