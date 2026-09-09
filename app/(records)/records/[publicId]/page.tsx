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
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--provly-spacing-provly-large-spacing)" }}>
      <Link href="/records" className="btn btn-secondary" style={{ alignSelf: "flex-start" }}>
        Back to records
      </Link>

      <div className="card animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: "var(--provly-spacing-provly-large-spacing)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "var(--provly-spacing-provly-base-spacing)" }}>
          <div>
            <h1 style={{ font: "var(--typography-provly-title-large)", margin: 0 }}>{record.title}</h1>
            <p style={{ font: "var(--typography-provly-body-small)", margin: 0, color: "var(--provly-role-provly-neutral-variant)" }}>
              Record {record.publicId}
            </p>
          </div>
          <span className={record.status === "OPEN" ? "badge badge-open" : "badge badge-closed"}>
            {record.status.toLowerCase()}
          </span>
        </div>

        <div>
          <h3 style={{ font: "var(--typography-provly-title-small)", margin: 0 }}>Notes</h3>
          <p style={{ font: "var(--typography-provly-body-medium)", margin: "var(--provly-spacing-provly-small-spacing) 0 0", whiteSpace: "pre-wrap" }}>
            {record.notes || "No notes provided."}
          </p>
        </div>

        <div style={{ font: "var(--typography-provly-body-small)", color: "var(--provly-role-provly-neutral-variant)" }}>
          Created {new Date(record.createdAt).toLocaleString()}
        </div>
      </div>

      <div>
        <DeleteRecordButton publicId={record.publicId} />
      </div>
    </div>
  );
}
