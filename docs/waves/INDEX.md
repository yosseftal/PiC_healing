# Development Wave Index

Canonical wave documentation lives under **docs/waves/**.
Start with a wave index, then its specification, tickets, audits and final handoff.
Wave 13 implementation is authorized; follow its ticket index for the current execution checkpoint.

## Waves

| Wave | Specification | Tickets | Audit | Handoff |
| --- | --- | --- | --- | --- |
| [0][W0] | — | — | — | — |
| [1][W1] | — | [Suite][T1] | — | — |
| [2][W2] | — | [Suite][T2] | — | — |
| [2.5][W2.5] | — | [Suite][T2.5] | — | — |
| [3][W3] | — | [Suite][T3] | — | — |
| [4][W4] | — | [Suite][T4] | [Document][A4] | — |
| [5][W5] | — | [Suite][T5] | — | — |
| [6][W6] | — | [Suite][T6] | — | [Document][H6] |
| [6.5][W6.5] | — | [Suite][T6.5] | — | [Document][H6.5] |
| [7][W7] | — | [Suite][T7] | — | — |
| [7.5][W7.5] | — | — | — | — |
| [8][W8] | — | [Suite][T8] | — | [Document][H8] |
| [9][W9] | [Document][S9] | — | [Document][A9] | [Document][H9] |
| [9.1][W9.1] | — | — | — | — |
| [9.2][W9.2] | — | [Suite][T9.2] | — | — |
| [10][W10] | [Document][S10] | [Suite][T10] | [Document][A10] | [Document][H10] |
| [11][W11] | [Document][S11] | [Suite][T11] | [Document][A11] | [Document][H11] |
| [12][W12] | [Document][S12] | [Suite][T12] | [Document][A12] | [Document][H12] |
| [13][W13] | [Document][S13] | [Suite][T13] | [Document][A13] | [Checkpoint][H13] |

[W0]: wave-0/INDEX.md
[W1]: wave-1/INDEX.md
[T1]: wave-1/tickets/01-monorepo-tooling-scaffold.md
[W2]: wave-2/INDEX.md
[T2]: wave-2/tickets/02-repository-port-domain-types.md
[W2.5]: wave-2.5/INDEX.md
[T2.5]: wave-2.5/tickets/11-supabase-schema-migration.md
[W3]: wave-3/INDEX.md
[T3]: wave-3/tickets/05-library-engine.md
[W4]: wave-4/INDEX.md
[T4]: wave-4/tickets/07-group-engine.md
[A4]: wave-4/audits/wave-4-audit.md
[W5]: wave-5/INDEX.md
[T5]: wave-5/tickets/09-session-engine.md
[W6]: wave-6/INDEX.md
[T6]: wave-6/tickets/12-adapter-supabase-crud.md
[H6]: wave-6/handoffs/wave-6-handoff.md
[W6.5]: wave-6.5/INDEX.md
[T6.5]: wave-6.5/tickets/01-schema-symptoms-rated-at.md
[H6.5]: wave-6.5/handoffs/wave-6.5-handoff.md
[W7]: wave-7/INDEX.md
[T7]: wave-7/tickets/14-web-app-shell.md
[W7.5]: wave-7.5/INDEX.md
[W8]: wave-8/INDEX.md
[T8]: wave-8/tickets/01-promote-path-wiring.md
[H8]: wave-8/handoffs/wave-8-handoff.md
[W9]: wave-9/INDEX.md
[S9]: wave-9/specs/structured-markdown-content-integration.md
[A9]: wave-9/audits/wave-9-detailed-audit.md
[H9]: wave-9/handoffs/wave-9-handoff.md
[W9.1]: wave-9.1/INDEX.md
[W9.2]: wave-9.2/INDEX.md
[T9.2]: wave-9.2/tickets/21-clear-stale-session-pointers.md
[W10]: wave-10/INDEX.md
[S10]: wave-10/specs/wave-10-ui-primitives.md
[T10]: wave-10/tickets/01-web-visual-foundation-and-design-tokens.md
[A10]: wave-10/audits/wave-10-remediation-seam-map.md
[H10]: wave-10/handoffs/wave-10-handoff.md
[W11]: wave-11/INDEX.md
[S11]: wave-11/specs/wave-11-i18n-spec.md
[T11]: wave-11/tickets/01-persistent-language-choice.md
[A11]: wave-11/audits/wave-11-seam-map.md
[H11]: wave-11/handoffs/wave-11-handoff.md
[W12]: wave-12/INDEX.md
[S12]: wave-12/specs/wave-12-spec.md
[T12]: wave-12/tickets/12-01-brand-palette.md
[A12]: wave-12/audits/production-route-audit-2026-10-18.md
[H12]: wave-12/handoffs/wave-12-handoff.md
[W13]: wave-13/INDEX.md
[S13]: wave-13/specs/wave-13-spec.md
[T13]: wave-13/tickets/INDEX.md
[A13]: wave-13/audits/wave-13-content-audit.md
[H13]: wave-13/handoffs/w13-02-manual-apply-checkpoint.md

Artifact shortcuts open the primary record or ticket suite. Open a wave number for every preserved version,
additional audit and handoff. A dash means no standalone artifact was found; shared specifications remain linked
from the relevant wave index.

Each wave index links directly to every available specification, ticket, audit, handoff and preserved brief.
Missing historical artifacts are explicitly marked rather than recreated. Decimal waves keep their original labels.
Wave 10 remediation remains within its wave; the Wave 9.1 amendment remains in its original combined specification.

## Current review

- [Approved Wave 13 specification](wave-13/specs/wave-13-spec.md)
- [Wave 13 ticket suite and explicit DAG](wave-13/tickets/INDEX.md)
- [Wave 13 content audit and deletion gate](wave-13/audits/wave-13-content-audit.md)
- [Completed Wave 12 handoff](wave-12/handoffs/wave-12-handoff.md)

## Structure and authority

- **specs/** contains the wave's authoritative specification.
- **tickets/** contains open and closed tickets; their Status and Resolution determine state.
- **audits/** contains seam maps, findings and audit evidence.
- **handoffs/** contains final and intermediate handoffs, labeled by their original names.
- **briefs/** contains historical dispatch context; **archive/** and **tickets/drafts/** preserve earlier versions.
- **shared/** holds the cross-wave tracer-bullet specification, architecture diagrams and combined audit.

Status comes from the final handoff and ticket Resolution, not from an old checkpoint.
Archived instructions to reapply stashes or rerun migrations are historical evidence, not current execution instructions.
The preflight did not infer new closure statuses for early waves or synthesize absent ticket files.
Early foundation tickets are grouped by subject; ticket 11 includes original schema work and Wave 2.5 amendments.

The domain glossary, decisions, ADRs, reusable agent workflows and remote-testing guide remain at their established
cross-project locations. Source-code comments may retain historical paths; use the relocation ledger to find them.

## Preservation and navigation

- [Relocation ledger](RELOCATION.md): every old path and its new canonical destination.
- [Machine-readable manifest](relocation-manifest.json): original SHA-256, byte count and Git tracking status.
- [Preflight verification](PREFLIGHT.md): move integrity, documentation checks and commit scope.
- [Shared references](shared/INDEX.md)

No historical file was deleted, collapsed into another version or discarded as a duplicate.
All 148 inventoried documents were moved one-to-one, with SHA-256 verified immediately after the move.
112 tracked sources used git mv; 36 previously ignored local records were moved without overwriting targets.
Subsequent changes repair documentation references, preserve line formatting rules and record the approved Wave 13 state.
