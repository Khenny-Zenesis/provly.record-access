// R4.6 / R4.8 — Shared, dependency-free validation reused by client and server.
// Keep this module free of app-specific imports so both sides can use it, and
// never trust browser-supplied values: the server re-validates everything.

export const RECORD_STATUSES = ["OPEN", "CLOSED"] as const;
export type RecordStatus = (typeof RECORD_STATUSES)[number];

// R4.8 — The conditional list view is driven by URL state. This is the complete,
// closed set of supported values; anything else is normalised to the default.
export const RECORD_VIEWS = ["all", "open", "closed"] as const;
export type RecordView = (typeof RECORD_VIEWS)[number];
export const DEFAULT_RECORD_VIEW: RecordView = "all";

const TITLE_MAX = 120;
const NOTES_MAX = 2000;

export type CreateRecordInput = {
  title: string;
  notes: string;
  status: RecordStatus;
};

export type FieldErrors = Partial<Record<"title" | "notes" | "status", string>>;

export type ValidationResult<T> =
  | { ok: true; data: T }
  | { ok: false; errors: FieldErrors };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

/**
 * Validate a create-record payload coming from the browser (or a direct
 * request). Returns the normalised, safe input or a map of field errors.
 */
export function validateCreateRecord(raw: unknown): ValidationResult<CreateRecordInput> {
  const errors: FieldErrors = {};

  const titleRaw = isRecord(raw) && raw.title !== undefined ? raw.title : "";
  const title = typeof titleRaw === "string" ? titleRaw.trim() : "";
  if (title.length === 0) {
    errors.title = "Title is required.";
  } else if (title.length > TITLE_MAX) {
    errors.title = `Title must be ${TITLE_MAX} characters or fewer.`;
  }

  const notesRaw = isRecord(raw) && raw.notes !== undefined ? raw.notes : "";
  const notes = typeof notesRaw === "string" ? notesRaw.replace(/\r\n/g, "\n").trim() : "";
  if (notes.length > NOTES_MAX) {
    errors.notes = `Notes must be ${NOTES_MAX} characters or fewer.`;
  }

  let status: RecordStatus = "OPEN";
  const statusRaw = isRecord(raw) && raw.status !== undefined ? raw.status : "OPEN";
  if (
    typeof statusRaw === "string" &&
    RECORD_STATUSES.includes(statusRaw as RecordStatus)
  ) {
    status = statusRaw as RecordStatus;
  } else if (statusRaw !== undefined && statusRaw !== null) {
    errors.status = "Status must be OPEN or CLOSED.";
  }

  if (Object.keys(errors).length > 0) {
    return { ok: false, errors };
  }

  return { ok: true, data: { title, notes, status } };
}

/**
 * R4.8 — Safely interpret the URL-state `view` parameter. Only the closed set
 * is accepted; any other value (including a missing or manipulated one) is
 * normalised to the default. The raw value is never passed into a query.
 */
export function parseRecordView(raw: unknown): RecordView {
  return typeof raw === "string" &&
    RECORD_VIEWS.includes(raw as RecordView)
    ? (raw as RecordView)
    : DEFAULT_RECORD_VIEW;
}
