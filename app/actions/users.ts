"use server";

import db from "@/lib/db";
import { auth } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

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

export async function getAuditLogs() {
  const session = await requireAdmin();
  if (!session) {
    return { error: "Unauthorized: Admin access required" };
  }

  const logs = await db.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
    include: {
      performedBy: { select: { name: true, email: true } },
      targetUser: { select: { name: true, email: true } },
    },
  });
  return { logs };
}

export async function updateUserRole(formData: FormData) {
  const session = await requireAdmin();
  if (!session) {
    return { error: "Unauthorized: Admin access required" };
  }

  const userId = formData.get("userId") as string;
  const role = formData.get("role") as string;
  const adminId = (session.user as any).id;

  if (!userId || !role) {
    return { error: "Missing required fields." };
  }
  if (role !== "ADMIN" && role !== "VIEWER") {
    return { error: "Invalid role." };
  }

  // Prevent self-demotion
  if (adminId === userId && role !== "ADMIN") {
    return { error: "You cannot demote your own account." };
  }

  // Fetch the target user to get current role + email for audit
  const targetUser = await db.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, role: true, name: true },
  });
  if (!targetUser) {
    return { error: "User not found." };
  }

  await db.user.update({
    where: { id: userId },
    data: { role },
  });

  await logAudit({
    action: "USER_ROLE_CHANGED",
    performedById: adminId,
    targetUserId: userId,
    targetEmail: targetUser.email,
    details: {
      fromRole: targetUser.role,
      toRole: role,
      targetName: targetUser.name,
    },
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
  const adminId = (session.user as any).id;

  if (!userId) {
    return { error: "Missing user ID." };
  }

  // Prevent disabling your own account
  if (adminId === userId) {
    return { error: "You cannot disable your own account." };
  }

  // Fetch target user for audit
  const targetUser = await db.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, name: true },
  });
  if (!targetUser) {
    return { error: "User not found." };
  }

  await db.user.update({
    where: { id: userId },
    data: { active },
  });

  await logAudit({
    action: active ? "USER_ENABLED" : "USER_DISABLED",
    performedById: adminId,
    targetUserId: userId,
    targetEmail: targetUser.email,
    details: { targetName: targetUser.name },
  });

  return { success: true };
}

export async function deleteUser(formData: FormData) {
  const session = await requireAdmin();
  if (!session) {
    return { error: "Unauthorized: Admin access required" };
  }

  const userId = formData.get("userId") as string;
  const adminId = (session.user as any).id;

  if (!userId) {
    return { error: "Missing user ID." };
  }

  // Don't allow deleting yourself
  if (adminId === userId) {
    return { error: "You cannot delete your own account." };
  }

  // Fetch target user for audit before deleting
  const targetUser = await db.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, name: true },
  });
  if (!targetUser) {
    return { error: "User not found." };
  }

  await db.user.delete({
    where: { id: userId },
  });

  await logAudit({
    action: "USER_DELETED",
    performedById: adminId,
    targetEmail: targetUser.email,
    details: { targetName: targetUser.name },
  });

  return { success: true };
}
