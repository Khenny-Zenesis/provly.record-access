import Link from "next/link";
import { notFound } from "next/navigation";
import { getOwnedRecord } from "@/lib/records/queries";
import { getSessionUser } from "@/lib/auth/session";
import { DeleteRecordButton } from "./delete-button";

export const dynamic = "force-dynamic";

// R4.1 — Ownership is in the query. A user requesting another user's record gets
// a 404 at the page level (the API enforces the 403/404 distinction server-side).
export default async function RecordDetailPage({
  params,
}: {
  params: Promise<{ publicId: string }>;
}) {
  const { publicId } = await params;
  const user = await getSessionUser();
  if (!user) {
    notFound();
  }

  const record = await getOwnedRecord(user.id, publicId);
  if (!record) {
    notFound();
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem", maxWidth: 760, margin: "0 auto" }} className="animate-fade-in">
      {/* Top Navigation */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
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

        {/* Ownership verification indicator */}
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.375rem",
            padding: "0.25rem 0.625rem",
            background: "#f0fdf4",
            border: "1px solid #bbf7d0",
            borderRadius: 999,
            fontSize: "0.75rem",
            color: "#166534",
            fontWeight: 500,
          }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
          <span>Ownership Verified</span>
        </div>
      </div>

      {/* Main Record Detail Card */}
      <div
        className="card"
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "1.75rem",
          padding: "2rem",
          background: "#ffffff",
          boxShadow: "0 4px 20px rgba(0, 0, 0, 0.05)",
        }}
      >
        {/* Header Title & Status Badge */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "1rem",
            borderBottom: "1px solid #f1f5f9",
            paddingBottom: "1.25rem",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            <h1
              style={{
                font: "var(--typography-provly-title-large, normal 700 1.75rem 'Space Grotesk', sans-serif)",
                color: "#0f172a",
                margin: 0,
                letterSpacing: "-0.02em",
              }}
            >
              {record.title}
            </h1>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
              <span style={{ fontSize: "0.8125rem", color: "#64748b" }}>Public Ref ID:</span>
              <code
                style={{
                  fontSize: "0.8125rem",
                  fontFamily: "monospace",
                  padding: "0.2rem 0.5rem",
                  background: "#f1f5f9",
                  borderRadius: 6,
                  color: "#334155",
                  border: "1px solid #e2e8f0",
                }}
              >
                {record.publicId}
              </code>
            </div>
          </div>

          <span className={record.status === "OPEN" ? "badge badge-open" : "badge badge-closed"} style={{ padding: "0.375rem 0.875rem", fontSize: "0.8125rem" }}>
            <span className="badge-dot" />
            {record.status.toLowerCase()}
          </span>
        </div>

        {/* Record Content / Notes */}
        <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
          <h3
            style={{
              font: "var(--typography-provly-title-small, normal 600 1rem 'Space Grotesk', sans-serif)",
              color: "#334155",
              margin: 0,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              fontSize: "0.8125rem",
            }}
          >
            Job Notes & Details
          </h3>
          <div
            style={{
              padding: "1.25rem",
              background: "#f8fafc",
              border: "1px solid #e2e8f0",
              borderRadius: 12,
              fontFamily: "var(--typography-provly-body-medium-font-family, 'Inter', sans-serif)",
              fontSize: "0.9375rem",
              lineHeight: 1.6,
              color: record.notes ? "#1e293b" : "#94a3b8",
              whiteSpace: "pre-wrap",
              fontStyle: record.notes ? "normal" : "italic",
            }}
          >
            {record.notes || "No additional notes provided for this record."}
          </div>
        </div>

        {/* Timestamps & Info Footer */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "0.75rem",
            paddingTop: "1rem",
            borderTop: "1px solid #f1f5f9",
            fontSize: "0.8125rem",
            color: "#64748b",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.375rem" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12 6 12 12 16 14"/>
            </svg>
            <span>Created on {new Date(record.createdAt).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}</span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "0.375rem" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
            <span>Audit Trail Maintained</span>
          </div>
        </div>
      </div>

      {/* Delete Record Section */}
      <div style={{ paddingTop: "0.5rem" }}>
        <DeleteRecordButton publicId={record.publicId} />
      </div>
    </div>
  );
}
