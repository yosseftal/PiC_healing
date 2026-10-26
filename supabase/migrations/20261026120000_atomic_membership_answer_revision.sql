-- W13-03: atomic append-and-answer revisions. MANUAL APPLICATION CHECKPOINT.
-- Additive only. Review with the matching client; do not apply automatically.
begin;
alter table public.symptom_groups add column if not exists membership_revision bigint not null default 0;
alter table public.symptom_groups add column if not exists joint_treatment_membership_revision bigint not null default 0;
do $$
begin
  if not exists (select 1 from pg_constraint where conrelid = 'public.symptom_groups'::regclass
      and conname = 'symptom_groups_membership_answer_check') then
    alter table public.symptom_groups add constraint symptom_groups_membership_answer_check check (
      membership_revision between 0 and 9007199254740991
      and joint_treatment_membership_revision between 0 and 9007199254740991
      and membership_revision = joint_treatment_membership_revision);
  end if;
end;
$$;

create table if not exists public.membership_revision_receipts (
  operation_id uuid primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  group_id uuid not null references public.symptom_groups(id) on delete cascade,
  request_fingerprint text not null,
  membership_revision bigint not null check (membership_revision between 1 and 9007199254740991)
);
alter table public.membership_revision_receipts enable row level security;
revoke all on public.membership_revision_receipts from public, anon, authenticated;

create or replace function public.pic_group_projection(p_group_id uuid) returns jsonb
language sql stable set search_path = pg_catalog, public as $$
  select jsonb_build_object(
    'id', g.id, 'name', g.name, 'revision', g.revision,
    'created_at', public.pic_group_timestamp(g.created_at),
    'joint_treatment_muscle_test', g.joint_treatment_muscle_test,
    'joint_treatment_test_at', public.pic_group_timestamp(g.joint_treatment_test_at),
    'symptoms', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', s.id, 'name', s.name, 'polarity', s.polarity, 'intensity', s.intensity,
        'rated_at', public.pic_group_timestamp(s.rated_at)
      ) order by s.priority_position, s.id)
      from public.symptoms s where s.group_id = g.id and s.user_id = g.user_id
    ), '[]'::jsonb)
  ) || case when g.membership_revision = 0 then '{}'::jsonb else jsonb_build_object(
    'membership_revision', g.membership_revision,
    'joint_treatment_membership_revision', g.joint_treatment_membership_revision) end
  from public.symptom_groups g where g.id = p_group_id and g.user_id = auth.uid();
$$;
revoke all on function public.pic_group_projection(uuid) from public, anon, authenticated;

create or replace function public.get_symptom_group(p_group_id uuid) returns jsonb
language sql stable security definer set search_path = pg_catalog, public as $$
  select public.pic_group_projection(p_group_id);
$$;
revoke all on function public.get_symptom_group(uuid) from public, anon;
grant execute on function public.get_symptom_group(uuid) to authenticated;

create or replace function public.save_symptom_group(p_group jsonb) returns jsonb
language plpgsql security definer set search_path = pg_catalog, public as $$
declare
  v_id uuid := (p_group ->> 'id')::uuid;
  v_owner uuid := auth.uid();
  v_existing public.symptom_groups%rowtype;
  v_found boolean;
  v_current jsonb;
  v_incoming jsonb;
  v_ids uuid[];
  v_existing_ids uuid[];
  v_revision bigint;
  v_written bigint;
begin
  if v_owner is null or v_id is null or jsonb_typeof(p_group) is distinct from 'object' then
    raise exception 'GROUP_PERMISSION: an authenticated owner and group id are required';
  end if;
  if jsonb_typeof(p_group -> 'symptoms') is distinct from 'array' then
    raise exception 'GROUP_MEMBERSHIP: symptoms must be an array';
  end if;
  if p_group ? 'revision' and not public.pic_valid_group_revision(p_group -> 'revision') then
    raise exception 'GROUP_REVISION: revision must be a nonnegative safe integer';
  end if;
  if (p_group ? 'membership_revision') <> (p_group ? 'joint_treatment_membership_revision')
     or (p_group ? 'membership_revision' and (
       not public.pic_valid_group_revision(p_group -> 'membership_revision')
       or not public.pic_valid_group_revision(p_group -> 'joint_treatment_membership_revision')
       or p_group ->> 'joint_treatment_test_at' is null
       or p_group -> 'membership_revision' is distinct from p_group -> 'joint_treatment_membership_revision')) then
    raise exception 'GROUP_ANSWER_MEMBERSHIP: invalid answer association';
  end if;
  perform pg_advisory_xact_lock(hashtextextended('pic-group:' || v_id::text, 0));
  select * into v_existing from public.symptom_groups where id = v_id for update;
  v_found := found;
  if v_found and v_existing.user_id is distinct from v_owner then
    raise exception 'GROUP_PERMISSION: group belongs to another owner';
  end if;
  if exists (select 1 from public.symptoms where group_id = v_id and user_id is distinct from v_owner) then
    raise exception 'GROUP_PERMISSION: group membership has a different owner';
  end if;

  select coalesce(array_agg((item ->> 'id')::uuid order by ord), array[]::uuid[]) into v_ids
    from jsonb_array_elements(p_group -> 'symptoms') with ordinality as items(item, ord);
  if cardinality(v_ids) <> (select count(distinct id) from unnest(v_ids) as ids(id)) then
    raise exception 'GROUP_MEMBERSHIP: duplicate or missing symptom id';
  end if;
  if exists (select 1 from public.symptoms where id = any(v_ids)
    and (group_id is distinct from v_id or user_id is distinct from v_owner)) then
    raise exception 'GROUP_MEMBERSHIP: symptom belongs to another group or owner';
  end if;

  if (v_found and coalesce((p_group ->> 'membership_revision')::numeric::bigint, 0) <> v_existing.membership_revision)
     or (not v_found and coalesce((p_group ->> 'membership_revision')::numeric::bigint, 0) <> 0) then
    if v_found and (not (p_group ? 'revision')
        or (p_group ->> 'revision')::numeric::bigint <> v_existing.revision) then
      raise exception 'GROUP_REVISION_CONFLICT: refresh the committed group before retrying';
    end if;
    raise exception 'GROUP_ANSWER_MEMBERSHIP: counters are owned by commit_membership_revision';
  end if;
  if v_found then
    if cardinality(v_ids) > (select count(*) from public.symptoms where group_id = v_id) then
      if not (p_group ? 'revision') or (p_group ->> 'revision')::numeric::bigint <> v_existing.revision then
        raise exception 'GROUP_REVISION_CONFLICT: refresh the committed group before retrying';
      end if;
      raise exception 'GROUP_ANSWER_MEMBERSHIP: answered membership changes require commit_membership_revision';
    end if;
    v_current := public.pic_group_projection(v_id);
    -- Ordinary save equality compares persisted typed values, not spelling (UUID case, UTC suffix or fractional width).
    -- This is deliberately separate from promotion's raw JSON fingerprint, which must never be canonicalized.
    v_incoming := jsonb_build_object(
      'id', v_id, 'name', p_group ->> 'name',
      'created_at', public.pic_group_timestamp((p_group ->> 'created_at')::timestamptz),
      'joint_treatment_muscle_test', p_group ->> 'joint_treatment_muscle_test',
      'joint_treatment_test_at', public.pic_group_timestamp((p_group ->> 'joint_treatment_test_at')::timestamptz),
      'symptoms', coalesce((select jsonb_agg(jsonb_build_object(
        'id', (item ->> 'id')::uuid, 'name', item ->> 'name',
        'polarity', item ->> 'polarity', 'intensity', (item ->> 'intensity')::integer,
        'rated_at', public.pic_group_timestamp((item ->> 'rated_at')::timestamptz)
      ) order by ord) from jsonb_array_elements(p_group -> 'symptoms') with ordinality as items(item, ord)), '[]'::jsonb)
    );
    -- Equal persisted content retries cannot advance revision, including a lost response to the initial aggregate flush.
    if v_incoming = (v_current - 'revision' - 'membership_revision' - 'joint_treatment_membership_revision') then
      return v_current;
    end if;
    if not (p_group ? 'revision') or (p_group ->> 'revision')::numeric::bigint <> v_existing.revision then
      raise exception 'GROUP_REVISION_CONFLICT: refresh the committed group before retrying';
    end if;
    select coalesce(array_agg(id order by priority_position, id), array[]::uuid[]) into v_existing_ids
      from public.symptoms where group_id = v_id;
    if v_ids[1:cardinality(v_existing_ids)] is distinct from v_existing_ids
       and cardinality(v_existing_ids) > 0 then
      raise exception 'GROUP_MEMBERSHIP: existing members must be retained in their current order; append only';
    end if;
    if v_existing.revision >= 9007199254740991 then
      raise exception 'GROUP_REVISION_CONFLICT: revision cannot advance beyond the safe integer limit';
    end if;
    v_revision := v_existing.revision + 1;
    update public.symptom_groups set name = p_group ->> 'name', created_at = (p_group ->> 'created_at')::timestamptz,
      joint_treatment_muscle_test = p_group ->> 'joint_treatment_muscle_test',
      joint_treatment_test_at = (p_group ->> 'joint_treatment_test_at')::timestamptz,
      revision = v_revision
      where id = v_id;
  else
    v_revision := coalesce((p_group ->> 'revision')::numeric::bigint, 0);
    insert into public.symptom_groups (
      id, user_id, name, created_at, joint_treatment_muscle_test, joint_treatment_test_at, revision
    ) values (
      v_id, v_owner, p_group ->> 'name', (p_group ->> 'created_at')::timestamptz,
      p_group ->> 'joint_treatment_muscle_test', (p_group ->> 'joint_treatment_test_at')::timestamptz, v_revision
    );
  end if;

  insert into public.symptoms as stored (id, group_id, user_id, name, polarity, intensity, rated_at, priority_position)
    select (item ->> 'id')::uuid, v_id, v_owner, item ->> 'name', item ->> 'polarity',
      (item ->> 'intensity')::integer, (item ->> 'rated_at')::timestamptz, (ord - 1)::integer
    from jsonb_array_elements(p_group -> 'symptoms') with ordinality as items(item, ord)
    on conflict (id) do update set name = excluded.name, polarity = excluded.polarity,
      intensity = excluded.intensity, rated_at = excluded.rated_at
      where stored.group_id = v_id and stored.user_id = v_owner;
  get diagnostics v_written = row_count;
  if v_written <> cardinality(v_ids) then
    raise exception 'GROUP_MEMBERSHIP: symptom id was concurrently bound to another group or owner';
  end if;
  -- Existing positions and every omitted/non-member row are never rewritten by aggregate rating/name saves.
  return public.pic_group_projection(v_id);
end;
$$;
revoke all on function public.save_symptom_group(jsonb) from public, anon;
grant execute on function public.save_symptom_group(jsonb) to authenticated;


-- A receipt represents only this request family. It never creates a Timeline event.
create or replace function public.commit_membership_revision(p_request jsonb) returns jsonb
language plpgsql security definer set search_path = pg_catalog, public as $$
declare
  v_owner uuid := auth.uid();
  v_id uuid := (p_request ->> 'groupId')::uuid;
  v_operation uuid := (p_request ->> 'operationId')::uuid;
  v_group public.symptom_groups%rowtype;
  v_receipt public.membership_revision_receipts%rowtype;
  v_fingerprint text;
  v_current_ids uuid[];
  v_new_ids uuid[];
  v_order uuid[];
  v_answer_at timestamptz := (p_request ->> 'answeredAt')::timestamptz;
begin
  if v_owner is null or v_id is null or v_operation is null then
    raise exception 'GROUP_PERMISSION: authenticated owner, group and operation IDs required';
  end if;
  if jsonb_typeof(p_request) is distinct from 'object'
     or not public.pic_valid_group_revision(p_request -> 'expectedRevision')
     or not public.pic_valid_group_revision(p_request -> 'expectedMembershipRevision')
     or jsonb_typeof(p_request -> 'additions') is distinct from 'array'
     or jsonb_typeof(p_request -> 'orderedSymptomIds') is distinct from 'array'
     or p_request ->> 'answer' is null
     or p_request ->> 'answer' not in ('together', 'split_suggested')
     or v_answer_at is null or not isfinite(v_answer_at) then
    raise exception 'GROUP_ANSWER_MEMBERSHIP: invalid frozen membership request';
  end if;
  if jsonb_array_length(p_request -> 'additions') = 0 or exists (
    select 1 from jsonb_array_elements(p_request -> 'additions') as rows(item)
    where jsonb_typeof(item) is distinct from 'object' or item ->> 'id' is null
      or jsonb_typeof(item -> 'name') is distinct from 'string' or btrim(item ->> 'name') = ''
      or item ->> 'polarity' is null or item ->> 'polarity' not in ('positive', 'negative')
      or not public.pic_valid_group_revision(item -> 'intensity')
      or (item ->> 'intensity')::numeric not between 1 and 10
  ) then raise exception 'GROUP_ANSWER_MEMBERSHIP: additions require explicit initial 1-10 ratings'; end if;

  -- Fixed field tuples match the shared public fingerprint helper; object key insertion order is irrelevant.
  v_fingerprint := md5(jsonb_build_array(p_request -> 'operationId', p_request -> 'groupId',
    p_request -> 'expectedRevision', p_request -> 'expectedMembershipRevision',
    (select jsonb_agg(jsonb_build_array(item -> 'id', item -> 'name', item -> 'polarity', item -> 'intensity') order by ord)
      from jsonb_array_elements(p_request -> 'additions') with ordinality as rows(item, ord)),
    p_request -> 'orderedSymptomIds', p_request -> 'answer', p_request -> 'answeredAt')::text);

  perform pg_advisory_xact_lock(hashtextextended('pic-group:' || v_id::text, 0));
  select * into v_group from public.symptom_groups where id = v_id for update;
  if not found or v_group.user_id is distinct from v_owner then
    raise exception 'GROUP_PERMISSION: group unavailable to this owner';
  end if;
  if exists (select 1 from public.symptoms where group_id = v_id and user_id is distinct from v_owner) then
    raise exception 'GROUP_PERMISSION: group membership has a different owner';
  end if;
  select * into v_receipt from public.membership_revision_receipts where operation_id = v_operation;
  if found then
    if v_receipt.user_id is distinct from v_owner or v_receipt.group_id is distinct from v_id
       or v_receipt.request_fingerprint is distinct from v_fingerprint then
      raise exception 'MEMBERSHIP_OPERATION_MISMATCH: operation UUID already belongs to another request';
    end if;
    return public.pic_group_projection(v_id);
  end if;
  if v_group.revision <> (p_request ->> 'expectedRevision')::numeric::bigint
     or v_group.membership_revision <> (p_request ->> 'expectedMembershipRevision')::numeric::bigint
     or v_group.revision >= 9007199254740991 or v_group.membership_revision >= 9007199254740991 then
    raise exception 'GROUP_REVISION_CONFLICT: refresh before revising membership';
  end if;

  select coalesce(array_agg(id order by priority_position, id), array[]::uuid[]) into v_current_ids
    from public.symptoms where group_id = v_id and user_id = v_owner;
  select array_agg((item ->> 'id')::uuid order by ord) into v_new_ids
    from jsonb_array_elements(p_request -> 'additions') with ordinality as rows(item, ord);
  select coalesce(array_agg(value::uuid order by ord), array[]::uuid[]) into v_order
    from jsonb_array_elements_text(p_request -> 'orderedSymptomIds') with ordinality as rows(value, ord);
  if cardinality(v_new_ids) <> (select count(distinct id) from unnest(v_new_ids) as ids(id))
     or array_position(v_new_ids, null) is not null or array_position(v_order, null) is not null
     or exists (select 1 from public.symptoms where id = any(v_new_ids))
     or cardinality(v_order) <> cardinality(v_current_ids) + cardinality(v_new_ids)
     or cardinality(v_order) <> (select count(distinct id) from unnest(v_order) as ids(id))
     or not (v_order @> (v_current_ids || v_new_ids) and (v_current_ids || v_new_ids) @> v_order) then
    raise exception 'GROUP_MEMBERSHIP: retain every existing ID and add only distinct new IDs in a complete order';
  end if;

  insert into public.symptoms (id, user_id, group_id, name, polarity, intensity, rated_at, priority_position)
    select (item ->> 'id')::uuid, v_owner, v_id, item ->> 'name', item ->> 'polarity',
      (item ->> 'intensity')::numeric::integer, v_answer_at,
      array_position(v_order, (item ->> 'id')::uuid) - 1
    from jsonb_array_elements(p_request -> 'additions') as rows(item);
  update public.symptoms s set priority_position = requested.ord - 1
    from unnest(v_order) with ordinality as requested(id, ord)
    where s.id = requested.id and s.group_id = v_id and s.user_id = v_owner;
  update public.symptom_groups set revision = revision + 1,
    membership_revision = membership_revision + 1,
    joint_treatment_membership_revision = membership_revision + 1,
    joint_treatment_muscle_test = p_request ->> 'answer', joint_treatment_test_at = v_answer_at
    where id = v_id;
  -- Direct isolated SQL fixtures only. The adapter's fixed-field serializer cannot emit this key.
  if p_request -> '__test_only_failure_after_write__' = 'true'::jsonb then
    raise exception 'MEMBERSHIP_TEST_ROLLBACK: simulated failure after membership writes';
  end if;
  insert into public.membership_revision_receipts (operation_id, user_id, group_id, request_fingerprint, membership_revision)
    values (v_operation, v_owner, v_id, v_fingerprint, v_group.membership_revision + 1);
  return public.pic_group_projection(v_id);
end;
$$;
revoke all on function public.commit_membership_revision(jsonb) from public, anon;
grant execute on function public.commit_membership_revision(jsonb) to authenticated;
create or replace function public.promote_guest_to_account(
  p_guest_group jsonb, p_symptoms jsonb, p_player_session jsonb, p_new_user_id uuid
) returns jsonb language plpgsql security definer set search_path = pg_catalog, public as $$
declare
  v_group_id uuid := (p_guest_group ->> 'id')::uuid;
  v_session_id uuid := (p_player_session ->> 'id')::uuid;
  v_treatment_id uuid := (p_player_session ->> 'treatment_id')::uuid;
  v_linked_group_id uuid := nullif(p_player_session ->> 'linked_group_id', '')::uuid;
  v_fingerprint text;
  v_existing_fingerprint text;
  v_existing_owner uuid;
  v_receipt_found boolean;
  v_ordered boolean := p_player_session ? 'payload_version';
  v_membership boolean := p_player_session -> 'payload_version' = '3'::jsonb;
  v_membership_revision bigint := 0;
  v_library_row_id uuid;
  v_ids uuid[];
  v_revision bigint := 0;
begin
  if auth.uid() is null or auth.uid() is distinct from p_new_user_id then
    raise exception 'promote_guest_to_account: auth.uid() does not match p_new_user_id';
  end if;
  if jsonb_typeof(p_player_session) is distinct from 'object' then
    raise exception 'promote_guest_to_account: p_player_session must be an object';
  end if;
  if v_session_id is null or v_treatment_id is null then
    raise exception 'promote_guest_to_account: player session id and treatment id are required';
  end if;
  if v_ordered and p_player_session -> 'payload_version' is distinct from '2'::jsonb
    and p_player_session -> 'payload_version' is distinct from '3'::jsonb then
    raise exception 'promote_guest_to_account: unsupported payload_version';
  end if;
  if p_guest_group is not null then
    if jsonb_typeof(p_guest_group) is distinct from 'object'
       or v_group_id is null or (v_ordered and v_linked_group_id is distinct from v_group_id)
       or p_guest_group ->> 'name' is null or p_guest_group ->> 'joint_treatment_muscle_test' is null then
      raise exception 'promote_guest_to_account: a valid linked group and actual joint answer are required';
    end if;
    if jsonb_typeof(p_symptoms) is distinct from 'array' then
      raise exception 'promote_guest_to_account: p_symptoms must be an array';
    end if;
    if v_membership then
      if not public.pic_valid_group_revision(p_guest_group -> 'membership_revision')
         or not public.pic_valid_group_revision(p_guest_group -> 'joint_treatment_membership_revision')
         or p_guest_group ->> 'joint_treatment_test_at' is null
         or p_guest_group -> 'membership_revision' is distinct from p_guest_group -> 'joint_treatment_membership_revision' then
        raise exception 'GROUP_ANSWER_MEMBERSHIP: v3 requires matching membership and actual-answer revisions';
      end if;
      v_membership_revision := (p_guest_group ->> 'membership_revision')::numeric::bigint;
    end if;
    if v_ordered then
      if not public.pic_valid_group_revision(p_guest_group -> 'revision') then
        raise exception 'promote_guest_to_account: ordered payload requires a nonnegative safe integer revision';
      end if;
      v_revision := (p_guest_group ->> 'revision')::numeric::bigint;
      if exists (select 1 from jsonb_array_elements(p_symptoms) with ordinality as items(item, ord)
        where item -> 'priority_position' is distinct from to_jsonb(ord - 1)) then
        raise exception 'promote_guest_to_account: priority positions must match the complete ordered array';
      end if;
    elsif p_guest_group ? 'revision' or exists (
      select 1 from jsonb_array_elements(p_symptoms) as items(item) where item ? 'priority_position'
    ) then
      raise exception 'promote_guest_to_account: ordering metadata requires payload_version 2';
    end if;
    perform pg_advisory_xact_lock(hashtextextended('pic-group:' || v_group_id::text, 0));
  elsif v_linked_group_id is not null or
    (p_symptoms is not null and (jsonb_typeof(p_symptoms) <> 'array' or jsonb_array_length(p_symptoms) <> 0)) then
    raise exception 'promote_guest_to_account: unlinked promotion requires no group or symptoms';
  end if;
  perform pg_advisory_xact_lock(hashtextextended('pic-session:' || v_session_id::text, 0));

  -- Keep this exact legacy formula. No coalescing omitted metadata into null/zero; no old receipt recomputation.
  v_fingerprint := md5(
    p_new_user_id::text || '|' || coalesce(p_guest_group::text, 'null') || '|' ||
    coalesce(p_symptoms::text, 'null') || '|' || p_player_session::text
  );
  if p_guest_group is null then
    select user_id, promotion_payload_fingerprint into v_existing_owner, v_existing_fingerprint
      from public.player_sessions where id = v_session_id for update;
  else
    select user_id, promotion_payload_fingerprint into v_existing_owner, v_existing_fingerprint
      from public.symptom_groups where id = v_group_id for update;
  end if;
  v_receipt_found := found;
  if v_receipt_found then
    if v_existing_owner is distinct from p_new_user_id or v_existing_fingerprint is distinct from v_fingerprint then
      raise exception 'promote_guest_to_account: idempotency key was already used with a different payload';
    end if;
    select l.id into v_library_row_id from public.personal_treatment_library l
      join public.player_sessions s on s.id = v_session_id and s.user_id = l.user_id and s.treatment_id = l.treatment_id
      join public.timeline_events t on t.id = s.id and t.user_id = l.user_id
        and t.library_row_id = l.id and t.treatment_id = l.treatment_id
      where l.user_id = p_new_user_id and l.treatment_id = v_treatment_id
        and (s.linked_group_id is null or exists (
          select 1 from public.symptom_groups g where g.id = s.linked_group_id and g.user_id = p_new_user_id
        ))
        and (t.linked_group_id is null or exists (
          select 1 from public.symptom_groups g where g.id = t.linked_group_id and g.user_id = p_new_user_id
        ));
    if v_library_row_id is null then
      raise exception 'promote_guest_to_account: committed receipt entities or owner associations are unavailable';
    end if;
    -- An exact replay returns current entities; it never restores old order or ratings over a later legitimate write.
    return jsonb_build_object('group_id', v_group_id, 'session_id', v_session_id,
      'library_row_id', v_library_row_id, 'timeline_event_id', v_session_id);
  end if;
  if exists (select 1 from public.player_sessions where id = v_session_id) then
    raise exception 'promote_guest_to_account: session id is already bound to another request';
  end if;
  if v_linked_group_id is not null and v_linked_group_id is distinct from v_group_id and not exists (
    select 1 from public.symptom_groups where id = v_linked_group_id and user_id = p_new_user_id
  ) then raise exception 'promote_guest_to_account: linked group belongs to another owner or is unavailable'; end if;
  if p_guest_group is not null then
    select coalesce(array_agg((item ->> 'id')::uuid), array[]::uuid[]) into v_ids
      from jsonb_array_elements(p_symptoms) as items(item);
    if cardinality(v_ids) <> (select count(distinct id) from unnest(v_ids) as ids(id))
       or exists (select 1 from public.symptoms where id = any(v_ids)) then
      raise exception 'promote_guest_to_account: duplicate, missing or already-owned symptom id';
    end if;
    insert into public.symptom_groups (
      id, user_id, name, joint_treatment_muscle_test, joint_treatment_test_at,
      created_at, promotion_payload_fingerprint, revision, membership_revision, joint_treatment_membership_revision
    ) values (
      v_group_id, p_new_user_id, p_guest_group ->> 'name', p_guest_group ->> 'joint_treatment_muscle_test',
      (p_guest_group ->> 'joint_treatment_test_at')::timestamptz,
      coalesce((p_guest_group ->> 'created_at')::timestamptz, now()), v_fingerprint, v_revision,
      v_membership_revision, v_membership_revision
    );
    insert into public.symptoms (id, group_id, user_id, name, polarity, intensity, rated_at, priority_position)
      select (item ->> 'id')::uuid, v_group_id, p_new_user_id, item ->> 'name', item ->> 'polarity',
        (item ->> 'intensity')::integer, (item ->> 'rated_at')::timestamptz, (ord - 1)::integer
      from jsonb_array_elements(p_symptoms) with ordinality as items(item, ord);
  end if;
  -- Existing intentional rollback fixture is available only to direct SQL tests, never the adapter serializer.
  if coalesce((p_guest_group ->> '__test_only_connection_drop__')::boolean, false) then
    perform pg_sleep(3);
    raise exception 'promote_guest_to_account: test-only simulated connection drop';
  end if;
  insert into public.player_sessions (
    id, user_id, treatment_id, linked_group_id, units, terminal_nemar_response,
    success_declared, integrating_reason, finished_at, promotion_payload_fingerprint
  ) values (
    v_session_id, p_new_user_id, v_treatment_id, v_linked_group_id,
    coalesce(p_player_session -> 'units', '[]'::jsonb), p_player_session ->> 'terminal_nemar_response',
    coalesce((p_player_session ->> 'success_declared')::boolean, false), p_player_session ->> 'integrating_reason',
    (p_player_session ->> 'finished_at')::timestamptz, case when p_guest_group is null then v_fingerprint else null end
  );
  insert into public.personal_treatment_library (
    user_id, treatment_id, use_count, provenance, variant_type, global_reference_id
  ) values (
    p_new_user_id, v_treatment_id, 0,
    jsonb_build_object('source', 'guest_promotion', 'first_seen_at', to_jsonb(now())), 'original', v_treatment_id
  ) on conflict (user_id, treatment_id) do nothing;
  select id into v_library_row_id from public.personal_treatment_library
    where user_id = p_new_user_id and treatment_id = v_treatment_id;
  update public.personal_treatment_library set use_count = use_count + 1,
    promoted_session_ids = array_append(promoted_session_ids, v_session_id)
    where id = v_library_row_id and not (promoted_session_ids @> array[v_session_id]);
  insert into public.timeline_events (
    id, user_id, log_type, treatment_id, library_row_id, linked_group_id, metadata
  ) values (v_session_id, p_new_user_id, 'treatment_execution', v_treatment_id, v_library_row_id, v_linked_group_id, null);
  return jsonb_build_object('group_id', v_group_id, 'session_id', v_session_id,
    'library_row_id', v_library_row_id, 'timeline_event_id', v_session_id);
end;
$$;
revoke all on function public.promote_guest_to_account(jsonb, jsonb, jsonb, uuid) from public, anon;
grant execute on function public.promote_guest_to_account(jsonb, jsonb, jsonb, uuid) to authenticated;


commit;
