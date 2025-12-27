-- 1. Create Profiles Table
create table if not exists profiles (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references auth.users(id) on delete cascade not null,
    name text not null,
    avatar_url text not null,
    internal_id text not null,
    created_at timestamptz default now(),
    updated_at timestamptz default now(),
    last_name_update timestamptz,
    last_avatar_update timestamptz
);

-- 2. Enable RLS
alter table profiles enable row level security;

-- 3. RLS Policies (STRICT)
-- Select: Users can view only their own profiles
create policy "Users can view own profiles"
on profiles for select
using (auth.uid() = user_id);

-- Insert: Users can insert their own profiles (Trigger will handle limit)
create policy "Users can insert own profiles"
on profiles for insert
with check (auth.uid() = user_id);

-- Update: Users can update their own profiles
create policy "Users can update own profiles"
on profiles for update
using (auth.uid() = user_id);

-- Delete: Users can delete their own profiles
create policy "Users can delete own profiles"
on profiles for delete
using (auth.uid() = user_id);

-- 4. Indexes
create index if not exists idx_profiles_user_id on profiles(user_id);

-- 5. Internal ID Generation Function
-- Requirements: 8 chars total. Contains 2 letters, 1 symbol, 3 numbers.
-- We will generate a random string of 8 chars ensuring these constraints.
create or replace function generate_internal_profile_id()
returns text
language plpgsql
as $$
declare
    chars text := 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
    nums text := '0123456789';
    syms text := '!@#$%&*';
    all_chars text := chars || nums || syms;
    result text := '';
    i int;
begin
    -- Strategy: Pick required components then fill the rest, then shuffle (or simplified: just build randomly)
    -- Simplified for robustness:
    -- 1. Pick 2 letters
    result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
    result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
    
    -- 2. Pick 1 symbol
    result := result || substr(syms, floor(random() * length(syms) + 1)::int, 1);
    
    -- 3. Pick 3 numbers
    result := result || substr(nums, floor(random() * length(nums) + 1)::int, 1);
    result := result || substr(nums, floor(random() * length(nums) + 1)::int, 1);
    result := result || substr(nums, floor(random() * length(nums) + 1)::int, 1);
    
    -- 4. Fill remaining 2 chars (Total 8) with anything
    result := result || substr(all_chars, floor(random() * length(all_chars) + 1)::int, 1);
    result := result || substr(all_chars, floor(random() * length(all_chars) + 1)::int, 1);
    
    -- Note: Ideally we would shuffle 'result' here, but for an ID string order might not matter strictly 
    -- as long as components are there. If order matters (random look), we can shuffle.
    -- For now, this deterministic pattern (LLSNNNXX) is safe enough for internal ID.
    -- To make it clearer, we can just use the generated result directly.
    
    return result;
end;
$$;

-- 6. Trigger to Enforce Max 3 Profiles
create or replace function check_profile_limit()
returns trigger
language plpgsql
security definer
as $$
declare
    profile_count int;
begin
    select count(*) into profile_count
    from profiles
    where user_id = auth.uid();
    
    if profile_count >= 3 then
        raise exception 'Limite de 3 perfis por conta atingido.';
    end if;
    
    -- Auto-generate Internal ID if not provided (should be provided, but good fallback)
    if NEW.internal_id is null then
         NEW.internal_id := generate_internal_profile_id();
    end if;

    return NEW;
end;
$$;

create trigger enforce_profile_limit_trigger
before insert on profiles
for each row
execute function check_profile_limit();
