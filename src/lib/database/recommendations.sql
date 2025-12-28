-- 1. Create the Recommendations table
create table if not exists public.profile_recommendations (
  profile_id uuid references public.profiles(id) on delete cascade primary key,
  genre_scores jsonb default '{}'::jsonb,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Enable RLS
alter table public.profile_recommendations enable row level security;

-- 3. Create Policy: Users can see/edit only their own profile's recommendations (via profile ownership check)
-- Ideally profiles are linked to auth.uid(), so checking if the profile belongs to the user is key.
-- Assuming profiles table has user_id.
create policy "Users can view own recommendations"
  on public.profile_recommendations for select
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = profile_recommendations.profile_id
      and profiles.user_id = auth.uid()
    )
  );

create policy "Users can update own recommendations"
  on public.profile_recommendations for update
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = profile_recommendations.profile_id
      and profiles.user_id = auth.uid()
    )
  );
  
create policy "Users can insert own recommendations"
  on public.profile_recommendations for insert
  with check (
    exists (
      select 1 from public.profiles
      where profiles.id = profile_recommendations.profile_id
      and profiles.user_id = auth.uid()
    )
  );

-- 4. Create RPC Function for Atomic Updates (Race Condition Safe)
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

  -- Loop through genres and atomically increment
  foreach genre in array p_genres
  loop
    update public.profile_recommendations
    set 
      genre_scores = jsonb_set(
        case when genre_scores is null then '{}'::jsonb else genre_scores end,
        array[genre],
        (coalesce((genre_scores->>genre)::int, 0) + 1)::text::jsonb
      ),
      updated_at = now()
    where profile_id = p_profile_id;
  end loop;
end;
$$;
