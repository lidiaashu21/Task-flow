"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ApiError } from "@/lib/api/error";
import { useAuth } from "@/lib/auth/auth-context";
import type { ProjectMemberSummary } from "@/lib/projects/types";
import { createTask } from "@/lib/tasks/api";
import { priorityLabels, statusLabels } from "@/lib/tasks/display";

const schema = z.object({
  title: z.string().trim().min(1, "Title is required").max(255),
  description: z.string().trim().max(10000).optional(),
  status: z.enum(["todo", "in_progress", "done"]),
  priority: z.enum(["low", "medium", "high"]),
  dueDate: z.string().optional(),
  assigneeId: z.string().optional(),
});
type FormValues = z.infer<typeof schema>;

export function CreateTaskDialog({
  projectId,
  members,
  open,
  onClose,
}: {
  projectId: string;
  members: ProjectMemberSummary[];
  open: boolean;
  onClose: () => void;
}) {
  const { fetcher } = useAuth();
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { status: "todo", priority: "medium" },
  });

  const mutation = useMutation({
    mutationFn: (values: FormValues) =>
      createTask(fetcher, projectId, {
        title: values.title,
        description: values.description || undefined,
        status: values.status,
        priority: values.priority,
        dueDate: values.dueDate || undefined,
        assigneeId: values.assigneeId || undefined,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["projects", projectId, "tasks"] });
      await queryClient.invalidateQueries({ queryKey: ["projects", projectId, "dashboard"] });
      toast.success("Task created");
      reset();
      onClose();
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : "Couldn't create the task");
    },
  });

  return (
    <Dialog open={open} onClose={onClose} title="New task">
      <form onSubmit={handleSubmit((values) => mutation.mutate(values))} noValidate className="flex flex-col gap-4">
        <Field id="task-title" label="Title" error={errors.title?.message}>
          <Input id="task-title" placeholder="Design the landing page" invalid={!!errors.title} {...register("title")} />
        </Field>

        <Field id="task-description" label="Description" error={errors.description?.message}>
          <Textarea id="task-description" rows={3} invalid={!!errors.description} {...register("description")} />
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field id="task-status" label="Status">
            <Select id="task-status" {...register("status")}>
              {(["todo", "in_progress", "done"] as const).map((status) => (
                <option key={status} value={status}>
                  {statusLabels[status]}
                </option>
              ))}
            </Select>
          </Field>

          <Field id="task-priority" label="Priority">
            <Select id="task-priority" {...register("priority")}>
              {(["low", "medium", "high"] as const).map((priority) => (
                <option key={priority} value={priority}>
                  {priorityLabels[priority]}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Field id="task-due-date" label="Due date" error={errors.dueDate?.message}>
            <Input id="task-due-date" type="date" invalid={!!errors.dueDate} {...register("dueDate")} />
          </Field>

          <Field id="task-assignee" label="Assignee">
            <Select id="task-assignee" defaultValue="" {...register("assigneeId")}>
              <option value="">Unassigned</option>
              {members.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        <div className="mt-1 flex justify-end gap-3">
          <Button type="button" variant="outline" className="w-auto px-4" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" className="w-auto px-4" loading={isSubmitting || mutation.isPending}>
            Create task
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
