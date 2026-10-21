# Wave 10 seam map

Source: `.scratch/wave-10-ui-primitives.md` and canonical tickets 10.6–10.9.

| Ticket | Owned presentation seam | Upstream authority | Downstream dependency | Risk |
| --- | --- | --- | --- | --- |
| 10.6 | `UnifiedPlayerScreen` frame, active card, slide composition | Reflected Player session, parsed treatment content | 10.7 utility integration | Must fix: never animate unreflected movement or duplicate Player state |
| 10.7 | Header `TherapeuticSheet`, Navigation Tree, Finish Anyway | Existing `jumpTo` and `SessionEngine.onFinishRequested` actions | 10.8 action layout | Must fix: keep sovereign actions reachable for all responses |
| 10.8 | Terminal NEMAR action and banner composition | Reflected `terminal_nemar_response` | 10.9 browser hardening | Must fix: no new completion gate or duplicate response state |
| 10.9 | Player browser geometry, accessibility, documentation | Completed 10.6–10.8 composition | Wave closure | Must fix: root gate status reported truthfully; remote tests are environment dependent |

Dependency order: 10.2 + 10.4 → 10.6; 10.5 + 10.6 → 10.7; 10.3 + 10.7 → 10.8; 10.8 → 10.9.

All runtime, styling, and test implementation stays in `packages/pic-web`. The current root typecheck has documented nullability errors in unchanged engine tests; unfiltered remote Supabase tests cannot fetch on this host. The scoped `pic-web` and deterministic local gates remain the ticket gates until those external conditions change.
