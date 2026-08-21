"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { AuthCard } from "@/components/auth/auth-card";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { ApiError } from "@/lib/api/error";
import { forgotPassword } from "@/lib/auth/api";
import { applyFieldErrors } from "@/lib/auth/apply-field-errors";
import { type ForgotPasswordFormValues, forgotPasswordFormSchema } from "@/lib/auth/schemas";

export function ForgotPasswordForm() {
  const [sentTo, setSentTo] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordFormValues>({ resolver: zodResolver(forgotPasswordFormSchema) });

  async function onSubmit(values: ForgotPasswordFormValues) {
    try {
      await forgotPassword(values.email);
      setSentTo(values.email);
    } catch (error) {
      if (error instanceof ApiError) {
        const handled = applyFieldErrors(error, setError);
        if (!handled) toast.error(error.message);
        return;
      }
      toast.error("Something went wrong. Please try again.");
    }
  }

  if (sentTo) {
    return (
      <AuthCard
        title="Check your email"
        footer={
          <Link href="/login" className="font-medium text-blue-600 hover:underline dark:text-blue-400">
            Back to sign in
          </Link>
        }
      >
        <Alert variant="success">
          If an account exists for <strong>{sentTo}</strong>, we&apos;ve sent a link to reset your password. The
          link expires in 30 minutes.
        </Alert>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title="Forgot your password?"
      description="Enter your email and we'll send you a link to reset it"
      footer={
        <Link href="/login" className="font-medium text-blue-600 hover:underline dark:text-blue-400">
          Back to sign in
        </Link>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
        <Field id="email" label="Email" error={errors.email?.message}>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            invalid={!!errors.email}
            {...register("email")}
          />
        </Field>

        <Button type="submit" loading={isSubmitting} className="mt-2">
          Send reset link
        </Button>
      </form>
    </AuthCard>
  );
}
