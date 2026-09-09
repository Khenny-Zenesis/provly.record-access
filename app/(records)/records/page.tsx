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

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--provly-spacing-provly-large-spacing)" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "var(--provly-spacing-provly-base-spacing)" }}>
        <div>
          <h1 style={{ font: "var(--typography-provly-title-large)", margin: 0 }}>Records</h1>
          <p style={{ font: "var(--typography-provly-body-small)", margin: 0, color: "var(--provly-role-provly-neutral-variant)" }}>
            Your job records
          </p>
        </div>
        <Link href="/records/new" className="btn btn-primary">
          New record
        </Link>
      </div>

      <nav
        aria-label="Filter records"
        style={{ display: "flex", gap: "var(--provly-spacing-provly-small-spacing)" }}
      >
        {RECORD_VIEWS.map((v) => {
          const active = v === view;
          return (
            <Link
              key={v}
              href={v === "all" ? "/records" : `/records?view=${v}`}
              className="btn"
              style={
                active
                  ? {
                      background: "var(--provly-role-provly-primary)",
                      color: "var(--provly-role-provly-on-primary)",
                    }
                  : {
                      background: "var(--provly-role-provly-neutral-container)",
                      color: "var(--provly-role-provly-on-neutral-container)",
                      border: "1px solid var(--provly-role-provly-neutral-variant)",
                    }
              }
            >
              {v}
            </Link>
          );
        })}
      </nav>

      {records.length === 0 ? (
        <div className="empty-state animate-fade-in">
          <h2 style={{ font: "var(--typography-provly-title-medium)", margin: 0 }}>
            {view === "all" ? "No records yet" : `No ${view} records`}
          </h2>
          <p style={{ font: "var(--typography-provly-body-small)", margin: 0, color: "var(--provly-role-provly-neutral-variant)" }}>
            {view === "all"
              ? "You don't have any records. Create your first one to get started."
              : `You don't have any ${view} records.`}
          </p>
          <Link href="/records/new" className="btn btn-primary">
            Create your first record
          </Link>
        </div>
      ) : (
        <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "var(--provly-spacing-provly-base-spacing)", margin: 0, padding: 0 }}>
          {records.map((record) => (
            <li key={record.publicId}>
              <Link href={`/records/${record.publicId}`} className="card" style={{ display: "block" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "var(--provly-spacing-provly-base-spacing)" }}>
                  <h3 style={{ font: "var(--typography-provly-title-small)", margin: 0 }}>{record.title}</h3>
                  <span className={record.status === "OPEN" ? "badge badge-open" : "badge badge-closed"}>
                    {record.status.toLowerCase()}
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
