import { prisma } from "@/lib/db/prisma";
import { ownedRecordFilter } from "./ownership";
import { parseRecordView, type RecordView } from "@/lib/validation/records";

export const recordListSelect = {
  publicId: true,
  title: true,
  status: true,
  createdAt: true,
} as const;

export type RecordListItem = {
  publicId: string;
  title: string;
  status: "OPEN" | "CLOSED";
  createdAt: Date;
};

export type OwnedRecord = {
  publicId: string;
  title: string;
  notes: string;
  status: "OPEN" | "CLOSED";
  createdAt: Date;
  updatedAt: Date;
};

// R4.8 — Map the validated view onto a status filter. `all` imposes no filter.
function statusFilter(view: RecordView): { status?: "OPEN" | "CLOSED" } {
  if (view === "open") return { status: "OPEN" };
  if (view === "closed") return { status: "CLOSED" };
  return {};
}

// R4.1 — The list is scoped to the authenticated user in the query itself. The
// (userId, createdAt desc) index supports this ordering (R4.11).
export async function listRecordsForUser(
  userId: string,
  rawView: unknown,
): Promise<RecordListItem[]> {
  const view = parseRecordView(rawView);
  return prisma.record.findMany({
    where: { userId, ...statusFilter(view) },
    select: recordListSelect,
    orderBy: { createdAt: "desc" },
  });
}

// R4.1/R4.9 — Ownership is part of the WHERE clause (userId AND publicId), so a
// record owned by anyone else is never returned. Uses the composite unique
// `[userId, publicId]` index (R4.11).
export async function getOwnedRecord(
  userId: string,
  publicId: string,
): Promise<OwnedRecord | null> {
  return prisma.record.findFirst({
    where: ownedRecordFilter(userId, publicId),
    select: {
      publicId: true,
      title: true,
      notes: true,
      status: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}

// Used only to distinguish 403 (record exists but belongs to someone else) from
// 404 (record does not exist). Does not reveal any record content.
export async function recordExists(publicId: string): Promise<boolean> {
  const found = await prisma.record.findFirst({
    where: { publicId },
    select: { publicId: true },
  });
  return found !== null;
}
