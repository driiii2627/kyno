-- Only the function needs to be updated. 
-- "CREATE OR REPLACE" will overwrite the existing logic with the new Capped logic.

create or replace function increment_genre_scores(
  p_profile_id uuid,
  p_genres text[]
)
returns void
language plpgsql
security definer
as $$
declare
  genre text;
begin
  -- Ensure the row exists (upsert)
  insert into public.profile_recommendations (profile_id)
  values (p_profile_id)
  on conflict (profile_id) do nothing;

  -- Verify ownership (Optional extra security since RLS applies, but good for RPC)
  if not exists (
      select 1 from public.profiles 
      where id = p_profile_id and user_id = auth.uid()
  ) then
      raise exception 'Unauthorized';
  end if;

  -- Loop through genres and atomically increment (Capped at 100)
  foreach genre in array p_genres
  loop
    update public.profile_recommendations
    set 
      genre_scores = jsonb_set(
        case when genre_scores is null then '{}'::jsonb else genre_scores end,
        array[genre],
        (LEAST(coalesce((genre_scores->>genre)::int, 0) + 1, 100))::text::jsonb
      ),
      updated_at = now()
    where profile_id = p_profile_id;
  end loop;
end;
$$;
