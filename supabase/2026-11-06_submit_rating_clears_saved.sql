-- Rating a place now clears its bookmark inside the same transaction, so a
-- place can't end up both rated and saved if the second step fails.
-- Previously /api/ratings/submit deleted from `saved` in a separate call.
--
-- Also revokes EXECUTE from the public roles: only the server (service_role)
-- calls these, and both take p_user_id as an argument.
--
-- Safe to run more than once.

begin;

create or replace function public.submit_rating(
  p_user_id uuid,
  p_restaurant_id text,
  p_bucket text,
  p_final_rank integer,
  p_tags text[]
) returns void
language plpgsql
as $$
declare
  v_old_bucket text;
  v_old_rank integer;
begin
  if p_bucket not in ('liked', 'ok', 'disliked') then
    raise exception 'invalid bucket: %', p_bucket;
  end if;

  perform pg_advisory_xact_lock(hashtext(p_user_id::text));

  select bucket, rank_position into v_old_bucket, v_old_rank
    from ratings where user_id = p_user_id and restaurant_id = p_restaurant_id;

  if found then
    delete from ratings where user_id = p_user_id and restaurant_id = p_restaurant_id;
    update ratings
      set rank_position = rank_position - 1
      where user_id = p_user_id and bucket = v_old_bucket and rank_position > v_old_rank;
    perform recalculate_bucket_scores(p_user_id, v_old_bucket);
  end if;

  update ratings
    set rank_position = rank_position + 1
    where user_id = p_user_id and bucket = p_bucket and rank_position >= p_final_rank;

  insert into ratings (user_id, restaurant_id, bucket, rank_position, score, tags)
    values (p_user_id, p_restaurant_id, p_bucket, p_final_rank, 0, coalesce(p_tags, '{}'));

  perform recalculate_bucket_scores(p_user_id, p_bucket);

  insert into liked (user_id, restaurant_id)
    values (p_user_id, p_restaurant_id)
    on conflict (user_id, restaurant_id) do nothing;

  -- Saved and visited are mutually exclusive. saved.user_id is text, not uuid.
  delete from saved where user_id = p_user_id::text and restaurant_id = p_restaurant_id;
end;
$$;

revoke execute on function public.submit_rating(uuid, text, text, integer, text[]) from public, anon, authenticated;
revoke execute on function public.recalculate_bucket_scores(uuid, text) from public, anon, authenticated;
grant execute on function public.submit_rating(uuid, text, text, integer, text[]) to service_role;
grant execute on function public.recalculate_bucket_scores(uuid, text) to service_role;

commit;
