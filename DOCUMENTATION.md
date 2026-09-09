# Assessment 4 — Records and Access Slice — Documentation

Scope contract: a single, secure data-access slice. A signed-in user creates a record, sees their own records in a list, opens a single record detail, and deletes a record they own — with ownership enforced in the database, correct 401/403/404 behaviour, an audit log that survives deletion, validated URL state, and measured queries. Nothing else (no editing, search, tags, sharing, collaboration, comments, dashboards, analytics, CRM). Extra scope is graded as a failure, so none of it is present.

---

## Section 1: What This Is

The Records and Access Slice for Provly. It proves that Provly can securely create, list, view, and delete records that belong to the signed-in user, and that a user can never see or touch another user's record.

It is the same product family as the earlier slices — same authentication (Assessment 1 cookie sessions), same Prisma/PostgreSQL stack, same Provly design tokens — but it is a **standalone project** (it does not share a live connection to Assessments 1-3; the reused auth files are copied in, like the previous slices).

The flow is exactly:

**Sign in → Records list → Create record → Record detail → Delete record**

with a conditional list view driven by validated URL state added on top.

The records being managed are conceptually a tradesperson's job records (title, notes, status). The point of the assessment is not job-specific feature work; it is the ownership, authorization, audit, and querying of signed-in user data.

---

## Section 2: How To Run It

1. Clone the repo, then `npm install`.
2. Provide a local `.env` (never `.env.example`) with a PostgreSQL connection:

   ```
   DATABASE_URL=postgresql://postgres:postgres@localhost:5433/provly_records
   ```

   `.env.example` holds only a commented placeholder; no real values are committed.
3. Create the tables (needs `DATABASE_URL`):

   ```
   npx prisma migrate dev
   npx prisma generate
   ```

4. Run the app: `npm run dev` (defaults to `http://localhost:3000`; it will pick the next free port if taken).
5. Open the app, create an account (`/signup`), and land on `/records`.

Verified clean:

```
npm run typecheck
npm run build
```

Database used locally: a `provly-postgres` PostgreSQL container on host port `5433`, database `provly_records`.

---

## Section 3: The Flow, Step By Step

**Authentication.** Signup (`/signup`) calls `POST /api/auth/signup` (Assessment 1 logic) which hashes the password with bcrypt, creates the `User` and a `Session` row, and sets an httpOnly cookie holding an opaque token. Sign-in requires a matching bcrypt hash. The cookie value is meaningless on its own — the authoritative session is the `Session` row, so signing out is just deleting that row.

**Records list.** `/records` is a protected server page. It reads the `view` URL-state parameter, validates it against the closed set `all | open | closed` (normalising anything else to `all`), then calls `listRecordsForUser(user.id, view)`. That query is `WHERE userId = ? ... ORDER BY createdAt DESC` — ownership is in the database query, so a user only ever receives their own rows. When the result is empty the page renders a **genuine empty state** driven by the zero-row query result, with an action to create the first record.

**Create record.** `/records/new` posts to `POST /api/records`. The server re-validates the body (title required / length-capped, notes length-capped, status in the enum) and rejects anything malformed with `400`, even if called directly without the UI. On success it creates the `Record` and a `RECORD_CREATED` audit entry in a single transaction, returning `201` with the record's opaque `publicId`.

**Record detail.** `/records/[publicId]` reads the record by `({ userId, publicId })` in one query (`getOwnedRecord`). Only the owner's record is returned. The route renders the detail and a delete action requiring confirmation.

**Delete record.** The confirm dialog calls `DELETE /api/records/[publicId]`. `deleteRecord` verifies the record exists (else `404`) and that the authenticated user is its owner (else `403`), writes a `RECORD_DELETED` audit entry and removes the row in one transaction, and returns `204`. The audit entry survives because `AuditLog` does not reference `Record`.

**Conditional list view (URL state).** The list is toggled by `?view=open|closed|all`. On the server the value is validated/normalised before it is ever used in a query; a manipulated value (e.g. `?view=DROP%20TABLE`) is safely normalised to `all` and never reaches the database.

---

## Section 4: The Data Model

**User** — reused from Assessment 1 (email unique, passwordHash, timestamps) so the copied auth has a real user to operate on.

**Session** — reused from Assessment 1. One row per signed-in session; an opaque `token @unique` plus `expiresAt`, related to `User` with `onDelete: Cascade`.

**Record** — the owned entity.
- `id` (`cuid`): internal identity, never exposed.
- `publicId` (`uuid`, default random): the opaque public identifier used in every URL and API response (R4.2). Internal IDs never reach the client.
- `title`, `notes`, `status` (`RecordStatus` enum: OPEN/CLOSED).
- `userId` + `user` relation: the owning user (R4.5). `onDelete: Cascade`.
- `@@unique([userId, publicId])`: the **ownership access index** (R4.1/R4.11). The detail/delete path resolves directly by `(userId, publicId)` in a single query — no fetch-then-filter, no way to address a record without its owner.
- `@@index([userId, createdAt(sort: Desc)])`: the **list index** (R4.11), supporting `WHERE userId = ? ORDER BY createdAt DESC`.
- `publicId` is unique **per owner**, not globally. This is deliberate: we never look a record up by `publicId` alone — every query pairs it with the authenticated `userId` — so scoping uniqueness to the owner is sufficient and is exactly the ownership index the brief asks for. Trade-off: two users could theoretically hold the same `publicId` value, but since access is always owner-scoped that collision is harmless.

**AuditLog** — the evidence log (R4.4).
- `action` (`RECORD_CREATED` / `RECORD_DELETED`), `actorUserId` (FK to `User`), `recordPublicId` (string), `recordTitle` (nullable snapshot), `createdAt`.
- **Deliberately has no relation to `Record`.** The target is stored as a plain string `publicId` plus a title snapshot. This is what makes the audit survive deletion (Trap 6): deleting a `Record` cannot cascade-delete its evidence, because `AuditLog` does not reference it. The actor is kept via FK to `User` so the agent remains attributable.
- `@@index([actorUserId, createdAt(sort: Desc)])`: supports "show me this actor's trail, newest first."

**Why `publicId` per-owner uniqueness is safe.** A raw database `id` is never in a URL or response; the composite unique `(userId, publicId)` is the only index the detail/delete query can use, which means ownership is structurally part of access rather than a post-hoc check.

---

## Section 5: The Concepts

### Authentication vs. Authorization

**What it is.** Authentication answers "who are you?"; authorization answers "are you allowed to do this?"

**Why it is needed, with a concrete failure case.** A signed-in user (User A) is authenticated, but that says nothing about the URL they type next. If User A changes a record identifier in the URL to User B's record, authentication still succeeds — the request is coming from a valid session. Authorization is the check that must fail: the record belongs to someone else. Without separate authorization, "you are signed in" would be mistaken for "you can read anything," which is exactly how cross-user data leaks happen.

**How it was implemented.** Authentication is `getSessionUser()` in `lib/auth/session.ts`, used at the top of every records route. Authorization is `ownedRecordFilter(user.id, publicId)` in `lib/records/ownership.ts`, used inside `getOwnedRecord` and `deleteRecord`. The userId comes only from the session, never from the request body (R3: `const userId = session.user.id`, not `body.userId`).

**What alternative was rejected.** Trusting a `userId` from the request body or from an URL param. The browser must never decide who owns a record.

### Query Scoping (owning the query, not the result)

**What it is.** Putting the owner condition inside the database query itself: `WHERE userId = ? AND publicId = ?`.

**Why it is needed, with a concrete failure case.** Fetching a record by `publicId` and then checking `if (record.userId !== user.id)` afterward is a real, well-known flaw: the unauthorised row is already returned to the application (and could be logged, cached, or leaked by a later mistake), and a bug in the post-check silently drops the protection. The ownership condition must be part of the query so an unauthorised record is never returned in the first place.

**How it was implemented.** The exact query in `lib/records/queries.ts`:

```ts
prisma.record.findFirst({
  where: { userId, publicId },   // both predicates, in the query
  ...
})
```

The `userId` comes only from the authenticated session. Deleting uses the same condition: `deleteRecord` only ever sets `where: ownedRecordFilter(userId, publicId)`.

**What alternative was rejected.** `findUnique({ where: { publicId } })` then a separate ownership test. Rejected because it returns data before authorization and splits the security decision from the data operation.

### 401 vs. 403

**What it is.** Two different failure responses: `401 Unauthorized` = no valid session; `403 Forbidden` = a valid session, but the actor is not allowed to perform the action.

**Why it is needed, with a concrete failure case.** A user who is simply not signed in, and a signed-in user probing another user's record, are materially different situations. If a caller can't distinguish them, a signed-in user attacking another user's data gets the same "not found / you can't" signal as an anonymous request — which both hides the real access-control boundary and makes it impossible to test that authorization (rather than just authentication) is working. PRD Trap 4 explicitly warns against returning 404 for every failure.

**How it was implemented.** In `app/api/records/[publicId]/route.ts`: no session → `401`; session present but the record exists for another user → `403`; record does not exist → `404`.

```ts
const user = await getSessionUser();
if (!user) return 401;
const record = await getOwnedRecord(user.id, publicId);
if (record) return 200;
const exists = await recordExists(publicId);
return exists ? 403 : 404;
```

**What alternative was rejected.** Collapsing everything into one status (or returning 404 for all failures). Rejected because the assessment explicitly differentiates these and tests both.

### Opaque / Public Identifiers

**What it is.** Using a generated UUID (`publicId`) in URLs and responses instead of the database's sequential `id`.

**Why it is needed, with a concrete failure case.** Internal IDs are sequential (`…/records/17`). They leak how many records exist, are trivially enumerable (guess `18`, `19`, …), and make it easy to target "the next record" when probing another user's data. An opaque identifier removes any ordering or enumeration signal.

**How it was implemented.** `Record.publicId` defaults to `uuid()`. All URLs and API responses use it; the `cuid` `id` is never serialised to the client. `lib/records/queries.ts` selects only `publicId`, `title`, `status`, `createdAt`.

**What alternative was rejected.** Exposing the numeric internal id. Rejected for the enumeration and information-leak reasons above.

### Audit Logging That Survives Deletion

**What it is.** An append-only evidence log recording who did what, to which record, when — independent of whether the record still exists.

**Why it is needed, with a concrete failure case.** A delete destroys the record. If the only place the audit lived referenced that record (e.g. a FK with `onDelete: Cascade`), deleting the record would also delete the evidence — the exact thing the assessment forbids. Then there would be no record that a deletion ever happened.

**How it was implemented.** `AuditLog` has a FK to the actor `User` but **no relation to `Record`**. It stores `recordPublicId` and a `recordTitle` snapshot as plain values. Create and delete write their audit entry inside the same transaction as the data change; for delete, the audit row is written *before* the row is removed.

**What alternative was rejected.** A `Record`-FK with `onDelete: SetNull` or `Cascade`. `Cascade` destroys evidence; `SetNull` keeps the row but loses the target identification. Storing the target as a value is what guarantees the evidence stays meaningful after deletion.

### Database Indexes

**What it is.** A secondary structure the database uses to find rows without a full table scan — a trade of extra write/storage cost for faster reads.

**Which query it improves, and why it exists.**
- `Record @@unique([userId, publicId])` — supports the detail/delete lookup `WHERE userId = ? AND publicId = ?`. There is no point looking a record up without its owner, so this composite unique is effectively the access path index.
- `Record @@index([userId, createdAt(sort: Desc)])` — supports the list `WHERE userId = ? ORDER BY createdAt DESC`.
- `AuditLog @@index([actorUserId, createdAt(sort: Desc)])` — supports "this actor's trail, newest first."

**The cost / trade-off.** Every index costs storage and slows writes (each INSERT/UPDATE/DELETE must maintain the extra structure) and adds memory pressure. That is acceptable here because reads far outnumber writes in this slice. Crucially, the list index is **descending on `createdAt` to match the query's `ORDER BY ... DESC`**, so the query is answered from the index ordering rather than a sort step. No index was added without a query that uses it.

### Query Counts and Optimisation

**What it is.** Counting the database roundtrips each flow makes, then removing unnecessary ones.

**How it was measured.** I temporarily enabled Prisma `log: ['query']`, restarted the dev server, drove each endpoint once, and counted the `prisma:query` lines emitted for that request. The shipped code has query logging turned off.

**Results (roundtrips per endpoint):**

| Endpoint | Roundtrips | Notes |
|----------|-----------:|-------|
| `GET /api/records` (list) | 3 | 2 auth + 1 list |
| `GET /api/records/:publicId` (detail) | 3 | 2 auth + 1 record |
| `POST /api/records` (create) | 6 | 2 auth + BEGIN + 2 inserts + COMMIT |
| `DELETE /api/records/:publicId` (delete) | 8 | 2 auth + 1 existence + [BEGIN + SELECT + INSERT + DELETE + COMMIT] |

**Why this is acceptable.** The constant `2` auth queries is Prisma's cost for `getSessionUser()`'s relation include (a Session lookup then a User fetch) — it is the same in every request regardless of how many records a user owns. The transaction roundtrips (`BEGIN`/`COMMIT`) are what guarantee data+audit atomicity (R4.4). delete's extra existence query runs only on the failure path and exists solely to return a genuine `403` vs `404` (R4.3). There is no N+1: the list is one query, not one-per-row.

### URL State

**What it is.** A conditional list view encoded in the query string (`?view=open`) so it is shareable, bookmarkable, and survives navigation/back.

**Why it is needed, with a concrete failure case.** URL state is user-controlled input. Without validation, someone could pass `?view=OPEN'; DELETE FROM "Record"; --` and, if the value were interpolated into a query, break out of the filter. Even without injection, a nonsense value should not silently produce wrong results.

**How it was implemented.** `lib/validation/records.ts` defines the closed set `["all","open","closed"]`. `parseRecordView` accepts only those; anything else is normalised to `all`. The API route (`GET /api/records`) calls `listRecordsForUser(user.id, view)` where `view` is the validated/normalised value — the raw string never reaches Prisma. Tested with `?view=DROP%20TABLE` → `200` with a normalised `all` result, no error and no query hit.

**What alternative was rejected.** Trusting the raw param, or reflecting it back to the user. Rejected because the value is used at the query boundary.

### Ownership vs. Filtering

**What it is.** The difference between hiding another user's rows in the UI (filtering) and refusing to return them in the database (ownership).

**Why it is needed, with a concrete failure case.** If the only "protection" is that the list component filters by the current user, the data is still fully accessible by calling the API directly — the frontend is not a security boundary. The database query itself must enforce ownership so that even a direct call returns only the caller's rows.

**How it was implemented.** The list (`listRecordsForUser`), detail (`getOwnedRecord`) and delete (`deleteRecord`) all put `userId` in the `where` clause. The delete endpoint re-checks ownership server-side even though the UI could try to hide the button (R4.9) — hiding a button is not authorization.

**What alternative was rejected.** UI-only filtering, and the classic fetch-then-check pattern.

---

## Section 6: Real Problems Hit While Building

### Problem 1 — Test data made automated verification misleading (409 → 401 cascade)

- **Symptom:** Running the automated security checks returned a confusing mix of `409`, `401`, and `308` responses instead of the expected `201`/`200`/`403`. `signup` said "Email already registered" for accounts that looked new, and then every subsequent request returned `401`, and detail/delete URLs returned `308 /api/records`.
- **Investigation:** Checked the request bodies, the cookie jars, and the session handling. The `308` responses were the giveaway: the record `publicId` in those URLs was empty, so the server was redirecting `/api/records/` (empty segment) to `/api/records`. Tracing back, the `publicId` was empty because the create request that should have returned it had returned `401` — and it returned `401` because the `WebRequestSession` had no cookie.
- **Dead ends:** I first suspected a bug in the API (missing session on creates, wrong routing on detail/delete). Re-reading the route handlers showed no such bug — every route correctly returned `401` when there was no valid session.
- **Cause:** Leftover accounts from an earlier ad-hoc `curl` run were still in the database. Those accounts already existed, so signup correctly returned `409`, which meant **no new session cookie was set** for that test client. With no cookie, every later request correctly returned `401`, and the failed creates left no record to derive a `publicId` from. The test harness and the database were out of step — I had not reset the data to a known-clean state before asserting deterministic results.
- **Fix:** Reset the database to a clean state (`TRUNCATE "AuditLog", "Record", "Session", "User" RESTART IDENTITY CASCADE`) and restart the dev server (the in-memory signup rate-limit also had to be cleared) so the test ran against a known base. After that, all checks returned the expected statuses.

(The same cause bit a real user: while I was resetting the database, one of the truncations deleted an account someone had just created in the browser, so a later sign-in correctly returned "Invalid email or password" — the account was genuinely gone. The fix is the same behaviour: the data must be in a known state before relying on test evidence.)

### Problem 2 — Audit trail could be destroyed by record deletion

- **Symptom:** Designing the schema, the natural approach was a `AuditLog.recordId` relation to `Record` — but that made the audit evidence disappear the moment the record was deleted, which directly violates R4.4 and PRD Trap 6.
- **Investigation:** I evaluated the relationship options: a plain FK to `Record`, and an FK with `onDelete: Cascade` versus `SetNull`.
- **Dead ends:** I briefly considered keeping the relation and just accepting that the audit row's `recordId` would be nulled on delete. That preserves the row, but loses the very thing the audit is meant to prove — which record was affected — so it is a semantically broken audit.
- **Cause:** An audit that references the audited row with an `ON DELETE` action is structurally fragile. A `Cascade` removes evidence; a `SetNull` or plain FK loses or constrains the target identity after deletion.
- **Fix:** Design `AuditLog` with **no relation to `Record`**. It stores the target as a plain string `recordPublicId` plus a `recordTitle` snapshot, and relates only to the actor `User`. Deleting a `Record` therefore cannot touch the audit row. Verified directly: after `DELETE /api/records/:publicId` returned `204` and a follow-up `GET` returned `404`, the `RECORD_DELETED` audit row for that `publicId` was still present with actor, target id, title snapshot, and timestamp.

### Problem 3 — Distinguishing 403 from 404 costs an extra query

- **Symptom:** The detail and delete routes needed to return `403` for a record that belongs to another user and `404` for one that does not exist (R4.3 / Trap 4) — but the ownership-scoped query was returning an empty result for both cases.
- **Investigation:** The ownership query `WHERE userId = ? AND publicId = ?` is correct and safe, but when it returns nothing there is no way to know whether the record is absent entirely or present but owned by someone else.
- **Dead ends:** I considered returning `403` for every scoped miss. That would be safe, but it would also return `403` for a genuinely non-existent record — semantically wrong and exactly what Trap 4 warns about.
- **Cause:** These are genuinely two different outcomes that a single owner-scoped query cannot distinguish without more information.
- **Fix:** Added a small `recordExists(publicId)` check (`lib/records/queries.ts`), used only on the failure path: if the owner-scoped query returns nothing and the record exists for someone else → `403`; if it does not exist at all → `404`. This adds one query on the failure path only — a successful detail or delete is unaffected. It is documented in the query-count measurement (delete = 8 roundtrips, up from 7, purely on the failure path) and is the deliberate price of a correct 403/404 distinction.

---

## Section 7: What This Slice Does Not Handle

**No record editing, search, tags, sharing, or collaboration.** The record has title/notes/status and nothing else. This is a scoping/ownership slice, not the jobs feature.

**Rate limiting and user sessions are in-memory/single-process.** As in Assessment 1, the in-memory rate limiter resets on restart and would need a shared store before running horizontally. The session model is server-side and already revocation-friendly, but there is no session expiry job; expired sessions are cleaned lazily on access.

**The empty state is driven by the query, not hardcoded** — but the empty state is only reachable/knowable for a user who actually has zero records; no seed data or demo accounts are shipped.

**The `AuditLog` is not exposed through a UI.** Evidence of audit behaviour is captured by direct database inspection rather than a user-facing audit screen, because the assessment screens are exactly the five listed and adding an audit page would be scope creep.

**No automated test suite.** Verification was manual: direct database inspection, deliberately driving each endpoint as two different users, replaying URL-state and cross-user cases. There is no re-runnable automated suite; see Section 8.

**Evidence is captured as plain text outputs (HTTP statuses + DB rows), not screenshots.** The capture files are in `provly.evidence-4/` and reference the exact responses and database rows; browser screenshots have to be taken from the running app by the author before submission.

---

## Section 8: If I Built This Again

The single biggest thing I would do differently is introduce a **re-runnable end-to-end test script** that (a) resets the database, (b) clears the in-memory rate limit, and (c) drives the whole two-user matrix from a clean start — instead of the PowerShell harness I used. Problem 1 happened precisely because asserting deterministic results against data I had not reset is unreliable, and that exact confusion (409/401/308 cascade) cost real time. A `seed`/`reset` script plus one test command would have made the evidence reproducible and the "invalid credentials" surprise impossible.

Beyond that, I would keep the audit-survives-deletion design (Problem 2) and the 403/404 existence check (Problem 3) as-is — both came out of real requirements rather than convenience. If the empty state and URL-state cases are the graded focus, I would also add a tiny set of unit tests around `parseRecordView` (the validate-and-normalise boundary), since that is pure logic, easy to test, and exactly where a manipulated URL-state value would otherwise slip through.
