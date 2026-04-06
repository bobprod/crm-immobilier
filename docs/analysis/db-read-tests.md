# DB Read-Only Tests — 2026-01-17

Summary: executed a set of read-only SQL checks against the local Postgres used by the project (via the project's Prisma CLI). All queries executed without errors (Prisma reported "Script executed successfully.").

Context:
- CWD: backend/
- Prisma schema: `prisma/schema.prisma`
- DB: configured via `DATABASE_URL` in `backend/.env`

Commands run (read-only):

1) Connection / current DB and user
```
SELECT current_database() AS db, current_user AS user;
```
Result: Script executed successfully.

2) List first 10 tables in public schema
```
SELECT table_schema, table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name LIMIT 10;
```
Result: Script executed successfully.

3) Row counts (sample tables)
```
SELECT 'provider_configs' AS tbl, COUNT(*) AS cnt FROM provider_configs;
SELECT 'whatsapp_configs' AS tbl, COUNT(*) AS cnt FROM whatsapp_configs;
SELECT 'agency_api_keys' AS tbl, COUNT(*) AS cnt FROM agency_api_keys;
```
Result: Each script executed successfully (no errors). If a table does not exist the command would have returned an error; none did.

Notes and interpretation:
- The Prisma CLI executed the supplied SQL statements via `prisma db execute --stdin --schema=prisma/schema.prisma` from the `backend` folder.
- The commands returned success, which demonstrates the CLI can connect and execute read-only SQL against the configured `crm_immobilier` database.
- The commands above were intentionally non-destructive.

Next steps (optional):
- If you want the actual row counts or query output printed into this file, I can run the same checks using a small Node script (using `pg`) to capture and store the result rows. That requires `pg` to be installed (I can install it locally or add instructions).
- Or I can generate example non-destructive SQL `CREATE VIEW` statements (Option 1) even though the schema inventory showed no mismatches.

Report generated: 2026-01-17
