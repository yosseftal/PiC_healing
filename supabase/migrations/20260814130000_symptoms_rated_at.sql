-- Ticket 01: DEC-011 Blind-by-Default — `Symptom.rated_at` persistence column.
-- Nullable, no default, no backfill: existing rows correctly read as "never rated".

alter table public.symptoms
  add column if not exists rated_at timestamptz;
