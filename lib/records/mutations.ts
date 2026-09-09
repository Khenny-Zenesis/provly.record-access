import { prisma } from "@/lib/db/prisma";
import { ownedRecordFilter } from "./ownership";
import { writeAuditLog, AUDIT_ACTIONS } from "./audit";
import type { CreateRecordInput } from "@/lib/validation/records";
import type { OwnedRecord } from "./queries";

// R4.4 — Create is wrapped with its audit entry in a single transaction so the
// record and its evidence can never diverge.
export async function createRecord(
  userId: string,
  input: CreateRecordInput,
): Promise<OwnedRecord> {
  return prisma.$transaction(async (tx) => {
    const record = await tx.record.create({
      data: {
        title: input.title,
        notes: input.notes,
        status: input.status,
        userId,
      },
      select: {
        publicId: true,
        title: true,
        notes: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    await tx.auditLog.create({
      data: {
        action: AUDIT_ACTIONS.RECORD_CREATED,
        actorUserId: userId,
        recordPublicId: record.publicId,
        recordTitle: record.title,
      },
    });

    return record;
  });
}

export type DeleteOutcome = "deleted" | "not_found" | "forbidden";

// R4.9 — Ownership is part of the delete condition; a record owned by another
// user is neither touched nor audited as a deletion. The audit entry is written
// inside the same transaction and before the row is removed, so it survives the
// deletion (R4.4 / Trap 6). "not_found" vs "forbidden" is the 404 / 403 split.
export async function deleteRecord(
  userId: string,
  publicId: string,
): Promise<DeleteOutcome> {
  // Distinguish "does not exist" (404) from "exists but not yours" (403).
  const existsForOther = await prisma.record.findFirst({
    where: { publicId },
    select: { publicId: true },
  });
  if (!existsForOther) {
    return "not_found";
  }

  const result = await prisma.$transaction(async (tx) => {
    const owned = await tx.record.findFirst({
      where: ownedRecordFilter(userId, publicId),
      select: { id: true, title: true },
    });
    if (!owned) {
      return "forbidden" as const;
    }

    await tx.auditLog.create({
      data: {
        action: AUDIT_ACTIONS.RECORD_DELETED,
        actorUserId: userId,
        recordPublicId: publicId,
        recordTitle: owned.title,
      },
    });

    await tx.record.delete({ where: { id: owned.id } });
    return "deleted" as const;
  });

  return result;
}

// Re-exported so callers that write audit entries in a transaction share the
// same helper path; kept for a single audit-logging code path.
export { writeAuditLog };
