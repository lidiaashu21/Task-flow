"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { AuthCard } from "@/components/auth/auth-card";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { PasswordInput } from "@/components/ui/password-input";
import { ApiError } from "@/lib/api/error";
import { resetPassword } from "@/lib/auth/api";
import { applyFieldErrors } from "@/lib/auth/apply-field-errors";
import { type ResetPasswordFormValues, resetPasswordFormSchema } from "@/lib/auth/schemas";

function InvalidLinkCard() {
  return (
    <AuthCard title="Invalid reset link">
      <Alert variant="error">This password reset link is invalid or has expired.</Alert>
      <Link href="/forgot-password" className="mt-5 block">
        <Button variant="outline">Request a new link</Button>
      </Link>
    </AuthCard>
  );
}

export function ResetPasswordForm() {
  const token = useSearchParams().get("token");
  const [done, setDone] = useState(false);
  const [expired, setExpired] = useState(false);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordFormValues>({ resolver: zodResolver(resetPasswordFormSchema) });

  async function onSubmit(values: ResetPasswordFormValues) {
    if (!token) return;

    try {
      await resetPassword({ token, password: values.password });
      setDone(true);
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.code === "INVALID_OR_EXPIRED_TOKEN") {
          setExpired(true);
          return;
        }
        const handled = applyFieldErrors(error, setError);
        if (!handled) toast.error(error.message);
        return;
      }
      toast.error("Something went wrong. Please try again.");
    }
  }

  if (!token || expired) {
    return <InvalidLinkCard />;
  }

  if (done) {
    return (
      <AuthCard title="Password reset">
        <Alert variant="success">Your password has been reset. You can now sign in with your new password.</Alert>
        <Link href="/login" className="mt-5 block">
          <Button>Continue to sign in</Button>
        </Link>
      </AuthCard>
    );
  }

  return (
    <AuthCard title="Set a new password" description="Choose a new password for your account">
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
        <Field
          id="password"
          label="New password"
          error={errors.password?.message}
          hint={!errors.password ? "At least 8 characters" : undefined}
        >
          <PasswordInput
            id="password"
            autoComplete="new-password"
            placeholder="••••••••"
            invalid={!!errors.password}
            {...register("password")}
          />
        </Field>

        <Field id="confirmPassword" label="Confirm new password" error={errors.confirmPassword?.message}>
          <PasswordInput
            id="confirmPassword"
            autoComplete="new-password"
            placeholder="••••••••"
            invalid={!!errors.confirmPassword}
            {...register("confirmPassword")}
          />
        </Field>

        <Button type="submit" loading={isSubmitting} className="mt-2">
          Reset password
        </Button>
      </form>
    </AuthCard>
  );
}
