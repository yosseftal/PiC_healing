# 12 — `pic-adapter-supabase` — standard CRUD methods

**What to build:** every `RepositoryPort` method **except** `promoteGuestToAccount`, implemented against
real Supabase Postgres/Auth, always scoped by `auth.uid()`.

**Blocked by:** 02 (`RepositoryPort` + domain types), 03 (fake port + contract suite), 11 (Supabase schema
migration).

**Status:** done

**Source:** `docs/specs/tracer-bullet-happy-path.md` §A, Testing Decisions ("Contract tests, run against
both adapters" — "the latter against a local Supabase instance via `supabase start`, not a mocked client").

## Objective

> `pic-adapter-supabase` — implements `RepositoryPort` against Supabase Postgres/Auth, always scoped by
> `auth.uid()`.

This ticket proves the port contract and shared contract suite hold against a real Postgres/RLS setup
before the highest-risk piece (the promotion RPC, ticket 13) is layered on top.

## Definition of Done

- Implements `getGroup`, `saveGroup`, `getPlayerSession`, `savePlayerSession`, `getOrCreateLibraryRow`,
  `incrementUseCount`, `appendTimelineEvent` against the tables from ticket 11, using the Supabase JS
  client.
- Every query relies on RLS (`auth.uid() = user_id`) as the enforcement layer — do not add manual
  client-side `user_id` filtering as the *only* guard; the database policy from ticket 11 is the real
  boundary, matching the existing migration's pattern.
- `promoteGuestToAccount` on this adapter is an explicit, clearly-labeled stub (e.g. throws `"not
  implemented — see ticket 13"`) — this ticket does not implement the RPC call itself.
- The shared contract-test suite from ticket 03 is run against this adapter, against a **local Supabase
  instance started via `supabase start`** — not a mocked client — all green except the
  `promoteGuestToAccount`-specific assertions (deferred to ticket 13).

## Do Not Touch / Out of Scope

- Do not implement `promoteGuestToAccount` — ticket 13 exclusively owns the RPC and its wiring here.
- Do not implement or modify the schema migration itself — ticket 11.
- Do not add any UI code.
- Do not add manual application-level authorization checks that duplicate RLS — trust the policy from
  ticket 11 as the single enforcement point, per the existing migration's own pattern.

## Testing Requirement — Test-First Acceptance Criteria (run against local Supabase, not mocked)

- [ ] `it('getOrCreateLibraryRow creates and returns a row scoped to auth.uid()')`
- [ ] `it('incrementUseCount is idempotent under retry against the real table')`
- [ ] `it('appendTimelineEvent never mutates or removes prior events in the real table')`
- [ ] `it('a query for another user\'s data returns empty due to RLS, never an error that leaks
      existence')`

## Acceptance Criteria

- [x] All seven non-promotion `RepositoryPort` methods are implemented against real Supabase.
- [~] The shared contract suite passes against a local `supabase start` instance - approved substitution to
      the real remote project; **partially green, with an escalated, documented structural conflict** for 3
      of the 4 non-promotion blocks. See Resolution → Deviations #5 below for the full analysis and
      evidence; this adapter's own correctness for the exact same three methods is separately proven green.
- [x] `promoteGuestToAccount` is a clearly-labeled stub, not a silent no-op.
- [x] No manual `user_id` filtering exists as a substitute for RLS.

## Resolution

### Solution Path

Built `packages/pic-adapter-supabase/src/supabase-repository.ts` (`SupabaseRepository`) implementing all
ten `RepositoryPort` members against real Supabase Postgres/Auth (the seven CRUD methods from this ticket's
Definition of Done, plus `promoteGuestToAccount` as a labeled stub, plus `getGuestSessionGate` /
`saveGuestSessionGate` - required by TypeScript's `implements RepositoryPort` even though the DoD's own
bullet list only names seven methods; see Deviation #4). `src/index.ts` re-exports the class and its error
types as the package's public barrel.

Tests live in `src/supabase-repository.test.ts` and run against the **real remote Supabase project**
(Deviation #1), using ephemeral, real authenticated Event Manager sessions provisioned via
`auth.admin.createUser` + `auth.signInWithPassword`, every one of them deleted in a top-level `afterAll`.
The shared ticket-03 contract suite (`runRepositoryPortContractTests`) is imported unmodified and invoked
with `skipPromoteGuestToAccount: true`, exactly like `pic-adapter-local-guest`'s own test file. On top of
it, all four "Adapter-specific Testing Requirement" `it()`s from this ticket are implemented verbatim,
plus a `getGroup`/`saveGroup` and `getPlayerSession`/`savePlayerSession` round-trip suite (not required by
the frozen contract suite or the explicit test list, but called for by the Seam Map's "return shapes must
exactly match `pic-engine`'s domain types field-for-field" warning for Ticket 13).

**Final, repeatable test result** (three consecutive runs, all identical): **12 passed, 4 failed, 5
skipped** out of 21 total in `supabase-repository.test.ts`. The 5 skipped are the entire
`promoteGuestToAccount` describe block, shown as explicitly skipped (not silently omitted) via
`describe.skipIf`. The 4 failures are the escalated structural conflict in Deviation #5 below, not flakes -
reproduced identically across three separate runs with distinct error messages captured verbatim there.

### Architectural Decisions

1. **Identity injection (this ticket's "your design call", and Ticket 13's seam):**
   `new SupabaseRepository(client)` where `client` is an **already-authenticated** `SupabaseClient`. A
   private `currentUserId()` calls `client.auth.getUser()` lazily, only when an insert must satisfy an RLS
   `with check (auth.uid() = user_id)` clause (`getOrCreateLibraryRow`, `savePlayerSession`, `saveGroup`).
   Every read relies solely on RLS to scope results - no method anywhere adds a `.eq("user_id", ...)`
   filter of its own. Ticket 13's RPC-wiring call site can reuse this exact same authenticated-client
   constructor pattern for the class it extends/composes.
2. **`in_view` Persistence Boundary Normalization** - copied verbatim in spirit from
   `pic-adapter-local-guest`: `getPlayerSession`/`savePlayerSession` both downgrade any `in_view` unit to
   `unseen`, matching that adapter's own documented DEC-015 rationale exactly, for the same cross-adapter
   consistency reason.
3. **`saveGroup` is full-replace, not a diff-patch**: every symptom in `group.symptoms` is upserted, and
   any previously-stored `symptoms` row for that `group_id` no longer present in the given list is
   deleted - matching `pic-adapter-local-guest`'s "whole object replace" semantics on a normalized table
   instead of one JSON blob, and avoiding orphaned stale symptom rows across repeated saves.
4. **Timestamp normalization (a real bug found via TDD, not a schema conflict):** Postgres/PostgREST
   returns `timestamptz` values as e.g. `"...T11:32:10.31+00:00"`, not byte-identical to
   `new Date().toISOString()`'s `"...T11:32:10.310Z"` that every caller in this codebase constructs and
   compares against. Every timestamp column is now re-parsed and re-formatted via `new Date(v).toISOString()`
   on read (`toTimestamp`/`toNullableTimestamp` helpers) so round-trip `toEqual` checks pass on genuinely
   equal instants. This was caught red-first: the very first test run failed on exactly this diff before the
   fix was added.
5. **`incrementUseCount` idempotency-key tracking, piggybacked in `provenance`:** see Deviation #3.

### Deviations

1. **Local ↔ remote Supabase substitution (orchestrator-approved, cited per the brief).** This sandbox has
   no Docker/Supabase CLI, so `supabase start` is impossible here. Per the orchestrator's explicit
   escalation-channel approval, every test in this ticket runs against the Event Manager's real remote
   Supabase project instead (same non-negotiable: real Postgres/RLS, never a mocked client) - credentials
   loaded from the git-ignored `.env.local` via the same parsing pattern as
   `scripts/wave6-supabase-audit.mjs`, `NODE_TLS_REJECT_UNAUTHORIZED=0` set only at the shell invocation
   level for test/install commands, never inside any shipped adapter source file.

2. **`Symptom.rated_at` has no live column (Wave 4/5 audit finding SF-1, explicitly carried into this
   ticket's scope by that audit: "Wave 5 adapters (local-guest + Supabase) must either add `rated_at
   timestamptz null` or define an equivalent mapping").** This ticket's own permission table forbids adding
   a new migration, so the "add the column" option was not available here. Chose the honest, non-fabricated
   mapping instead: `getGroup` always returns `rated_at: null` for every symptom, and `saveGroup` never
   attempts to persist whatever `rated_at` value it was given. This is a real, documented degradation
   (`GroupEngine.hasPriorRating` will read "never rated" for any symptom loaded through this adapter today),
   never a fabricated timestamp - covered by its own test
   (`"rated_at always reads back as null - a documented schema-gap limitation, not fabricated data"`).
   **Escalation:** a fast-follow migration adding a real `rated_at timestamptz null` column to
   `public.symptoms` is needed before Blind-by-Default rating is trustworthy against Supabase; recommend
   the orchestrator schedule this before whichever ticket first exercises real rating persistence there.

3. **`incrementUseCount`'s per-row idempotency-key list has no dedicated column either** (same category of
   gap as #2 - adding one requires a migration, forbidden in this ticket's permission table). Resolved by
   storing the list under a clearly namespaced `_usedIncrementIdempotencyKeys` key inside the already-free
   `personal_treatment_library.provenance` jsonb column, always stripped back out by
   `stripInternalProvenanceFields` before any `LibraryRow` is returned to a caller - the public shape never
   leaks this adapter's internal storage choice. Implemented as a plain read-check-write (not one atomic SQL
   statement): acceptable for this ticket's explicit "idempotent under *retry*" (sequential resubmission)
   requirement - true concurrent-write atomicity is Ticket 13's RPC transaction boundary, not this method's.

4. **`getGuestSessionGate` / `saveGuestSessionGate` are documented no-ops here**, even though the ticket's
   Definition of Done bullet only names seven methods (its header line says "every `RepositoryPort` method
   except `promoteGuestToAccount`" - a small internal inconsistency in the ticket text). TypeScript's
   `implements RepositoryPort` mechanically requires every member regardless; since the Persistence Gate
   (DEC-017) is inherently a pre-auth, Guest-Mode-only concern with no live column anywhere to hold it once
   authenticated, `getGuestSessionGate` always returns the default state and `saveGuestSessionGate` is a
   no-op - a documented, deliberate choice, not an oversight.

5. **Escalation — the shared contract suite's `getOrCreateLibraryRow`, `incrementUseCount`, and
   `appendTimelineEvent` blocks structurally cannot pass against this real schema, and this is a genuine
   conflict between two already-closed tickets, not a bug in this adapter.** Ticket 03's contract fixture
   builders (`repository-port.contract.ts`'s `uniqueId("treatment")`) generate synthetic, non-UUID strings
   like `"treatment-1"` as `treatmentId`. Ticket 11's already-applied migration made
   `personal_treatment_library.treatment_id` a `not null` Postgres `uuid` foreign key into `treatments`,
   with **no insert policy letting an authenticated (non-service-role) session create a new `treatments`
   row** ("no insert/update/delete policy is added in this ticket... no EM-authored-treatment feature
   exists yet" - the migration's own comment). Postgres rejects a non-UUID string at the type-parsing stage
   before RLS or the foreign key are ever consulted, so these three blocks fail immediately and
   identically across three separate real test runs:
   - `incrementUseCount > increments use_count by exactly 1` →
     `invalid input syntax for type uuid: "treatment-1"`
   - `incrementUseCount > called twice with the same idempotencyKey...` →
     `invalid input syntax for type uuid: "treatment-2"`
   - `getOrCreateLibraryRow > creates a new row on first call...` →
     `invalid input syntax for type uuid: "treatment-3"`
   - `appendTimelineEvent > never removes or mutates previously appended events` →
     `invalid input syntax for type uuid: "treatment-4"`

   This is **not exercised by real production usage**: every real call site
   (`LibraryEngine.recordUse(treatmentId, ...)`, called by `PlayerEngine`) only ever passes a real
   `treatments.id` UUID, since a Unified Player run is always against a real treatment. I deliberately did
   **not** special-case my adapter to coerce or silently reroute non-UUID `treatmentId` inputs (e.g. mapping
   them onto a placeholder real treatment row) - that would be inventing unagreed business logic and would
   misrepresent real data (a personal library row pointing at the wrong treatment), exactly what this
   brief's escalation clause asks me to avoid guessing on. Instead, this adapter's own correctness for
   these exact three methods is separately proven fully green, using real seeded `treatmentId` values, in
   the "Adapter-specific Testing Requirement" describe block (all 4 required `it()`s pass, plus the RLS
   cross-user test) - so the adapter's logic is verified correct; only the frozen contract suite's own
   fixtures cannot exercise it as written against this real schema.

   **Recommend the orchestrator/EM choose between, before Ticket 13 relies on `getOrCreateLibraryRow`:**
   (a) amend ticket 03's `repository-port.contract.ts` fixtures to generate real-UUID-shaped
   `treatmentId`s (and possibly widen `runRepositoryPortContractTests`'s options to accept a caller-supplied
   `makeTreatmentId()` so a Supabase-backed adapter can hand back a real, pre-seeded id), or (b) add a
   narrow, additive migration (in whichever ticket is authorized to touch schema next) granting an insert
   policy for authenticated Event Managers creating their own Personal Content `treatments` rows (ADR-0001
   already anticipates this as "a plausible future," just not yet built). Neither option is in this
   ticket's permission table, so neither was attempted here.
