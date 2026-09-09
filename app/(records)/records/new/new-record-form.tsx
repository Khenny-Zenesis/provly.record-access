"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { validateCreateRecord } from "@/lib/validation/records";

export function NewRecordForm() {
  const router = useRouter();
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string>("OPEN");

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setApiError(null);

    const form = new FormData(event.currentTarget as HTMLFormElement);
    const raw = {
      title: String(form.get("title") ?? ""),
      notes: String(form.get("notes") ?? ""),
      status: selectedStatus,
    };

    const validation = validateCreateRecord(raw);
    if (!validation.ok) {
      setFieldErrors(validation.errors as Record<string, string>);
      return;
    }
    setFieldErrors({});

    setBusy(true);
    try {
      const response = await fetch("/api/records", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validation.data),
      });
      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as {
          error?: string;
          errors?: Record<string, string>;
        } | null;
        if (data?.errors) {
          setFieldErrors(data.errors);
        } else {
          setApiError(data?.error ?? "Could not create record.");
        }
        return;
      }
      router.push("/records");
      router.refresh();
    } catch {
      setApiError("Could not create record. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* Title input */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
        <label
          htmlFor="title"
          style={{
            font: "var(--typography-provly-label-large, normal 600 0.875rem 'Inter', sans-serif)",
            color: "#0f172a",
          }}
        >
          Record Title <span style={{ color: "#ef4444" }}>*</span>
        </label>
        <input
          id="title"
          name="title"
          type="text"
          placeholder="e.g. Site Inspection & Compliance Review"
          className="input"
          required
        />
        {fieldErrors.title ? (
          <span style={{ color: "#dc2626", fontSize: "0.8125rem", marginTop: "0.125rem" }}>
            {fieldErrors.title}
          </span>
        ) : (
          <span style={{ color: "#94a3b8", fontSize: "0.75rem" }}>
            Provide a concise, descriptive title for this job record.
          </span>
        )}
      </div>

      {/* Notes textarea */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
        <label
          htmlFor="notes"
          style={{
            font: "var(--typography-provly-label-large, normal 600 0.875rem 'Inter', sans-serif)",
            color: "#0f172a",
          }}
        >
          Notes / Details
        </label>
        <textarea
          id="notes"
          name="notes"
          rows={4}
          placeholder="Add job notes, observations, or audit context..."
          className="input"
        />
        {fieldErrors.notes ? (
          <span style={{ color: "#dc2626", fontSize: "0.8125rem", marginTop: "0.125rem" }}>
            {fieldErrors.notes}
          </span>
        ) : null}
      </div>

      {/* Status Card Selection */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        <label
          style={{
            font: "var(--typography-provly-label-large, normal 600 0.875rem 'Inter', sans-serif)",
            color: "#0f172a",
          }}
        >
          Record Status
        </label>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
          {/* OPEN Radio Option */}
          <div
            className={`status-option-card ${selectedStatus === "OPEN" ? "selected" : ""}`}
            onClick={() => setSelectedStatus("OPEN")}
          >
            <input
              type="radio"
              id="status-open"
              name="status"
              value="OPEN"
              checked={selectedStatus === "OPEN"}
              onChange={() => setSelectedStatus("OPEN")}
            />
            <div>
              <label htmlFor="status-open" style={{ fontWeight: 600, color: "#0f172a", fontSize: "0.875rem", cursor: "pointer", display: "block" }}>
                Open
              </label>
              <span style={{ fontSize: "0.75rem", color: "#64748b" }}>Active record pending completion</span>
            </div>
          </div>

          {/* CLOSED Radio Option */}
          <div
            className={`status-option-card ${selectedStatus === "CLOSED" ? "selected" : ""}`}
            onClick={() => setSelectedStatus("CLOSED")}
          >
            <input
              type="radio"
              id="status-closed"
              name="status"
              value="CLOSED"
              checked={selectedStatus === "CLOSED"}
              onChange={() => setSelectedStatus("CLOSED")}
            />
            <div>
              <label htmlFor="status-closed" style={{ fontWeight: 600, color: "#0f172a", fontSize: "0.875rem", cursor: "pointer", display: "block" }}>
                Closed
              </label>
              <span style={{ fontSize: "0.75rem", color: "#64748b" }}>Completed or archived record</span>
            </div>
          </div>
        </div>
        {fieldErrors.status ? (
          <span style={{ color: "#dc2626", fontSize: "0.8125rem", marginTop: "0.125rem" }}>
            {fieldErrors.status}
          </span>
        ) : null}
      </div>

      {apiError ? (
        <div role="alert" className="alert-error">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" x2="12" y1="8" y2="12"/>
            <line x1="12" x2="12.01" y1="16" y2="16"/>
          </svg>
          <span>{apiError}</span>
        </div>
      ) : null}

      <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "0.75rem", paddingTop: "0.75rem", borderTop: "1px solid #f1f5f9" }}>
        <Link href="/records" className="btn btn-secondary">
          Cancel
        </Link>
        <button
          type="submit"
          disabled={busy}
          className="btn btn-primary"
          style={{ padding: "0.75rem 1.75rem" }}
        >
          {busy ? (
            <>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: "spin 1s linear infinite" }}>
                <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
              </svg>
              <span>Creating…</span>
            </>
          ) : (
            "Create record"
          )}
        </button>
      </div>
    </form>
  );
}
