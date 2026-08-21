"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Textarea } from "@/components/ui/textarea";
import { ApiError } from "@/lib/api/error";
import { useAuth } from "@/lib/auth/auth-context";
import { createComment, deleteComment, listComments, updateComment } from "@/lib/comments/api";
import { formatRelative } from "@/lib/format";

export function TaskComments({ taskId }: { taskId: string }) {
  const { fetcher, user } = useAuth();
  const queryClient = useQueryClient();
  const [body, setBody] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editBody, setEditBody] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const commentsQuery = useQuery({
    queryKey: ["tasks", taskId, "comments"],
    queryFn: () => listComments(fetcher, taskId),
  });

  function invalidate() {
    return queryClient.invalidateQueries({ queryKey: ["tasks", taskId, "comments"] });
  }

  const createMutation = useMutation({
    mutationFn: (text: string) => createComment(fetcher, taskId, text),
    onSuccess: async () => {
      setBody("");
      await invalidate();
    },
    onError: (error) => toast.error(error instanceof ApiError ? error.message : "Couldn't post the comment"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ commentId, text }: { commentId: string; text: string }) => updateComment(fetcher, commentId, text),
    onSuccess: async () => {
      setEditingId(null);
      await invalidate();
    },
    onError: (error) => toast.error(error instanceof ApiError ? error.message : "Couldn't update the comment"),
  });

  const deleteMutation = useMutation({
    mutationFn: (commentId: string) => deleteComment(fetcher, commentId),
    onSuccess: () => invalidate(),
    onError: (error) => toast.error(error instanceof ApiError ? error.message : "Couldn't delete the comment"),
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Textarea
          rows={2}
          placeholder="Write a comment…"
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
                  <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{comment.author.name}</span>
                  <span className="text-xs text-zinc-400">
                    {formatRelative(comment.createdAt)}
                    {comment.isEdited && " (edited)"}
                  </span>
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
                  <p className="mt-0.5 whitespace-pre-wrap text-sm text-zinc-700 dark:text-zinc-300">{comment.body}</p>
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

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) deleteMutation.mutate(deleteTarget);
        }}
        title="Delete this comment?"
        confirmLabel="Delete"
      />
    </div>
  );
}
