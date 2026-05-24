import db from "@/lib/db";

export type AuditAction =
  | "USER_ROLE_CHANGED"
  | "USER_DISABLED"
  | "USER_ENABLED"
  | "USER_DELETED";

export async function logAudit({
  action,
  performedById,
  targetUserId,
  targetEmail,
  details,
}: {
  action: AuditAction;
  performedById: string;
  targetUserId?: string | null;
  targetEmail?: string | null;
  details?: Record<string, unknown> | null;
}) {
  await db.auditLog.create({
    data: {
      action,
      performedById,
      targetUserId: targetUserId || null,
      targetEmail: targetEmail || null,
      details: details ? JSON.stringify(details) : null,
    },
  });
}
