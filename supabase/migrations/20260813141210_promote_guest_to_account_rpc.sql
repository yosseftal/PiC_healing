-- Ticket 13: Atomic Promotion RPC (promoteGuestToAccount).
--
-- promote_guest_to_account() is the single Supabase RPC (security definer, one implicit transaction)
-- that atomically moves a full Guest session - Symptom Group (+ symptoms), Player session, Library row,
-- and Timeline event - into a newly authenticated account (DEC-017, spec §E). All-or-nothing: any
-- failure (a constraint violation, a dropped connection mid-call) raises and rolls back the entire
-- function body's implicit transaction - there is no exception handler anywhere in this file that
-- swallows an error.
--
-- Idempotency design: `p_guest_group ->> 'id'` (== `PromoteGuestToAccountInput.idempotencyKey`, per that
-- field's own doc comment in packages/pic-engine/src/repository-port.ts - "the Guest Group's client-side
-- UUID, reused as the eventual symptom_groups.id") is the natural conflict key. A retry with the
-- identical full payload (new_user_id + guest_group + symptoms + player_session) is a true no-op - every
-- downstream table already carries the first call's rows (`on conflict do nothing` per idempotency-keyed
-- table), and use_count is never incremented twice for the same player_session.id (see
-- `promoted_session_ids` below). A retry with the SAME id but a DIFFERENT payload rejects outright (Wave
-- 2.5 hardening, PromoteGuestToAccountIdentityMismatchError) - a bare `on conflict do nothing` alone would
-- silently succeed-as-first-writer instead, which is exactly the failure mode being closed. See
-- `promotion_payload_fingerprint` below for how this comparison is made.
--
-- No client-generated Timeline-event UUID exists anywhere in `PromoteGuestToAccountInput` (`group` and
-- `playerSession` are the only two entities carrying a client id) - this function deterministically
-- reuses the promoted player_session's own id as the Timeline event's id instead (a 1:1
-- promotion-scoped event per session, naturally idempotent via the same `on conflict (id) do nothing`
-- mechanism, with no need for a fabricated extra client-generated column).

create extension if not exists pgcrypto;

-- Idempotency-mismatch detection (Wave 2.5 hardening): a fingerprint of the full incoming payload,
-- recorded on first write, compared against any later call reusing the same symptom_groups.id, so a
-- payload mismatch can be rejected instead of silently no-op'd or silently overwritten (see this
-- migration's header comment). Added here, not to ticket 11's already-applied migration, per this
-- ticket's own permission table ("add it in this ticket's own migration file").
alter table public.symptom_groups
  add column if not exists promotion_payload_fingerprint text;

-- Double-use_count-increment guard (ticket 13's Definition of Done: "a promoted_session_id marker on
-- personal_treatment_library"). Tracks every player_session.id that has already been recorded as
-- promoted against this row, so a retry of the same promotion is never re-incremented, while a
-- genuinely different session finishing the same treatment later still increments normally - the same
-- "idempotent under retry, but not under a genuinely new completion" contract `incrementUseCount`
-- (ticket 12) already honors, expressed here as a real column instead of piggybacking on `provenance`
-- (ticket 12 was forbidden from adding migrations at all; this ticket is not).
alter table public.personal_treatment_library
  add column if not exists promoted_session_ids uuid[] not null default '{}';

create or replace function public.promote_guest_to_account(
  p_guest_group jsonb,
  p_symptoms jsonb,
  p_player_session jsonb,
  p_new_user_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_group_id uuid;
  v_session_id uuid;
  v_treatment_id uuid;
  v_linked_group_id uuid;
  v_incoming_fingerprint text;
  v_existing_fingerprint text;
  v_group_found boolean;
  v_symptom jsonb;
  v_library_row_id uuid;
begin
  -- Test-only connection-drop simulation gate (adversarial matrix row 4). Recognized ONLY by this exact
  -- jsonb boolean key. pic-adapter-supabase's real promoteGuestToAccount() always serializes a
  -- FinalizedSymptomGroup's own fixed field set (id/name/symptoms/created_at/joint_treatment_muscle_test/
  -- joint_treatment_test_at) - no shipped code path anywhere ever adds this key, so a normal production
  -- call structurally cannot reach this branch, not merely "is documented not to." Placed as the very
  -- first statement in the function body, before any read or write, so even a hypothetical accidental
  -- hit still guarantees zero rows written. The rollback itself is a deterministic, unconditional `raise`
  -- after `pg_sleep` - not a reliance on flaky network-level query-cancellation timing - so the assertion
  -- "zero rows landed" holds regardless of how the underlying HTTP connection actually behaves.
  if coalesce((p_guest_group ->> '__test_only_connection_drop__')::boolean, false) then
    perform pg_sleep(3);
    raise exception
      'promote_guest_to_account: test-only simulated connection drop (__test_only_connection_drop__ '
      'was set on the payload - this branch is never reachable from production code, which never '
      'sets that key)';
  end if;

  -- Authorization: this RPC is `security definer` specifically so its internal inserts can bypass RLS
  -- (a brand-new account's very first writes), but that must never mean "any caller may promote into any
  -- account." The one legitimate caller is the newly authenticated account's own session (spec §E:
  -- "On successful auth, SessionEngine.promote(guestState, newUserId) calls
  -- RepositoryPort.promoteGuestToAccount" - promotion always runs against the just-signed-in session).
  if auth.uid() is distinct from p_new_user_id then
    raise exception
      'promote_guest_to_account: auth.uid() does not match p_new_user_id - this RPC only promotes '
      'into the calling session''s own newly authenticated account';
  end if;

  if p_guest_group is null or p_symptoms is null or p_player_session is null or p_new_user_id is null then
    raise exception
      'promote_guest_to_account: p_guest_group, p_symptoms, p_player_session, and p_new_user_id are all required';
  end if;

  if jsonb_typeof(p_symptoms) is distinct from 'array' then
    raise exception 'promote_guest_to_account: p_symptoms must be a jsonb array';
  end if;

  v_group_id := (p_guest_group ->> 'id')::uuid;
  v_session_id := (p_player_session ->> 'id')::uuid;
  v_treatment_id := (p_player_session ->> 'treatment_id')::uuid;
  v_linked_group_id := case
    when p_player_session ->> 'linked_group_id' is null or p_player_session ->> 'linked_group_id' = '' then null
    else (p_player_session ->> 'linked_group_id')::uuid
  end;

  if v_group_id is null or v_session_id is null or v_treatment_id is null
     or p_guest_group ->> 'name' is null or p_guest_group ->> 'joint_treatment_muscle_test' is null then
    raise exception
      'promote_guest_to_account: p_guest_group.id/name/joint_treatment_muscle_test and '
      'p_player_session.id/treatment_id are all required';
  end if;

  -- Canonical fingerprint of the *entire* incoming payload (every field of every one of the four
  -- arguments), not just p_new_user_id - matching PromoteGuestToAccountIdentityMismatchError's documented
  -- scope ("any payload mismatch rejects, not only a mismatched newUserId"). `::text` on a jsonb value is
  -- already canonical (Postgres re-serializes jsonb from its binary storage form with normalized key
  -- order and whitespace), so two calls sending byte-different but semantically identical JSON still
  -- fingerprint identically.
  v_incoming_fingerprint := encode(
    digest(
      p_new_user_id::text || '|' || p_guest_group::text || '|' || p_symptoms::text || '|' || p_player_session::text,
      'sha256'
    ),
    'hex'
  );

  select promotion_payload_fingerprint into v_existing_fingerprint
    from public.symptom_groups
    where id = v_group_id;
  v_group_found := found;

  if v_group_found then
    if v_existing_fingerprint is distinct from v_incoming_fingerprint then
      raise exception
        'promote_guest_to_account: idempotency key % was already used with a different payload - '
        'refusing to silently reuse the original promotion''s result or write a second, divergent '
        'one under the same key',
        v_group_id;
    end if;
    -- Matching retry: every table below was already fully written by the original call. Every insert
    -- below is skipped by its own `on conflict do nothing`, and the use_count guard's own
    -- `promoted_session_ids` membership check independently no-ops - so falling through unconditionally
    -- to the writes (rather than branching around them) is safe and requires no separate code path.
  end if;

  insert into public.symptom_groups (
    id, user_id, name, joint_treatment_muscle_test, joint_treatment_test_at,
    created_at, promotion_payload_fingerprint
  )
  values (
    v_group_id,
    p_new_user_id,
    p_guest_group ->> 'name',
    p_guest_group ->> 'joint_treatment_muscle_test',
    (p_guest_group ->> 'joint_treatment_test_at')::timestamptz,
    coalesce((p_guest_group ->> 'created_at')::timestamptz, now()),
    v_incoming_fingerprint
  )
  on conflict (id) do nothing;

  for v_symptom in select * from jsonb_array_elements(p_symptoms)
  loop
    insert into public.symptoms (id, group_id, user_id, name, polarity, intensity)
    values (
      (v_symptom ->> 'id')::uuid,
      v_group_id,
      p_new_user_id,
      v_symptom ->> 'name',
      v_symptom ->> 'polarity',
      (v_symptom ->> 'intensity')::int
    )
    on conflict (id) do nothing;
  end loop;

  -- The FK on linked_group_id (and, for a group-linked session, the just-inserted symptom_groups row
  -- above) is why this must be one transaction: an out-of-order multi-call sequence could otherwise
  -- observe the FK before its target committed. Within one function body, both rows are visible to each
  -- other from the moment they're inserted.
  insert into public.player_sessions (
    id, user_id, treatment_id, linked_group_id, units, terminal_nemar_response,
    success_declared, integrating_reason, finished_at
  )
  values (
    v_session_id,
    p_new_user_id,
    v_treatment_id,
    v_linked_group_id,
    coalesce(p_player_session -> 'units', '[]'::jsonb),
    p_player_session ->> 'terminal_nemar_response',
    coalesce((p_player_session ->> 'success_declared')::boolean, false),
    p_player_session ->> 'integrating_reason',
    (p_player_session ->> 'finished_at')::timestamptz
  )
  on conflict (id) do nothing;

  -- Library row: get-or-create by (user_id, treatment_id), matching getOrCreateLibraryRow's own contract
  -- (ticket 12) - a promotion never creates a second row for a treatment the new account already has one
  -- for.
  insert into public.personal_treatment_library (
    user_id, treatment_id, use_count, provenance, variant_type, global_reference_id
  )
  values (
    p_new_user_id, v_treatment_id, 0,
    jsonb_build_object('source', 'guest_promotion', 'first_seen_at', to_jsonb(now())),
    'original', v_treatment_id
  )
  on conflict (user_id, treatment_id) do nothing;

  select id into v_library_row_id
    from public.personal_treatment_library
    where user_id = p_new_user_id and treatment_id = v_treatment_id;

  -- Increments use_count exactly once for this exact player_session.id, regardless of whether the
  -- library row above was just created or already existed, and regardless of how many times this whole
  -- function is retried with the same session - see this migration's header comment.
  update public.personal_treatment_library
    set use_count = use_count + 1,
        promoted_session_ids = array_append(promoted_session_ids, v_session_id)
    where id = v_library_row_id
      and not (promoted_session_ids @> array[v_session_id]);

  insert into public.timeline_events (
    id, user_id, log_type, treatment_id, library_row_id, linked_group_id, metadata
  )
  values (
    v_session_id, p_new_user_id, 'treatment_execution', v_treatment_id, v_library_row_id, v_linked_group_id, null
  )
  on conflict (id) do nothing;

  -- At minimum group_id and library_row_id (ticket's Definition of Done); session_id and
  -- timeline_event_id are returned too so pic-adapter-supabase can re-fetch every promoted entity's
  -- current, authoritative state (correct on both a fresh write and a matching-retry no-op) without this
  -- function having to duplicate pic-engine's own row-to-domain-object mapping in SQL.
  return jsonb_build_object(
    'group_id', v_group_id,
    'session_id', v_session_id,
    'library_row_id', v_library_row_id,
    'timeline_event_id', v_session_id
  );
end;
$$;

-- Only the calling session's own (already-authenticated) role may invoke this function - never `anon`,
-- and never any role by default `public` grant. Combined with the `auth.uid() = p_new_user_id` check
-- inside the function body above, this closes both the "unauthenticated caller" and the "authenticated
-- caller promoting into someone else's account" attack surfaces a `security definer` function would
-- otherwise open.
revoke all on function public.promote_guest_to_account(jsonb, jsonb, jsonb, uuid) from public;
grant execute on function public.promote_guest_to_account(jsonb, jsonb, jsonb, uuid) to authenticated;
