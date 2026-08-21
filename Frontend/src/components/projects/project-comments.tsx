"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { ApiError } from "@/lib/api/error";
import { useAuth } from "@/lib/auth/auth-context";
import { formatRelative } from "@/lib/format";
import {
  createProjectComment,
  deleteProjectComment,
  listProjectComments,
  updateProjectComment,
} from "@/lib/project-comments/api";

export function ProjectComments({ projectId }: { projectId: string }) {
  const { fetcher, user } = useAuth();
  const queryClient = useQueryClient();
  const [body, setBody] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editBody, setEditBody] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const commentsQuery = useQuery({
    queryKey: ["projects", projectId, "comments"],
    queryFn: () => listProjectComments(fetcher, projectId),
  });

  function invalidate() {
    return queryClient.invalidateQueries({ queryKey: ["projects", projectId, "comments"] });
  }

  const createMutation = useMutation({
    mutationFn: (text: string) => createProjectComment(fetcher, projectId, text),
    onSuccess: async () => {
      setBody("");
      await invalidate();
    },
    onError: (error) => toast.error(error instanceof ApiError ? error.message : "Couldn't post the comment"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ commentId, text }: { commentId: string; text: string }) =>
      updateProjectComment(fetcher, commentId, text),
    onSuccess: async () => {
      setEditingId(null);
      await invalidate();
    },
    onError: (error) => toast.error(error instanceof ApiError ? error.message : "Couldn't update the comment"),
  });

  const deleteMutation = useMutation({
    mutationFn: (commentId: string) => deleteProjectComment(fetcher, commentId),
    onSuccess: () => invalidate(),
    onError: (error) => toast.error(error instanceof ApiError ? error.message : "Couldn't delete the comment"),
  });

  return (
    <Card>
      <CardBody className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <Textarea
            rows={2}
            placeholder="Write a comment about this project…"
            value={body}
            onChange={(event) => setBody(event.target.value)}
          />
          <Button
            className="w-auto self-end px-4"
            disabled={!body.trim()}
            loading={createMutation.isPending}
            onClick={() => createMutation.mutate(body.trim())}
          >
            Comment
          </Button>
        </div>

        {commentsQuery.isLoading ? (
          <Spinner />
        ) : commentsQuery.isError ? (
          <p className="text-sm text-red-600 dark:text-red-400">Couldn&apos;t load comments.</p>
        ) : (
          <div className="flex flex-col gap-4">
            {!commentsQuery.data?.comments.length && (
              <p className="text-sm text-zinc-500 dark:text-zinc-400">No comments yet.</p>
            )}

            {commentsQuery.data?.comments.map((comment) => {
              const isAuthor = comment.author.id === user?.id;
              const isEditing = editingId === comment.id;

              return (
                <div key={comment.id} className="flex gap-3">
                  <Avatar name={comment.author.name} src={comment.author.avatarUrl} size="sm" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                        {comment.author.name}
                      </span>
                      <span className="text-xs text-zinc-400">{formatRelative(comment.createdAt)}</span>
                    </div>

                    {isEditing ? (
                      <div className="mt-1.5 flex flex-col gap-2">
                        <Textarea rows={2} value={editBody} onChange={(event) => setEditBody(event.target.value)} />
                        <div className="flex gap-2">
                          <Button
                            className="w-auto px-3 text-xs"
                            loading={updateMutation.isPending}
                            disabled={!editBody.trim()}
                            onClick={() => updateMutation.mutate({ commentId: comment.id, text: editBody.trim() })}
                          >
                            Save
                          </Button>
                          <Button variant="outline" className="w-auto px-3 text-xs" onClick={() => setEditingId(null)}>
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <p className="mt-0.5 whitespace-pre-wrap text-sm text-zinc-700 dark:text-zinc-300">
                        {comment.body}
                      </p>
                    )}

                    {isAuthor && !isEditing && (
                      <div className="mt-1 flex gap-3">
                        <button
                          onClick={() => {
                            setEditingId(comment.id);
                            setEditBody(comment.body);
                          }}
                          className="flex items-center gap-1 text-xs text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
                        >
                          <Pencil className="h-3 w-3" /> Edit
                        </button>
                        <button
                          onClick={() => setDeleteTarget(comment.id)}
                          className="flex items-center gap-1 text-xs text-zinc-400 hover:text-red-600 dark:hover:text-red-400"
                        >
                          <Trash2 className="h-3 w-3" /> Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardBody>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) deleteMutation.mutate(deleteTarget);
        }}
        title="Delete this comment?"
        confirmLabel="Delete"
      />
    </Card>
  );
}
