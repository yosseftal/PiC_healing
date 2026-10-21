# 02 — `pic-engine` domain types + `RepositoryPort` interface

**What to build:** the one persistence interface every engine depends on, plus the shared domain types it
speaks in. Types and an interface only — zero implementation.

**Blocked by:** 01 (monorepo & tooling scaffold).

**Status:** done

**Source:** `docs/specs/tracer-bullet-happy-path.md` §A "Modules", §B "Data Schema" (Guest store shapes).

## Objective

Fix the seam: "everything that is state, transition, or business rule... lives inside `pic-engine`... with
zero DOM, zero React, zero Supabase client import." This ticket defines the contract every other engine
ticket (05–09) and both adapter tickets (10, 12, 13) are built against, so nothing downstream has to
renegotiate the shape of persistence.

## Context Injection (copied verbatim from the spec — this is the single source of truth)

From §A:

> `RepositoryPort` — the one interface all engines depend on for persistence (`getGroup`, `saveGroup`,
> `getPlayerSession`, `savePlayerSession`, `getOrCreateLibraryRow`, `incrementUseCount`,
> `appendTimelineEvent`, `promoteGuestToAccount`). No engine imports a concrete adapter.
> `promoteGuestToAccount` is documented on the port as **atomic-or-nothing** — see §E.

From §B, Guest store shapes (the types this ticket must define):

> `guest_group`: `id` (client UUID), `name`, `symptoms: [{ id, name, polarity: 'positive' | 'negative',
> intensity: 0..10 }]`, `joint_treatment_muscle_test: 'together' | 'split_suggested'`,
> `joint_treatment_test_at: timestamp`, `created_at`.
>
> `guest_player_session`: `id`, `treatment_id`, `linked_group_id` (nullable), `units: [{ unit_id, state:
> 'unseen' | 'in_view' | 'skipped' | 'completed' }]` (`in_view` never persisted, computed at read time),
> `terminal_nemar_response: 'yes' | 'no' | null`, `success_declared: boolean` (set only by `finish()` /
> `finishAnyway()`), `finished_at: timestamp | null`, `integrating_reason: 'mid_exit' | 'terminal_nemar_no' |
> null`. No rating field exists on this record — ratings live exclusively on `guest_group.symptoms`.

Also carry equivalents for `personal_treatment_library` and `timeline_events` rows (from §B) so
`getOrCreateLibraryRow`, `incrementUseCount`, and `appendTimelineEvent` have real return/argument types
instead of `any`.

## Definition of Done

- `packages/pic-engine/src/types.ts` exports: `Symptom`, `SymptomGroupDraft`, `FinalizedSymptomGroup`,
  `PlayerUnitState` (`'unseen' | 'in_view' | 'skipped' | 'completed'`), `PlayerSession`, `LibraryRow`,
  `TimelineEvent` — field names and nullability matching §B exactly.
- `packages/pic-engine/src/repository-port.ts` exports a `RepositoryPort` interface with **exactly** these
  eight methods, no more, no fewer: `getGroup`, `saveGroup`, `getPlayerSession`, `savePlayerSession`,
  `getOrCreateLibraryRow`, `incrementUseCount`, `appendTimelineEvent`, `promoteGuestToAccount`.
- `promoteGuestToAccount`'s TSDoc comment states, close to verbatim, that it is atomic-or-nothing: implemented
  as a single transaction, idempotent under retry via a client-supplied idempotency key, with no partial
  writes ever observable by the caller.
- No engine class (`GroupEngine`, `PlayerEngine`, `LibraryEngine`, `TimelineEngine`, `SessionEngine`) exists
  yet — interfaces and types only.
- `npx tsc --noEmit` passes.
- Zero imports of React, a Supabase client, or any DOM API anywhere under `packages/pic-engine`.

## Do Not Touch / Out of Scope

- Do not implement `GroupEngine`, `PlayerEngine`, `LibraryEngine`, `TimelineEngine`, or `SessionEngine` —
  tickets 05–09.
- Do not implement the fake in-memory adapter (ticket 03) or either real adapter (tickets 10, 12, 13).
- Do not enforce runtime validation (e.g. intensity 0–10 bounds) here — that is `GroupEngine`'s job
  (ticket 07). This ticket only fixes the TypeScript shape.
- Do not add a `listTreatments`-style read method unless a later ticket (18) explicitly needs one added
  here — keep the eight methods exactly as named in the spec until then.

## Testing Requirement

No runtime tests exist for a types-only ticket. The only check is:

- [x] `npx tsc --noEmit` passes with zero errors across `packages/pic-engine`.
- [x] A trivial type-level check (e.g. a file that imports `RepositoryPort` and assigns an object literal
      missing one method) fails to compile, proving the interface is enforced, not just documented.

## Acceptance Criteria

- [x] `RepositoryPort` interface matches the eight-method list verbatim.
- [x] All Guest-store-shaped domain types are exported and match §B's field names and nullability.
- [x] Zero React/Supabase/DOM imports anywhere in the package.
- [x] No engine implementation exists yet.

## Resolution

Landed on `main` as the ratified persistence seam for all tracer-bullet engines and adapters.

**Domain types** (`packages/pic-engine/src/types.ts`):

- `Symptom` — `id`, `name`, `polarity` (`'positive' | 'negative'`), `intensity` (0–10); ratings live on
  the Symptom Group, never on `PlayerSession`.
- `SymptomGroupDraft` / `FinalizedSymptomGroup` — Guest and authenticated group shapes with Joint Treatment
  Muscle Test metadata (`joint_treatment_muscle_test`, `joint_treatment_test_at`).
- `PlayerUnitState` — flat four-state model (`unseen` | `in_view` | `skipped` | `completed`); `in_view` is
  ephemeral, never persisted.
- `PlayerSession` — treatment execution record with `terminal_nemar_response`, `success_declared`,
  `integrating_reason` (`'mid_exit' | 'terminal_nemar_no'`), and `finished_at`; no rating column.
- `LibraryRow`, `TimelineEvent` — Personal Treatment Library and chronological timeline spine shapes per §B.

**`RepositoryPort`** (`packages/pic-engine/src/repository-port.ts`) — eight core methods as specified, plus
Wave 2.5/7.5 hardening that did not change engine call sites:

- `PromoteGuestToAccountIdentityMismatchError` — rejects idempotency-key reuse with a divergent payload
  (hard failure, not silent no-op).
- `PromoteGuestToAccountInput` — bundles `idempotencyKey`, `newUserId`, `group`, and `playerSession` for the
  atomic promotion seam (ticket 13 RPC deferred; port contract is ratified now).

Identity scoping (`user_id`, RLS) is documented as an **adapter concern** — engines never thread a `userId`
through `getOrCreateLibraryRow` or `incrementUseCount`. A compile-time guard
(`repository-port.compile-check.ts`) proves the interface is enforced, not merely documented. Zero
React/Supabase/DOM imports under `packages/pic-engine`.
