export type InvitationStatus = "pending" | "accepted" | "expired" | "revoked";

export interface PublicInvitation {
  id: string;
  projectId: string;
  email: string;
  status: InvitationStatus;
  isExpired: boolean;
  invitedBy: { id: string; name: string };
  expiresAt: Date;
  acceptedAt: Date | null;
  createdAt: Date;
}

export interface InvitationPreview {
  projectName: string;
  invitedByName: string;
  email: string;
  status: InvitationStatus;
  isExpired: boolean;
}

interface InvitationWithInviter {
  id: string;
  projectId: string;
  email: string;
  status: InvitationStatus;
  expiresAt: Date;
  acceptedAt: Date | null;
  createdAt: Date;
  invitedByUser: { id: string; name: string };
}

export function toPublicInvitation(invitation: InvitationWithInviter): PublicInvitation {
  return {
    id: invitation.id,
    projectId: invitation.projectId,
    email: invitation.email,
    status: invitation.status,
    isExpired: invitation.status === "expired" || (invitation.status === "pending" && invitation.expiresAt.getTime() < Date.now()),
    invitedBy: invitation.invitedByUser,
    expiresAt: invitation.expiresAt,
    acceptedAt: invitation.acceptedAt,
    createdAt: invitation.createdAt,
  };
}
