# 22 — Terminal NEMAR Response Feedback & Finish Visibility

**Wave:** 9.2 (P0 Audit Remediation: Terminal Completion & Rehydration Synchronization)

**Blocked by:** none. Independent of ticket 21 (different files), but land after 21 lands to avoid two
agents editing `UnifiedPlayerScreen.tsx` / `unified-player-screen.test.tsx` concurrently.

**Status:** done

**Source (verbatim from Event Manager remediation request):**

> **Context:** The audit returned `Verdict: REFACTOR` due to stale session pointers on completion/promotion
> and lack of visual transition on Terminal NEMAR response submission.
>
> 2. **Add Terminal NEMAR Response Feedback & Finish Visibility:**
>    * Update `TerminalNemarUnit.tsx` to provide clear visual feedback/confirmation upon selecting a
>      response.
>    * Ensure the `Finish` action (in `FinishBar` or adjacent) is clearly visible and accessible once the
>      response is recorded.
>
> 3. **Strict /tdd & Regression Tests:**
>    * Verify all 279+ tests pass and `npm run depcruise --workspaces` returns 0 violations.

## Objective

`TerminalNemarUnit.tsx` (`packages/pic-web/src/TerminalNemarUnit.tsx`) renders two buttons (Yes/No) and only
shows anything extra on a **rejected** promise (`responseStatus === "recovery"`). On a **successful**
response there is zero visual acknowledgement that the click registered — the EM has no in-the-moment
confirmation that their answer was recorded, and no visual cue connecting that answer to the `FinishBar`
that has just become relevant.

`FinishBar` (`packages/pic-web/src/FinishBar.tsx`) already computes `canFinish` from
`session.terminal_nemar_response === "yes"` and is already rendered unconditionally alongside
`TerminalNemarUnit` in `UnifiedPlayerScreen.tsx` (`UnifiedPlayerScreen.tsx:90-100`) — so the `[Finish]`
button already becomes reactive once `playerSessionStore` refreshes
(`composition-root.ts:195-198`, `respondTerminalNemar` already refreshes the store). The gap is **not**
`FinishBar`'s logic; it is that nothing in `TerminalNemarUnit` tells the EM "your response was recorded,
look for Finish below."

## Locked contract (Dumb Reflection — DEC-015)

- `TerminalNemarUnit` must **not** introduce a local `useState` that duplicates
  `session.terminal_nemar_response`. The confirmation UI is derived purely from the already-persisted
  engine value passed down as a prop — this is the same "no component stores rating/response state locally"
  discipline the Wave 9 audit already verified holds for this subtree
  (`docs/audits/wave-9-detailed-audit.md` §2). `responseStatus` (from `useAsyncAction`) is fine to keep as
  transient recovery-UI state; it is not domain state.
- Never use "Failed"/"Error"/"Invalid" framing for a "No" response — "No" is **Integrating**, per
  `CLAUDE.md` §E and `decisions.md` DEC-015 §7b. Confirmation copy for "No" must read as a normal,
  non-judgmental outcome (e.g. "Integrating"), not a failure state.
- `[[Finish Anyway]]` must remain unconditionally available regardless of response, per DEC-015 §4/§7b
  EM Sovereignty — do not gate `FinishBar`'s Finish Anyway button behind the new confirmation UI.

## Required changes

1. **`UnifiedPlayerScreen.tsx`**: pass the current session's `terminal_nemar_response` down —
   `<TerminalNemarUnit sessionId={activePlayerSessionId} response={session.terminal_nemar_response} />`.
2. **`TerminalNemarUnit.tsx`**: accept a new required prop `response: "yes" | "no" | null` (dumb reflection
   of `PlayerSession.terminal_nemar_response`, not local state). When `response !== null`:
   - Render a visible, `role="status"` confirmation element (stable `data-testid`, e.g.
     `terminal-nemar-response-recorded`) whose copy differs by value:
     - `"yes"` → confirms the "Yes" answer was recorded and that Finish is now available.
     - `"no"` → confirms the "No" answer was recorded, framed as Integrating (never "failed"), and that
       `[Finish Anyway]` remains available.
   - Mark the selected button's selected state accessibly (e.g. `aria-pressed={response === "yes"}` /
     `aria-pressed={response === "no"}` on the respective buttons) so assistive tech and tests can both
     observe which answer is current — both buttons stay enabled and clickable (EM may change their answer;
     this is not a lock-in).
   - Keep the existing `responseStatus === "recovery"` retry affordance untouched and still reachable.

## Acceptance Criteria

- [ ] AC1: A new/extended component-level test proves that with `response="yes"` passed as a prop,
      `TerminalNemarUnit` renders a `role="status"` confirmation whose text does not match
      `/error|failed|invalid/i` and does match copy confirming the "Yes" recording, and
      `terminal-nemar-yes` has `aria-pressed="true"`.
- [ ] AC2: Same as AC1 for `response="no"` — confirmation copy reads as Integrating (not failure), and
      `terminal-nemar-no` has `aria-pressed="true"`.
- [ ] AC3: With `response={null}` (initial state), no confirmation element is rendered and neither button is
      `aria-pressed="true"`.
- [ ] AC4: An integration test in `unified-player-screen.test.tsx` (or a sibling test file) proves that
      clicking `terminal-nemar-yes` on a live `UnifiedPlayerScreen` render results in — within the same
      `waitFor` — **both** the new confirmation element **and** `finish-button` becoming visible, without
      requiring a manual re-render/remount. (This is the actual "Finish is clearly visible and accessible
      once the response is recorded" contract, proven end-to-end, not just at the `FinishBar` unit level.)
- [ ] AC5: `[Finish Anyway]` (`finish-anyway-button`) remains present and enabled regardless of `response`
      value in every case above.
- [ ] AC6: All pre-existing tests referencing `TerminalNemarUnit` in `unified-player-screen.test.tsx`
      (the two "offers a visible retry when the Terminal NEMAR response needs another moment" /
      "FinishBar shows [Finish] only when terminal NEMAR is yes" tests) still pass.
- [ ] AC7: `npm run test` (root) shows the same or greater passing-test count than the pre-ticket-21
      baseline, and `npx depcruise --validate .dependency-cruiser.cjs src` (run from `packages/pic-web`)
      reports 0 violations.

## Do Not Touch

- `composition-root.ts`, `guest-flow-facts.ts`, `SessionEngine` — owned by ticket 21; if ticket 21 has not
  yet landed when you start, treat its described current behavior as ground truth and do not fix it here.
- `PlayerEngine.respondTerminalNemar` / any `pic-engine` source — this ticket is presentation-only.
- Do not add a mandatory delay, animation library, or toast/snackbar dependency — a plain, always-visible
  DOM element satisfies "clear visual feedback" without adding new dependencies or timing complexity.

## Resolution

Implemented via strict TDD, one AC per red→green cycle. `TerminalNemarUnit` now accepts a new required
`response: "yes" | "no" | null` prop (dumb reflection of `PlayerSession.terminal_nemar_response`, no local
`useState` duplicate) and renders a `role="status"` `data-testid="terminal-nemar-response-recorded"`
confirmation element when `response !== null`, plus `aria-pressed` on both `terminal-nemar-yes` and
`terminal-nemar-no`. `UnifiedPlayerScreen` passes `response={session.terminal_nemar_response}` through
(one-line wiring, no other change). `FinishBar`, `composition-root.ts`, `guest-flow-facts.ts`, and
`PlayerEngine`/`SessionEngine` were not touched, per the "Do Not Touch" list.

Confirmation copy chosen:
- **Yes:** "Your Yes response was recorded — Finish is now available below."
- **No:** "Your No response was recorded. This session is Integrating — Finish Anyway remains available
  whenever you're ready."

Both strings avoid `/error|failed|invalid/i` framing per DEC-015 §7b / `CLAUDE.md` §E.

- **AC1** — `response="yes"` renders non-failure `role="status"` confirmation + `terminal-nemar-yes`
  `aria-pressed="true"`. Proved by `terminal-nemar-unit.test.tsx:27`
  (`"confirms the Yes response was recorded and Finish is available (AC1)"`): asserts `role="status"`,
  text not matching `/error|failed|invalid/i`, text matching `/yes/i` and `/finish/i`, `terminal-nemar-yes`
  `aria-pressed="true"`, `terminal-nemar-no` not `"true"`. Implementation: `TerminalNemarUnit.tsx:26-32`
  (`aria-pressed={response === "yes"}`) and `TerminalNemarUnit.tsx:41-45` (confirmation block).
- **AC2** — same as AC1 for `response="no"`, framed as Integrating. Proved by
  `terminal-nemar-unit.test.tsx:43`
  (`"confirms the No response was recorded as Integrating, never failure framing (AC2)"`): asserts
  `role="status"`, text not matching `/error|failed|invalid/i`, text matching `/no/i`, `/integrating/i`,
  `/finish anyway/i`, `terminal-nemar-no` `aria-pressed="true"`, `terminal-nemar-yes` not `"true"`.
  Implementation: `TerminalNemarUnit.tsx:33-39` (`aria-pressed={response === "no"}`) and
  `TerminalNemarUnit.tsx:46-51` (confirmation block).
- **AC3** — `response={null}` renders no confirmation, no `aria-pressed="true"`. Proved by
  `terminal-nemar-unit.test.tsx:14`
  (`"renders no confirmation and no aria-pressed selection when response is null (AC3)"`): queries
  `terminal-nemar-response-recorded` is `null`; both buttons' `aria-pressed` is not `"true"`. Written
  first per brief and confirmed green against the pre-ticket component before any implementation change.
- **AC4** — end-to-end: clicking Yes shows confirmation + `finish-button` together in the same `waitFor`,
  no manual re-render. Proved by `unified-player-screen.test.tsx:529`
  (`"clicking terminal-nemar-yes shows the confirmation and finish-button together, without a manual
  re-render (AC4)"`): confirms both `terminal-nemar-response-recorded` and `finish-button` absent before
  the click, then present together inside one `waitFor` (`unified-player-screen.test.tsx:557-562`) after
  `fireEvent.click(screen.getByTestId("terminal-nemar-yes"))`, driven by the real `respondTerminalNemar` →
  `playerSessionStore.refresh` → re-render path (no mocks, no manual remount).
- **AC5** — `finish-anyway-button` present and enabled regardless of `response`. Covered across contexts:
  `unified-player-screen.test.tsx:529` (AC4 test) asserts `finish-anyway-button` present after "yes"
  (`unified-player-screen.test.tsx:568`); `unified-player-screen.test.tsx:571`
  (`"finish-anyway-button remains present and enabled when the response is No (AC5)"`) asserts it is
  present and `disabled === false` with `response="no"`; the pre-existing `unified-player-screen.test.tsx:232`
  test already covers the `null` case (`finish-anyway-button` present before any response is recorded).
- **AC6** — pre-existing Terminal-NEMAR/FinishBar tests still pass:
  `unified-player-screen.test.tsx:232`
  (`"FinishBar shows [Finish] only when terminal NEMAR is yes, and [Finish Anyway] always"`) and
  `unified-player-screen.test.tsx:495`
  (`"offers a visible retry when the Terminal NEMAR response needs another moment"`) — both green,
  unmodified assertions, after the `response` prop was wired through.
- **AC7** — full suite passing-count baseline held/exceeded; depcruise clean. Root `npm run test`:
  **255 passed** (32 test files; 3 pre-existing Supabase-network-dependent suites fail in this sandbox —
  `supabase-repository.test.ts`, `symptoms-rated-at-schema.test.ts`, `promote-path.test.ts` remote block —
  unrelated to this ticket, matching the documented sandbox limitation). 255 ≥ the 250-passing
  post-ticket-21 baseline (5 new tests added by this ticket: 3 in `terminal-nemar-unit.test.tsx` + 2 in
  `unified-player-screen.test.tsx`). `npx depcruise --validate .dependency-cruiser.cjs src` from
  `packages/pic-web`: **0 violations** (631 modules, 1183 dependencies cruised).

All AC1–AC7 satisfied; no scope widening, no edits outside the Read-Write zone, no renamed identifiers.
