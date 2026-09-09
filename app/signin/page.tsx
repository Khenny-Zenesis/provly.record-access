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
        padding: "var(--provly-spacing-provly-2x-large)",
      }}
    >
      <main
        className="provly-card animate-fade-in"
        style={{
          maxWidth: 440,
          width: "100%",
          display: "flex",
          flexDirection: "column",
          gap: "var(--provly-spacing-provly-large-spacing)",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--provly-spacing-provly-extra-small-spacing)" }}>
          <h1
            style={{
              font: "var(--typography-provly-headline-large)",
              margin: 0,
              color: "var(--provly-role-provly-on-neutral-container)",
            }}
          >
            Sign in
          </h1>
          <p
            style={{
              font: "var(--typography-provly-body-small)",
              color: "var(--provly-role-provly-neutral-variant)",
              margin: 0,
            }}
          >
            Welcome back. Access your records
          </p>
        </div>

        <form onSubmit={onSubmit} style={{ display: "flex", flexDirection: "column", gap: "var(--provly-spacing-provly-large-spacing)" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--provly-spacing-provly-small-spacing)" }}>
            <label
              htmlFor="email"
              style={{
                font: "var(--typography-provly-label-large)",
                color: "var(--provly-role-provly-on-neutral-container)",
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
              className="provly-input"
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "var(--provly-spacing-provly-small-spacing)" }}>
            <label
              htmlFor="password"
              style={{
                font: "var(--typography-provly-label-large)",
                color: "var(--provly-role-provly-on-neutral-container)",
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
              className="provly-input"
            />
          </div>

          {error ? (
            <div role="alert" className="provly-alert-error">
              {error}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={busy}
            className="provly-btn-primary"
            style={{ width: "100%" }}
          >
            {busy ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <div
          style={{
            borderTop: "1px solid var(--provly-role-provly-neutral-variant-container)",
            paddingTop: "var(--provly-spacing-provly-base-spacing)",
            textAlign: "center",
          }}
        >
          <p
            style={{
              font: "var(--typography-provly-body-small)",
              color: "var(--provly-role-provly-on-neutral-container)",
              margin: 0,
            }}
          >
            Don&apos;t have an account?{" "}
            <Link
              href="/signup"
              style={{
                color: "var(--provly-role-provly-primary)",
                fontWeight: 500,
                textDecoration: "underline",
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
