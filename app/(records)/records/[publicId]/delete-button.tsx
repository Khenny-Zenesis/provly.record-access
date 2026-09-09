"use client";

import { useRouter, useParams } from "next/navigation";
import { FormEvent, useState } from "react";

// R4.9 — The delete button calls the endpoint, but the server (not the hiddden
// button) is the enforcement point. Deleting another user's record is rejected
// server-side even if this button were bypassed entirely.
export function DeleteRecordButton({ publicId }: { publicId: string }) {
  const router = useRouter();
  const params = useParams();
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
      <button type="button" onClick={() => setConfirming(true)} className="btn btn-secondary">
        Delete record
      </button>
    );
  }

  return (
    <form onSubmit={onDelete} style={{ display: "flex", flexDirection: "column", gap: "var(--provly-spacing-provly-base-spacing)" }}>
      <div className="alert-error" role="alert">
        Are you sure? This permanently deletes this record.
      </div>
      {error ? <div className="alert-error">{error}</div> : null}
      <div style={{ display: "flex", gap: "var(--provly-spacing-provly-base-spacing)" }}>
        <button type="button" onClick={() => setConfirming(false)} className="btn btn-secondary">
          Cancel
        </button>
        <button type="submit" disabled={busy} className="btn btn-danger">
          {busy ? "Deleting…" : "Confirm delete"}
        </button>
      </div>
    </form>
  );
}
