# 08-07 — `listTreatments` Port + `TreatmentPickerScreen`

**What to build:** vertical slice — add `RepositoryPort.listTreatments()` to engine port + all adapters,
then dumb-reflection picker screen.

**Blocked by:** 08-03, 08-04.

**Status:** done

**Source:** `.scratch/pic-tracer-bullet/issues/18-treatment-picker-screen.md` (orig. Ticket 18).

## Definition of Done

- [x] `listTreatments()` on port, fake, local-guest, supabase adapters.
- [x] Picker renders treatment list; selection navigates to player with `treatment_id`.
- [x] RLS-only reads (`auth.uid()` / global seed rows per ADR-0001).

## Testing

- [x] `it('renders the flat treatment list without throwing given a seed list of treatments')`
- [x] `it('calls playerEngine.startSession with the selected treatment id and null when no group link is chosen')`
- [x] `it('calls playerEngine.startSession with the selected treatment id and the group id when the link toggle is on')`

## Resolution

**Deliverables**

- `RepositoryPort.listTreatments()` + `TreatmentListItem` type in `pic-engine`.
- `TRACER_BULLET_SEED_TREATMENTS` bundled catalog for Guest Mode (`pic-engine/src/tracer-bullet-seed-treatments.ts`).
- Implementations: `FakeRepositoryPort`, `LocalGuestRepository`, `SupabaseRepository`, `DelegatingRepositoryPort`.
- `compositionRoot.catalogActions.listTreatments()` + `CatalogProvider` / `useCatalogActions`.
- `TreatmentPickerScreen.tsx` wired into `guest-flow-screens.tsx` for `pick-treatment`.

**Verification**

- `npx vitest run packages/pic-engine packages/pic-adapter-local-guest packages/pic-web`
  (excluding remote promote-path) — **136 passed**.
- `depcruise` pic-web + pic-engine — **0 violations**.

**Note (Should-fix for E2E / promotion FK):** Guest bundled treatment IDs are stable client handles; remote
`promote_guest_to_account` requires `player_sessions.treatment_id` to exist in Supabase. Align bundled UUIDs
with seed rows via a future manual-apply migration if promotion tests fail on FK.
