-- Ticket 05: idempotency-key tracking for incrementUseCount — dedicated uuid[] column,
-- matching promoted_session_ids pattern from ticket 13.

alter table public.personal_treatment_library
  add column if not exists used_increment_idempotency_keys uuid[] not null default '{}';
