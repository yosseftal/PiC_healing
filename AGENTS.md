# PiC agent instructions

## Core seam boundary

Keep all Wave 10 visual, interaction, styling, and UI test changes inside
`packages/pic-web`. Make zero edits to `packages/pic-engine`, adapters,
migrations, and their tests. The root `package-lock.json` is permitted only
when a `pic-web` dependency changes.

## Wave 10 therapeutic principles

- Lock the adopted screen to one `100dvh` viewport; keep document scrolling off.
- Expose at most two direct choices in the main frame.
- Animate reflected step navigation horizontally, with reduced motion support.
- Scroll long guidance inside its content card, including wide tables.
- Put secondary tools in the accessible `TherapeuticSheet` pull-out drawer.

## References

- Read [CLAUDE.md](CLAUDE.md) for product language and domain invariants.
- For Wave 10 work, read the [approved specification](docs/waves/wave-10/specs/wave-10-ui-primitives.md)
  and the active ticket in `docs/waves/wave-10/tickets/`.

For any wave, start at [the master wave index](docs/waves/INDEX.md), then read its specification and ticket index.
Open and closed tickets share `docs/waves/wave-N/tickets/`; Status and Resolution determine their state.
Historical paths can be resolved through [the relocation ledger](docs/waves/RELOCATION.md).
Wave 13 documentation approval does not authorize implementation; wait for the user's ticket-suite green light.
