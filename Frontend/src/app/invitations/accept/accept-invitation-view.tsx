"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { AuthCard } from "@/components/auth/auth-card";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { ApiError } from "@/lib/api/error";
import { AuthProvider, useAuth } from "@/lib/auth/auth-context";
import { acceptInvitation, previewInvitation } from "@/lib/invitations/api";
import type { InvitationPreview } from "@/lib/invitations/types";

function InvalidCard({ message }: { message: string }) {
  return (
    <AuthCard title="Invitation unavailable">
      <Alert variant="error">{message}</Alert>

      <Link href="/" className="mt-5 block">
        <Button variant="outline" className="w-full">
          Go to TaskFlow
        </Button>
      </Link>
    </AuthCard>
  );
}

function InvitationDetails({ preview }: { preview: InvitationPreview }) {
  return (
    <div className="mb-6 rounded-lg border p-4">
      <div className="space-y-3 text-sm">
        <div>
          <p className="text-muted-foreground">Project</p>
          <p className="font-semibold">{preview.projectName}</p>
        </div>

        <div>
          <p className="text-muted-foreground">Invited by</p>
          <p className="font-semibold">{preview.invitedByName}</p>
        </div>

        <div>
          <p className="text-muted-foreground">Invitation sent to</p>
          <p className="font-semibold break-all">{preview.email}</p>
        </div>
      </div>
    </div>
  );
}

function AcceptInvitationContent({ token }: { token: string }) {
  const { status, user, logout, fetcher } = useAuth();

  const [preview, setPreview] = useState<InvitationPreview | null>(null);
  const [previewLoading, setPreviewLoading] = useState(true);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [accepting, setAccepting] = useState(false);

  /*
   * Load the invitation.
   *
   * This endpoint is public.
   * The invitation token identifies the invitation and therefore
   * identifies the project.
   */
  useEffect(() => {
    let cancelled = false;

    async function loadInvitation() {
      setPreviewLoading(true);
      setPreviewError(null);

      try {
        const result = await previewInvitation(token);

        if (cancelled) {
          return;
        }

        setPreview(result.invitation);
      } catch (error) {
        console.error("Invitation preview failed:", error);

        if (!cancelled) {
          setPreviewError(
            error instanceof Error
              ? error.message
              : "This invitation link is invalid.",
          );
        }
      } finally {
        if (!cancelled) {
          setPreviewLoading(false);
        }
      }
    }

    void loadInvitation();

    return () => {
      cancelled = true;
    };
  }, [token]);

  /*
   * Accept the invitation.
   *
   * The backend determines the project from the invitation token.
   * The authenticated user's ID is then added to that project.
   */
  async function handleAccept() {
    if (!preview || !fetcher || accepting) {
      return;
    }

    setAccepting(true);

    try {
      const result = await acceptInvitation(fetcher, token);

      toast.success(`You've joined ${preview.projectName}`);

      /*
       * Redirect to the exact project from the invitation.
       */
      window.location.assign(`/projects/${result.invitation.projectId}`);
    } catch (error) {
      console.error("Invitation acceptance failed:", error);

      toast.error(
        error instanceof ApiError
          ? error.message
          : error instanceof Error
            ? error.message
            : "Couldn't accept the invitation",
      );
    } finally {
      setAccepting(false);
    }
  }

  /*
   * Loading invitation.
   */
  if (previewLoading) {
    return (
      <AuthCard title="Loading invitation…">
        <Spinner />
      </AuthCard>
    );
  }

  /*
   * Invitation couldn't be loaded.
   */
  if (previewError || !preview) {
    return (
      <InvalidCard
        message={previewError ?? "This invitation link is invalid."}
      />
    );
  }

  /*
   * Authentication is still being checked.
   */
  if (status === "loading") {
    return (
      <AuthCard title="Checking your account…">
        <Spinner />
      </AuthCard>
    );
  }

  /*
   * Invitation is no longer usable.
   */
  if (preview.status !== "pending" || preview.isExpired) {
    let message = "This invitation is unavailable.";

    if (preview.status === "accepted") {
      message = "This invitation has already been accepted.";
    } else if (preview.status === "revoked") {
      message = "This invitation has been revoked.";
    } else if (preview.isExpired) {
      message =
        "This invitation has expired. Ask the project owner to resend it.";
    }

    return <InvalidCard message={message} />;
  }

  /*
   * User is not logged in.
   */
  if (status === "unauthenticated") {
    const params = new URLSearchParams({
      next: `/invitations/accept?token=${encodeURIComponent(token)}`,
      email: preview.email,
    });

    const query = params.toString();

    return (
      <AuthCard
        title={`Join ${preview.projectName}`}
        description="You've been invited to join this TaskFlow project."
      >
        <InvitationDetails preview={preview} />

        <div className="flex flex-col gap-3">
          <Link href={`/register?${query}`}>
            <Button className="w-full">Create an account to join</Button>
          </Link>

          <Link href={`/login?${query}`}>
            <Button variant="outline" className="w-full">
              I already have an account
            </Button>
          </Link>
        </div>
      </AuthCard>
    );
  }

  /*
   * Any authenticated user can now accept the invitation
   * Email validation removed to allow flexible invitation acceptance
   */
  return (
    <AuthCard
      title={`Join ${preview.projectName}`}
      description={`${preview.invitedByName} invited you to this project.`}
    >
      <InvitationDetails preview={preview} />

      <Button
        className="w-full"
        onClick={handleAccept}
        loading={accepting}
        disabled={!fetcher || accepting}
      >
        Accept invitation
      </Button>
    </AuthCard>
  );
}

function AcceptInvitationPage() {
  const searchParams = useSearchParams();

  const token = searchParams.get("token");

  if (!token) {
    return <InvalidCard message="This invitation link is missing its token." />;
  }

  return (
    <AuthProvider>
      <AcceptInvitationContent token={token} />
    </AuthProvider>
  );
}

export function AcceptInvitationView() {
  return <AcceptInvitationPage />;
}
