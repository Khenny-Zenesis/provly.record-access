import Link from "next/link";
import { NewRecordForm } from "./new-record-form";

export default function NewRecordPage() {
  return (
    <div className="card animate-fade-in" style={{ maxWidth: 560 }}>
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--provly-spacing-provly-base-spacing)" }}>
        <h1 style={{ font: "var(--typography-provly-title-large)", margin: 0 }}>New record</h1>
        <p style={{ font: "var(--typography-provly-body-small)", margin: 0, color: "var(--provly-role-provly-neutral-variant)" }}>
          Create a job record that will be visible only to you.
        </p>
      </div>
      <div style={{ marginTop: "var(--provly-spacing-provly-large-spacing)" }}>
        <NewRecordForm />
      </div>
      <div style={{ marginTop: "var(--provly-spacing-provly-large-spacing)" }}>
        <Link href="/records" className="btn btn-secondary">
          Cancel
        </Link>
      </div>
    </div>
  );
}
