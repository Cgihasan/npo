"use server";

import db from "@/lib/db";
import { auth } from "@/lib/auth";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== "ADMIN") {
    return null;
  }
  return session;
}

export async function getUsers() {
  const session = await requireAdmin();
  if (!session) {
    return { error: "Unauthorized: Admin access required" };
  }

  const users = await db.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      active: true,
      createdAt: true,
    },
  });
  return { users };
}

export async function updateUserRole(formData: FormData) {
  const session = await requireAdmin();
  if (!session) {
    return { error: "Unauthorized: Admin access required" };
  }

  const userId = formData.get("userId") as string;
  const role = formData.get("role") as string;

  if (!userId || !role) {
    return { error: "Missing required fields." };
  }
  if (role !== "ADMIN" && role !== "VIEWER") {
    return { error: "Invalid role." };
  }

  // Prevent self-demotion
  if ((session.user as any).id === userId && role !== "ADMIN") {
    return { error: "You cannot demote your own account." };
  }

  await db.user.update({
    where: { id: userId },
    data: { role },
  });

  return { success: true };
}

export async function toggleUserActive(formData: FormData) {
  const session = await requireAdmin();
  if (!session) {
    return { error: "Unauthorized: Admin access required" };
  }

  const userId = formData.get("userId") as string;
  const active = formData.get("active") === "true";

  if (!userId) {
    return { error: "Missing user ID." };
  }

  // Prevent disabling your own account
  if ((session.user as any).id === userId) {
    return { error: "You cannot disable your own account." };
  }

  await db.user.update({
    where: { id: userId },
    data: { active },
  });

  return { success: true };
}

export async function deleteUser(formData: FormData) {
  const session = await requireAdmin();
  if (!session) {
    return { error: "Unauthorized: Admin access required" };
  }

  const userId = formData.get("userId") as string;

  if (!userId) {
    return { error: "Missing user ID." };
  }

  // Don't allow deleting yourself
  if ((session.user as any).id === userId) {
    return { error: "You cannot delete your own account." };
  }

  await db.user.delete({
    where: { id: userId },
  });

  return { success: true };
}
