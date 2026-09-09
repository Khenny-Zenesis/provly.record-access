"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

// R4.9 — The delete button calls the endpoint, but the server (not the hidden
// button) is the enforcement point. Deleting another user's record is rejected
// server-side even if this button were bypassed entirely.
export function DeleteRecordButton({ publicId }: { publicId: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onDelete(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const response = await fetch(`/api/records/${publicId}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as { error?: string } | null;
        setError(data?.error ?? "Could not delete record.");
        return;
      }
      router.push("/records");
      router.refresh();
    } catch {
      setError("Could not delete record. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  if (!confirming) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "1.25rem 1.5rem",
          background: "#ffffff",
          border: "1px solid #fee2e2",
          borderRadius: 16,
        }}
      >
        <div>
          <h4 style={{ margin: 0, fontSize: "0.9375rem", fontWeight: 600, color: "#991b1b" }}>
            Danger Zone
          </h4>
          <p style={{ margin: "0.125rem 0 0 0", fontSize: "0.8125rem", color: "#7f1d1d" }}>
            Permanently remove this job record and log the action to audit trail.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setConfirming(true)}
          className="btn"
          style={{
            background: "#fef2f2",
            color: "#dc2626",
            border: "1px solid #fecaca",
            fontSize: "0.8125rem",
            padding: "0.5rem 1rem",
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3 6 5 6 21 6"/>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
          </svg>
          <span>Delete record</span>
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={onDelete}
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "1rem",
        padding: "1.25rem 1.5rem",
        background: "#fef2f2",
        border: "1.5px solid #fecaca",
        borderRadius: 16,
      }}
      className="animate-fade-in"
    >
      <div style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem" }}>
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: "50%",
            background: "#fee2e2",
            color: "#dc2626",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
            <line x1="12" y1="9" x2="12" y2="13"/>
            <line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
        </div>
        <div>
          <h4 style={{ margin: 0, fontSize: "0.9375rem", fontWeight: 700, color: "#991b1b" }}>
            Confirm Record Deletion
          </h4>
          <p style={{ margin: "0.25rem 0 0 0", fontSize: "0.8125rem", color: "#7f1d1d" }}>
            Are you sure? This action cannot be undone. An immutable audit record will log this deletion.
          </p>
        </div>
      </div>

      {error ? (
        <div className="alert-error" role="alert">
          <span>{error}</span>
        </div>
      ) : null}

      <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "0.75rem", paddingTop: "0.5rem" }}>
        <button
          type="button"
          onClick={() => setConfirming(false)}
          className="btn btn-secondary"
          style={{ padding: "0.5rem 1rem", fontSize: "0.8125rem" }}
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={busy}
          className="btn btn-danger"
          style={{ padding: "0.5rem 1.25rem", fontSize: "0.8125rem" }}
        >
          {busy ? "Deleting…" : "Confirm delete"}
        </button>
      </div>
    </form>
  );
}
