import Link from "next/link";
import { listRecordsForUser } from "@/lib/records/queries";
import { getSessionUser } from "@/lib/auth/session";
import { parseRecordView, RECORD_VIEWS, type RecordView } from "@/lib/validation/records";

export const dynamic = "force-dynamic";

// R4.8 — Conditional list view is driven by URL state `?view=`. The server
// validates/normalises the value; the raw string never reaches a query.
export default async function RecordsListPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>;
}) {
  const params = await searchParams;
  const view: RecordView = parseRecordView(params.view);
  const user = await getSessionUser();

  // R4.1 — Only the authenticated user's records are queried, in the DB query.
  const records = await listRecordsForUser(user?.id ?? "", params.view);

  // Quick stats summary
  const allUserRecords = await listRecordsForUser(user?.id ?? "", "all");
  const openCount = allUserRecords.filter((r) => r.status === "OPEN").length;
  const closedCount = allUserRecords.filter((r) => r.status === "CLOSED").length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.75rem" }} className="animate-fade-in">
      {/* Page Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1
            style={{
              font: "var(--typography-provly-title-large, normal 700 2rem 'Space Grotesk', sans-serif)",
              color: "#0f172a",
              margin: 0,
              letterSpacing: "-0.02em",
            }}
          >
            Job Records
          </h1>
          <p
            style={{
              fontSize: "0.875rem",
              color: "#64748b",
              margin: "0.25rem 0 0 0",
            }}
          >
            Manage and track your authenticated user records securely.
          </p>
        </div>

        <Link
          href="/records/new"
          className="btn btn-primary"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.5rem",
            boxShadow: "0 4px 12px rgba(31, 75, 67, 0.25)",
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"/>
            <line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          <span>New record</span>
        </Link>
      </div>

      {/* Overview Stats Bar & Filter Tabs */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "1rem",
          padding: "1rem 1.25rem",
          background: "#ffffff",
          borderRadius: 16,
          border: "1px solid #e2e8f0",
          boxShadow: "0 1px 3px rgba(0, 0, 0, 0.03)",
        }}
      >
        {/* Segmented Filter Control */}
        <nav aria-label="Filter records" className="segmented-control">
          {RECORD_VIEWS.map((v) => {
            const active = v === view;
            return (
              <Link
                key={v}
                href={v === "all" ? "/records" : `/records?view=${v}`}
                className={`segmented-tab ${active ? "active" : ""}`}
              >
                {v}
              </Link>
            );
          })}
        </nav>

        {/* Quick Stat Indicators */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <div className="stat-chip">
            <span>Total:</span>
            <strong>{allUserRecords.length}</strong>
          </div>
          <div className="stat-chip">
            <span style={{ color: "#16a34a" }}>Open:</span>
            <strong>{openCount}</strong>
          </div>
          <div className="stat-chip">
            <span style={{ color: "#475569" }}>Closed:</span>
            <strong>{closedCount}</strong>
          </div>
        </div>
      </div>

      {/* Record List or Genuine Empty State */}
      {records.length === 0 ? (
        <div className="empty-state">
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: "50%",
              background: "#f0fdf4",
              border: "1px solid #bbf7d0",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--provly-role-provly-primary, #1f4b43)",
              marginBottom: "0.25rem",
            }}
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="12" y1="18" x2="12" y2="12"/>
              <line x1="9" y1="15" x2="15" y2="15"/>
            </svg>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
            <h2
              style={{
                font: "var(--typography-provly-title-medium, normal 700 1.25rem 'Space Grotesk', sans-serif)",
                color: "#0f172a",
                margin: 0,
              }}
            >
              {view === "all" ? "No records yet" : `No ${view} records found`}
            </h2>
            <p
              style={{
                fontSize: "0.875rem",
                color: "#64748b",
                margin: 0,
                maxWidth: 360,
              }}
            >
              {view === "all"
                ? "You don't have any job records created yet. Create your first record to get started."
                : `You currently have no records with "${view}" status.`}
            </p>
          </div>
          <Link
            href="/records/new"
            className="btn btn-primary"
            style={{ marginTop: "0.5rem" }}
          >
            Create your first record
          </Link>
        </div>
      ) : (
        <ul
          style={{
            listStyle: "none",
            display: "flex",
            flexDirection: "column",
            gap: "0.875rem",
            margin: 0,
            padding: 0,
          }}
        >
          {records.map((record) => (
            <li key={record.publicId}>
              <Link
                href={`/records/${record.publicId}`}
                className="card card-hoverable"
                style={{
                  display: "block",
                  padding: "1.25rem 1.5rem",
                  textDecoration: "none",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "1rem",
                  }}
                >
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
                      <h3
                        style={{
                          font: "var(--typography-provly-title-small, normal 600 1.125rem 'Space Grotesk', sans-serif)",
                          color: "#0f172a",
                          margin: 0,
                        }}
                      >
                        {record.title}
                      </h3>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", fontSize: "0.75rem", color: "#64748b" }}>
                      <span>Ref: <code style={{ fontStyle: "normal", color: "#475569" }}>{record.publicId.slice(0, 8)}…</code></span>
                      <span>•</span>
                      <span>Created {new Date(record.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}</span>
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                    <span className={record.status === "OPEN" ? "badge badge-open" : "badge badge-closed"}>
                      <span className="badge-dot" />
                      {record.status.toLowerCase()}
                    </span>
                    <div
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: "50%",
                        background: "#f1f5f9",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#64748b",
                        transition: "all 0.15s ease",
                      }}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="9 18 15 12 9 6"/>
                      </svg>
                    </div>
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
