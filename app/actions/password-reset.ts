"use server";

import db from "@/lib/db";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { sendPasswordResetEmail } from "@/lib/email";

export async function forgotPassword(formData: FormData) {
  const email = (formData.get("email") as string)?.toLowerCase().trim();

  if (!email || !email.includes("@")) {
    return { error: "Please enter a valid email address." };
  }

  // Always respond the same way regardless of whether the email exists
  // (prevents email enumeration)
  const successMsg = "If an account with that email exists, we've sent a reset link.";

  const user = await db.user.findUnique({ where: { email } });
  if (!user || !user.active) {
    // Don't reveal whether the email exists
    console.log(`Password reset requested for unknown/inactive email: ${email}`);
    return { success: true, message: successMsg };
  }

  // Invalidate any existing tokens for this email
  await db.passwordResetToken.updateMany({
    where: { email, used: false },
    data: { used: true },
  });

  // Generate a secure random token
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  await db.passwordResetToken.create({
    data: {
      email,
      token,
      expiresAt,
      userId: user.id,
    },
  });

  const baseUrl = process.env.BASE_URL || process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  const resetLink = `${baseUrl}/reset-password?token=${token}`;

  await sendPasswordResetEmail(email, resetLink);

  return { success: true, message: successMsg };
}

export async function resetPassword(formData: FormData) {
  const token = formData.get("token") as string;
  const password = formData.get("password") as string;

  if (!token) {
    return { error: "Invalid reset link." };
  }
  if (!password || password.length < 6) {
    return { error: "Password must be at least 6 characters." };
  }

  // Find valid token
  const resetToken = await db.passwordResetToken.findUnique({
    where: { token },
  });

  if (!resetToken) {
    return { error: "Invalid or expired reset link." };
  }
  if (resetToken.used) {
    return { error: "This reset link has already been used." };
  }
  if (resetToken.expiresAt < new Date()) {
    return { error: "This reset link has expired. Please request a new one." };
  }

  // Update password and mark token as used
  const hashed = await bcrypt.hash(password, 10);

  await db.$transaction([
    db.user.update({
      where: { id: resetToken.userId! },
      data: { password: hashed },
    }),
    db.passwordResetToken.update({
      where: { id: resetToken.id },
      data: { used: true },
    }),
  ]);

  return { success: true };
}
