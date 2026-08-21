import type { Fetcher, PaginationMeta } from "../api/types";
import type {
  InvitationPreview,
  InvitationStatus,
  PublicInvitation,
} from "./types";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

/**
 * List project invitations.
 * Requires authentication.
 */
export function listInvitations(
  fetcher: Fetcher,
  projectId: string,
  status?: InvitationStatus,
): Promise<{
  invitations: PublicInvitation[];
  pagination: PaginationMeta;
}> {
  return fetcher<{
    invitations: PublicInvitation[];
    pagination: PaginationMeta;
  }>(`/projects/${projectId}/invitations`, {
    query: { status },
  });
}

/**
 * Create an invitation.
 * Requires authentication.
 *
 * The projectId determines which project the user
 * will be invited to.
 */
export function createInvitation(
  fetcher: Fetcher,
  projectId: string,
  email: string,
): Promise<{ invitation: PublicInvitation }> {
  return fetcher<{ invitation: PublicInvitation }>(
    `/projects/${projectId}/invitations`,
    {
      method: "POST",
      body: {
        email,
      },
    },
  );
}

/**
 * Resend an invitation.
 * Requires authentication.
 */
export function resendInvitation(
  fetcher: Fetcher,
  projectId: string,
  invitationId: string,
): Promise<{ invitation: PublicInvitation }> {
  return fetcher<{ invitation: PublicInvitation }>(
    `/projects/${projectId}/invitations/${invitationId}/resend`,
    {
      method: "POST",
    },
  );
}

/**
 * Revoke an invitation.
 * Requires authentication.
 */
export function revokeInvitation(
  fetcher: Fetcher,
  projectId: string,
  invitationId: string,
): Promise<{ revoked: true }> {
  return fetcher<{ revoked: true }>(
    `/projects/${projectId}/invitations/${invitationId}`,
    {
      method: "DELETE",
    },
  );
}

/**
 * Preview a public invitation.
 *
 * IMPORTANT:
 * This endpoint does NOT require an access token.
 *
 * The invitation token itself identifies the invitation.
 *
 * The backend returns:
 *
 * {
 *   success: true,
 *   data: {
 *     invitation: {
 *       projectName: "...",
 *       invitedByName: "...",
 *       email: "...",
 *       status: "pending",
 *       isExpired: false
 *     }
 *   }
 * }
 */
export async function previewInvitation(
  token: string,
): Promise<{ invitation: InvitationPreview }> {
  const cleanToken = token.trim();

  if (!cleanToken) {
    throw new Error("Invitation token is missing.");
  }

  const encodedToken = encodeURIComponent(cleanToken);

  const url = `${API_BASE_URL}/invitations/preview/${encodedToken}`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
    cache: "no-store",
  });

  const rawText = await response.text();

  let data: {
    success?: boolean;

    data?: {
      invitation?: InvitationPreview;
    };

    invitation?: InvitationPreview;

    error?: {
      code?: string;
      message?: string;
      details?: unknown;
    };

    message?: string;
  };

  try {
    data = JSON.parse(rawText);
  } catch {
    throw new Error(
      `Backend did not return JSON. HTTP ${response.status}. Response: ${rawText.slice(
        0,
        500,
      )}`,
    );
  }

  if (!response.ok) {
    throw new Error(
      data.error?.message ??
        data.message ??
        `Invitation preview failed with HTTP ${response.status}.`,
    );
  }

  if (!data.success) {
    throw new Error(
      data.error?.message ?? data.message ?? "Invitation preview failed.",
    );
  }

  /*
   * Support the normal TaskFlow API response:
   *
   * {
   *   success: true,
   *   data: {
   *     invitation: ...
   *   }
   * }
   *
   * Also support:
   *
   * {
   *   success: true,
   *   invitation: ...
   * }
   */
  const invitation = data.data?.invitation ?? data.invitation;

  if (!invitation) {
    throw new Error("Backend returned success but no invitation.");
  }

  return {
    invitation,
  };
}

/**
 * Accept an invitation.
 *
 * Requires authentication.
 *
 * IMPORTANT:
 * Do NOT send projectId from the frontend.
 *
 * The backend determines the project from the invitation token:
 *
 * token
 *   ↓
 * invitation
 *   ↓
 * invitation.projectId
 *   ↓
 * add authenticated user to that project
 */
export function acceptInvitation(
  fetcher: Fetcher,
  token: string,
): Promise<{ invitation: PublicInvitation }> {
  const cleanToken = token.trim();

  if (!cleanToken) {
    return Promise.reject(new Error("Invitation token is missing."));
  }

  return fetcher<{
    invitation: PublicInvitation;
  }>("/invitations/accept", {
    method: "POST",
    body: {
      token: cleanToken,
    },
  });
}
