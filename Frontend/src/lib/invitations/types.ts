export type InvitationStatus = "pending" | "accepted" | "expired" | "revoked";

export interface PublicInvitation {
  id: string;
  projectId: string;
  email: string;
  status: InvitationStatus;
  isExpired: boolean;
  invitedBy: { id: string; name: string };
  expiresAt: string;
  acceptedAt: string | null;
  createdAt: string;
}

export interface InvitationPreview {
  projectName: string;
  invitedByName: string;
  email: string;
  status: InvitationStatus;
  isExpired: boolean;
}
