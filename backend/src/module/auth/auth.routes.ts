import { Router } from "express";
import { authController } from "./auth.controller.js";
import { validate } from "../../middleware/validation.middleware.js";
import { requireAuth } from "../../middleware/auth.middleware.js";
import { authRateLimiter } from "../../middleware/rate-limit.middleware.js";
import {
  forgotPasswordSchema,
  googleCallbackQuerySchema,
  loginSchema,
  registerSchema,
  resendVerificationSchema,
  resetPasswordSchema,
  verifyEmailSchema,
} from "./auth.schema.js";

const router = Router();

router.post("/register", authRateLimiter, validate(registerSchema), authController.register);
router.post("/login", authRateLimiter, validate(loginSchema), authController.login);
router.post("/refresh", authController.refresh);
router.post("/logout", authController.logout);
router.get("/me", requireAuth, authController.me);

router.get("/verify-email", validate(verifyEmailSchema, "query"), authController.verifyEmail);
router.post(
  "/resend-verification",
  authRateLimiter,
  validate(resendVerificationSchema),
  authController.resendVerification
);

router.post("/forgot-password", authRateLimiter, validate(forgotPasswordSchema), authController.forgotPassword);
router.post("/reset-password", authRateLimiter, validate(resetPasswordSchema), authController.resetPassword);

router.get("/google", authController.googleRedirect);
router.get("/google/callback", validate(googleCallbackQuerySchema, "query"), authController.googleCallback);

export const authRoutes = router;
