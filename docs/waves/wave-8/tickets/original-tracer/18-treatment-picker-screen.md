# 18 — `TreatmentPickerScreen`

**What to build:** the flat, non-diagnostic treatment list with an optional "link to group" toggle, that
starts a `PlayerEngine` session on selection.

**Blocked by:** 14 (`pic-web` app shell), 08 (`PlayerEngine`), 11 (Supabase schema migration — seed
`treatments` rows).

**Status:** ready-for-agent

**Source:** `docs/specs/tracer-bullet-happy-path.md` §F, User Stories 18–19, §G Out of Scope (flat list,
no diagnosis engine).

## Locked Engine Interface (Dumb Reflection Contract)

```ts
// Read-only treatment list, sourced through the composition root (ticket 14), never queried directly
// by this component from Supabase:
repositoryPort.listTreatments(): Promise<Array<{ id: string; title: string }>>;

// Selecting a treatment + optional group link starts a PlayerEngine session:
playerEngine.startSession(treatmentId: string, linkedGroupId: string | null): Promise<string>; // sessionId
```

`RepositoryPort` (ticket 02) does not currently define `listTreatments` — if it's still missing when this
ticket starts, add it there as a small, explicitly-flagged amendment (one read-only method, same pattern as
the other seven) rather than having this component query Supabase directly or invent a side-channel data
source.

## Definition of Done

- Flat list UI — precisely because "the spike never needs a diagnosis engine" (§G Out of Scope). No
  category grouping, no NEMAR-style narrowing.
- An optional "link to group" toggle referencing the group just created in this session; leaving it off
  passes `null` as `linkedGroupId` (user story 19 — Smart-Linking is "intentional, never automatic").
- Selecting a treatment calls `playerEngine.startSession(...)` and navigates to `UnifiedPlayerScreen`
  (ticket 19) — this screen never renders treatment content itself.

## Do Not Touch / Out of Scope

- Do not implement any diagnosis/NEMAR selection logic, Causes Table, or Treatments Table beyond the flat
  seed list — all of GQ-020, fully out of scope for this spike.
- Do not implement multi-group linking — exactly one optional link at treatment-pick time, per the spec's
  Out of Scope note on the full Smart-Linking surface.
- Do not render any part of `UnifiedPlayerScreen`'s tree from within this screen.

## Testing Requirement — Test-First Acceptance Criteria (thin smoke tests only)

- [ ] `it('renders the flat treatment list without throwing given a seed list of treatments')`
- [ ] `it('calls playerEngine.startSession with the selected treatment id and null when no group link is
      chosen')`
- [ ] `it('calls playerEngine.startSession with the selected treatment id and the group id when the link
      toggle is on')`

## Acceptance Criteria

- [ ] All three smoke tests pass.
- [ ] The list is flat with no diagnosis/category logic anywhere in this ticket's code.
- [ ] The group-link toggle is optional and defaults to off (`null`).
