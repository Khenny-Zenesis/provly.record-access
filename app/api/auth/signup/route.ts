import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { hashPassword, PASSWORD_MAX_BYTES } from "@/lib/auth/password";
import { createSession } from "@/lib/auth/session";
import { checkRateLimit } from "@/lib/auth/rateLimit";

export const runtime = "nodejs";

// R1.3 — signup is rate limited per client IP to stop automated account creation.
// Small budget: real users sign up once; this is abuse prevention, not the AI
// cost-control framing of R3.8.
const SIGNUP_RATE_LIMIT = { limit: 5, windowMs: 10 * 60 * 1000 };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function clientKey(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  const real = req.headers.get("x-real-ip");
  return forwarded?.split(",")[0]?.trim() || real || "unknown";
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const rate = checkRateLimit({
    key: `signup:${clientKey(req)}`,
    ...SIGNUP_RATE_LIMIT,
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
  if (email.length > 254 || !EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "Invalid email" }, { status: 400 });
  }
  // bcrypt only uses the first 72 bytes (see password.ts); reject anything past
  // that rather than silently truncating. A minimum length keeps a bare minimum
  // password from being trivially weak.
  if (Buffer.byteLength(password) > PASSWORD_MAX_BYTES) {
    return NextResponse.json({ error: "Password too long" }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "Email already registered" }, { status: 409 });
  }

  const passwordHash = await hashPassword(password);
  const user = await prisma.user.create({ data: { email, passwordHash } });
  await createSession(user.id);

  return NextResponse.json({ ok: true }, { status: 201 });
}
