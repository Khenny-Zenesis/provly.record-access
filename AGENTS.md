# Assessment 4 — Records and Access Slice — AGENTS.md

## 1. What is this project

This project is the **Assessment 4 — Records and Access Slice** for the Product Engineering bootcamp.

The goal is to demonstrate that Provly can securely create, list, view, and delete records that belong to the signed-in user.

This is a **single working engineering slice**, not the complete Provly product.

The implementation should demonstrate:

- authenticated users can create records
- users can view only their own records
- users can open a record detail page
- users can delete their own records
- users receive a genuine empty state when they have no records
- list views can be changed using validated URL state
- unauthorized users receive the correct HTTP status
- important actions are recorded in audit logs
- database queries enforce ownership
- appropriate indexes support the main queries
- query counts can be measured and documented
- two different users cannot access each other's records

Do not build features outside the Assessment 4 brief.

---

## 2. What is locked

The following requirements are locked and must not be changed without a clear reason and documentation.

### Core flow

The required flow is:

**Sign in → Records list → Create record → Record detail → Delete record**

The records list must also support the required URL-state conditional view.

### Security

Ownership must be enforced on the server and in database queries.

Every record query that operates on user-owned data must include the authenticated user's ownership condition.

Do not:

- fetch a record only by its ID and check ownership afterward
- trust a user-supplied user ID
- expose another user's record through a detail route
- allow another user to delete a record they do not own

### IDs

Do not expose raw database IDs in user-facing URLs where the assessment requires a safe public identifier.

Use a safe public identifier such as a generated UUID/public ID.

Internal database IDs must remain internal.

### Authentication and authorization

Protected routes must require authentication.

Use:

- **401 Unauthorized** when the request has no valid authenticated user
- **403 Forbidden** when an authenticated user is not permitted to perform the requested action

Do not return a generic success response for unauthorized access.

### Audit logging

Important record actions must create audit log entries.

At minimum, record the relevant action, actor/user, target record reference, and timestamp.

Audit logs must survive record deletion where required by the data model.

Do not make the audit record disappear simply because the user deletes the original record.

### Validation

Client-side validation may improve the experience, but server-side validation is mandatory.

Never trust data supplied by the browser.

Validate:

- record creation input
- route parameters
- URL-state/filter values
- delete requests
- authenticated user context

### Empty state

The records list must have a **genuine empty state**.

Do not use fake placeholder records simply to make the screen look populated.

When a new user has no records, the UI should clearly explain that there are no records yet and provide the appropriate next action.

### URL state

Conditional list views must use URL state.

URL parameters must be validated against an allowed set of values.

Invalid values must not be blindly passed into queries or UI logic.

### Database

Use proper relationships between users, records, and audit logs.

Add indexes that support the actual queries used by the application.

Do not add random indexes without a query/use-case reason.

### Scope

Do not add:

- payments
- new AI functionality
- chat
- notifications
- team collaboration
- advanced analytics
- landing pages
- unrelated dashboards
- extra product features

unless explicitly required by the assessment.

---

## 3. What must never happen

### Never trust the client

The browser must never decide which user owns a record.

Bad:

```ts
const userId = body.userId;
```

Good:

```ts
const userId = session.user.id;
```

The authenticated session determines the current user.

### Never query owned records without ownership

Bad:

```ts
db.record.findUnique({
  where: { publicId }
});
```

Better:

```ts
db.record.findFirst({
  where: {
    publicId,
    userId: session.user.id,
  },
});
```

The ownership condition belongs in the database query.

### Never leak another user's record

If User A requests User B's record, the application must not return the record data.

Test this deliberately with two different users.

### Never use hidden authorization in the UI

Hiding a delete button is not authorization.

The server must still reject unauthorized deletion.

### Never expose raw database IDs

Do not put internal IDs into:

- URLs
- client-side objects when unnecessary
- public API responses when unnecessary
- screenshots intended as evidence

Use the record's public identifier instead.

### Never confuse 401 and 403

- No valid authentication → **401**
- Authenticated but not allowed → **403**

Document and test both cases where applicable.

### Never skip server validation

A form looking valid in the browser does not make the request safe.

All important validation must happen on the server.

### Never fake an empty state

Do not insert fake records just to demonstrate the UI.

The empty state must come from a real query returning zero records.

### Never trust URL parameters

Only allow documented values.

Invalid URL state should be rejected or safely normalized according to the implementation decision documented in `DOCUMENTATION.md`.

### Never delete the audit trail accidentally

Deleting a record must not silently remove required evidence that the action happened.

Design the database relationship appropriately.

### Never claim performance without measuring it

If the documentation says a query uses a certain number of database calls, measure it.

Do not guess query counts.

### Never add scope because it is easy

The purpose of this assessment is to prove the required engineering concepts.

A smaller, secure, well-documented slice is better than a larger unfinished application.

---

## 4. How work is arranged

Keep the project structure simple and predictable.

Suggested structure:

```text
/
├── app/
│   ├── (records)/
│   │   ├── records/
│   │   │   ├── page.tsx
│   │   │   ├── new/
│   │   │   │   └── page.tsx
│   │   │   └── [publicId]/
│   │   │       └── page.tsx
│   │   └── ...
│   │
│   └── api/
│       └── records/
│           ├── route.ts
│           └── [publicId]/
│               └── route.ts
│
├── lib/
│   ├── records/
│   │   ├── queries.ts
│   │   ├── mutations.ts
│   │   ├── ownership.ts
│   │   └── audit.ts
│   │
│   ├── validation/
│   │   └── records.ts
│   │
│   └── db/
│       └── ...
│
├── prisma/
│   ├── schema.prisma
│   └── migrations/
│
├── public/
│
├── .env.example
├── AGENTS.md
├── DOCUMENTATION.md
├── package.json
└── ...
```

The exact framework structure may differ slightly if the existing project requires it, but the responsibilities should remain separated.

### Route responsibilities

Pages should primarily handle:

- rendering
- collecting user input
- displaying loading/error/empty states
- calling the appropriate server functionality

API/server code should handle:

- authentication
- authorization
- validation
- database operations
- audit logging
- status codes

### Database responsibilities

The database layer should contain:

- User relationship
- Record model
- Audit log model
- public identifiers
- indexes
- appropriate foreign-key relationships

### Validation responsibilities

Keep record validation in a shared validation module where practical.

The same schema should be reusable by the client and server when appropriate.

---

## 5. How code should look

### Prefer simple code

Write code that can be explained during the defence.

Avoid unnecessary abstractions.

A reviewer should be able to understand:

1. who the current user is
2. how the record is found
3. where ownership is enforced
4. where validation happens
5. where the audit log is created
6. what response/status is returned

### Ownership should be obvious

Prefer:

```ts
where: {
  publicId,
  userId: session.user.id,
}
```

over fetching broadly and performing authorization later.

### Keep authorization close to the data operation

The code responsible for deleting a record should verify ownership as part of the delete operation or immediately through a secure transaction/query strategy.

### Use meaningful names

Prefer:

- `publicId`
- `userId`
- `recordId`
- `auditLog`
- `recordStatus`
- `view`

Avoid unclear names such as:

- `x`
- `thing`
- `data2`
- `temp`

unless genuinely temporary and local.

### Handle errors deliberately

Do not expose database errors directly to users.

Return a safe application error and log useful debugging information on the server.

### Use correct HTTP responses

Examples:

```text
201 Created
200 OK
204 No Content
400 Bad Request
401 Unauthorized
403 Forbidden
404 Not Found
```

Use the status that accurately represents the outcome.

### Do not over-fetch

Only retrieve the fields required by the screen or operation.

This also makes query-count and performance reasoning easier.

### Measure query counts

When demonstrating query efficiency, use a deliberate measurement method and document:

- what action was measured
- how it was measured
- number of database queries observed
- why that number is acceptable

---

## 6. Design tokens

Provly's existing design system is the source of truth.

Do not introduce random spacing, colors, typography, shadows, or radii when an existing token is appropriate.

### Typography

Provly uses:

- **Space Grotesk** for display/title roles
- **Inter** for body/supporting UI roles

Existing title scale includes:

- Title Large: 32px
- Title Medium: 22px
- Title Small: 20px

Use the existing project typography tokens where available.

### Spacing

Existing spacing system:

```text
No Spacing: 0
Extra Small: 4
Small Spacing: 8
Medium Spacing: 12
Base Spacing: 16
Large Spacing: 24
Extra Large: 32
2X Large: 40
3X Large: 48
4X Large: 64
```

### Shadows

Existing Provly shadow system:

```text
Shadow / Soft
X: 0
Y: 2
Blur: 8
Spread: 0
Black opacity: 8%

Shadow / Medium
X: 0
Y: 4
Blur: 16
Spread: 0
Black opacity: 12%

Shadow / Hard
X: 0
Y: 6
Blur: 20
Spread: 0
Black opacity: 16%
```

### Border radius

Use the existing radius system, including:

```text
Small: 4
Medium: 8
Large: 12
Extra Large: 16
Full / Pill: 999
```

### General design rule

The Assessment 4 UI should look like the same Provly product as the earlier slices.

Do not redesign the entire visual system for this assessment.

---

## 7. What counts as done

Assessment 4 is done only when all of the following are true.

### Functionality

- [ ] Authenticated user can view records
- [ ] Authenticated user can create a record
- [ ] Authenticated user can open a record detail
- [ ] Authenticated user can delete their own record
- [ ] Empty state appears when there are no records
- [ ] URL-state conditional view works
- [ ] Invalid URL state is handled safely
- [ ] Loading/error states are honest and usable

### Security

- [ ] Every owned-record query includes ownership
- [ ] Raw database IDs are not exposed where prohibited
- [ ] Unauthenticated requests return 401 where appropriate
- [ ] Authenticated-but-forbidden requests return 403 where appropriate
- [ ] Users cannot view another user's record
- [ ] Users cannot delete another user's record
- [ ] Delete authorization is enforced on the server
- [ ] Server validation exists
- [ ] Protected routes are actually protected

### Auditability

- [ ] Required record actions create audit logs
- [ ] Audit logs contain the required actor/action/time information
- [ ] Audit history survives record deletion where required
- [ ] Audit behavior is demonstrated in evidence

### Database

- [ ] User-record relationship is correct
- [ ] Audit-log relationship is correct
- [ ] Public identifier exists where required
- [ ] Appropriate indexes exist
- [ ] Index choices are explained
- [ ] Main query count has been measured

### Testing

- [ ] Test with User A
- [ ] Test with User B
- [ ] User A cannot access User B's record
- [ ] User B cannot access User A's record
- [ ] Unauthorized delete is rejected
- [ ] Empty state is tested with a user who has zero records
- [ ] Invalid URL-state values are tested
- [ ] Important success and failure cases are captured as evidence

### Documentation

- [ ] `DOCUMENTATION.md` follows the required eight-section submission format
- [ ] Concepts are explained in the required question format
- [ ] At least three real problems encountered are documented
- [ ] Evidence screenshots are included
- [ ] Query measurement is documented
- [ ] Security testing is documented
- [ ] No secrets are committed
- [ ] `.env.example` is present
- [ ] Incremental commits are present
- [ ] Every file can be explained during the defence

---

## 8. What to do when unsure

Use this order:

### 1. Check the assessment brief

The assessment brief is the highest-level scope contract.

If a feature is not required, do not automatically add it.

### 2. Check `DOCUMENTATION.md`

The implementation and documentation should agree.

If the documentation says something is implemented, verify that it actually exists.

### 3. Check existing Provly patterns

Reuse the established:

- authentication approach
- validation approach
- database conventions
- typography
- spacing
- component patterns

Do not create a second competing pattern without a reason.

### 4. Choose the simplest secure implementation

When two approaches satisfy the requirement, prefer the one that:

- is easier to explain
- has fewer moving parts
- makes authorization obvious
- is easier to test
- does not add scope

### 5. Document meaningful decisions

If a technical decision matters to the assessment, record:

- what you chose
- why you chose it
- what trade-off it creates

### 6. Ask before changing locked requirements

If a change affects:

- ownership model
- authorization
- database relationships
- public identifiers
- audit behavior
- indexes
- query behavior
- assessment scope

stop and verify before changing it.

---

## 9. Self-check

Before considering Assessment 4 complete, run this checklist.

### Security self-check

```text
[ ] What happens when I am not signed in?
[ ] What happens when User A requests User B's record?
[ ] What happens when User A tries to delete User B's record?
[ ] Is ownership included in the database query?
[ ] Can a raw database ID be discovered from the URL or response?
[ ] Are 401 and 403 used correctly?
```

### Data self-check

```text
[ ] Does every record belong to a user?
[ ] Does every important action create the required audit log?
[ ] Does the audit log survive record deletion?
[ ] Are public identifiers used where required?
[ ] Are indexes based on real query patterns?
```

### Validation self-check

```text
[ ] Is record input validated on the server?
[ ] Are route parameters validated?
[ ] Are URL-state values validated?
[ ] Can malformed requests reach the database?
```

### Query self-check

```text
[ ] Have I measured the important query?
[ ] Do I know how many database calls it makes?
[ ] Can I explain why that query count is acceptable?
[ ] Can I explain why each index exists?
```

### Product self-check

```text
[ ] Is the empty state genuine?
[ ] Does the UI match Provly's existing design system?
[ ] Are success and failure states clear?
[ ] Is the flow small enough for the assessment?
[ ] Did I avoid unrelated features?
```

### Defence self-check

You should be able to explain, without reading the code:

1. How ownership is enforced.
2. Why a user cannot access another user's record.
3. The difference between 401 and 403.
4. Why raw database IDs are not exposed.
5. How audit logs work.
6. Why audit logs survive deletion.
7. How URL state is validated.
8. Why the database indexes were chosen.
9. How query count was measured.
10. How you tested the system with two users.

If you cannot explain one of these, stop and understand the implementation before submitting.

---

## Final rule

**Build only what the assessment asks for, make ownership and authorization impossible to misunderstand, measure what you claim, document real problems, and make sure you can explain every important decision during the defence.**
