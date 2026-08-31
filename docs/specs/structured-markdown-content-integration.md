# Structured Markdown Content Integration — Implementation Spec

**Status:** Wave 9 core finalized and closed (commits `099b861`–`fab5faa`, see
`docs/audits/wave-9-handoff.md`). **Wave 9.1 Resilience Hardening Amendment finalized by Executive
Command, 2026-08-26** — see that section below; it resolves the three Must-Fix gaps the Sovereign Domain
Audit surfaced post-closure (`docs/audits/wave-9-detailed-audit.md`) and adds two further build-time
integrity requirements. Tickets generated under `.scratch/md_content_integration/issues/` per
`docs/agents/wave-orchestrator.md`'s open-ticket convention (`docs/specs/tickets/` is reserved for
already-closed tickets — see that file's "Pre-flight" §3). Not yet filed as a GitHub issue (`gh` CLI
unavailable in the drafting environment — see `docs/agents/issue-tracker.md` for the intended publish
path). **This amendment is a documentation-only planning pass — no production code, schema, or test was
changed to produce it; implementation is a separate, EM-approved follow-up wave.**

**Context:** Builds directly on the "Executive Review" Current Truth audit and the follow-up Gap
Analysis (see chat history / `docs/audits/` if archived). The Tracer Bullet's Unified Player state
machine (Navigation Tree, Terminal NEMAR, Finish sovereignty) is fully verified end-to-end, but no code
path anywhere reads `treatments.structured_markdown` — `RepositoryPort` exposes only `{id, title}`,
`TreatmentPickerScreen` starts every session against two hardcoded stub unit ids, and `AtomicUnitView`
renders only the raw `unit_id` string.

## Problem Statement

An Event Manager who reaches the Unified Player today — in either Guest Mode or as an authenticated
account — sees a state machine with nothing in it: each Atomic Unit renders as a bare technical id
(e.g. `"intro"`, `"practice"`) instead of the real therapeutic guidance already sitting in the
`treatments` table. The Tracer Bullet's core Value Moment — "receive and follow real treatment
guidance, step by step" — is unreachable, even though every other part of the Player (state
transitions, Navigation Tree, Terminal NEMAR, Finish/Finish Anyway sovereignty, the Persistence Gate,
and atomic promotion) is already correct and tested.

## Solution

Wire `structured_markdown` from `treatments` through to the screen, without touching `PlayerEngine`'s
existing state machine, schema, or the promotion RPC. A new pure `pic-engine` Content Parser converts
raw Structured Markdown into an ordered list of Atomic Unit content records (title, content, and an
optional rationale per DEC-015 §9). `RepositoryPort` gains one additive read method,
`getTreatment(id)`, implemented identically in shape across the Supabase adapter and the Local Guest
adapter (the latter gaining real bundled Markdown so DEC-017 flight mode keeps delivering a full Value
Moment offline). A single new `pic-web` seam fetches, parses, and caches this content once per
treatment id, and both `TreatmentPickerScreen` (to get real ordered unit ids and to detect an
empty/malformed treatment before a session ever starts) and `AtomicUnitView` (to render real content via
`react-markdown`) read through that one seam. `PlayerEngine` is untouched: it keeps managing
`{unit_id, state}` only, exactly as DEC-015 already specifies — this is the "Path B" decision.

## User Stories

1. As an Event Manager picking a treatment, I want to see the treatment's real guidance text instead of
   a placeholder label, so I can actually follow the therapeutic instructions.
2. As an Event Manager in Guest Mode with no network connection, I want the same real treatment content
   to render, so flight mode delivers a full Value Moment, not a degraded one.
3. As an Event Manager, I want each Atomic Unit's content to appear the moment it becomes the active
   unit, so the Player's existing visibility-triggered `advance()` timing is unaffected by this change.
4. As an Event Manager navigating via the Navigation Tree, I want the jumped-to unit's real content to
   render immediately, so jumping and rendering stay in sync exactly as they do today.
5. As an Event Manager, I want a treatment with no parseable steps to never be startable from the
   picker, so I never land in a session with nothing to do.
6. As an Event Manager, if a treatment's content can't be parsed into any steps, I want a calm,
   non-error message, so the tone matches this product's positive, non-blocking framing.
7. As an Event Manager revisiting a `completed` unit, I want to see its content again unchanged, so
   revisiting/deepening keeps working exactly as it does today.
8. As an Event Manager, I want the parser to capture an optional rationale blockquote when present, so
   future "info" affordance work has real data to build on without a second content-parsing pass.
9. As an Event Manager using an authenticated web session, I want treatment content fetched through the
   same RLS-scoped Supabase client as every other read, so ownership/security is unaffected.
10. As a developer, I want the Content Parser to be independently unit-testable with zero engine or
    adapter dependencies, preserving the Seam.
11. As an Event Manager, I want real Markdown formatting (paragraphs, emphasis, lists, links) in the
    content to render as formatted text, not raw markdown syntax characters.
12. As an Event Manager, I want the picker's flat list of treatment titles to look exactly as it does
    today — this change affects what happens after selection, not the list itself.
13. As an Event Manager linking a treatment to a Symptom Group, I want that linking behavior completely
    untouched by this change.
14. As an Event Manager, I want the Terminal NEMAR unit's own text and behavior to be unaffected, since
    it is not sourced from `structured_markdown`.
15. As a developer, I want the existing dependency-cruiser and module-isolation tests to stay green,
    proving the new Content Parser never leaks into `PlayerEngine`.
16. As a developer, I want the fake `RepositoryPort` and its contract suite extended with `getTreatment`,
    so the Local Guest and Supabase adapters both provably satisfy the identical contract.
17. As an Event Manager on the Guest → Authenticated promotion path, I want an in-progress session's
    persisted unit ids to still resolve to the same content after promotion, so revisiting history after
    signing in never shows different or missing text.
18. As an Event Manager, I want a treatment's rendered content to always reflect its current, live
    authored version rather than a frozen snapshot, consistent with DEC-016 §5's Pointer/live-render
    principle — even though no EM-authored-treatment editing exists yet.
19. As a developer, I want `happy-path-e2e.test.tsx` and all affected screen-level tests updated to
    assert against real parsed content instead of the two hardcoded stub unit ids, so the test suite
    doesn't silently diverge from production behavior.
20. As an Event Manager, I want unit ids to stay stable across a page reload or resume, so
    `findActiveUnit`'s existing reload-recovery fallback keeps working unchanged.
21. As an Event Manager, I want this change to require no new sign-in, no new permission prompt, and no
    visible migration step — it should feel like the Player "just works" now, not like a new feature was
    bolted on.

## Implementation Decisions

- **New domain type, `Treatment`** (`RepositoryPort`'s module): `{ id, title, structured_markdown,
  content_format }`, mirroring the `treatments` table exactly. Additive alongside the existing
  `TreatmentListItem` — the flat picker list keeps using `TreatmentListItem`; nothing about that
  contract changes.
- **[FINALIZED] New `RepositoryPort` method, `getTreatment(treatmentId): Promise<Treatment | null>`** —
  a standalone additive method, deliberately not folded into `listTreatments()`. This preserves
  `listTreatments()`'s existing, already-tested contract untouched, and — just as importantly — keeps
  the flat picker list cheap: `listTreatments()` stays a lightweight `{id, title}` scan, and the heavy
  `structured_markdown` payload is only ever fetched lazily, once, at the moment an Event Manager
  actually selects a treatment to start a session against — never on every render of the picker list.
  Implemented in the Supabase adapter as a single-row select of `id, title, structured_markdown,
  content_format`, reusing the existing `.maybeSingle()` + `wrapError` pattern already used by every
  other read method in that adapter. No RLS/policy change needed — the existing hybrid SELECT policy on
  `treatments` already covers this column.
- **New `pic-engine` Content Parser module** (a pure function, zero dependency on `RepositoryPort` or
  any adapter): converts a raw Structured Markdown string into an ordered array of Atomic Unit content
  records — `unit_id`, `unit_order`, `unit_title`, `unit_content`, and `unit_rationale` (nullable),
  matching the schema DEC-015 §9 already specifies. Never throws.
  **[SUPERSEDED BY WAVE 9.1 — HEURISTIC FALLBACK, see below]** Wave 9 core resolved *any* zero-H3 input
  (including non-empty prose) to an empty array. Wave 9.1 narrows this: only a genuinely empty or
  whitespace-only string resolves to an empty array now; non-empty prose with zero H3 headers is wrapped
  into a single fallback unit instead (Decision A below) — this also brings the implementation back into
  alignment with DEC-015 §9's own "graceful degradation... falls back to a single `unit_content`
  container" clause, which Wave 9 core had not implemented.
- **[FINALIZED] Unit id generation is order-based, not title-based** (`unit-1`, `unit-2`, …, derived from
  parse position, never from the H3 heading text). This is what keeps `PlayerSession.units[].unit_id`
  meaningfully aligned with re-fetched, re-parsed content across page reloads and across the
  Guest→Authenticated promotion boundary, since content is never persisted on the session itself (see
  below) — only re-derived on each read. Explicitly chosen to protect DEC-016 §5's "Live Render"
  principle: a content edit (wording, formatting) to a Pointer-type treatment must never invalidate an
  Event Manager's historical Timeline pointers into that same session's units, which a title-derived
  (slug) id scheme would risk on every edit.
- **Rationale extraction implements DEC-015 §9's rule exactly**: a blockquote immediately following an
  H3 header is extracted as `unit_rationale`, separate from `unit_content`. The "info" affordance that
  would surface `unit_rationale` in the UI remains **out of scope** for this pass (mirroring ticket 08's
  own prior deferral) — the parser captures the data now so no second parsing pass is needed when that
  UI work is picked up.
- **`PlayerEngine` itself does not change at all.** It keeps accepting `unitIds: string[]` and knows
  nothing about titles, content, or rationale — the "Path B" decision. No schema migration, no RPC
  change, and no change to `player_sessions.units`'s persisted shape are needed anywhere in this spec.
- **[FINALIZED] New `pic-web` seam: a single treatment-content cache/fetcher**, following the same
  context-plus-module-scoped-store pattern already used for player sessions (mirroring the existing
  `player-engine-context.tsx` / composition-root `playerSessionStore` shape). It exposes one action —
  "get this treatment's parsed Atomic Unit content" — that internally calls
  `RepositoryPort.getTreatment` then the Content Parser, and caches the result per treatment id,
  **module-scoped for the life of the browser tab** (confirmed final, not reload-persistent). This is a
  deliberate Resilience choice: every full page reload re-fetches from the actual Source of Truth
  (Supabase for authenticated sessions, the bundled Local Guest seed for flight mode) rather than trusting
  a possibly-stale `localStorage`/`sessionStorage` copy — consistent with `PlayerSession`'s own reload
  path, which already re-derives its active unit from persisted engine state rather than a UI cache. Both
  `TreatmentPickerScreen` and `AtomicUnitView` read through this one seam — there is no second,
  independent fetch/parse path anywhere in `pic-web`.
- **`TreatmentPickerScreen` change**: on selection, it asks the new seam for the treatment's parsed
  units before calling `startSession`. If the array is empty, it never calls `startSession` — it shows the
  finalized sovereign, non-error copy (see "Zero-H3 Guard" below) and keeps the Event Manager on the
  picker. Otherwise, it passes the parsed content's ordered unit ids into `startSession`, replacing the
  two hardcoded stub ids entirely.
- **[FINALIZED] Zero-H3 Guard copy**: exactly — *"This guidance is currently undergoing internal
  refinement and is not available for execution right now. NEMAR to choose another guidance?"* — chosen
  to honor EM Sovereignty and glossary discipline (CLAUDE.md §G): never "Error," "Failed," or "Invalid,"
  and it offers a next action (choose another guidance) rather than a dead end.
  **[NARROWED BY WAVE 9.1]** The copy string itself is unchanged and still fires for a genuinely
  empty/whitespace-only treatment. Its trigger surface widens from picker-only to picker **and** Player
  mount/restore (Decision B below), because Heuristic Fallback (Decision A) means this guard is now the
  rarer, truly-exceptional path rather than the catch-all for "no H3s."
- **`AtomicUnitView` change**: given a `treatmentId` (newly threaded down from `UnifiedPlayerScreen`,
  which already has it via `session.treatment_id`) and the active `unit`, it resolves that unit's
  content through the same seam and renders `unit_title` + `unit_content` via `react-markdown`. The
  existing `advance()`-on-render effect is unchanged — content lookup is a pure additional read, never a
  new trigger.
- **[FINALIZED] `react-markdown` + `remark-gfm` are added as new `pic-web` runtime dependencies.**
  GFM (GitHub-Flavored Markdown) support — tables, strikethrough, task lists — is mandatory, not
  optional: Sigal's therapeutic protocols require table layouts and structured checklists, and rendering
  them incorrectly (or stripping them to plain text) would itself be a Historical Integrity violation of
  the authored content, not merely a cosmetic gap. `unit_content` is rendered through the full
  `react-markdown` + `remark-gfm` pipeline in this pass; `unit_rationale` is parsed and cached but not
  displayed anywhere yet (see Out of Scope).
- **Local Guest adapter**: `TRACER_BULLET_SEED_TREATMENTS` (currently `{id, title}` only) is widened to
  carry the real `structured_markdown` / `content_format` for the same three seed treatments already
  present in the Supabase migration, keeping the two catalogs in lockstep exactly as their titles already
  are today. `LocalGuestRepository.getTreatment` reads from this same bundled constant — flight mode
  continues to require zero network calls.

## Testing Decisions

- **Content Parser**: pure unit tests in `pic-engine`, following the existing house style (mirroring
  `group-engine.test.ts` / `player-engine.test.ts`). Cover: a single H3; multiple H3s in order; an H3
  with an immediately-following blockquote (rationale extracted, cleanly separated from content); an H3
  with no blockquote (`unit_rationale: null`); zero H3 headers (empty array, no throw); and a literal
  fixture built from the three real seed strings in the schema migration (not a paraphrase), to guard
  against a parser that only "works" on synthetic examples.
- **Module isolation**: extend the existing dependency-cruiser rule plus its companion source-scan test
  (the same style already enforcing `player-engine` ⇎ `group-engine` isolation) with an assertion that
  `player-engine` has zero import of the new Content Parser module — proving the Path B decision
  structurally, not just by convention.
- **`RepositoryPort` contract suite**: add `getTreatment` to the shared contract test and run it against
  the fake port, `LocalGuestRepository`, and `SupabaseRepository` — the same three-way parity discipline
  every other port method already gets.
- **`pic-web` screen tests**: extend `treatment-picker-screen.test.tsx` to assert real content-derived
  unit ids reach `startSession` (replacing the stub-id assertions), and add coverage for the empty-parse
  soft-message path using a fixture treatment with no H3 headers. Extend `unified-player-screen.test.tsx`
  (or a sibling test) to assert `AtomicUnitView` renders real `unit_title` / `unit_content` text, not a
  `unit_id` label. Update `happy-path-e2e.test.tsx`'s Player-phase assertions to match real content
  instead of the `"intro"` / `"practice"` stub ids.
- **Test only external behavior**: what gets passed to `startSession`, what text renders on screen —
  never the new cache's internal storage shape — matching this codebase's existing testing philosophy
  throughout `pic-web`.

## Out of Scope

- The `unit_rationale` "info" affordance UI (already explicitly deferred once before, in ticket 08).
- `is_optional` unit metadata — no Structured Markdown syntax is defined yet to express it.
- Cache invalidation / live-edit propagation for treatment content — no EM-authored-treatment editing UI
  exists yet, so there is nothing to invalidate against.
- Any change to the Supabase schema, the `promote_guest_to_account` RPC, or `player_sessions.units`'s
  persisted shape.
- Any change to `PlayerEngine`'s public API, state machine, or existing tests.
- Content formats other than `'structured_markdown'` — `content_format` is read and checked, but no
  second parser is implemented for any other value.
- Course lesson content / Treatment Reference blocks (DEC-016) — this spec covers standalone treatments
  only, matching the Tracer Bullet's existing scope.
- Sanitizing EM-authored HTML/Markdown against injection — not a live risk today since only
  `service_role` migrations can write to `treatments`, but flagged for whoever eventually opens an
  EM-authored-treatment write path.

## Bundled Fix: Persistence Gate Silent-Fail (Wave 9 Scope Addition)

Not part of Structured Markdown content wiring — a separate, pre-existing production defect the Current
Truth audit surfaced, bundled into this wave at Executive direction rather than filed as its own spec.
Flagging its independence here so a future reader doesn't assume it's caused by, or related to, content
integration.

- **Defect:** `PersistenceGateModal`'s "Sign in (dev tracer stub)" button calls `anchorSession()`, which
  calls `promoteGuestSessionFromEnv` with a bare `void` (no `.catch`). If Supabase config or tracer
  test-user credentials are missing from the build's env, `signInAsTestUserFromEnv` throws
  **synchronously, before `SessionEngine.promote()` is ever entered** — so `promotionStatus` never leaves
  `"idle"`. The Event Manager sees the button do nothing; the console sees an unhandled rejection.
- **Fix:** surface this failure into the existing `promotionStatus: "failed"` UI (or an equivalent
  visible, non-error state) instead of letting it disappear silently — the retry copy and button already
  exist in `PersistenceGateModal` for the `"failed"` state; this fix only needs the failure to actually
  reach that state instead of being swallowed before `SessionEngine.promote()` starts.
- **Explicitly not in scope of this fix:** whether shipping password-based dev-stub sign-in as the only
  working Persistence Gate auth path in a public bundle is itself the right call — that's a separate
  product/security question, unaffected by this ticket.

## Further Notes

- Unit id stability matters for two existing behaviors that must keep working unchanged:
  `findActiveUnit`'s reload-recovery fallback and Navigation Tree jump targeting — both key exclusively
  off `unit_id`. The order-based id scheme above is chosen specifically to keep both correct without
  touching either of those files.
- This spec deliberately keeps the "spike" ethos of the existing Tracer Bullet tickets: minimum viable
  wiring, explicit deferrals named rather than silently dropped, matching every prior ticket's own
  "Do Not Touch / Out of Scope" convention.
- **Publishing:** intended to be filed as a GitHub issue with the `ready-for-agent` label per
  `docs/agents/issue-tracker.md`; saved as a file here instead because `gh` was unavailable when this
  spec was drafted.

## Finalized Decisions Log (Executive Command, 2026-08-18)

All five previously-open questions are resolved; each is also inlined at its point of relevance above,
marked `[FINALIZED]`:

| # | Question | Final decision |
|---|---|---|
| 1 | Unit id scheme | Order-based (`unit-1`, `unit-2`, …) — protects DEC-016 §5 Live Render / historical Timeline pointer stability across content edits. |
| 2 | Markdown feature surface | `react-markdown` + `remark-gfm` (tables, strikethrough, task lists) — mandatory for Sigal's protocol content and Historical Integrity. |
| 3 | Empty-treatment copy | *"This guidance is currently undergoing internal refinement and is not available for execution right now. NEMAR to choose another guidance?"* |
| 4 | `getTreatment` shape | Standalone additive `RepositoryPort` method — preserves `listTreatments()`'s contract and enables lazy loading of heavy content only at session start. |
| 5 | Content cache lifetime | Module-scoped per tab, no reload persistence — fresh Source-of-Truth retrieval on every reload, matching this codebase's Resilience principle. |

## Wave 9.1 — Resilience Hardening Amendment (Executive Command, 2026-08-26)

**Status:** finalized, documentation-only. Not yet implemented — see the rewritten tickets under
`.scratch/md_content_integration/issues/` for the follow-up implementation wave.

### Problem Statement

`docs/audits/wave-9-detailed-audit.md`'s Sovereign Domain Audit (run after Wave 9 core closed) found the
Player's Safe Container guarantee still has a hole an Event Manager can fall into after the wave's own
"complete" state: a restored or resumed session can mount a blank or Terminal-NEMAR-only Player instead of
the sovereign Zero-H3 copy (Must-Fix A), the offline GFM promise is unproven against real Guest content
(Must-Fix B), and six of the eight ticket files never durably recorded how they were resolved before
`.scratch/` (gitignored) eventually evaporates (Must-Fix C). Separately, Executive Command determined that
treating *any* authored treatment with zero H3 headers as if it had no content at all — rather than
honoring the prose Sigal actually wrote — was itself a Reciprocity violation, not just a UI-copy problem;
and that nothing today catches a malformed treatment before it reaches production.

### Solution

Five amendments, each closing one gap without touching `PlayerEngine`'s state machine, schema, or the
promotion RPC — Path B holds unchanged:

- **(A) Heuristic Fallback** makes the Content Parser resilient to non-empty, non-H3-structured prose
  instead of discarding it.
- **(B) All-or-Nothing Loading** closes the Safe Container leak Must-Fix A found, at both the Player's
  mount and restore paths, not just the picker's pre-check.
- **(C) Bootstrap Data Integrity** adds a build-time gate so a treatment that cannot resolve to at least
  one unit never reaches the seed data or the migration in the first place.
- **(D) Un-mocked GFM Offline Proof** closes Must-Fix B by proving table/strikethrough/task-list rendering
  through the real Guest adapter, not a mock.
- **(E) Durable Resolutions Appendix** closes Must-Fix C by archiving every ticket's Resolution log where
  git actually tracks it.

### User Stories

22. As an Event Manager who authored (or whose author authored) a treatment with real guidance text but no
    `###` structure, I want to still receive and follow that guidance in the Player, so an authoring
    formatting gap never erases real therapeutic content I'm entitled to see.
23. As an Event Manager, I want the "Continuous Guidance" fallback unit to look and behave exactly like
    any other Atomic Unit (same visibility-based state transitions, same Navigation Tree entry, same
    Terminal NEMAR appended after it), so this fallback never feels like a degraded or second-class
    experience.
24. As an Event Manager, I want the Zero-H3 Guard to still appear for a treatment that truly has no
    authored content, so I'm never told a genuinely empty treatment is ready to execute.
25. As an Event Manager restoring or resuming a session (same-tab resume today; any future boot-rehydrate
    tomorrow), I want the Player to hold me at a calm loading or recovery state rather than ever showing me
    an empty article or a Terminal-NEMAR-only session, so I never mistake unrendered content for a
    completed or executable session.
26. As an Event Manager, I want a content-load failure (network, missing row) to offer me a sovereign
    recovery action — return to the picker and choose again — rather than trapping me on a broken screen,
    consistent with EM Sovereignty.
27. As a developer, I want a build-time test that reads every treatment's `structured_markdown` — from the
    Supabase migration and from the Local Guest seed alike — and proves each one parses to at least one
    unit, so a future authoring mistake is caught before it ever reaches production, not discovered by an
    Event Manager in the Player.
28. As a developer, I want that Bootstrap Integration Test to run as part of the existing `npm test` gate,
    so it's structurally impossible to merge a treatment that would trigger the Zero-H3 Guard for a reason
    other than genuinely empty content.
29. As an Event Manager relying on Guest Mode / flight mode, I want the same table-formatted guidance a
    Supabase-backed treatment could show, proven against the actual bundled content I'd see offline — not
    merely proven against a test double standing in for it — so Historical Integrity of GFM-formatted
    protocols holds even with zero network access.
30. As a developer, I want the GFM offline proof and the Guest↔SQL lockstep both to stay true after any
    future edit to the seed treatments, so the two catalogs never silently drift the way the audit found
    they already had for table formatting.
31. As a future engineer reading this project's history, I want to be able to find how every Wave 9 ticket
    was actually resolved without depending on a gitignored directory that could be deleted at any time, so
    the wave's Historical Integrity survives independent of any one person's local `.scratch/` contents.
32. As the Event Manager directing this project, I want this hardening pass itself fully specified and
    reviewable before any code is written, so I can approve the design once rather than discovering
    resilience gaps after a second implementation pass.

### Implementation Decisions

**A. Heuristic Fallback (Content Parser resilience)**

- `parseStructuredMarkdown` gains a second branch, evaluated only when zero `###` headers are found:
  - If the trimmed input is empty (`""` after `.trim()`) → return `[]`, exactly as today. This is the
    **only** remaining path into the Zero-H3 Guard.
  - Otherwise (non-empty, non-whitespace prose, zero H3 headers) → return a single-element array:
    `{ unit_id: "unit-0", unit_order: 0, unit_title: "Continuous Guidance", unit_content: <the entire
    trimmed raw input>, unit_rationale: null }`. `"unit-0"` is a reserved sentinel id, distinct from the
    `unit-1…unit-N` order-based scheme used for H3-structured documents — the two shapes are mutually
    exclusive per document, so no collision is possible. It does not collide with
    `TERMINAL_NEMAR_UNIT_ID` (`"__terminal_nemar__"`).
  - `"Continuous Guidance"` is the canonical English title for this fallback unit; the paired domain gloss
    is **הנחיה רציפה**, following this project's existing bilingual canonical-term convention (e.g.
    "Symptom Group / קבוצת סימפטומים" in `CLAUDE.md`). Flagged as a candidate glossary addition to
    `CONTEXT.md` for whoever implements this — not edited by this documentation-only pass.
  - This realigns the implementation with `decisions.md` DEC-015 §9's own, already-decided "graceful
    degradation" clause ("If parsing fails, the unit falls back to a single `unit_content` container"),
    which Wave 9 core never actually implemented — this is a correction, not a new policy invented outside
    the domain model.
  - A leading preamble before a document's first H3 (a mixed prose+H3 document) is unaffected and
    explicitly out of scope for this amendment — Wave 9 core's existing behavior (preamble lines are
    skipped, not collected) is unchanged; only the *all-prose, zero-H3* document gets the new branch.
    **Superseded (2026-08-31):** Ticket 02 deliberately reverses this preamble clause. Non-whitespace
    content before the first H3 is now preserved as a leading `unit-0` "Continuous Guidance" unit; the
    H3-derived units retain their existing `unit-1…unit-N` ids, and the all-prose fallback is unchanged.
- **Healing Principle:** honors Reciprocity (הדדיות) — the exact clinical text Sigal authored is always
  respected and delivered to the Event Manager, even when it lacks strict semantic header spacing.

**B. All-or-Nothing Loading (Safe Container Gate)**

- `UnifiedPlayerScreen` gains an explicit, ephemeral, screen-local loading phase — not a `PlayerEngine`
  state, preserving Dumb Reflection — with (at minimum) three phases: resolving → ready → recovery.
- The screen must never render the Active phase (units, `NavigationTreePanel`, `FinishBar`,
  `TerminalNemarUnit`) until **all** of the following have resolved for the session's `treatment_id`:
  `RepositoryPort.getTreatment(id)` has settled, the Content Parser has run against its result, and the
  parsed units are in the `pic-web` content cache. This closes both empty-content mount shapes the audit
  found: a Terminal-NEMAR-only session (empty `unitIds` before this fix) and a stale-unit-ids-with-live-
  empty-parse session.
- This gate applies uniformly at every path that can put the Event Manager on this screen: a fresh
  `startSession` mount, same-tab resume (`activePlayerSessionId` already set), and any future boot-time
  rehydrate of a persisted session blob — the gate lives at the screen's entry, not inside any one caller,
  so it structurally covers callers that don't exist yet.
- If resolution fails, or resolves to a genuinely empty parse (post-Heuristic-Fallback, so this is now the
  rare "authored truly nothing" case), the screen renders the same sovereign `ZERO_H3_GUARD_MESSAGE` copy
  used at the picker, inline, with a sovereign recovery action back to the picker — never a blank article,
  never a Terminal-NEMAR-only run with `[Finish Anyway]` available on unexecuted guidance.
- **Healing Principle:** protects the Safe Container. Holding the Event Manager at the Gate on failure — 
  with a sovereign way out — is categorically different from silently letting them "complete" a hollow
  session.

**C. Bootstrap Data Integrity (CI Shift-Left)**

- A new Bootstrap Integration Test reads every treatment's `structured_markdown` from both Sources of
  Truth this project already keeps in lockstep — the Supabase migration SQL
  (`supabase/migrations/20260730194911_tracer_bullet_schema.sql`, plus any future migration that adds or
  updates a treatment row) and the Local Guest seed
  (`packages/pic-engine/src/tracer-bullet-seed-treatments.ts`'s `TRACER_BULLET_SEED_TREATMENT_ROWS`) — and
  asserts every single one parses to `.length >= 1` via `parseStructuredMarkdown` (H3 split or, after
  Decision A, Heuristic Fallback).
- This is a build-time/test-time gate, not a runtime database constraint — it runs as part of the existing
  `npm test` suite, alongside the other module-isolation and contract-suite checks this wave already gates
  on.
- **Engineering Principle:** catches an authoring error (e.g., a treatment saved as a genuinely empty
  string) at build time, before it can ever reach an Event Manager as a live Zero-H3 Guard trigger in
  production.

**D. Un-mocked GFM Offline Proof**

- At least one of the three seed treatments in `TRACER_BULLET_SEED_TREATMENT_ROWS` gains a real
  GitHub-Flavored-Markdown table (ideally alongside a strikethrough span and a task list, matching ticket
  04's original "tables, strikethrough, task lists all render correctly" acceptance bar) inside its
  `structured_markdown`. Per the audit's lockstep constraint, this widens the **existing** seed row's
  content (no fourth id introduced — Guest↔Supabase FK alignment is preserved) via a new **`UPDATE`**
  migration (an already-applied `INSERT` migration is never rewritten), mirrored byte-identical into the
  TypeScript constant, with the Content Parser's seed-fixture tests updated to match the new content.
- `atomic-unit-view.test.tsx`'s GFM assertion (`getByRole("table")`, a checked task-list checkbox,
  strikethrough-adjacent text) must be re-proven through a real, un-mocked call into
  `LocalGuestRepository.getTreatment` → the real Content Parser → the real composition-root content cache
  — not `mockResolvedValue` on `getParsedTreatmentContent`. The existing mocked case may remain as an
  additional, faster unit test, but it no longer stands alone as the wave's only GFM proof.
- `happy-path-e2e.test.tsx` gains a `<table>` assertion during the Player phase, closing the audit's
  observation that the E2E spine never checks for one today.

**E. Durable Resolutions Appendix**

- Every `## Resolution` log across all eight ticket files under
  `.scratch/md_content_integration/issues/` — reconstructing the six that were never written (02, 03, 04,
  05, 07, 08) from the already-shipped commits and tests, per the audit's own Appendix A reconstruction —
  is compiled and permanently archived as **"Appendix A — Ticket Resolution Log"** inside
  `docs/audits/wave-9-handoff.md`, which is git-tracked, unlike `.scratch/` (`.gitignore:4`).
- This is the durable record from this point forward; `.scratch/` remains the working/ephemeral copy for
  active ticket iteration, exactly as `wave-orchestrator.md` intends, but is no longer the *only* place
  these resolutions exist.

### Testing Decisions

- **Content Parser**: new unit tests for the Heuristic Fallback branch — non-empty/zero-H3 prose → single
  `unit-0` "Continuous Guidance" unit with the full trimmed input as `unit_content` and `unit_rationale:
  null`; empty-string and whitespace-only inputs still → `[]`. Existing H3-present and seed-fixture tests
  are unaffected and must stay green unchanged.
- **Bootstrap Integration Test**: a new test (new file, e.g. under `pic-engine`'s test suite, since the
  parser it exercises lives there and it needs zero adapter/UI dependency) that reads the migration SQL
  file and the Local Guest seed module as its two data sources and table-drives an assertion of
  `parseStructuredMarkdown(row.structured_markdown).length >= 1` for every row found in either source.
- **`UnifiedPlayerScreen`**: new tests proving (1) the screen renders a loading/resolving state, never the
  Active phase, until `getTreatment` + parse + cache have all settled; (2) a fresh `startSession` mount, a
  same-tab resume, and a rejected/failed `getTreatment` call all route through the same gate; (3) a
  genuinely empty parse (post-Heuristic-Fallback) renders `ZERO_H3_GUARD_MESSAGE` with a working recovery
  action, never a Terminal-NEMAR-only or blank render.
- **`AtomicUnitView` / Guest GFM**: replace (or add alongside) the existing mocked GFM test with one that
  renders through the real `LocalGuestRepository` → real parser → real cache path, asserting the same
  table/strikethrough/task-list expectations against real bundled content.
- **Test only external behavior**: what the screen renders, what `startSession` receives, what the
  Bootstrap test asserts about parse output length — never the loading phase's internal variable names or
  the cache's internal storage shape, matching this codebase's existing testing philosophy.

### Out of Scope (Wave 9.1)

- The `unit_rationale` "info" affordance UI — still deferred, unaffected by this amendment.
- Any change to `PlayerEngine`'s public API, state machine, schema, or the promotion RPC — Path B holds.
- A generic "malformed content" taxonomy beyond the empty-vs-non-empty-zero-H3 distinction — no third
  category is introduced.
- Boot-time rehydrate of `activePlayerSessionId` from persisted storage itself (Should-Fix #3 in the
  audit) — Decision B's gate is built so that feature, whenever it ships, is automatically covered by it,
  but building the rehydrator itself is not this amendment's scope.
- `content_format` values other than `'structured_markdown'` — still unimplemented, still Should-Fix #1 in
  the audit, not escalated to Must-Fix by this amendment.
- Renaming `PersistenceGateModal`'s internal `promotionStatus === "failed"` / `preRpcPromotionFailed`
  naming (audit Should-Fix #4) — unrelated subsystem, not touched here.

### Further Notes (Wave 9.1)

- This amendment is deliberately sequenced as documentation-first: the spec and tickets are updated and
  reviewed before any sub-agent is spawned against them, per the Event Manager's explicit Phase 1
  constraint.
- Recommended (not executed by this pass): once approved, add "Continuous Guidance / הנחיה רציפה" to
  `CONTEXT.md`'s glossary alongside the other canonical bilingual terms, and add a short ADR note if the
  `unit-0` sentinel scheme needs to be referenced from a future ticket outside this wave.

## Implementation Roadmap (Priority Triage, Wave 9)

**Immediate must-haves** (the actual "Skeleton → Breathing Product" content wiring):

1. Wire `structured_markdown` from Postgres (authenticated) and the bundled Local Guest seed (flight
   mode) to the Player, via the Content Parser + `getTreatment` + the new `pic-web` content seam.
2. Update `TRACER_BULLET_SEED_TREATMENTS` with the real Markdown so DEC-017 flight-mode parity holds for
   content, not just titles.
3. Fix the Persistence Gate's silent-fail sign-in path (a real, pre-existing production bug the Current
   Truth audit surfaced — see "Bundled Fix" below; unrelated to content wiring but bundled into this wave
   at Executive direction).
4. Confirm — not (re-)build — that the Terminal NEMAR mandatory-last-step guarantee (DEC-015 §7b) still
   holds once `startSession` is fed real, dynamically-sized unit arrays instead of the fixed 2-item stub.
   **This is already implemented and already tested** (`PlayerEngine.startSession` unconditionally
   appends `TERMINAL_NEMAR_UNIT_ID` regardless of its `unitIds` argument's contents or length); this
   wave's job is a regression test proving the real-content path doesn't disturb it, not new logic.

**Tech-debt prevention** (regression guards on guarantees this wave's changes touch tangentially):

- **Pointer vs. Copy (Lazy Flip) / no-snapshot discipline (DEC-016 §5):** already true today —
  `TimelineEngine` links `treatment_id` + `library_row_id` only, never a content snapshot (see
  `timeline-engine.test.ts`'s existing "links ... without embedding any content or markdown snapshot"
  case), and `PlayerSession`/`player_sessions.units` never gains a content field under this spec's Path B
  decision. This wave adds no Lazy Flip implementation (still explicitly out of scope per
  `docs/adr/0002-protocol-content-jsonb.md`) — it only needs a regression test confirming the new
  client-side content fetch never gets threaded into anything persisted on the session or the timeline.
- **Zero-H3 Guard** in `TreatmentPickerScreen` — genuinely new logic in this wave (see Implementation
  Decisions above).

**Wave 9.1 must-haves** (Resilience Hardening Amendment, added 2026-08-26 — see the section above for full
decisions):

1. Heuristic Fallback in the Content Parser (Decision A) — non-empty, zero-H3 prose becomes a single
   `unit-0` "Continuous Guidance" unit instead of an empty array.
2. All-or-Nothing Loading in `UnifiedPlayerScreen` (Decision B) — closes the audit's Must-Fix A Safe
   Container leak at mount, resume, and any future restore path.
3. A Bootstrap Integration Test (Decision C) scanning the Supabase migration and the Local Guest seed for
   every treatment's parseability.
4. An un-mocked GFM proof against real Guest content (Decision D), plus lockstep seed/migration/parser
   fixture updates to carry a real table.
5. A durable Appendix A of every ticket's Resolution log inside `docs/audits/wave-9-handoff.md` (Decision
   E), closing the audit's Must-Fix C.

## Testing & TDD Standards (applies to every ticket in this wave)

- **Strict TDD in `pic-engine`**: no Content Parser business logic lands without a prior failing unit
  test — matching this codebase's existing "every transition gets its own test before implementation"
  convention (see `docs/specs/tickets/08-player-engine.md`'s Testing Requirement section for the house
  style to follow).
- **Module isolation**: `npm run depcruise` plus a dedicated source-scan assertion that `player-engine`
  has zero import of the new Content Parser module — the identical pattern already enforcing
  `player-engine` ⇎ `group-engine` isolation.
- **Adversarial Promotion regression**: the promotion RPC's existing adversarial matrix (mid-transaction
  failure, retry idempotency, cross-identity mismatch — already implemented and passing per
  `supabase-repository.test.ts` and `docs/audits/wave-8-handoff.md`'s User Story 37) must still pass
  unchanged after `RepositoryPort` gains `getTreatment` — this wave re-runs it as a regression gate, it
  does not rewrite it.
- **Sovereign Success regression**: `finishAnyway()` unconditionally setting `success_declared: true`
  regardless of unit states or `terminal_nemar_response` is already implemented and tested
  (`player-engine/index.ts`'s `finishAnyway`, User Story 32) — re-asserted as an explicit regression gate
  in this wave, not re-implemented.
- **Wave 9.1 additions**: strict TDD applies identically to the Heuristic Fallback branch and the
  Bootstrap Integration Test (both `pic-engine`, both pure/no-adapter); the All-or-Nothing Loading gate in
  `UnifiedPlayerScreen` gets a failing test per phase transition (resolving → ready, resolving → recovery)
  before implementation, matching this wave's existing state-transition-first discipline.
