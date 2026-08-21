import { apiFetch } from "../api/client";
import { API_BASE_URL } from "../config";
import type { AuthSession, PublicUser } from "./types";

export function register(input: { name: string; email: string; password: string }): Promise<AuthSession> {
  return apiFetch<AuthSession>("/auth/register", { method: "POST", body: input });
}

export function login(input: { email: string; password: string }): Promise<AuthSession> {
  return apiFetch<AuthSession>("/auth/login", { method: "POST", body: input });
}

export function logout(): Promise<{ loggedOut: true }> {
  return apiFetch<{ loggedOut: true }>("/auth/logout", { method: "POST" });
}

/** Exchanges the httpOnly refresh cookie for a new access token — no body needed. */
export function refresh(): Promise<AuthSession> {
  return apiFetch<AuthSession>("/auth/refresh", { method: "POST" });
}

export function getCurrentUser(token: string): Promise<{ user: PublicUser }> {
  return apiFetch<{ user: PublicUser }>("/auth/me", { token });
}

export function verifyEmail(token: string): Promise<{ user: PublicUser }> {
  return apiFetch<{ user: PublicUser }>("/auth/verify-email", { query: { token } });
}

export function resendVerification(email: string): Promise<{ message: string }> {
  return apiFetch<{ message: string }>("/auth/resend-verification", { method: "POST", body: { email } });
}

export function forgotPassword(email: string): Promise<{ message: string }> {
  return apiFetch<{ message: string }>("/auth/forgot-password", { method: "POST", body: { email } });
}

export function resetPassword(input: { token: string; password: string }): Promise<{ message: string }> {
  return apiFetch<{ message: string }>("/auth/reset-password", { method: "POST", body: input });
}

/** Not a fetch call — this is a full-page redirect into the backend's OAuth authorization-code flow. */
export function googleAuthUrl(): string {
  return `${API_BASE_URL}/auth/google`;
}
