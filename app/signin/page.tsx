"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

export default function SignInPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    const form = new FormData(event.currentTarget as HTMLFormElement);
    const email = String(form.get("email") ?? "");
    const password = String(form.get("password") ?? "");

    setBusy(true);
    try {
      const response = await fetch("/api/auth/signin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as { error?: string } | null;
        setError(data?.error ?? "Sign in failed.");
        return;
      }
      router.push("/records");
      router.refresh();
    } catch {
      setError("Sign in failed. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "var(--provly-spacing-provly-base-spacing, 1rem)",
        background: "linear-gradient(135deg, #0f2420 0%, #1f4b43 50%, #1b263b 100%)",
      }}
    >
      <main
        className="card animate-fade-in"
        style={{
          maxWidth: 440,
          width: "100%",
          display: "flex",
          flexDirection: "column",
          gap: "var(--provly-spacing-provly-large-spacing, 1.5rem)",
          background: "#ffffff",
          boxShadow: "0 20px 40px rgba(0, 0, 0, 0.2)",
          border: "none",
          padding: "2.5rem 2rem",
        }}
      >
        {/* Brand Header */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: "0.5rem" }}>
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 12,
              background: "var(--provly-role-provly-primary, #1f4b43)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#ffffff",
              marginBottom: "0.25rem",
              boxShadow: "0 4px 12px rgba(31, 75, 67, 0.3)",
            }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              <path d="m9 12 2 2 4-4"/>
            </svg>
          </div>
          <h1
            style={{
              font: "var(--typography-provly-title-large, normal 700 1.75rem 'Space Grotesk', sans-serif)",
              color: "var(--provly-role-provly-on-neutral-container, #16181d)",
              margin: 0,
              textAlign: "center",
            }}
          >
            Sign in to Provly
          </h1>
          <p
            style={{
              font: "var(--typography-provly-body-small, normal 400 0.875rem 'Inter', sans-serif)",
              color: "var(--provly-role-provly-neutral-variant, #64748b)",
              margin: 0,
              textAlign: "center",
            }}
          >
            Welcome back. Access your isolated job records.
          </p>
        </div>

        {/* Security Assurance Badge */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.5rem",
            padding: "0.4rem 0.75rem",
            background: "#f0fdf4",
            border: "1px solid #bbf7d0",
            borderRadius: 999,
            fontSize: "0.75rem",
            color: "#166534",
            fontWeight: 500,
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect width="18" height="11" x="3" y="11" rx="2" ry="2"/>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
          <span>Encrypted Session Authentication</span>
        </div>

        {/* Sign In Form */}
        <form onSubmit={onSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
            <label
              htmlFor="email"
              style={{
                font: "var(--typography-provly-label-large, normal 600 0.875rem 'Inter', sans-serif)",
                color: "var(--provly-role-provly-on-neutral-container, #16181d)",
              }}
            >
              Email address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              placeholder="name@company.com"
              required
              className="input"
              autoComplete="email"
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
            <label
              htmlFor="password"
              style={{
                font: "var(--typography-provly-label-large, normal 600 0.875rem 'Inter', sans-serif)",
                color: "var(--provly-role-provly-on-neutral-container, #16181d)",
              }}
            >
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              placeholder="Enter your password"
              required
              className="input"
              autoComplete="current-password"
            />
          </div>

          {error ? (
            <div role="alert" className="alert-error">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" x2="12" y1="8" y2="12"/>
                <line x1="12" x2="12.01" y1="16" y2="16"/>
              </svg>
              <span>{error}</span>
            </div>
          ) : null}

          <button
            type="submit"
            disabled={busy}
            className="btn btn-primary"
            style={{ width: "100%", marginTop: "0.25rem", padding: "0.875rem" }}
          >
            {busy ? "Signing in…" : "Sign in"}
          </button>
        </form>

        {/* Footer Navigation */}
        <div
          style={{
            borderTop: "1px solid #e2e8f0",
            paddingTop: "1.25rem",
            textAlign: "center",
          }}
        >
          <p
            style={{
              fontSize: "0.875rem",
              color: "#64748b",
              margin: 0,
            }}
          >
            Don&apos;t have an account?{" "}
            <Link
              href="/signup"
              style={{
                color: "var(--provly-role-provly-primary, #1f4b43)",
                fontWeight: 600,
                textDecoration: "none",
              }}
            >
              Create one
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
