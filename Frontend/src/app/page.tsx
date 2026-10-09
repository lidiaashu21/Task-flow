"use client";

import { useRouter } from "next/navigation";
import { useEffect, useSyncExternalStore } from "react";
import { LandingSlider } from "@/components/landing/landing-slider";
import { Spinner } from "@/components/ui/spinner";
import { getAccessToken } from "@/lib/auth/session";

/**
 * Signed-in users are sent straight to the dashboard (a fast, offline check — the dashboard
 * re-validates the token for real); everyone else sees the landing slider with "Get Started".
 */
export default function Home() {
  const router = useRouter();
  // "pending" during SSR/hydration, then the real client-side answer (no setState-in-effect).
  const session = useSyncExternalStore(
    () => () => {},
    () => (getAccessToken() ? "signed-in" : "signed-out"),
    () => "pending"
  );

  useEffect(() => {
    if (session === "signed-in") router.replace("/dashboard");
  }, [session, router]);

  if (session === "signed-out") return <LandingSlider />;

  return (
    <div className="flex min-h-full flex-1 items-center justify-center bg-zinc-50 dark:bg-black">
      <Spinner label="Loading TaskFlow…" />
    </div>
  );
}
