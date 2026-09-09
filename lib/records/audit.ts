import { prisma } from "@/lib/db/prisma";

// R4.4 — Audit entries capture the actor, the action, the target record's opaque
// public id, and an optional title snapshot plus a timestamp. They have a FK to
// the actor User but no relation to Record, so they survive the original record
// being deleted (PRD Trap 6).

export const AUDIT_ACTIONS = {
  RECORD_CREATED: "RECORD_CREATED",
  RECORD_DELETED: "RECORD_DELETED",
} as const;
export type AuditAction = (typeof AUDIT_ACTIONS)[keyof typeof AUDIT_ACTIONS];

export async function writeAuditLog({
  action,
  actorUserId,
  recordPublicId,
  recordTitle,
}: {
  action: AuditAction;
  actorUserId: string;
  recordPublicId: string;
  recordTitle: string;
}): Promise<void> {
  await prisma.auditLog.create({
    data: { action, actorUserId, recordPublicId, recordTitle },
  });
}
