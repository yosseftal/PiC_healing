-- W13-02: additive manual priority and whole-group optimistic concurrency.
-- MANUAL APPLICATION CHECKPOINT: review with the matching client before applying.
-- Old authenticated direct writes fail closed; SELECT/RLS and service-role access remain.
-- No rows/content are deleted. Historical priority was never stored: creation time/ID is only a deterministic fallback.
begin;

alter table public.symptom_groups add column if not exists revision bigint not null default 0;
alter table public.symptoms add column if not exists priority_position integer;

with initial_order as (
  select id, row_number() over (partition by group_id order by created_at asc nulls last, id asc) - 1 as position
  from public.symptoms
)
update public.symptoms s set priority_position = o.position from initial_order o
  where o.id = s.id and s.priority_position is null;

alter table public.symptoms alter column priority_position set not null;
do $$
begin
  if not exists (select 1 from pg_constraint
    where conrelid = 'public.symptom_groups'::regclass and conname = 'symptom_groups_revision_check') then
    alter table public.symptom_groups add constraint symptom_groups_revision_check
      check (revision between 0 and 9007199254740991);
  end if;
  if not exists (select 1 from pg_constraint
    where conrelid = 'public.symptoms'::regclass and conname = 'symptoms_priority_position_check') then
    alter table public.symptoms add constraint symptoms_priority_position_check check (priority_position >= 0);
  end if;
  if not exists (select 1 from pg_constraint
    where conrelid = 'public.symptoms'::regclass and conname = 'symptoms_group_priority_unique') then
    alter table public.symptoms add constraint symptoms_group_priority_unique
      unique (group_id, priority_position) deferrable initially deferred;
  end if;
end;
$$;

-- Keep ordinary JS millisecond spelling while retaining all additional PostgreSQL microseconds.
-- Never run a group projection through JavaScript Date/toISOString: that would discard these extra digits.
create or replace function public.pic_group_timestamp(p_value timestamptz) returns text
language sql stable strict set search_path = pg_catalog, public as $$
  select to_char(p_value at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS')
    || rtrim(right(to_char(p_value at time zone 'UTC', 'US'), 3), '0') || 'Z';
$$;
revoke all on function public.pic_group_timestamp(timestamptz) from public, anon, authenticated;

-- One snapshot produces both the concurrency token and the explicitly ordered symptom projection.
-- Internal helper: callers use get_symptom_group, and all writes return this same projection.
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
  ) from public.symptom_groups g where g.id = p_group_id and g.user_id = auth.uid();
$$;
revoke all on function public.pic_group_projection(uuid) from public, anon, authenticated;

create or replace function public.get_symptom_group(p_group_id uuid) returns jsonb
language sql stable security definer set search_path = pg_catalog, public as $$
  select public.pic_group_projection(p_group_id);
$$;
revoke all on function public.get_symptom_group(uuid) from public, anon;
grant execute on function public.get_symptom_group(uuid) to authenticated;

create or replace function public.pic_valid_group_revision(p_value jsonb) returns boolean
language sql immutable set search_path = pg_catalog, public as $$
  select case when jsonb_typeof(p_value) = 'number' then
    (p_value::text)::numeric between 0 and 9007199254740991
    and trunc((p_value::text)::numeric) = (p_value::text)::numeric
  else false end;
$$;
revoke all on function public.pic_valid_group_revision(jsonb) from public, anon, authenticated;

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

  if v_found then
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
    if v_incoming = (v_current - 'revision') then return v_current; end if;
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

create or replace function public.reorder_group_symptoms(
  p_group_id uuid, p_ordered_symptom_ids uuid[], p_expected_revision bigint
) returns jsonb language plpgsql security definer set search_path = pg_catalog, public as $$
declare
  v_group public.symptom_groups%rowtype;
  v_current_ids uuid[];
begin
  if auth.uid() is null or p_group_id is null then raise exception 'GROUP_PERMISSION: authenticated owner required'; end if;
  if p_expected_revision is null or p_expected_revision < 0 or p_expected_revision > 9007199254740991 then
    raise exception 'GROUP_REVISION: expected revision must be a nonnegative safe integer';
  end if;
  perform pg_advisory_xact_lock(hashtextextended('pic-group:' || p_group_id::text, 0));
  select * into v_group from public.symptom_groups where id = p_group_id for update;
  if not found or v_group.user_id is distinct from auth.uid() then
    raise exception 'GROUP_PERMISSION: group unavailable to this owner';
  end if;
  if exists (select 1 from public.symptoms where group_id = p_group_id and user_id is distinct from auth.uid()) then
    raise exception 'GROUP_PERMISSION: group membership has a different owner';
  end if;
  if v_group.revision <> p_expected_revision then
    raise exception 'GROUP_REVISION_CONFLICT: refresh the committed group before retrying';
  end if;
  select coalesce(array_agg(id order by priority_position, id), array[]::uuid[]) into v_current_ids
    from public.symptoms where group_id = p_group_id and user_id = auth.uid();
  if p_ordered_symptom_ids is null
     or cardinality(p_ordered_symptom_ids) <> cardinality(v_current_ids)
     or cardinality(p_ordered_symptom_ids) <> (select count(distinct id) from unnest(p_ordered_symptom_ids) as ids(id))
     or not (p_ordered_symptom_ids @> v_current_ids and v_current_ids @> p_ordered_symptom_ids) then
    raise exception 'GROUP_MEMBERSHIP: requested order must contain every current symptom exactly once';
  end if;
  if p_ordered_symptom_ids = v_current_ids then return public.pic_group_projection(p_group_id); end if;
  if v_group.revision >= 9007199254740991 then
    raise exception 'GROUP_REVISION_CONFLICT: revision cannot advance beyond the safe integer limit';
  end if;
  update public.symptoms s set priority_position = (requested.ord - 1)::integer
    from unnest(p_ordered_symptom_ids) with ordinality as requested(id, ord)
    where s.id = requested.id and s.group_id = p_group_id and s.user_id = auth.uid();
  update public.symptom_groups set revision = revision + 1 where id = p_group_id;
  return public.pic_group_projection(p_group_id);
end;
$$;
revoke all on function public.reorder_group_symptoms(uuid, uuid[], bigint) from public, anon;
grant execute on function public.reorder_group_symptoms(uuid, uuid[], bigint) to authenticated;

-- Same RPC name and four arguments: legacy callers retain their exact wire shape and original md5 fingerprint.
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
  if v_ordered and p_player_session -> 'payload_version' is distinct from '2'::jsonb then
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
      created_at, promotion_payload_fingerprint, revision
    ) values (
      v_group_id, p_new_user_id, p_guest_group ->> 'name', p_guest_group ->> 'joint_treatment_muscle_test',
      (p_guest_group ->> 'joint_treatment_test_at')::timestamptz,
      coalesce((p_guest_group ->> 'created_at')::timestamptz, now()), v_fingerprint, v_revision
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

-- Keep existing RLS SELECT isolation. A stale deployed client cannot bypass CAS or erase ordering metadata with old DML.
revoke insert, update, delete on public.symptom_groups, public.symptoms from public, authenticated, anon;
commit;
