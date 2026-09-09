import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { validateCreateRecord } from "@/lib/validation/records";
import { listRecordsForUser } from "@/lib/records/queries";
import { createRecord } from "@/lib/records/mutations";

export const runtime = "nodejs";

// R4.12 — Protected endpoint: no valid session → 401.
export async function GET(req: NextRequest): Promise<NextResponse> {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  // R4.8 — The URL-state `view` value is validated/normalised on the server.
  const view = req.nextUrl.searchParams.get("view");

  // R4.1 — The list is scoped to the authenticated user inside the query.
  const records = await listRecordsForUser(user.id, view);

  return NextResponse.json({ records });
}

// R4.6 / R4.12 — Protected endpoint; server-side validation; create scoped to
// the authenticated user; audit entry created in the same transaction.
export async function POST(req: NextRequest): Promise<NextResponse> {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const validation = validateCreateRecord(body);
  if (!validation.ok) {
    return NextResponse.json(
      { error: "Invalid record", errors: validation.errors },
      { status: 400 },
    );
  }

  const record = await createRecord(user.id, validation.data);

  return NextResponse.json(
    { record: { publicId: record.publicId, title: record.title } },
    { status: 201 },
  );
}
