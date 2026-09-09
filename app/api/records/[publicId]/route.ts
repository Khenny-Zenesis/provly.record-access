import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { getOwnedRecord, recordExists } from "@/lib/records/queries";
import { deleteRecord } from "@/lib/records/mutations";

export const runtime = "nodejs";

function unauthorized(): NextResponse {
  return NextResponse.json({ error: "Authentication required" }, { status: 401 });
}

// R4.3 / R4.12 — Protected detail endpoint. No session → 401. A record that
// exists but belongs to another user → 403. A record that does not exist → 404.
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ publicId: string }> },
): Promise<NextResponse> {
  const user = await getSessionUser();
  if (!user) {
    return unauthorized();
  }

  const { publicId } = await params;

  // R4.1 — Ownership is in the query (userId AND publicId). Only the owner's
  // record is ever returned.
  const record = await getOwnedRecord(user.id, publicId);
  if (record) {
    return NextResponse.json({ record });
  }

  // Not your record: distinguish 403 (exists but not owned) from 404 (absent).
  const exists = await recordExists(publicId);
  if (exists) {
    return NextResponse.json(
      { error: "You do not have access to this record" },
      { status: 403 },
    );
  }

  return NextResponse.json({ error: "Record not found" }, { status: 404 });
}

// R4.9 — Delete verifies existence + ownership. Audit entry is written before
// the row is removed, inside a transaction, so it survives the deletion (R4.4).
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ publicId: string }> },
): Promise<NextResponse> {
  const user = await getSessionUser();
  if (!user) {
    return unauthorized();
  }

  const { publicId } = await params;
  const outcome = await deleteRecord(user.id, publicId);

  if (outcome === "deleted") {
    return new NextResponse(null, { status: 204 });
  }
  if (outcome === "forbidden") {
    return NextResponse.json(
      { error: "You do not have access to this record" },
      { status: 403 },
    );
  }
  return NextResponse.json({ error: "Record not found" }, { status: 404 });
}
