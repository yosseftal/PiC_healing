# 16 — `SymptomGroupCreateScreen` (`SymptomAddStep` + `RatingControl`)

**What to build:** the one-screen, one-action group creation flow, plus the Blind-by-Default rating widget,
each rendering `GroupEngine` state and calling its methods directly — no rating logic in the component.

**Blocked by:** 14 (`pic-web` app shell), 07 (`GroupEngine`).

**Status:** ready-for-agent

**Source:** `docs/specs/tracer-bullet-happy-path.md` §F, User Stories 6–13, `CONTEXT.md` Blind (re-)rating
/ Polarity / Intensity entries.

## Locked Engine Interface (Dumb Reflection Contract)

```ts
groupEngine.createDraftGroup(name: string): Promise<string>;                 // returns groupId
groupEngine.addSymptom(groupId: string, name: string): Promise<string>;      // returns symptomId
groupEngine.hasPriorRating(symptomId: string): Promise<boolean>;
groupEngine.rate(symptomId: string, rating: { polarity: 'positive' | 'negative'; intensity: number }):
  Promise<void>;
groupEngine.revealPriorRating(symptomId: string): Promise<{ polarity; intensity } | null>;
```

This component tree must never call `revealPriorRating` except in direct response to an explicit EM tap on
a "Reveal" affordance, and must never render a polarity/intensity value it did not itself just receive back
from the arguments it passed to `rate()` or from an explicit `revealPriorRating()` result. If ticket 07's
actual shipped signatures differ from this sketch, use the real ones — do not invent new `GroupEngine`
surface from this UI ticket.

## Definition of Done

- `SymptomGroupCreateScreen`: name input → confirm, a single Atomic Focus action (user story 6).
- `SymptomAddStep`: repeatable — name + `RatingControl`; **one symptom per pass**, never a multi-symptom
  form (user story 11).
- `RatingControl`: polarity toggle + intensity slider (0–10 integer); renders
  `groupEngine.hasPriorRating()`'s result as a "Reveal" link, **never the prior value itself unless
  tapped**; instantiated **once, inside `SymptomAddStep`, nowhere else** in this spike's tree (per spec §F
  closing note — the same component a future "resume existing group" flow would reuse unmodified).
- Adding a symptom and rating it happens as one combined action per user story 8 — the polarity/intensity
  inputs and the "add this symptom" confirmation are presented together, not as two separate steps.

## Do Not Touch / Out of Scope

- Do not render `RatingControl` (or any rating-shaped UI) inside `UnifiedPlayerScreen`'s subtree — this
  ticket must not introduce that violation from its own side either (no shared "global" rating widget
  imported into the player tree in a later ticket).
- Do not implement the Joint Treatment Muscle Test step or the group summary screen — ticket 17.
- Do not implement trigger point 2 ("resume an existing group" session-scoped rating) — this screen only
  ever creates brand-new groups in this spike.
- Do not implement any validation logic beyond what the engine already enforces (e.g. don't duplicate
  intensity-range checking in the component — let `GroupEngine.rate()`'s rejection surface as an error the
  UI displays, not a re-implemented client-side rule).

## Testing Requirement — Test-First Acceptance Criteria (thin smoke tests only)

- [ ] `it('renders SymptomGroupCreateScreen without throwing given an empty draft group')`
- [ ] `it('calls groupEngine.addSymptom with the entered name when the add-symptom action is triggered')`
- [ ] `it('RatingControl calls groupEngine.rate with the selected polarity and intensity, and never
      pre-fills a prior value unless Reveal was tapped')`
- [ ] `it('RatingControl shows a Reveal affordance only when groupEngine.hasPriorRating resolves true')`

## Acceptance Criteria

- [ ] All four smoke tests pass.
- [ ] `RatingControl` appears exactly once in the rendered tree, inside `SymptomAddStep` only.
- [ ] No component in this ticket contains business-rule assertions (no `use_count`, no player-state logic).
