# PiC agent instructions

## Core seam boundary

Keep all UI, interaction, styling, and UI test changes strictly inside `packages/pic-web`.
Make zero edits to `packages/pic-engine`, adapters, migrations, and their tests unless explicitly
required by an approved active ticket. Keep any such extension within that ticket's declared scope.
Change the root `package-lock.json` only when a dependency change is required by the approved ticket.

## Therapeutic UI invariants

- Lock the adopted screen to one `100dvh` viewport; keep document scrolling off.
- Expose at most two direct choices in the main frame.
- Animate reflected step navigation horizontally, with reduced motion support.
- Scroll long guidance inside its content card, including wide tables.
- Put secondary tools in the accessible `TherapeuticSheet` pull-out drawer.

## Universal wave entry protocol

1. For ANY active wave, start by reading [the Master Wave Index](docs/waves/INDEX.md).
2. Identify the active wave and its ticket suite. The current entry point is
   [Wave 13](docs/waves/wave-13/INDEX.md); follow its specification and ticket-index links.
3. Read [CLAUDE.md](CLAUDE.md) for product language and domain invariants, then read the active ticket.
   Confirm its implementation authorization, blocking dependencies, scope, and out-of-scope boundaries before execution.
4. Execute strictly according to the active ticket's Definition of Done (DoD), acceptance criteria, and testing requirements.
   Record evidence and deviations in its Resolution; mark it complete only when its DoD is satisfied.

Open and closed tickets share `docs/waves/wave-N/tickets/`; Status and Resolution determine their state.
Historical paths can be resolved through [the relocation ledger](docs/waves/RELOCATION.md).
Documentation approval alone does not authorize implementation; wait for the user's ticket-suite green light.
