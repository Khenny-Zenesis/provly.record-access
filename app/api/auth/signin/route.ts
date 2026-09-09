import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { DUMMY_PASSWORD_HASH, verifyPassword } from "@/lib/auth/password";
import { createSession } from "@/lib/auth/session";
import { checkRateLimit } from "@/lib/auth/rateLimit";

export const runtime = "nodejs";

// R1.3 — signin is rate limited per IP as abuse prevention; a small budget and
// window still let a real user retry a typo without enabling a credential-stuffing
// burst.
const SIGNIN_RATE_LIMIT = { limit: 10, windowMs: 60_000 };

function clientKey(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  const real = req.headers.get("x-real-ip");
  return forwarded?.split(",")[0]?.trim() || real || "unknown";
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const rate = checkRateLimit({
    key: `signin:${clientKey(req)}`,
    ...SIGNIN_RATE_LIMIT,
  });
  if (!rate.allowed) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429, headers: { "Retry-After": String(rate.retryAfterSeconds) } },
    );
  }

  const body = (await req.json().catch(() => null)) as {
    email?: unknown;
    password?: unknown;
  } | null;
  const email =
    typeof body?.email === "string" ? body.email.trim().toLowerCase() : undefined;
  const password = typeof body?.password === "string" ? body.password : undefined;

  if (!email || !password) {
    return NextResponse.json({ error: "email and password are required" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { email } });

  // R1.6 — constant-ish timing: run a bcrypt compare even when the account does
  // not exist (against a fixed dummy hash) so a caller can't tell which emails
  // are registered from response timing.
  if (!user) {
    await verifyPassword(password, DUMMY_PASSWORD_HASH);
    return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
  }

  const ok = await verifyPassword(password, user.passwordHash);
  if (!ok) {
    return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
  }

  await createSession(user.id);
  return NextResponse.json({ ok: true });
}
