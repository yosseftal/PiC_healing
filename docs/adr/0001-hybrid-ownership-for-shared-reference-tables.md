---
status: accepted
---

# Hybrid ownership (nullable `user_id`) for tables that mix Global and Personal content

The tracer bullet's `treatments` table needed RLS, but the spec's blanket "every new table gets
`auth.uid() = user_id`" instruction didn't account for `treatments` being a shared seed catalog with
no natural owner — a strictly public table would give it no seam for future EM-authored rows (see
GQ-020's eventual production Treatments Table), while forcing per-user ownership on it today would
hide the shared seed rows from every EM except one and require duplicating rows per signup.

We add a **nullable** `user_id` to `treatments` instead of choosing one extreme: `user_id IS NULL`
marks **Global Content** (system-seeded, shared, read-only to EMs), `user_id = <uuid>` marks
**Personal Content** (an EM's own row). The RLS policy becomes
`using (user_id is null or auth.uid() = user_id)`. Every other new table in this migration
(`player_sessions`, `personal_treatment_library`, `timeline_events`) keeps `user_id not null` with the
strict `auth.uid() = user_id` policy — this hybrid shape is deliberately the exception, not the norm,
reserved for tables that plausibly hold both a shared catalog and EM-owned rows over time.

See `CONTEXT.md` — **Global Content** / **Personal Content** — for the vocabulary this introduces.

## Considered Options

- **Strictly public** (`for select using (true)`, no `user_id` column): simplest today, but bakes in
  "this table is never EM-owned," contradicting the plausible future where EMs add their own
  treatments directly to this table rather than only via the Personal Treatment Library.
- **Strictly owned** (`user_id not null`, standard policy): matches every other table's pattern, but
  makes a shared seed catalog invisible to all but one account, or requires duplicating seed rows per
  signup — an operational hack this ADR exists to avoid needing later.
- **Hybrid, nullable `user_id`** (chosen): supports both today's shared catalog and tomorrow's
  EM-authored rows in the same column, with no future migration required to add the ownership seam.
