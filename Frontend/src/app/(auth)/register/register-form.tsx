"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { AuthCard } from "@/components/auth/auth-card";
import { GoogleButton } from "@/components/auth/google-button";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { ApiError } from "@/lib/api/error";
import { register as registerAccount } from "@/lib/auth/api";
import { applyFieldErrors } from "@/lib/auth/apply-field-errors";
import { type RegisterFormValues, registerFormSchema } from "@/lib/auth/schemas";
import { saveAccessToken } from "@/lib/auth/session";

export function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next");
  const prefillEmail = searchParams.get("email") ?? undefined;

  const loginParams = new URLSearchParams();
  if (next) loginParams.set("next", next);
  if (prefillEmail) loginParams.set("email", prefillEmail);
  const loginHref = loginParams.size > 0 ? `/login?${loginParams.toString()}` : "/login";

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerFormSchema),
    defaultValues: { email: prefillEmail },
  });

  async function onSubmit(values: RegisterFormValues) {
    try {
      const session = await registerAccount({ name: values.name, email: values.email, password: values.password });
      saveAccessToken(session.accessToken);
      if (next) {
        toast.success("Account created! You're signed in.");
        router.push(next);
        return;
      }
      toast.success("Account created! Check your inbox to verify your email.");
      router.push(`/verify-email?email=${encodeURIComponent(session.user.email)}`);
    } catch (error) {
      if (error instanceof ApiError) {
        const handled = applyFieldErrors(error, setError);
        if (!handled) toast.error(error.message);
        return;
      }
      toast.error("Something went wrong. Please try again.");
    }
  }

  return (
    <AuthCard
      title="Create your account"
      description="Start organizing your team's work with TaskFlow"
      footer={
        <>
          Already have an account?{" "}
          <Link href={loginHref} className="font-medium text-blue-600 hover:underline dark:text-blue-400">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
        <Field id="name" label="Full name" error={errors.name?.message}>
          <Input id="name" autoComplete="name" placeholder="Ada Lovelace" invalid={!!errors.name} {...register("name")} />
        </Field>

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

        <Field
          id="password"
          label="Password"
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

        <Field id="confirmPassword" label="Confirm password" error={errors.confirmPassword?.message}>
          <PasswordInput
            id="confirmPassword"
            autoComplete="new-password"
            placeholder="••••••••"
            invalid={!!errors.confirmPassword}
            {...register("confirmPassword")}
          />
        </Field>

        <Button type="submit" loading={isSubmitting} className="mt-2">
          Create account
        </Button>
      </form>

      <div className="my-6 flex items-center gap-3">
        <div className="h-px flex-1 bg-zinc-200 dark:bg-zinc-800" />
        <span className="text-xs font-medium uppercase tracking-wide text-zinc-400">or</span>
        <div className="h-px flex-1 bg-zinc-200 dark:bg-zinc-800" />
      </div>

      <GoogleButton label="Continue with Google" />

      <p className="mt-6 text-center text-xs text-zinc-400">
        By creating an account, you agree to TaskFlow&apos;s Terms of Service and Privacy Policy.
      </p>
    </AuthCard>
  );
}
