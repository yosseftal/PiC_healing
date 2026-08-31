-- Wave 9.1+ Ticket 07: allow promote_guest_to_account to promote unlinked Guest Player sessions
-- (p_guest_group null). Idempotency fingerprint for unlinked sessions is stored on player_sessions.

alter table public.player_sessions
  add column if not exists promotion_payload_fingerprint text;

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
  v_session_found boolean;
  v_symptom jsonb;
  v_library_row_id uuid;
begin
  if coalesce((p_guest_group ->> '__test_only_connection_drop__')::boolean, false) then
    perform pg_sleep(3);
    raise exception
      'promote_guest_to_account: test-only simulated connection drop (__test_only_connection_drop__ '
      'was set on the payload - this branch is never reachable from production code, which never '
      'sets that key)';
  end if;

  if auth.uid() is distinct from p_new_user_id then
    raise exception
      'promote_guest_to_account: auth.uid() does not match p_new_user_id - this RPC only promotes '
      'into the calling session''s own newly authenticated account';
  end if;

  if p_player_session is null or p_new_user_id is null then
    raise exception
      'promote_guest_to_account: p_player_session and p_new_user_id are required';
  end if;

  if p_guest_group is not null then
    if p_symptoms is null then
      raise exception 'promote_guest_to_account: p_symptoms is required when p_guest_group is present';
    end if;
    if jsonb_typeof(p_symptoms) is distinct from 'array' then
      raise exception 'promote_guest_to_account: p_symptoms must be a jsonb array';
    end if;
  end if;

  v_session_id := (p_player_session ->> 'id')::uuid;
  v_treatment_id := (p_player_session ->> 'treatment_id')::uuid;
  v_linked_group_id := case
    when p_player_session ->> 'linked_group_id' is null or p_player_session ->> 'linked_group_id' = '' then null
    else (p_player_session ->> 'linked_group_id')::uuid
  end;

  if v_session_id is null or v_treatment_id is null then
    raise exception
      'promote_guest_to_account: p_player_session.id and p_player_session.treatment_id are required';
  end if;

  v_incoming_fingerprint := md5(
    p_new_user_id::text || '|' || coalesce(p_guest_group::text, 'null') || '|' ||
    coalesce(p_symptoms::text, 'null') || '|' || p_player_session::text
  );

  if p_guest_group is null then
    if p_symptoms is not null and jsonb_array_length(p_symptoms) > 0 then
      raise exception
        'promote_guest_to_account: p_symptoms must be empty when p_guest_group is null';
    end if;

    select promotion_payload_fingerprint into v_existing_fingerprint
      from public.player_sessions
      where id = v_session_id;
    v_session_found := found;

    if v_session_found then
      if v_existing_fingerprint is distinct from v_incoming_fingerprint then
        raise exception
          'promote_guest_to_account: idempotency key % was already used with a different payload - '
          'refusing to silently reuse the original promotion''s result or write a second, divergent '
          'one under the same key',
          v_session_id;
      end if;
    end if;

    v_group_id := null;
  else
    v_group_id := (p_guest_group ->> 'id')::uuid;

    if v_group_id is null
       or p_guest_group ->> 'name' is null or p_guest_group ->> 'joint_treatment_muscle_test' is null then
      raise exception
        'promote_guest_to_account: p_guest_group.id/name/joint_treatment_muscle_test and '
        'p_player_session.id/treatment_id are all required';
    end if;

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
    end if;
  end if;

  if p_guest_group is not null then
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
  end if;

  insert into public.player_sessions (
    id, user_id, treatment_id, linked_group_id, units, terminal_nemar_response,
    success_declared, integrating_reason, finished_at, promotion_payload_fingerprint
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
    (p_player_session ->> 'finished_at')::timestamptz,
    case when p_guest_group is null then v_incoming_fingerprint else null end
  )
  on conflict (id) do nothing;

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

  return jsonb_build_object(
    'group_id', v_group_id,
    'session_id', v_session_id,
    'library_row_id', v_library_row_id,
    'timeline_event_id', v_session_id
  );
end;
$$;

revoke all on function public.promote_guest_to_account(jsonb, jsonb, jsonb, uuid) from public;
grant execute on function public.promote_guest_to_account(jsonb, jsonb, jsonb, uuid) to authenticated;
