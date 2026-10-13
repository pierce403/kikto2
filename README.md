# kik.to  2!!!
fun fun

## Cloudflare migration

The preserved Flask application is the Heroku recovery source. Cloudflare uses
`src/worker.mjs` with Workers Static Assets and a native D1 repository. Builds run
`npm ci --ignore-scripts && npm run build`; deployments run `npm run deploy` through
Cloudflare's native Git integration. No Cloudflare deployment secret belongs in GitHub.

Existing link IDs, private edit keys, URLs, analytics preferences, hit counts and
original timestamps are preserved. Creation uses atomic conflict handling and
cryptographic random IDs; edit keys and destinations are excluded from logs and
HTML responses are not cached. Unknown short links now return a real404 instead
of the old200 error text. Production remains read-only until final reconciliation;
its staging database is independent. `npm test` exercises actual Worker/D1 behavior,
concurrent creation, old edit capability, update and maintenance denial.

Private PostgreSQL recovery copies and exact field/digest comparisons live in the
local migration coordination project, outside this repository. A rollback after
Cloudflare accepts writes requires a frozen, consistent reverse transfer before
re-enabling Heroku writers. Keep recovery deployments and database copies.
