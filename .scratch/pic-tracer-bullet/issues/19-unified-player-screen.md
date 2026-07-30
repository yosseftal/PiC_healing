# 19 — `UnifiedPlayerScreen` (`AtomicUnitView`, `NavigationTreePanel`, `TerminalNemarUnit`, `FinishBar`)

**What to build:** the Player's visual tree — one unit at a time, the Navigation Tree as the only jump
affordance, the Terminal NEMAR unit, and the Finish/Finish Anyway bar — with a hard, tested guarantee that
no rating UI ever appears anywhere in this subtree.

**Blocked by:** 14 (`pic-web` app shell), 08 (`PlayerEngine`).

**Status:** ready-for-agent

**Source:** `docs/specs/tracer-bullet-happy-path.md` §F (`UnifiedPlayerScreen` subtree), Testing Decisions
("One additional smoke test asserts `UnifiedPlayerScreen`'s rendered tree contains no `RatingControl`
instance"), User Stories 20–33.

## Objective

This is the UI-level mirror of ticket 04's engine-level isolation guarantee. The spec calls this out twice
— once as a structural constraint (§F) and once as an explicit required test (Testing Decisions) — because
this is the one screen where a rating prompt sneaking in would silently violate the entire seam this spec
exists to prove.

## Locked Component Hierarchy (copied verbatim from spec §F)

```
UnifiedPlayerScreen                    (contains no rating UI, sliders, or rating prompts anywhere
                                         in this subtree — enforced by code review / lint rule
                                         forbidding a RatingControl import here, not just convention)
├── AtomicUnitView                     (renders exactly one unit's unit_content; triggers in_view)
├── NavigationTreePanel                (the only jump affordance; calls jumpTo(unitId))
├── TerminalNemarUnit                  (Yes/No; a specialization of AtomicUnitView, not a separate screen)
└── FinishBar                          ([Finish] xor [Finish Anyway], computed from PlayerEngine state)
```

## Locked Engine Interface (Dumb Reflection Contract)

```ts
playerEngine.getState(sessionId: string): {
  units: Array<{ unitId: string; title: string; state: 'unseen' | 'in_view' | 'skipped' | 'completed' }>;
  currentUnitId: string;
  terminalNemarResponse: 'yes' | 'no' | null;
  canFinish: boolean;        // true once terminalNemarResponse === 'yes'
  canFinishAnyway: boolean;  // always true
  successDeclared: boolean;
};
playerEngine.jumpTo(sessionId: string, unitId: string): Promise<void>;
playerEngine.advance(sessionId: string): Promise<void>;             // implicit on rendering the next unit
playerEngine.respondTerminalNemar(sessionId: string, response: 'yes' | 'no'): Promise<void>;
sessionEngine.onFinishRequested(sessionId: string, kind: 'finish' | 'finishAnyway'): Promise<void>;
```

Use ticket 08's and ticket 09's real shipped signatures if they differ from this sketch — do not invent new
engine surface from this UI ticket.

## Definition of Done

- `AtomicUnitView`: renders exactly one unit's content; being rendered is itself what triggers the
  `in_view` transition — no button.
- `NavigationTreePanel`: the **only** jump affordance in this screen; calls `jumpTo(unitId)`. **No `skip()`
  call exists anywhere in this component or its siblings.**
- `TerminalNemarUnit`: Yes/No question, implemented as a specialization of `AtomicUnitView` — not a
  separate screen or route.
- `FinishBar`: shows `[Finish]` **xor** `[Finish Anyway]`, computed purely by reading
  `playerEngine.getState().canFinish` / `.canFinishAnyway` — never a locally-derived boolean.
- **Hard constraint, both code-review- and test-enforced:** zero import of `RatingControl`, `GroupEngine`,
  or any symptom/polarity/intensity type anywhere in this screen's file or its children.

## Do Not Touch / Out of Scope

- Do not import `RatingControl`, `GroupEngine`, or any rating-shaped type anywhere in this ticket's files.
- Do not add a manual "Done"/"Skip"/"Back" button — visibility (render) and `jumpTo` are the only triggers,
  per DEC-015.
- Do not implement Reflection Prompt units or the `unit_rationale` "info" affordance UI — explicitly Out of
  Scope for this spike.
- Do not add any prompt, screen, or navigation step after `Finish`/`Finish Anyway` — the Player ends there
  with nothing appended (user story 33).

## Testing Requirement — Test-First Acceptance Criteria

- [ ] `it('renders the current unit without throwing given a fresh player session state')`
- [ ] `it('rendering the current unit triggers advance()/in_view exactly once, not on every re-render')`
- [ ] `it('NavigationTreePanel\'s jumpTo call is the only way this component tree triggers a unit-state
      change other than rendering forward')`
- [ ] `it('FinishBar shows [Finish] only when canFinish is true, and [Finish Anyway] always')`
- [ ] `it('UnifiedPlayerScreen\'s rendered tree contains zero RatingControl instances')` — the literal
      spec-mandated UI-level isolation backstop, independent of ticket 04's engine-level static-analysis
      check.

## Acceptance Criteria

- [ ] All five smoke tests pass, including the zero-`RatingControl` backstop test.
- [ ] No manual skip/done/back button exists anywhere in this subtree.
- [ ] Nothing renders after `Finish`/`Finish Anyway` is pressed within this screen's own tree.
