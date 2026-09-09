"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { RECORD_STATUSES, validateCreateRecord } from "@/lib/validation/records";

// R4.6 — The shared validation module is reused on the client for a better
// experience, but the server re-validates (and is the enforcement point).
export function NewRecordForm() {
  const router = useRouter();
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setApiError(null);

    const form = new FormData(event.currentTarget as HTMLFormElement);
    const raw = {
      title: String(form.get("title") ?? ""),
      notes: String(form.get("notes") ?? ""),
      status: String(form.get("status") ?? "OPEN"),
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
    <form
      onSubmit={onSubmit}
      style={{ display: "flex", flexDirection: "column", gap: "var(--provly-spacing-provly-large-spacing)" }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--provly-spacing-provly-small-spacing)" }}>
        <label htmlFor="title" style={{ font: "var(--typography-provly-label-large)" }}>
          Title
        </label>
        <input id="title" name="title" type="text" placeholder="e.g. Site inspection" className="input" />
        {fieldErrors.title ? <span style={{ color: "var(--provly-role-provly-error)", font: "var(--typography-provly-body-small)" }}>{fieldErrors.title}</span> : null}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "var(--provly-spacing-provly-small-spacing)" }}>
        <label htmlFor="notes" style={{ font: "var(--typography-provly-label-large)" }}>
          Notes
        </label>
        <textarea id="notes" name="notes" rows={5} placeholder="Details about this record" className="input" />
        {fieldErrors.notes ? <span style={{ color: "var(--provly-role-provly-error)", font: "var(--typography-provly-body-small)" }}>{fieldErrors.notes}</span> : null}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "var(--provly-spacing-provly-small-spacing)" }}>
        <label htmlFor="status" style={{ font: "var(--typography-provly-label-large)" }}>
          Status
        </label>
        <select id="status" name="status" className="input" defaultValue="OPEN">
          {RECORD_STATUSES.map((status) => (
            <option key={status} value={status}>
              {status === "OPEN" ? "Open" : "Closed"}
            </option>
          ))}
        </select>
        {fieldErrors.status ? <span style={{ color: "var(--provly-role-provly-error)", font: "var(--typography-provly-body-small)" }}>{fieldErrors.status}</span> : null}
      </div>

      {apiError ? (
        <div role="alert" className="alert-error">
          {apiError}
        </div>
      ) : null}

      <div style={{ display: "flex", gap: "var(--provly-spacing-provly-base-spacing)" }}>
        <button type="submit" disabled={busy} className="btn btn-primary">
          {busy ? "Creating…" : "Create record"}
        </button>
      </div>
    </form>
  );
}
