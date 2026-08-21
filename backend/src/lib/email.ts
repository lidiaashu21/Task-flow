import nodemailer, { type Transporter } from "nodemailer";
import { env } from "../config/env.js";
import { logger } from "./logger.js";

let transporter: Transporter | null = null;

/**
 * Create and cache the SMTP transporter.
 */
function getTransporter(): Transporter | null {
  if (!env.SMTP_HOST || !env.SMTP_PORT) {
    return null;
  }

  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_PORT === 465,
      auth:
        env.SMTP_USER && env.SMTP_PASS
          ? {
              user: env.SMTP_USER,
              pass: env.SMTP_PASS,
            }
          : undefined,
    });
  }

  return transporter;
}

/**
 * Send an email through SMTP.
 *
 * Throws an error when SMTP is not configured or
 * when the email cannot be sent.
 */
async function sendMail(
  to: string,
  subject: string,
  html: string,
): Promise<void> {
  const client = getTransporter();

  if (!client) {
    const errorMessage = "SMTP is not configured. Check SMTP_HOST and SMTP_PORT in your .env file.";
    console.error("SMTP CONFIGURATION ERROR:", errorMessage);
    console.error("Current SMTP settings:", {
      SMTP_HOST: env.SMTP_HOST,
      SMTP_PORT: env.SMTP_PORT,
      SMTP_USER: env.SMTP_USER ? "***" : "not set",
      SMTP_FROM: env.SMTP_FROM,
    });
    throw new Error(errorMessage);
  }

  try {
    console.log("Attempting to verify SMTP connection...");
    await client.verify();

    logger.info("SMTP connection verified", {
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
    });

    console.log("SMTP connection verified. Sending email to:", to);

    const info = await client.sendMail({
      from: env.SMTP_FROM,
      to,
      subject,

      // IMPORTANT: tell Nodemailer this is HTML
      html,

      // Also provide a plain-text version
      text: html
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
        .replace(/<[^>]+>/g, " ")
        .replace(/&nbsp;/gi, " ")
        .replace(/&amp;/gi, "&")
        .replace(/\s+/g, " ")
        .trim(),
    });

    logger.info("EMAIL DELIVERY RESULT", {
      messageId: info.messageId,
      response: info.response,
      accepted: info.accepted,
      rejected: info.rejected,
      pending: info.pending,
    });

    console.log("Email sent successfully to:", to);
  } catch (error) {
    logger.error("Failed to send email", {
      to,
      subject,
      error: error instanceof Error ? error.message : String(error),
    });

    console.error("EMAIL SENDING FAILED:", {
      to,
      subject,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });

    throw error;
  }
}
/**
 * Send email verification email.
 */
export async function sendVerificationEmail(
  to: string,
  token: string,
): Promise<void> {
  const link = `${env.FRONTEND_URL}/verify-email?token=${encodeURIComponent(
    token,
  )}`;

  logger.info("Email verification link generated", {
    to,
    link,
  });

  await sendMail(
    to,
    "Verify your TaskFlow email address",
    `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; max-width: 600px; margin: 0 auto;">

        <h2 style="color: #18181b;">
          Verify your email
        </h2>

        <p>
          Click the button below to verify your email address and activate
          your TaskFlow account.
        </p>

        <p>
          <a
            href="${link}"
            style="
              display: inline-block;
              padding: 12px 20px;
              background-color: #2563eb;
              color: #ffffff;
              text-decoration: none;
              border-radius: 6px;
              font-weight: bold;
            "
          >
            Verify Email
          </a>
        </p>

        <p>
          If the button doesn't work, copy and paste this link into your browser:
        </p>

        <p style="word-break: break-all;">
          <a href="${link}">
            ${link}
          </a>
        </p>

        <p>
          This link expires in
          ${env.EMAIL_VERIFICATION_EXPIRES_IN_HOURS} hours.
        </p>

        <p>
          If you weren't expecting this email, you can safely ignore it.
        </p>

        <hr />

        <p style="color: #71717a; font-size: 13px;">
          TaskFlow
        </p>

      </div>
    `,
  );
}

/**
 * Send password reset email.
 */
export async function sendPasswordResetEmail(
  to: string,
  token: string,
): Promise<void> {
  const link = `${env.FRONTEND_URL}/reset-password?token=${encodeURIComponent(
    token,
  )}`;

  await sendMail(
    to,
    "Reset your TaskFlow password",
    `
      <div style="font-family: Arial, sans-serif; line-height: 1.6;">
        <h2>Reset your TaskFlow password</h2>

        <p>
          We received a request to reset your password.
        </p>

        <p>
          Click the button below to choose a new password.
        </p>

        <p>
          <a
            href="${link}"
            style="
              display: inline-block;
              padding: 12px 20px;
              background: #2563eb;
              color: #ffffff;
              text-decoration: none;
              border-radius: 6px;
            "
          >
            Reset Password
          </a>
        </p>

        <p>
          Or copy and paste this link into your browser:
        </p>

        <p>
          <a href="${link}">${link}</a>
        </p>

        <p>
          This link expires in
          ${env.PASSWORD_RESET_EXPIRES_IN_MINUTES} minutes.
        </p>

        <p>
          If you did not request this, you can safely ignore this email.
        </p>
      </div>
    `,
  );
}

export async function sendProjectInvitationEmail(
  to: string,
  projectName: string,
  token: string,
): Promise<void> {
  const cleanToken = token.trim();

  console.log("========================================");
  console.log("EMAIL SENDING FUNCTION STARTED");
  console.log("========================================");
  console.log("To:", to);
  console.log("Project Name:", projectName);
  console.log("Token Length:", cleanToken.length);
  console.log("Token (first 10 chars):", cleanToken.substring(0, 10) + "...");
  console.log("FRONTEND_URL:", env.FRONTEND_URL);
  console.log("========================================");

  if (!cleanToken) {
    throw new Error(
      "Cannot send invitation email: invitation token is missing.",
    );
  }

  if (!env.FRONTEND_URL) {
    throw new Error(
      "Cannot send invitation email: FRONTEND_URL is not configured.",
    );
  }

  const link =
    `${env.FRONTEND_URL.replace(/\/$/, "")}` +
    `/invitations/accept?token=${encodeURIComponent(cleanToken)}`;

  console.log("Generated Invitation Link:", link);
  console.log("========================================");

  // In development mode without SMTP, log the link to console but still throw error
  if (!env.SMTP_HOST || !env.SMTP_PORT) {
    console.log("\n========================================");
    console.log("📧 INVITATION EMAIL (SMTP NOT CONFIGURED)");
    console.log("========================================");
    console.log("To:", to);
    console.log("Project:", projectName);
    console.log("Invitation Link:", link);
    console.log("Token:", cleanToken);
    console.log("========================================\n");
    
    logger.info("Invitation link logged (SMTP not configured)", {
      to,
      projectName,
      link,
      tokenLength: cleanToken.length,
    });
    
    throw new Error(
      "SMTP is not configured. Please set SMTP_HOST and SMTP_PORT in your .env file to send invitation emails. The invitation link has been logged to the console for testing."
    );
  }

  console.log("SMTP Configuration:");
  console.log("SMTP_HOST:", env.SMTP_HOST);
  console.log("SMTP_PORT:", env.SMTP_PORT);
  console.log("SMTP_USER:", env.SMTP_USER ? "***" : "not set");
  console.log("SMTP_FROM:", env.SMTP_FROM);
  console.log("========================================");

  /*
   * Never log the real invitation token in production
   */
  logger.info("INVITATION EMAIL LINK GENERATED", {
    to,
    projectName,
    frontendUrl: env.FRONTEND_URL,
    invitationPath: "/invitations/accept",
    tokenLength: cleanToken.length,
  });

  console.log("Calling sendMail function...");
  await sendMail(
    to,
    `You've been invited to join ${projectName} on TaskFlow`,
    `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <meta
            name="viewport"
            content="width=device-width, initial-scale=1.0"
          />
          <title>TaskFlow Invitation</title>
        </head>

        <body
          style="
            margin:0;
            padding:0;
            background:#f4f4f5;
            font-family:Arial,Helvetica,sans-serif;
          "
        >

          <div
            style="
              max-width:600px;
              margin:40px auto;
              background:#ffffff;
              padding:40px;
              border-radius:10px;
            "
          >

            <h2
              style="
                margin-top:0;
                color:#18181b;
              "
            >
              You're invited to TaskFlow
            </h2>

            <p
              style="
                color:#3f3f46;
                line-height:1.6;
              "
            >
              You've been invited to join
              <strong>${projectName}</strong>
              on TaskFlow.
            </p>

            <p
              style="
                color:#3f3f46;
                line-height:1.6;
              "
            >
              Click the button below to accept the invitation.
            </p>

            <!-- Accept Invitation Button -->

            <p style="margin:30px 0;">
              <a
                href="${link}"
                target="_blank"
                rel="noopener noreferrer"
                style="
                  display:inline-block;
                  padding:14px 24px;
                  background:#2563eb;
                  color:#ffffff;
                  text-decoration:none;
                  border-radius:6px;
                  font-weight:bold;
                  font-size:16px;
                "
              >
                Accept Invitation
              </a>
            </p>

            <!-- Fallback clickable link -->

            <p
              style="
                color:#52525b;
                line-height:1.6;
              "
            >
              If the button doesn't work, click the link below:
            </p>

            <p
              style="
                word-break:break-all;
                line-height:1.6;
              "
            >
              <a
                href="${link}"
                target="_blank"
                rel="noopener noreferrer"
                style="
                  color:#2563eb;
                  text-decoration:underline;
                "
              >
                ${link}
              </a>
            </p>

            <p
              style="
                color:#71717a;
                font-size:13px;
                line-height:1.6;
              "
            >
              This invitation expires in
              ${env.INVITATION_EXPIRES_IN_DAYS}
              days.
            </p>

            <hr
              style="
                border:none;
                border-top:1px solid #e4e4e7;
                margin:30px 0;
              "
            />

            <p
              style="
                color:#71717a;
                font-size:13px;
              "
            >
              TaskFlow
            </p>

          </div>

        </body>
      </html>
    `,
  );
  
  console.log("========================================");
  console.log("EMAIL SENT SUCCESSFULLY");
  console.log("========================================");
}
