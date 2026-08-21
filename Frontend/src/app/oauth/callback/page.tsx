"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { Spinner } from "@/components/ui/spinner";
import { refresh } from "@/lib/auth/api";
import { saveAccessToken } from "@/lib/auth/session";

/**
 * Landing spot after a successful Google sign-in. The backend already set the httpOnly refresh
 * cookie during its own /auth/google/callback redirect — this page just exchanges that cookie for
 * an access token via /auth/refresh, same as any other silent refresh.
 */
export default function OAuthCallbackPage() {
  const router = useRouter();
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    refresh().then(
      (session) => {
        saveAccessToken(session.accessToken);
        toast.success(`Welcome, ${session.user.name.split(" ")[0]}!`);
        router.replace("/dashboard");
      },
      () => {
        toast.error("We couldn't sign you in with Google. Please try again.");
        router.replace("/login?error=google_oauth_failed");
      }
    );
  }, [router]);

  return (
    <div className="flex min-h-full flex-1 items-center justify-center bg-zinc-50 dark:bg-black">
      <Spinner label="Finishing sign-in…" />
    </div>
  );
}
