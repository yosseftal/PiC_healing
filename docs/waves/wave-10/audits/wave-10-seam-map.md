# Wave 10 seam map

Source: `docs/waves/wave-10/specs/wave-10-ui-primitives.md` and canonical tickets 10.6–10.9.

- **Ticket:** 10.6
  **Owned presentation seam:** `UnifiedPlayerScreen` frame, active card, slide composition
  **Upstream authority:** Reflected Player session, parsed treatment content
  **Downstream dependency:** 10.7 utility integration
  **Risk:** Must fix: never animate unreflected movement or duplicate Player state

- **Ticket:** 10.7
  **Owned presentation seam:** Header `TherapeuticSheet`, Navigation Tree, Finish Anyway
  **Upstream authority:** Existing `jumpTo` and `SessionEngine.onFinishRequested` actions
  **Downstream dependency:** 10.8 action layout
  **Risk:** Must fix: keep sovereign actions reachable for all responses

- **Ticket:** 10.8
  **Owned presentation seam:** Terminal NEMAR action and banner composition
  **Upstream authority:** Reflected `terminal_nemar_response`
  **Downstream dependency:** 10.9 browser hardening
  **Risk:** Must fix: no new completion gate or duplicate response state

- **Ticket:** 10.9
  **Owned presentation seam:** Player browser geometry, accessibility, documentation
  **Upstream authority:** Completed 10.6–10.8 composition
  **Downstream dependency:** Wave closure
  **Risk:** Must fix: root gate status reported truthfully; remote tests are environment dependent


Dependency order: 10.2 + 10.4 → 10.6; 10.5 + 10.6 → 10.7; 10.3 + 10.7 → 10.8; 10.8 → 10.9.

All runtime, styling, and test implementation stays in `packages/pic-web` . The current root typecheck has documented nullability
errors in unchanged engine tests; unfiltered remote Supabase tests cannot fetch on this host. The scoped `pic-web` and
deterministic local gates remain the ticket gates until those external conditions change.
