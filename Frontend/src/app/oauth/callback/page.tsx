"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef } from "react";
import { toast } from "sonner";
import { Spinner } from "@/components/ui/spinner";
import { getCurrentUser, refresh } from "@/lib/auth/api";
import { saveAccessToken } from "@/lib/auth/session";
import { useAuth } from "@/lib/auth/auth-context";

function OAuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const ran = useRef(false);
  const { setSession } = useAuth();

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    const tokenFromQuery = searchParams.get("accessToken") || searchParams.get("token");

    if (tokenFromQuery) {
      saveAccessToken(tokenFromQuery);
      getCurrentUser(tokenFromQuery)
        .then(({ user }) => {
          setSession({ user, accessToken: tokenFromQuery });
          toast.success(`Welcome, ${user.name.split(" ")[0]}!`);
          router.replace("/dashboard");
        })
        .catch(() => {
          router.replace("/dashboard");
        });
      return;
    }

    refresh().then(
      (session) => {
        setSession(session);
        toast.success(`Welcome, ${session.user.name.split(" ")[0]}!`);
        router.replace("/dashboard");
      },
      () => {
        toast.error("We couldn't sign you in with Google. Please try again.");
        router.replace("/login?error=google_oauth_failed");
      },
    );
  }, [router, searchParams, setSession]);

  return (
    <div className="flex min-h-full flex-1 items-center justify-center bg-zinc-50 dark:bg-black">
      <Spinner label="Finishing sign-in…" />
    </div>
  );
}

export default function OAuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-full flex-1 items-center justify-center bg-zinc-50 dark:bg-black">
          <Spinner label="Finishing sign-in…" />
        </div>
      }
    >
      <OAuthCallbackContent />
    </Suspense>
  );
}
