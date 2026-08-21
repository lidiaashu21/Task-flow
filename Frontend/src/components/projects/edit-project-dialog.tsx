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
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/lib/auth/auth-context";
import { ApiError } from "@/lib/api/error";
import { updateProject } from "@/lib/projects/api";
import type { ProjectDetail } from "@/lib/projects/types";

const schema = z.object({
  name: z.string().trim().min(2, "Project name must be at least 2 characters").max(255),
  description: z.string().trim().max(5000).optional(),
});
type FormValues = z.infer<typeof schema>;

export function EditProjectDialog({
  project,
  open,
  onClose,
}: {
  project: ProjectDetail;
  open: boolean;
  onClose: () => void;
}) {
  const { fetcher } = useAuth();
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    values: { name: project.name, description: project.description ?? "" },
  });

  const mutation = useMutation({
    mutationFn: (values: FormValues) =>
      updateProject(fetcher, project.id, { name: values.name, description: values.description ?? null }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["projects", project.id] });
      await queryClient.invalidateQueries({ queryKey: ["projects"] });
      toast.success("Project updated");
      onClose();
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : "Couldn't update the project");
    },
  });

  return (
    <Dialog open={open} onClose={onClose} title="Edit project">
      <form onSubmit={handleSubmit((values) => mutation.mutate(values))} noValidate className="flex flex-col gap-4">
        <Field id="edit-project-name" label="Project name" error={errors.name?.message}>
          <Input id="edit-project-name" invalid={!!errors.name} {...register("name")} />
        </Field>

        <Field id="edit-project-description" label="Description" error={errors.description?.message}>
          <Textarea id="edit-project-description" rows={3} invalid={!!errors.description} {...register("description")} />
        </Field>

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
