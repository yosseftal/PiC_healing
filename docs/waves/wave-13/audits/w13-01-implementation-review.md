# W13-01 implementation review

**Review baseline:** `bf49e50`; includes the working-tree implementation and newly added files.
**Scope:** approved unified-row refinement in W13-01, not the archived separate rating pass.

## Standards

Independent read-only review found no hard architectural violation.
The web staging decorator buffers GroupEngine writes during an exclusive composition operation.
Existing admitted operations drain first; new operations cannot observe or contaminate the staging window.
GroupEngine still owns materialization and rating validation. One complete group is flushed before publication.
Flush retries retain the same group/symptom IDs; provider, owner and inquiry generation checks remain in place.
All implementation and test changes remain inside pic-web. Generic blind 0–10 re-rating is unchanged.

The optional hygiene observation identified two unused strings from the superseded flow.
Both were removed from the typed dictionary and its translations.

## Spec

Independent read-only review identified two actionable findings, both resolved and re-reviewed:

1. Retained nonempty legacy groups with unrated topics were incorrectly blocked from continuation.
   They now retain the established continuation without assigning scores or changing timestamps.
2. Moving a topic focused its name input instead of preserving keyboard access to the move control.
   Focus now stays on the activated button while enabled, with the opposite enabled button as a boundary fallback.

The Hebrew preparation matches the supplied copy. No unrelated source expansion was found.
Follow-up read-only review confirmed both corrections without a new blocking finding.

## Additional regression correction

The retained form initially continued reporting unsaved input after its complete snapshot was committed.
Its dirty marker now applies only before an active group exists. Authenticated unanswered work retains its separate
existing unsaved envelope. Atomic submission tests assert the form marker changes from dirty to settled.
The authenticated post-promotion reset browser cases pass without weakening their original confirmation assertions.

## Evidence and limits

See the [ticket Resolution](../tickets/w13-01-instant-questionnaire-and-initial-rating.md) for final gate results.
Automated Chromium checks and a Hebrew 320px screenshot were reviewed. Native screen-reader and physical-device
results are not inferred from them. Those broader manual gates remain explicit in W13-09.
The review does not authorize deletion of existing data or treatment content.
