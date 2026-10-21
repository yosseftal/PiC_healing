# Wave 6 Handoff — The Pivot to Cloud

**Closed tickets:** 12 (`pic-adapter-supabase` standard CRUD), 13 (Atomic Promotion RPC — highest-risk
ticket in the tracer bullet).

**Fixed point:** `main` at `a77e854` (ticket 13's close-out commit).

## Environment deviation (wave-wide, orchestrator-approved)

Both tickets' own text calls for testing "against a local Supabase instance via `supabase start`, not a
mocked client." This sandbox has no Docker/Supabase CLI/direct Postgres connection, so every test in this
wave ran against the Event Manager's **real remote Supabase project** instead — same non-negotiable (real
Postgres/RLS, never mocked), only "local" swapped for "remote." Schema/RPC changes could only be applied by
the Event Manager, manually, via the Supabase SQL Editor — this produced three manual-apply checkpoints
across the wave (ticket 11's carry-over schema gap, ticket 13's initial RPC migration, and a `digest()`
hotfix found on the first real-project run). Every SQL change is a `create table`/`alter table ... add
column if not exists`/`create or replace function` — safe, additive, re-runnable — and lives in its own
migration file; nothing already-applied was edited in place.

## Depcruise status

Zero violations, both packages, re-verified independently by the orchestrator after each ticket closed:

| Package | Modules | Dependencies | Violations |
|---------|---------|--------------|------------|
| `pic-engine` | 63 | 174 | **0** |
| `pic-web` | 286 | 472 | **0** |

## Test suite status

`pic-adapter-supabase`: **23 passed, 5 skipped** (the frozen `RepositoryPort` contract suite's
`promoteGuestToAccount` block — this adapter's own dedicated 7-row matrix + 1 extra covers that ground
instead; see ticket 13's Resolution for why the shared block stays skipped here). Rest of the workspace
(`pic-engine` / `pic-web` / `pic-adapter-local-guest`): unchanged at **109 passed, 5 skipped** — zero
regressions from either ticket.

## Glossary / DEC additions

None. Both tickets implemented already-ratified contracts (`RepositoryPort`, `PromoteGuestToAccountInput`,
`PromoteGuestToAccountIdentityMismatchError` — all ticket 02/Wave 2.5) against already-ratified schema
(ticket 11, DEC-002/005/006/007/009/010/017) — no new domain vocabulary or DEC was needed. `pic-engine` was
Read-Only for this entire wave, by design, and stayed untouched.

## Ticket 03 amendment (test infrastructure only, no schema/behavior change)

`packages/pic-engine/test/contract/repository-port.contract.ts` gained an optional `makeTreatmentId?: () =>
string` factory on `RepositoryPortContractOptions`, defaulting to the original synthetic
`uniqueId("treatment")` (zero behavior change for the fake and `pic-adapter-local-guest`). Needed because
the frozen suite's synthetic treatment ids can't satisfy `pic-adapter-supabase`'s real `uuid` foreign-key
constraint into `treatments` — found and fixed during ticket 12, escalated to and approved by the Event
Manager before landing.

## Should-fix carry-forward

1. **`withInViewNormalized`-shaped DEC-015 boundary normalization is now duplicated in three places**, not
   two: `SessionEngine.normalizeForPermanentStore`, `LocalGuestRepository` (flagged already in the Wave
   5/7 audit, `docs/audits/wave-5-wave-7-audit.md`), and now `SupabaseRepository` (ticket 12). No
   `shared-helpers`-style module exists yet in this repo to consolidate into. Recommend a small, dedicated
   ticket to extract this into a module both adapters (and `SessionEngine`) can import — likely living in
   `pic-engine` itself (both adapters already depend on it for types) rather than a new package, but that's
   a design call for whoever picks up the ticket, not decided here.
2. **`Symptom.rated_at` still has no live Supabase column** (Wave 4/5 audit finding SF-1, carried through
   ticket 12 unresolved — that ticket's own permission table forbade adding migrations). `SupabaseRepository`
   honestly returns `null` always rather than fabricating a value; `GroupEngine.hasPriorRating` therefore
   always reads "never rated" for any symptom loaded through this adapter today. Needs a fast-follow
   migration (`alter table public.symptoms add column if not exists rated_at timestamptz`) before
   Blind-by-Default rating is trustworthy against Supabase.
3. **`pic-adapter-supabase`'s `incrementUseCount` idempotency-key tracking lives inside the `provenance`
   jsonb column** (`_usedIncrementIdempotencyKeys`, namespaced and stripped before any `LibraryRow` is
   returned) rather than a dedicated column — a deliberate ticket-12-era choice made under that ticket's
   own "no new migrations" constraint. Ticket 13's own `promoted_session_ids` (a real `uuid[]` column) shows
   the cleaner pattern once a migration is available; worth reconciling the two mechanisms in a future pass
   rather than carrying both indefinitely.
4. **`pic-adapter-supabase`'s test suite creates real ephemeral Supabase Auth users and `treatments` rows
   per run** (cleaned up in `afterAll`, independently re-verified clean after every run in this wave) —
   this is inherent to testing "real Postgres/RLS, never mocked" against a remote project with no local
   Supabase instance available, not a defect, but worth remembering if this suite ever runs in a shared CI
   environment: it needs real network access and real (test-tier) Supabase credentials, unlike every other
   package's test suite in this repo.
5. **`scripts/wave6-supabase-audit.mjs`** (repo root) is temporary Wave 6 tooling (connectivity + schema +
   RPC-existence + clean-state checks against the remote project) — per its own header comment, delete it
   once this wave's remote-project workflow is no longer needed, or fold its checks into a longer-lived
   script if remote-project testing continues into future waves.

## Not carried forward (already resolved within the wave)

- Ticket 13's own two flagged design points (`auth.uid() = p_new_user_id` authorization model,
  Timeline-event-id reuse of `player_session.id`) were reviewed and explicitly accepted by the Event
  Manager before the RPC migration was applied — see that ticket's Resolution for the full rationale, not
  carried forward as open questions.
