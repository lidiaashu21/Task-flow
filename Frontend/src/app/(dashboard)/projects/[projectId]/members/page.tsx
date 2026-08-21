"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Mail, UserPlus, X } from "lucide-react";
import { use, useState } from "react";
import { toast } from "sonner";
import { InviteMemberDialog } from "@/components/projects/invite-member-dialog";
import { ProjectTabs } from "@/components/projects/project-tabs";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Select } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { ApiError } from "@/lib/api/error";
import { useAuth } from "@/lib/auth/auth-context";
import { formatRelative } from "@/lib/format";
import { listInvitations, revokeInvitation } from "@/lib/invitations/api";
import { getProject, removeMember, updateMemberRole } from "@/lib/projects/api";
import type { ProjectRole } from "@/lib/projects/types";

export default function ProjectMembersPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = use(params);
  const { fetcher, user } = useAuth();
  const queryClient = useQueryClient();
  const [inviteOpen, setInviteOpen] = useState(false);
  const [removeTarget, setRemoveTarget] = useState<string | null>(null);

  const projectQuery = useQuery({
    queryKey: ["projects", projectId],
    queryFn: () => getProject(fetcher, projectId),
  });

  const project = projectQuery.data?.project;
  const isOwner = project?.myRole === "owner";

  const invitationsQuery = useQuery({
    queryKey: ["projects", projectId, "invitations"],
    queryFn: () => listInvitations(fetcher, projectId, "pending"),
    enabled: !!isOwner,
  });

  const roleMutation = useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: ProjectRole }) =>
      updateMemberRole(fetcher, projectId, userId, role),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["projects", projectId] });
      toast.success("Role updated");
    },
    onError: (error) => toast.error(error instanceof ApiError ? error.message : "Couldn't update the role"),
  });

  const removeMutation = useMutation({
    mutationFn: (userId: string) => removeMember(fetcher, projectId, userId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["projects", projectId] });
      toast.success("Member removed");
    },
    onError: (error) => toast.error(error instanceof ApiError ? error.message : "Couldn't remove this member"),
  });

  const revokeMutation = useMutation({
    mutationFn: (invitationId: string) => revokeInvitation(fetcher, projectId, invitationId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["projects", projectId, "invitations"] });
      toast.success("Invitation revoked");
    },
    onError: (error) => toast.error(error instanceof ApiError ? error.message : "Couldn't revoke the invitation"),
  });

  if (projectQuery.isLoading || !project) return <Spinner />;

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">{project.name}</h1>
        {isOwner && (
          <Button className="w-auto px-4" onClick={() => setInviteOpen(true)}>
            <UserPlus className="h-4 w-4" aria-hidden="true" />
            Invite
          </Button>
        )}
      </div>

      <ProjectTabs projectId={projectId} />

      <Card className="overflow-hidden py-0">
        {project.members.map((member) => (
          <div
            key={member.id}
            className="flex items-center gap-3 border-b border-zinc-100 px-4 py-3 last:border-b-0 dark:border-zinc-900"
          >
            <Avatar name={member.name} src={member.avatarUrl} size="sm" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">
                {member.name}
                {member.id === user?.id && <span className="ml-1.5 text-xs text-zinc-400">(you)</span>}
              </p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">Joined {formatRelative(member.joinedAt)}</p>
            </div>

            {isOwner && member.id !== project.ownerId ? (
              <>
                <Select
                  className="w-auto"
                  value={member.role}
                  onChange={(event) =>
                    roleMutation.mutate({ userId: member.id, role: event.target.value as ProjectRole })
                  }
                >
                  <option value="member">Member</option>
                  <option value="owner">Owner</option>
                </Select>
                <button
                  onClick={() => setRemoveTarget(member.id)}
                  aria-label={`Remove ${member.name}`}
                  className="rounded-md p-1.5 text-zinc-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30 dark:hover:text-red-400"
                >
                  <X className="h-4 w-4" />
                </button>
              </>
            ) : (
              <Badge variant={member.role === "owner" ? "blue" : "default"}>
                {member.role === "owner" ? "Owner" : "Member"}
              </Badge>
            )}
          </div>
        ))}
      </Card>

      {isOwner && (
        <Card>
          <CardHeader>
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Pending invitations</h2>
          </CardHeader>
          <CardBody className="flex flex-col gap-3">
            {!invitationsQuery.data?.invitations.length ? (
              <p className="text-sm text-zinc-500 dark:text-zinc-400">No pending invitations.</p>
            ) : (
              invitationsQuery.data.invitations.map((invitation) => (
                <div key={invitation.id} className="flex items-center justify-between gap-3 text-sm">
                  <span className="flex items-center gap-2 text-zinc-700 dark:text-zinc-300">
                    <Mail className="h-4 w-4 text-zinc-400" aria-hidden="true" />
                    {invitation.email}
                    {invitation.isExpired && <Badge variant="amber">Expired</Badge>}
                  </span>
                  <Button
                    variant="ghost"
                    className="w-auto px-2 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30"
                    onClick={() => revokeMutation.mutate(invitation.id)}
                  >
                    Revoke
                  </Button>
                </div>
              ))
            )}
          </CardBody>
        </Card>
      )}

      <InviteMemberDialog projectId={projectId} open={inviteOpen} onClose={() => setInviteOpen(false)} />
      <ConfirmDialog
        open={!!removeTarget}
        onClose={() => setRemoveTarget(null)}
        onConfirm={() => {
          if (removeTarget) removeMutation.mutate(removeTarget);
        }}
        title="Remove this member?"
        description="They'll lose access to this project's tasks and messages."
        confirmLabel="Remove"
      />
    </div>
  );
}
