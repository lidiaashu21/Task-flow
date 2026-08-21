"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { AuthCard } from "@/components/auth/auth-card";
import { GoogleButton } from "@/components/auth/google-button";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { ApiError } from "@/lib/api/error";
import { login } from "@/lib/auth/api";
import { applyFieldErrors } from "@/lib/auth/apply-field-errors";
import { saveAccessToken } from "@/lib/auth/session";
import { type LoginFormValues, loginFormSchema } from "@/lib/auth/schemas";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const oauthFailed = searchParams.get("error") === "google_oauth_failed";
  const next = searchParams.get("next");
  const prefillEmail = searchParams.get("email") ?? undefined;

  const registerParams = new URLSearchParams();
  if (next) registerParams.set("next", next);
  if (prefillEmail) registerParams.set("email", prefillEmail);
  const registerHref = registerParams.size > 0 ? `/register?${registerParams.toString()}` : "/register";

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: { email: prefillEmail },
  });

  async function onSubmit(values: LoginFormValues) {
    try {
      const session = await login(values);
      saveAccessToken(session.accessToken);
      toast.success(`Welcome back, ${session.user.name.split(" ")[0]}!`);
      router.push(next ?? "/");
      router.refresh();
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
      title="Welcome back"
      description="Sign in to continue to TaskFlow"
      footer={
        <>
          Don&apos;t have an account?{" "}
          <Link href={registerHref} className="font-medium text-blue-600 hover:underline dark:text-blue-400">
            Sign up
          </Link>
        </>
      }
    >
      {oauthFailed && (
        <Alert variant="error" className="mb-5">
          We couldn&apos;t sign you in with Google. Please try again.
        </Alert>
      )}

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

        <Field
          id="password"
          label="Password"
          error={errors.password?.message}
          action={
            <Link href="/forgot-password" className="text-sm font-medium text-blue-600 hover:underline dark:text-blue-400">
              Forgot password?
            </Link>
          }
        >
          <PasswordInput
            id="password"
            autoComplete="current-password"
            placeholder="••••••••"
            invalid={!!errors.password}
            {...register("password")}
          />
        </Field>

        <Button type="submit" loading={isSubmitting} className="mt-2">
          Sign in
        </Button>
      </form>

      <div className="my-6 flex items-center gap-3">
        <div className="h-px flex-1 bg-zinc-200 dark:bg-zinc-800" />
        <span className="text-xs font-medium uppercase tracking-wide text-zinc-400">or</span>
        <div className="h-px flex-1 bg-zinc-200 dark:bg-zinc-800" />
      </div>

      <GoogleButton label="Continue with Google" />
    </AuthCard>
  );
}
