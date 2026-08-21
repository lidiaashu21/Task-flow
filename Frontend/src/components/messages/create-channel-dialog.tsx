"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { ApiError } from "@/lib/api/error";
import { useAuth } from "@/lib/auth/auth-context";
import { createChannel } from "@/lib/messages/api";
import { getProject, listProjects } from "@/lib/projects/api";

export function CreateChannelDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { fetcher, user } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [name, setName] = useState("");
  const [projectId, setProjectId] = useState("");
  const [selectedMembers, setSelectedMembers] = useState<Set<string>>(new Set());

  const projectsQuery = useQuery({
    queryKey: ["projects"],
    queryFn: () => listProjects(fetcher),
    enabled: open,
  });

  const projectDetailQuery = useQuery({
    queryKey: ["projects", projectId],
    queryFn: () => getProject(fetcher, projectId),
    enabled: open && !!projectId,
  });

  const members = (projectDetailQuery.data?.project.members ?? []).filter((member) => member.id !== user?.id);

  function toggleMember(memberId: string) {
    setSelectedMembers((current) => {
      const next = new Set(current);
      if (next.has(memberId)) next.delete(memberId);
      else next.add(memberId);
      return next;
    });
  }

  const mutation = useMutation({
    mutationFn: () =>
      createChannel(fetcher, {
        name: name.trim(),
        projectId: projectId || undefined,
        memberIds: Array.from(selectedMembers),
      }),
    onSuccess: async ({ conversation }) => {
      await queryClient.invalidateQueries({ queryKey: ["conversations"] });
      handleClose();
      router.push(`/messages/channels/${conversation.id}`);
    },
    onError: (error) => toast.error(error instanceof ApiError ? error.message : "Couldn't create the channel"),
  });

  function handleClose() {
    setName("");
    setProjectId("");
    setSelectedMembers(new Set());
    onClose();
  }

  return (
    <Dialog open={open} onClose={handleClose} title="New channel" description="A group conversation for your team">
      <div className="flex flex-col gap-4">
        <Field id="channel-name" label="Channel name">
          <Input id="channel-name" placeholder="general" value={name} onChange={(event) => setName(event.target.value)} />
        </Field>

        <Field id="channel-project" label="Project (optional)" hint="Restricts membership to that project's team">
          <Select
            id="channel-project"
            value={projectId}
            onChange={(event) => {
              setProjectId(event.target.value);
              setSelectedMembers(new Set());
            }}
          >
            <option value="">No project</option>
            {(projectsQuery.data ?? []).map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </Select>
        </Field>

        {projectId && (
          <div>
            <p className="mb-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">Members</p>
            <div className="flex max-h-40 flex-col gap-1.5 overflow-y-auto rounded-lg border border-zinc-200 p-2 dark:border-zinc-800">
              {!members.length && <p className="px-1 py-1 text-sm text-zinc-400">No other members in this project.</p>}
              {members.map((member) => (
                <label key={member.id} className="flex items-center gap-2 rounded px-1 py-1 text-sm hover:bg-zinc-50 dark:hover:bg-zinc-900">
                  <input
                    type="checkbox"
                    checked={selectedMembers.has(member.id)}
                    onChange={() => toggleMember(member.id)}
                    className="h-4 w-4 rounded border-zinc-300 text-blue-600 focus:ring-blue-500"
                  />
                  {member.name}
                </label>
              ))}
            </div>
          </div>
        )}

        <div className="mt-1 flex justify-end gap-3">
          <Button type="button" variant="outline" className="w-auto px-4" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            className="w-auto px-4"
            disabled={name.trim().length < 2}
            loading={mutation.isPending}
            onClick={() => mutation.mutate()}
          >
            Create channel
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
