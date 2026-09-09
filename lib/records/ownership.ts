import type { Prisma } from "@prisma/client";

// R4.1 — Centralise the ownership condition so it is impossible to forget. Every
// record query that touches a user's data must pass through ownedRecordFilter;
// the ownership predicate is part of the database query, never a post-fetch
// check. The authenticated user's id is the only source of truth (R3 never
// trusts a client-supplied userId).
export function ownedRecordFilter(
  userId: string,
  publicId: string,
): Prisma.RecordWhereInput {
  return { userId, publicId };
}
