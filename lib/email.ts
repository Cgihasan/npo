import nodemailer from "nodemailer";

let transporter: nodemailer.Transporter | null = null;

function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "",
      port: parseInt(process.env.SMTP_PORT || "587"),
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER || "",
        pass: process.env.SMTP_PASS || "",
      },
    });
  }
  return transporter;
}

const fromAddress = process.env.SMTP_FROM || "noreply@npo.com";

export async function sendPasswordResetEmail(email: string, resetLink: string) {
  // If SMTP is not configured, log the link to console
  if (!process.env.SMTP_HOST) {
    console.log("═══════════════════════════════════════════════");
    console.log("  SMTP not configured — password reset link:");
    console.log(`  ${resetLink}`);
    console.log("───────────────────────────────────────────────");
    console.log("  To send real emails, set SMTP_* env vars.");
    console.log("═══════════════════════════════════════════════");
    return;
  }

  await getTransporter().sendMail({
    from: fromAddress,
    to: email,
    subject: "Reset Your NPO Management Password",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
        <div style="background: #10b981; padding: 24px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 20px;">NPO Management</h1>
        </div>
        <div style="padding: 32px 24px; border: 1px solid #e5e7eb; border-top: 0; border-radius: 0 0 8px 8px;">
          <h2 style="color: #111827; margin: 0 0 12px;">Password Reset Request</h2>
          <p style="color: #4b5563; line-height: 1.6; margin: 0 0 20px;">
            We received a request to reset your password. Click the button below to set a new one.
            This link expires in 1 hour.
          </p>
          <a href="${resetLink}"
             style="display: inline-block; background: #10b981; color: white; padding: 12px 32px;
                    text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 14px;">
            Reset Password
          </a>
          <p style="color: #9ca3af; font-size: 12px; margin-top: 24px;">
            If you didn't request this, you can safely ignore this email.
          </p>
        </div>
      </div>
    `,
  });
}
