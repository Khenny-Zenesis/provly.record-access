import Link from "next/link";
import { NewRecordForm } from "./new-record-form";

export default function NewRecordPage() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem", maxWidth: 640, margin: "0 auto" }} className="animate-fade-in">
      {/* Top Breadcrumb */}
      <div>
        <Link
          href="/records"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.375rem",
            fontSize: "0.875rem",
            fontWeight: 500,
            color: "var(--provly-role-provly-primary, #1f4b43)",
            textDecoration: "none",
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"/>
            <polyline points="12 19 5 12 12 5"/>
          </svg>
          <span>Back to job records</span>
        </Link>
      </div>

      <div
        className="card"
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "1.5rem",
          padding: "2rem",
          background: "#ffffff",
          boxShadow: "0 4px 20px rgba(0, 0, 0, 0.05)",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem", borderBottom: "1px solid #f1f5f9", paddingBottom: "1.25rem" }}>
          <h1
            style={{
              font: "var(--typography-provly-title-large, normal 700 1.75rem 'Space Grotesk', sans-serif)",
              color: "#0f172a",
              margin: 0,
            }}
          >
            Create new record
          </h1>
          <p
            style={{
              fontSize: "0.875rem",
              color: "#64748b",
              margin: 0,
            }}
          >
            Job records are isolated to your authenticated account.
          </p>
        </div>

        <NewRecordForm />
      </div>
    </div>
  );
}
