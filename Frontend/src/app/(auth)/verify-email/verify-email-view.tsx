"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, MailCheck } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { AuthCard } from "@/components/auth/auth-card";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { ApiError } from "@/lib/api/error";
import { resendVerification, verifyEmail } from "@/lib/auth/api";
import { applyFieldErrors } from "@/lib/auth/apply-field-errors";
import { type ResendVerificationFormValues, resendVerificationFormSchema } from "@/lib/auth/schemas";

type Status = "verifying" | "verified" | "failed" | "pending";

function ResendForm({ defaultEmail }: { defaultEmail: string }) {
  const [sent, setSent] = useState(false);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ResendVerificationFormValues>({
    resolver: zodResolver(resendVerificationFormSchema),
    defaultValues: { email: defaultEmail },
  });

  async function onSubmit(values: ResendVerificationFormValues) {
    try {
      await resendVerification(values.email);
      setSent(true);
    } catch (error) {
      if (error instanceof ApiError) {
        const handled = applyFieldErrors(error, setError);
        if (!handled) toast.error(error.message);
        return;
      }
      toast.error("Something went wrong. Please try again.");
    }
  }

  if (sent) {
    return (
      <Alert variant="success">If that account exists, a new verification email is on its way.</Alert>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
      <Field id="resend-email" label="Email" error={errors.email?.message}>
        <Input
          id="resend-email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          invalid={!!errors.email}
          {...register("email")}
        />
      </Field>
      <Button type="submit" variant="outline" loading={isSubmitting}>
        Resend verification email
      </Button>
    </form>
  );
}

export function VerifyEmailView() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const emailFromQuery = searchParams.get("email") ?? "";

  const [status, setStatus] = useState<Status>(token ? "verifying" : "pending");
  const verifiedRef = useRef(false);

  useEffect(() => {
    if (!token || verifiedRef.current) return;
    verifiedRef.current = true;

    verifyEmail(token)
      .then(() => setStatus("verified"))
      .catch(() => setStatus("failed"));
  }, [token]);

  if (status === "verifying") {
    return (
      <AuthCard title="Verifying your email">
        <div className="flex items-center justify-center gap-2 py-4 text-zinc-500 dark:text-zinc-400">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          <span className="text-sm">Hang tight, this only takes a moment…</span>
        </div>
      </AuthCard>
    );
  }

  if (status === "verified") {
    return (
      <AuthCard title="Email verified">
        <Alert variant="success">Your email address has been verified.</Alert>
        <Link href="/login" className="mt-5 block">
          <Button>Continue to sign in</Button>
        </Link>
      </AuthCard>
    );
  }

  if (status === "failed") {
    return (
      <AuthCard title="Verification link expired" description="Enter your email to get a new verification link">
        <Alert variant="error" className="mb-5">
          This verification link is invalid or has expired.
        </Alert>
        <ResendForm defaultEmail={emailFromQuery} />
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title="Check your inbox"
      description={
        emailFromQuery
          ? `We sent a verification link to ${emailFromQuery}.`
          : "We sent you a verification link — click it to activate your account."
      }
      footer={
        <Link href="/login" className="font-medium text-blue-600 hover:underline dark:text-blue-400">
          Back to sign in
        </Link>
      }
    >
      <div className="mb-5 flex justify-center text-blue-600 dark:text-blue-400">
        <MailCheck className="h-10 w-10" aria-hidden="true" />
      </div>
      <ResendForm defaultEmail={emailFromQuery} />
    </AuthCard>
  );
}
