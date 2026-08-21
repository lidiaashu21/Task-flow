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
import { useAuth } from "@/lib/auth/auth-context";
import { ApiError } from "@/lib/api/error";
import { createInvitation } from "@/lib/invitations/api";

const schema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email("Enter a valid email address")),
});
type FormValues = z.infer<typeof schema>;

export function InviteMemberDialog({ projectId, open, onClose }: { projectId: string; open: boolean; onClose: () => void }) {
  const { fetcher } = useAuth();
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const mutation = useMutation({
    mutationFn: (values: FormValues) => createInvitation(fetcher, projectId, values.email),
    onSuccess: async ({ invitation }) => {
      await queryClient.invalidateQueries({ queryKey: ["projects", projectId, "invitations"] });
      toast.success(`Invitation sent to ${invitation.email}`);
      reset();
      onClose();
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : "Couldn't send the invitation");
    },
  });

  return (
    <Dialog open={open} onClose={onClose} title="Invite a teammate" description="They'll get an email with a link to join.">
      <form onSubmit={handleSubmit((values) => mutation.mutate(values))} noValidate className="flex flex-col gap-4">
        <Field id="invite-email" label="Email" error={errors.email?.message}>
          <Input id="invite-email" type="email" placeholder="teammate@example.com" invalid={!!errors.email} {...register("email")} />
        </Field>

        <div className="mt-1 flex justify-end gap-3">
          <Button type="button" variant="outline" className="w-auto px-4" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" className="w-auto px-4" loading={isSubmitting || mutation.isPending}>
            Send invite
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
