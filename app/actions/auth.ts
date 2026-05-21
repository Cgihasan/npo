"use server";

import db from "@/lib/db";
import bcrypt from "bcryptjs";
import { signIn } from "@/lib/auth";

export async function signupUser(formData: FormData) {
  const name = formData.get("name") as string;
  const email = (formData.get("email") as string)?.toLowerCase().trim();
  const password = formData.get("password") as string;

  // Validation
  if (!name || name.length < 2) {
    return { error: "Name must be at least 2 characters." };
  }
  if (!email || !email.includes("@")) {
    return { error: "Please enter a valid email address." };
  }
  if (!password || password.length < 6) {
    return { error: "Password must be at least 6 characters." };
  }

  // Check if email already exists
  const existing = await db.user.findUnique({ where: { email } });
  if (existing) {
    return { error: "An account with this email already exists." };
  }

  // Hash password and create user
  const hashed = await bcrypt.hash(password, 10);

  try {
    await db.user.create({
      data: { name, email, password: hashed, role: "VIEWER" },
    });

    // Auto-login after signup
    const result = await signIn("credentials", {
      redirect: false,
      email,
      password,
    });

    if (result?.error) {
      return { error: "Account created. Please log in." };
    }

    return { success: true };
  } catch (err) {
    console.error("Signup error:", err);
    return { error: "Something went wrong. Please try again." };
  }
}
