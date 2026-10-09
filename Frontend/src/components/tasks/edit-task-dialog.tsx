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
import { formatDateInput } from "@/lib/format";
import type { ProjectMemberSummary } from "@/lib/projects/types";
import { updateTask } from "@/lib/tasks/api";
import { priorityLabels, statusLabels } from "@/lib/tasks/display";
import type { PublicTask } from "@/lib/tasks/types";

const schema = z.object({
  title: z.string().trim().min(1, "Title is required").max(255),
  description: z.string().trim().max(10000).optional(),
  status: z.enum(["todo", "in_progress", "done"]),
  priority: z.enum(["low", "medium", "high"]),
  dueDate: z.string().optional(),
  assigneeId: z.string().optional(),
});
type FormValues = z.infer<typeof schema>;

interface EditTaskDialogProps {
  task: PublicTask;
  members: ProjectMemberSummary[];
  open: boolean;
  onClose: () => void;
}

/** Edit a task in place from the list, without opening its detail page. */
export function EditTaskDialog({ task, members, open, onClose }: EditTaskDialogProps) {
  const { fetcher } = useAuth();
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
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

  const mutation = useMutation({
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
      await queryClient.invalidateQueries({ queryKey: ["projects", task.projectId, "tasks"] });
      await queryClient.invalidateQueries({ queryKey: ["projects", task.projectId, "dashboard"] });
      await queryClient.invalidateQueries({ queryKey: ["tasks", task.id] });
      toast.success("Task updated");
      onClose();
    },
    onError: (error) => toast.error(error instanceof ApiError ? error.message : "Couldn't update the task"),
  });

  return (
    <Dialog open={open} onClose={onClose} title="Edit task">
      <form onSubmit={handleSubmit((values) => mutation.mutate(values))} noValidate className="flex flex-col gap-4">
        <Field id={`edit-title-${task.id}`} label="Title" error={errors.title?.message}>
          <Input id={`edit-title-${task.id}`} invalid={!!errors.title} {...register("title")} />
        </Field>

        <Field id={`edit-description-${task.id}`} label="Description" error={errors.description?.message}>
          <Textarea id={`edit-description-${task.id}`} rows={3} invalid={!!errors.description} {...register("description")} />
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field id={`edit-status-${task.id}`} label="Status">
            <Select id={`edit-status-${task.id}`} {...register("status")}>
              {(["todo", "in_progress", "done"] as const).map((status) => (
                <option key={status} value={status}>
                  {statusLabels[status]}
                </option>
              ))}
            </Select>
          </Field>

          <Field id={`edit-priority-${task.id}`} label="Priority">
            <Select id={`edit-priority-${task.id}`} {...register("priority")}>
              {(["low", "medium", "high"] as const).map((priority) => (
                <option key={priority} value={priority}>
                  {priorityLabels[priority]}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Field id={`edit-due-${task.id}`} label="Due date">
            <Input id={`edit-due-${task.id}`} type="date" {...register("dueDate")} />
          </Field>

          <Field id={`edit-assignee-${task.id}`} label="Assignee">
            <Select id={`edit-assignee-${task.id}`} {...register("assigneeId")}>
              <option value="">Unassigned</option>
              {members
                .filter((member) => member.role !== "owner" || member.id === task.assignee?.id)
                .map((member) => (
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
            Save changes
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
