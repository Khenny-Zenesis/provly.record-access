import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";
import { SignOutButton } from "./sign-out-button";

export const dynamic = "force-dynamic";

// R4.12 — Protected app shell: every page under (records) requires a session.
export default async function RecordsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSessionUser();
  if (!user) {
    redirect("/signin");
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "var(--provly-spacing-provly-base-spacing)",
          padding: "var(--provly-spacing-provly-base-spacing) var(--provly-spacing-provly-2x-large)",
          background: "var(--provly-role-provly-on-primary)",
          borderBottom: "1px solid var(--provly-role-provly-neutral-variant-container)",
        }}
      >
        <Link
          href="/records"
          style={{
            font: "var(--typography-provly-title-medium)",
            color: "var(--provly-role-provly-on-neutral-container)",
          }}
        >
          Provly Records
        </Link>
        <div style={{ display: "flex", alignItems: "center", gap: "var(--provly-spacing-provly-base-spacing)" }}>
          <span
            style={{
              font: "var(--typography-provly-body-small)",
              color: "var(--provly-role-provly-neutral-variant)",
            }}
          >
            {user.email}
          </span>
          <SignOutButton />
        </div>
      </header>
      <main
        style={{
          flex: 1,
          width: "100%",
          maxWidth: 960,
          margin: "0 auto",
          padding: "var(--provly-spacing-provly-2x-large)",
        }}
      >
        {children}
      </main>
    </div>
  );
}
