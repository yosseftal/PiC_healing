# W13-06 implementation review

Baseline: `6a28ed5`. Scope: W13-06 web identity presentation, excluding W13-02 storage preparation.
Independent Standards and Spec reviews ran in fresh contexts using gpt-6.1-sol with high reasoning.
The implementation used gpt-6-luna with high reasoning for the bounded UI and targeted test/debug loop.

## Findings and follow-up

1. Both axes found that a retained registration marker could hide checking, expiry or uncertainty.
   Preserve authoritative lifecycle status; show email verification as the Guest presentation only.
2. Spec review found that retained promotion recovery was invisible after RPC success followed by
   a failed confirmation read or cleanup. Reflect the existing recovery store separately from engine mode.
3. The first full gate found old remote assertions expecting no auth revision field. Extend the exact
   expected shape and assert that sign-out/reauthentication advances the revision.
4. A W13-02 SQL draft exposed the existing treatment extractor's unsupported `FOR UPDATE` parsing.
   Preserve that unapplied draft outside migration discovery until W13-02 owns and tests the helper fix.
   No W13-06 engine change or scanner waiver is needed.

The old reset ARIA snapshot and open-drawer interaction were inspected as potential browser issues.
Actual Chromium execution passed all four assembled Hebrew/English journeys; neither was a reproduced defect.
The generic Sheet and Player state machine remain unchanged.

## Verification

Both presentation findings have failing-then-passing provider regressions. Standards and Spec re-reviews pass.
The corrective focused run passes 31 tests; final root `npm test` passes 57 files / 587 tests and dependency checks.
Root typecheck, web dependency isolation, lint, line length and whitespace checks pass.
Final Chromium command passes 11 cases:
`npm run test:browser -w packages/pic-web -- wave12-journey.browser.test.ts
therapeutic-sheet.browser.test.ts returning-identity.browser.test.ts --workers=2`.
The returning-identity transport now permits exactly one owner-scoped profile-name GET while continuing to assert
zero therapeutic requests. Its former catch-all REST counter reported that new identity read as a false failure.
No generic request exemption or profile-write permission was introduced.

One full rerun encountered transient remote fetch failures; the connectivity check then returned 200 and the next full
run passed. Normal TLS stayed enabled. Final counts match the baseline: profiles 31, groups 23, symptoms 22,
treatments 23, sessions 30, personal library 23, timeline 26. Counts are cleanup evidence, not a content audit.
No live migration was applied. Remote cleanup remained limited to the same test run's fixture UUIDs.
