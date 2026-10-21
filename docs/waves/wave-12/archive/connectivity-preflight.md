# Wave 12 remote preflight

Date: 2026-10-14 (Asia/Jerusalem).
Command: node scripts/supabase-connectivity-check.mjs
Result: exit 0 with normal TLS verification and approved network execution.
Sandbox-only attempt failed fetch; no configuration or TLS policy changed.

- OpenAPI introspection: 200.
- Expected columns present: profiles, symptom_groups, symptoms, treatments, player_sessions,
  personal_treatment_library, timeline_events.
- promote_guest_to_account RPC present.
- Preflight row counts: profiles31, symptom_groups23, symptoms22, treatments23, player_sessions24,
  personal_treatment_library19, timeline_events19.
- These are existing shared records. Only fixtures created by this run may be cleaned up.
- Own-profile RLS/bootstrap, real auth, verification delivery, and promotion still need ticket-specific evidence.
- .env.local has configured public URL/anon key and a test-only service role key. Values were never printed.
- Test-only admin helpers may provision/clean isolated fixtures; service role must never enter browser runtime.

Public Auth settings read (GET /auth/v1/settings, anon key, no mutation) also passed:
- Email provider enabled: true.
- Signup disabled: false.
- Email auto-confirm: false (email confirmation is enabled).
- This does not establish SMTP delivery, allowed return URLs, or actual mailbox access.
