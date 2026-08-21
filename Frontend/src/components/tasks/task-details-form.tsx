"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ApiError } from "@/lib/api/error";
import { useAuth } from "@/lib/auth/auth-context";
import { formatDateInput } from "@/lib/format";
import type { ProjectMemberSummary } from "@/lib/projects/types";
import { deleteTask, updateTask } from "@/lib/tasks/api";
import { priorityLabels, statusLabels } from "@/lib/tasks/display";
import type { PublicTask } from "@/lib/tasks/types";
import { useState } from "react";

const schema = z.object({
  title: z.string().trim().min(1, "Title is required").max(255),
  description: z.string().trim().max(10000).optional(),
  status: z.enum(["todo", "in_progress", "done"]),
  priority: z.enum(["low", "medium", "high"]),
  dueDate: z.string().optional(),
  assigneeId: z.string().optional(),
});
type FormValues = z.infer<typeof schema>;

export function TaskDetailsForm({ task, members }: { task: PublicTask; members: ProjectMemberSummary[] }) {
  const { fetcher } = useAuth();
  const queryClient = useQueryClient();
  const router = useRouter();
  const [deleteOpen, setDeleteOpen] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    values: {
      title: task.title,
      description: task.description ?? "",
      status: task.status,
      priority: task.priority,
      dueDate: formatDateInput(task.dueDate),
      assigneeId: task.assignee?.id ?? "",
    },
  });

  const updateMutation = useMutation({
    mutationFn: (values: FormValues) =>
      updateTask(fetcher, task.id, {
        title: values.title,
        description: values.description || null,
        status: values.status,
        priority: values.priority,
        dueDate: values.dueDate || null,
        assigneeId: values.assigneeId || null,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["tasks", task.id] });
      await queryClient.invalidateQueries({ queryKey: ["projects", task.projectId, "tasks"] });
      await queryClient.invalidateQueries({ queryKey: ["tasks", task.id, "activity"] });
      toast.success("Task updated");
    },
    onError: (error) => toast.error(error instanceof ApiError ? error.message : "Couldn't update the task"),
  });

  async function handleDelete() {
    try {
      await deleteTask(fetcher, task.id);
      toast.success("Task deleted");
      router.push(`/projects/${task.projectId}/tasks`);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Couldn't delete the task");
    }
  }

  return (
    <form onSubmit={handleSubmit((values) => updateMutation.mutate(values))} noValidate className="flex flex-col gap-4">
      <Field id="task-detail-title" label="Title" error={errors.title?.message}>
        <Input id="task-detail-title" invalid={!!errors.title} {...register("title")} />
      </Field>

      <Field id="task-detail-description" label="Description" error={errors.description?.message}>
        <Textarea id="task-detail-description" rows={5} invalid={!!errors.description} {...register("description")} />
      </Field>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Field id="task-detail-status" label="Status">
          <Select id="task-detail-status" {...register("status")}>
            {(["todo", "in_progress", "done"] as const).map((status) => (
              <option key={status} value={status}>
                {statusLabels[status]}
              </option>
            ))}
          </Select>
        </Field>

        <Field id="task-detail-priority" label="Priority">
          <Select id="task-detail-priority" {...register("priority")}>
            {(["low", "medium", "high"] as const).map((priority) => (
              <option key={priority} value={priority}>
                {priorityLabels[priority]}
              </option>
            ))}
          </Select>
        </Field>

        <Field id="task-detail-due-date" label="Due date">
          <Input id="task-detail-due-date" type="date" {...register("dueDate")} />
        </Field>

        <Field id="task-detail-assignee" label="Assignee">
          <Select id="task-detail-assignee" {...register("assigneeId")}>
            <option value="">Unassigned</option>
            {members.map((member) => (
              <option key={member.id} value={member.id}>
                {member.name}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      <div className="mt-1 flex items-center justify-between">
        <Button
          type="button"
          variant="ghost"
          className="w-auto px-2 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30"
          onClick={() => setDeleteOpen(true)}
        >
          Delete task
        </Button>
        <Button type="submit" className="w-auto px-5" loading={isSubmitting || updateMutation.isPending} disabled={!isDirty}>
          Save changes
        </Button>
      </div>

      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
        title="Delete this task?"
        description="This permanently deletes the task, its comments, and its activity log."
        confirmLabel="Delete task"
      />
    </form>
  );
}
