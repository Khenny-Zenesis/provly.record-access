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

  const userInitial = user.email ? user.email.charAt(0).toUpperCase() : "U";

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh", background: "#f8fafc" }}>
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 50,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "1rem",
          padding: "0.875rem 2rem",
          background: "#ffffff",
          borderBottom: "1px solid #e2e8f0",
          boxShadow: "0 1px 3px rgba(0, 0, 0, 0.04)",
        }}
      >
        <Link
          href="/records"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.625rem",
            textDecoration: "none",
          }}
        >
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: 8,
              background: "var(--provly-role-provly-primary, #1f4b43)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#ffffff",
              boxShadow: "0 2px 6px rgba(31, 75, 67, 0.25)",
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              <path d="m9 12 2 2 4-4"/>
            </svg>
          </div>
          <span
            style={{
              font: "var(--typography-provly-title-medium, normal 700 1.25rem 'Space Grotesk', sans-serif)",
              color: "#0f172a",
              letterSpacing: "-0.02em",
            }}
          >
            Provly
          </span>
          <span
            style={{
              fontSize: "0.6875rem",
              fontWeight: 700,
              padding: "0.15rem 0.5rem",
              background: "#e0f2fe",
              color: "#0369a1",
              borderRadius: 999,
              letterSpacing: "0.05em",
              textTransform: "uppercase",
            }}
          >
            Records
          </span>
        </Link>

        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          {/* User profile pill */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.625rem",
              padding: "0.35rem 0.75rem 0.35rem 0.4rem",
              background: "#f1f5f9",
              borderRadius: 999,
              border: "1px solid #e2e8f0",
            }}
          >
            <div
              style={{
                width: 26,
                height: 26,
                borderRadius: "50%",
                background: "var(--provly-role-provly-primary, #1f4b43)",
                color: "#ffffff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "0.75rem",
                fontWeight: 700,
              }}
            >
              {userInitial}
            </div>
            <span
              style={{
                fontSize: "0.8125rem",
                fontWeight: 500,
                color: "#334155",
              }}
            >
              {user.email}
            </span>
          </div>

          <SignOutButton />
        </div>
      </header>

      <main
        style={{
          flex: 1,
          width: "100%",
          maxWidth: 960,
          margin: "0 auto",
          padding: "2.5rem 1.5rem",
        }}
      >
        {children}
      </main>
    </div>
  );
}
