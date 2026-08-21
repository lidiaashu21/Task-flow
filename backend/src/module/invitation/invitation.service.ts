import { randomBytes, createHash } from "node:crypto";
import { invitationRepository } from "./invitation.repository.js";
import { sendProjectInvitationEmail } from "../../lib/email.js";
import { AppError } from "../../shared/error/app-error.js";
import { env } from "../../config/env.js";
import {
  getPagination,
  buildPaginationMeta,
  type PaginationMeta,
} from "../../shared/utils/pagination.js";
import {
  toPublicInvitation,
  type InvitationPreview,
  type PublicInvitation,
} from "./invitation.types.js";
import type {
  CreateInvitationInput,
  ListInvitationsQuery,
} from "./invitation.schema.js";

function hashInvitationToken(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}

/** Raw token is only ever emailed once — only its hash is persisted (in the `token` column). */
function newInvitationToken() {
  const raw = randomBytes(32).toString("hex");
  return { raw, hash: hashInvitationToken(raw) };
}

function invitationExpiry(): Date {
  return new Date(
    Date.now() + env.INVITATION_EXPIRES_IN_DAYS * 24 * 60 * 60 * 1000,
  );
}

/** Project owners are either the project's creator or hold an "owner" row in project_members. */
async function assertIsProjectOwner(projectId: string, userId: string) {
  const project = await invitationRepository.findProjectById(projectId);
  if (!project) {
    throw AppError.notFound("Project not found");
  }

  if (project.ownerId === userId) return project;

  const membership = await invitationRepository.findMembership(
    projectId,
    userId,
  );
  if (!membership || membership.role !== "owner") {
    throw AppError.forbidden("Only project owners can manage invitations");
  }

  return project;
}

export const invitationService = {
  async create(
    projectId: string,
    inviterId: string,
    input: CreateInvitationInput,
  ): Promise<PublicInvitation> {
    const project = await assertIsProjectOwner(projectId, inviterId);

    const alreadyMember = await invitationRepository.findMemberByEmail(
      projectId,
      input.email,
    );
    if (alreadyMember) {
      throw AppError.conflict("This person is already a member of the project");
    }

    const { raw, hash } = newInvitationToken();
    const expiresAt = invitationExpiry();
    const pending = await invitationRepository.findPendingInvitation(
      projectId,
      input.email,
    );

    let invitationId: string;
    if (pending) {
      // Re-inviting: rotate the token and expiry instead of creating a duplicate row.
      await invitationRepository.refresh(pending.id, hash, expiresAt);
      invitationId = pending.id;
    } else {
      const created = await invitationRepository.createInvitation({
        projectId,
        email: input.email,
        invitedBy: inviterId,
        token: hash,
        expiresAt,
      });
      invitationId = created.id;
    }

    await sendProjectInvitationEmail(input.email, project.name, raw);

    const invitation =
      await invitationRepository.findInvitationWithInviter(invitationId);
    return toPublicInvitation(invitation!);
  },

  async list(
    projectId: string,
    userId: string,
    query: ListInvitationsQuery,
  ): Promise<{ invitations: PublicInvitation[]; pagination: PaginationMeta }> {
    await assertIsProjectOwner(projectId, userId);

    const { limit, offset, page } = getPagination(query);
    const { rows, total } = await invitationRepository.listByProject(
      projectId,
      query.status,
      limit,
      offset,
    );

    return {
      invitations: rows.map(toPublicInvitation),
      pagination: buildPaginationMeta(page, limit, total),
    };
  },

  async resend(
    projectId: string,
    invitationId: string,
    userId: string,
  ): Promise<PublicInvitation> {
    const project = await assertIsProjectOwner(projectId, userId);

    const invitation =
      await invitationRepository.findInvitationById(invitationId);
    if (!invitation || invitation.projectId !== projectId) {
      throw AppError.notFound("Invitation not found");
    }

    if (invitation.status !== "pending" && invitation.status !== "expired") {
      throw AppError.badRequest(
        "Only pending or expired invitations can be resent",
      );
    }

    const { raw, hash } = newInvitationToken();
    const expiresAt = invitationExpiry();
    await invitationRepository.refresh(invitationId, hash, expiresAt);
    await sendProjectInvitationEmail(invitation.email, project.name, raw);

    const updated =
      await invitationRepository.findInvitationWithInviter(invitationId);
    return toPublicInvitation(updated!);
  },

  async revoke(
    projectId: string,
    invitationId: string,
    userId: string,
  ): Promise<void> {
    await assertIsProjectOwner(projectId, userId);

    const invitation =
      await invitationRepository.findInvitationById(invitationId);
    if (!invitation || invitation.projectId !== projectId) {
      throw AppError.notFound("Invitation not found");
    }

    if (invitation.status !== "pending") {
      throw AppError.badRequest("Only pending invitations can be revoked");
    }

    await invitationRepository.revoke(invitationId);
  },

  /** Unauthenticated preview so an invitee can see what they're accepting before logging in. */
  async preview(token: string): Promise<InvitationPreview> {
    const tokenHash = hashInvitationToken(token);

    const invitation =
      await invitationRepository.findInvitationByTokenHash(tokenHash);

    if (!invitation) {
      throw AppError.notFound("This invitation link is invalid");
    }

    const isStale =
      invitation.status === "pending" &&
      invitation.expiresAt.getTime() < Date.now();

    if (isStale) {
      await invitationRepository.markExpired(invitation.id);
    }

    return {
      projectName: invitation.project.name,
      invitedByName: invitation.invitedByUser.name,
      email: invitation.email,
      status: isStale ? "expired" : invitation.status,
      isExpired: isStale || invitation.status === "expired",
    };
  },

  async accept(
    token: string,
    userId: string,
    userEmail: string,
  ): Promise<PublicInvitation> {
    const tokenHash = hashInvitationToken(token);
    const invitation =
      await invitationRepository.findInvitationByTokenHash(tokenHash);
    if (!invitation) {
      throw AppError.notFound("This invitation link is invalid");
    }

    if (
      invitation.status === "pending" &&
      invitation.expiresAt.getTime() < Date.now()
    ) {
      await invitationRepository.markExpired(invitation.id);
      throw AppError.badRequest("This invitation has expired");
    }

    if (invitation.status !== "pending") {
      throw AppError.badRequest(
        "This invitation has already been used, expired, or been revoked",
      );
    }

    if (invitation.email !== userEmail.toLowerCase()) {
      throw AppError.forbidden("This invitation was sent to a different email address");
    }

    await invitationRepository.addMember(invitation.projectId, userId);
    await invitationRepository.markAccepted(invitation.id);

    const updated = await invitationRepository.findInvitationWithInviter(
      invitation.id,
    );
    return toPublicInvitation(updated!);
  },
};
