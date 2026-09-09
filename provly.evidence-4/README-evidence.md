# Assessment 4 — Evidence index

All captures in this folder. The image files are the UI evidence; the .txt files are
the actual HTTP responses, DB rows, query measurement, and schema/index output.

Screenshots (read top-down for the flow):
01-empty-state-A.png                 genuine empty state for a user with zero records
02-create-form.png                   create record form (title, notes, status cards)
03-list-after-create.png             record now appears in the list (empty state was real)
04-url-state-open.png                ?view=open shows only open records
05-url-state-closed-empty.png         ?view=closed shows "No closed records found"
06-invalid-url-state-safe.png        ?view=DROP%20TABLE renders normally (normalised)
07-record-detail.png                 record detail (title, ref id, status, notes)
08-delete-confirm.png                delete confirmation prompt
09-empty-after-delete.png            list is empty again after deletion (+ audit survives)
10-userB-list.png                    User B's records (different from User A)
11-cross-user-A-accesses-B.png       A opening B's detail URL gets no data

Text evidence:
11-cross-user-403-response.txt       403 actual response (A -> B's record)
12-unauth-401-response.txt           401 actual response (no session)
audit-log-proof.txt                  AuditLog rows; RECORD_DELETED survives deletion
query-count-measurement.txt          measured DB roundtrips (list/detail/create/delete)
index-schema.txt                     live \d "Record" & \d "AuditLog" output + index reasoning
security-test-results.txt            full two-user API status matrix
