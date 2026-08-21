import type { Request, Response } from "express";
import { authService } from "./auth.service.js";
import { oauthService } from "./oauth.service.js";
import { authRepository } from "./auth.repository.js";
import { toPublicUser } from "./auth.types.js";
import { asyncHandler } from "../../shared/utils/async-handler.js";
import { sendSuccess } from "../../shared/utils/response.js";
import { REFRESH_COOKIE_NAME, refreshCookieOptions } from "../../lib/session.js";
import { env, isProduction } from "../../config/env.js";
import { AppError } from "../../shared/error/app-error.js";
import type { AuthenticatedRequest } from "../../middleware/auth.middleware.js";
import type {
  ForgotPasswordInput,
  GoogleCallbackQuery,
  LoginInput,
  RegisterInput,
  ResendVerificationInput,
  ResetPasswordInput,
  VerifyEmailInput,
} from "./auth.schema.js";

const OAUTH_STATE_COOKIE = "taskflow_oauth_state";

function setRefreshCookie(res: Response, refreshToken: string): void {
  res.cookie(REFRESH_COOKIE_NAME, refreshToken, refreshCookieOptions());
}

function clearRefreshCookie(res: Response): void {
  res.clearCookie(REFRESH_COOKIE_NAME, refreshCookieOptions());
}

export const authController = {
  register: asyncHandler(async (req: Request, res: Response) => {
    const { user, tokens } = await authService.register(req.body as RegisterInput, req);
    setRefreshCookie(res, tokens.refreshToken);
    sendSuccess(res, { user, accessToken: tokens.accessToken }, 201);
  }),

  login: asyncHandler(async (req: Request, res: Response) => {
    const { user, tokens } = await authService.login(req.body as LoginInput, req);
    setRefreshCookie(res, tokens.refreshToken);
    sendSuccess(res, { user, accessToken: tokens.accessToken });
  }),

  refresh: asyncHandler(async (req: Request, res: Response) => {
    const refreshToken = req.cookies?.[REFRESH_COOKIE_NAME] as string | undefined;
    if (!refreshToken) {
      throw AppError.unauthorized("Missing refresh token");
    }

    const { user, tokens } = await authService.refresh(refreshToken, req);
    setRefreshCookie(res, tokens.refreshToken);
    sendSuccess(res, { user, accessToken: tokens.accessToken });
  }),

  logout: asyncHandler(async (req: Request, res: Response) => {
    const refreshToken = req.cookies?.[REFRESH_COOKIE_NAME] as string | undefined;
    if (refreshToken) {
      await authService.logout(refreshToken);
    }
    clearRefreshCookie(res);
    sendSuccess(res, { loggedOut: true });
  }),

  me: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const user = await authRepository.findUserById(req.user!.id);
    if (!user) throw AppError.unauthorized("Account no longer exists");
    sendSuccess(res, { user: toPublicUser(user) });
  }),

  verifyEmail: asyncHandler(async (req: Request, res: Response) => {
    const { token } = req.query as unknown as VerifyEmailInput;
    const user = await authService.verifyEmail(token);
    sendSuccess(res, { user });
  }),

  resendVerification: asyncHandler(async (req: Request, res: Response) => {
    await authService.resendVerification(req.body as ResendVerificationInput);
    sendSuccess(res, { message: "If that account exists, a new verification email has been sent." });
  }),

  forgotPassword: asyncHandler(async (req: Request, res: Response) => {
    await authService.forgotPassword(req.body as ForgotPasswordInput);
    sendSuccess(res, { message: "If that account exists, a password reset email has been sent." });
  }),

  resetPassword: asyncHandler(async (req: Request, res: Response) => {
    await authService.resetPassword(req.body as ResetPasswordInput);
    sendSuccess(res, { message: "Your password has been reset. You can now log in." });
  }),

  googleRedirect: asyncHandler(async (_req: Request, res: Response) => {
    const state = oauthService.createState();
    res.cookie(OAUTH_STATE_COOKIE, state, {
      httpOnly: true,
      secure: isProduction,
      sameSite: "lax",
      maxAge: 5 * 60 * 1000,
    });
    res.redirect(oauthService.getGoogleAuthUrl(state));
  }),

  googleCallback: asyncHandler(async (req: Request, res: Response) => {
    const query = req.query as unknown as GoogleCallbackQuery;
    const expectedState = req.cookies?.[OAUTH_STATE_COOKIE] as string | undefined;
    res.clearCookie(OAUTH_STATE_COOKIE);

    if (query.error || !query.state || query.state !== expectedState) {
      res.redirect(`${env.FRONTEND_URL}/login?error=google_oauth_failed`);
      return;
    }

    const { tokens } = await authService.loginWithGoogle(query.code, req);
    setRefreshCookie(res, tokens.refreshToken);
    res.redirect(`${env.FRONTEND_URL}/oauth/callback`);
  }),
};
