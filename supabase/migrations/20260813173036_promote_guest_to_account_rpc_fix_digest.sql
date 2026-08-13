-- Ticket 13 hotfix: replace pgcrypto's digest() with core Postgres md5() for the idempotency
-- fingerprint.
--
-- Real-project red-run finding (post-migration-application): the originally applied
-- 20260813141210_promote_guest_to_account_rpc.sql's
--   v_incoming_fingerprint := encode(digest(..., 'sha256'), 'hex');
-- fails on every single call, including plain happy-path ones, with:
--   function digest(text, unknown) does not exist
-- This function declares `set search_path = public`, but this Supabase project (like most Supabase
-- projects) installs pgcrypto into a dedicated `extensions` schema, not `public` - so `digest()` is
-- not resolvable under this function's restricted search_path, regardless of whether
-- `create extension if not exists pgcrypto;` (a no-op here, since the extension already existed
-- elsewhere) ran. Rather than guess at, or widen, this project's exact schema layout for an
-- extension this function doesn't otherwise need, this switches to `md5()` - a core Postgres
-- builtin (pg_catalog), always resolvable under any search_path, on any Postgres install, with no
-- extension dependency at all.
--
-- This is a pure internal-implementation swap: the fingerprint is write-only (compared only against
-- itself on a later call, never returned to any caller, never exposed in any API), so this changes
-- no observable behavior, no column, no return shape, and no test contract - only the RPC's own
-- ability to actually run. `create or replace function` is safe to re-run - this migration
-- re-supplies the function's full, corrected body (a partial patch isn't possible in SQL) rather
-- than editing the already-applied 20260813141210 file, matching this wave's own established rule of
-- never editing an already-applied migration file.

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
  -- fingerprint identically. md5() (core Postgres, pg_catalog) rather than pgcrypto's digest() - see this
  -- migration's header comment; collision-resistance needs here are "detect an accidental/malicious
  -- payload mismatch on a reused key," not a cryptographic security boundary, so md5 is more than
  -- sufficient and removes the extension-schema dependency entirely.
  v_incoming_fingerprint := md5(
    p_new_user_id::text || '|' || p_guest_group::text || '|' || p_symptoms::text || '|' || p_player_session::text
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

-- Re-issued (idempotent, safe to re-run) since `create or replace function` above does not itself
-- reset grants, but a fresh apply from a clean project state must still end up with these exact
-- grants regardless of which of this ticket's two migration files a given environment starts from.
revoke all on function public.promote_guest_to_account(jsonb, jsonb, jsonb, uuid) from public;
grant execute on function public.promote_guest_to_account(jsonb, jsonb, jsonb, uuid) to authenticated;
