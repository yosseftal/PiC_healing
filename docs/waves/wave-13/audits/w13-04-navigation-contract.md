# W13-04 presentation navigation and draft lifetime contract

Date: 2026-10-26. Baseline: `b9c5a11`, W13-03 closed with 66 files / 686 passing real-schema tests.
This implements the approved W13-04 ticket inside pic-web; no engine, adapter, SQL or promotion-policy changes.

## Ownership and agreed test seams

Composition owns questionnaire presentation, return/focus targets and retained draft lifetime.
The router renders this projection; `deriveGuestFlowScreen` remains the forward projection of committed facts.
One strong-reasoning implementation owner writes pic-web; root owns docs, final heavy runners, reviews and commits.
Existing rendered App/providers/composition actions and browser journeys are the agreed TDD seams.
Use public port snapshots to compare exact IDs, fields, actual answers, versions and completion counts.

Back must not clear `groupFinalized`, `summaryAcknowledged` or `symptomAdditionComplete` to force a screen.
Replace W13-03 presentation-only fact clearing with a composition presentation override.
Actual successful domain operations may still publish their established facts.
Retain title/rows/scores/order, pending revision, actual response, joint advisory phase/dismissal and retry intent
above transient screen mounts. Summary priority failure/retry intent must not disappear on a revisit.
An unchanged forward return to a finalized group is navigation; never call answer/finalize merely to view the next screen.

## Back destinations and frame

- Unified rows return to a minimal prior-entry/preparation surface; retain the complete draft.
- Joint question returns to the list; No advisory returns to the actual question without erasing the saved No.
- Summary returns to joint/list review; treatment selection returns to summary without starting a Player.
- Preparation/help opened during work returns to the exact invoking location and logical focus target.
- Unified rating remains inline; restore its topic/control focus rather than inventing another rating wizard.
- Player remains under its existing Navigation Tree/exit rules, with no added manual Back/Skip/Done control.

Expose one accessible Back in screen chrome outside primary choices. Use the existing horizontal transition primitive,
RTL/LTR logical direction, reduced motion and focus completion. Keep one 100dvh viewport with internal card scrolling.
Before W13-07, the prior-entry surface reuses supplied preparation text and a return action.
Do not introduce unapproved method background, physical instructions or video in this ticket.
Keep the current initial questionnaire landing; W13-07 owns the full welcome surface.
Native browser history is not a domain progress source; no new browser-history integration is required.

## Settlement and identity

Queue presentation changes while admitted writes settle, keep the source visible and announce progress.
On failure retain the source/draft and expose recovery; do not replace a frozen operation UUID, answer or timestamp.
Check generation, provider/context and owning identity before and after waits. An admitted Player start takes precedence
over a queued questionnaire Back. Reset confirmation and cancellation retain their existing separate lifecycle.
Do not reuse the reset drain unchanged: it closes operation admission for reset.

Hide authenticated retained fields synchronously whenever verified identity no longer matches their owner,
including checking/unverified/suspended/another-owner states while composition still remembers the old owner.
Old event handlers cannot submit them. Same-owner reauthentication may reveal retained work under existing policy;
temporary authority loss must not erase work, force sign-out or advance inquiry generation by itself.
Gate, pending promotion and reset recovery remain above questionnaire presentation in precedence.

## Versioned web recovery and truthful limits

Use a bounded schema-versioned sessionStorage envelope for serializable web fields and presentation/focus targets.
Exclude secrets, executable closures and claims that runtime retries were restored.
Validate shape/version/context before reading. Malformed/unsupported data cannot authorize writes.
Retain original Guest record recovery without private engine hydration.
Authenticated restored fields are hidden until same-owner verification, then read-only under existing recovery policy.
Uncertain/lost-response attempts remain read-only after reload wherever exact public reconciliation is unavailable,
including initial Guest submission whose prepared aggregate/IDs existed only in its runtime retry closure.
Never reconstruct a fresh create from such restored raw fields: it could duplicate previously committed work.
Show these reload limits clearly; tab closure/cross-device editable recovery is not promised.
Clear retained work only through successful disposition, established explicit discard/reset or owner-isolation policy.

## Required evidence

Table-driven backward/forward controls; exact before/after domain snapshots; remount, locale/help return;
deferred and failed writes; pending membership revision; reset/cancel and stale generation;
immediate identity visibility; malformed and same-owner read-only reload recovery;
unchanged Player/reset/Gate/Finish/replay behavior; bilingual keyboard/reduced-motion/narrow-screen browser checks.
Run focused red-to-green loops, independent Standards/Spec reviews, then root gates and full real `npm test`.
Same-run UUID fixture cleanup authorization persists. No existing data, treatment file or historical document deletion.
