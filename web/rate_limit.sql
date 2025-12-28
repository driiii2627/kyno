-- 1. Create table for rate limits
create table if not exists auth_rate_limits (
    id uuid primary key default gen_random_uuid(),
    ip_address text,
    email text,
    attempt_type text not null, -- 'login' or 'register'
    failed_attempts int default 0,
    last_attempt_at timestamptz default now(),
    blocked_until timestamptz
);

-- 2. Security & RLS
-- Enable RLS to block all direct access by default
alter table auth_rate_limits enable row level security;

-- No policies are created, which means Default Deny for all roles (anon, authenticated).
-- Access is ONLY possible via the SECURITY DEFINER functions below.

-- Indexes for performance
create index if not exists idx_rate_limits_ip on auth_rate_limits(ip_address);
create index if not exists idx_rate_limits_email on auth_rate_limits(email);

-- 3. RPC Function (Secure)
create or replace function check_and_update_rate_limit(
    request_ip text,
    request_email text,
    request_type text,
    max_attempts int,
    block_duration_seconds int
)
returns json
language plpgsql
security definer -- Execute as function creator (admin), bypassing RLS
set search_path = public -- Prevent search_path hijacking
as $$
declare
    record_id uuid;
    current_failed int;
    current_blocked_until timestamptz;
    new_blocked_until timestamptz;
begin
    -- 1. Find existing record
    select id, failed_attempts, blocked_until
    into record_id, current_failed, current_blocked_until
    from auth_rate_limits
    where ip_address = request_ip
    and attempt_type = request_type
    limit 1;

    -- 2. Check if currently blocked
    if current_blocked_until is not null and current_blocked_until > now() then
        return json_build_object(
            'allowed', false,
            'blocked_until', current_blocked_until
        );
    end if;

    -- 3. If record doesn't exist, create it
    if record_id is null then
        insert into auth_rate_limits (ip_address, email, attempt_type, failed_attempts)
        values (request_ip, request_email, request_type, 1)
        returning id into record_id;
        
        return json_build_object('allowed', true);
    end if;

    -- 4. If record exists, increment logic
    
    -- If enough time (e.g. block duration * 2) has passed since last attempt without being blocked, 
    -- we could consider resetting, but for now we just strictly increment on failure 
    -- and rely on the successful login reset to clear it. 
    -- Or if the block_until has expired, we reset attempts to 1 (new failure chain).
    
    if current_blocked_until is not null and current_blocked_until <= now() then
         -- Punishment over, reset counter to 1 for this new failure
         current_failed := 0;
    end if;

    current_failed := current_failed + 1;

    if current_failed > max_attempts then
        new_blocked_until := now() + (block_duration_seconds || ' seconds')::interval;
        
        update auth_rate_limits
        set failed_attempts = current_failed,
            blocked_until = new_blocked_until,
            last_attempt_at = now()
        where id = record_id;

        return json_build_object(
            'allowed', false,
            'blocked_until', new_blocked_until
        );
    else
        update auth_rate_limits
        set failed_attempts = current_failed,
            last_attempt_at = now(),
            -- Clear blocked_until if it was set but expired, just to be clean
            blocked_until = null 
        where id = record_id;
        
        return json_build_object('allowed', true);
    end if;
end;
$$;

-- 4. Reset function (Secure)
create or replace function reset_rate_limit(
    request_ip text,
    request_type text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
    delete from auth_rate_limits
    where ip_address = request_ip
    and attempt_type = request_type;
end;
$$;

-- 5. IP Registration Limit Function (3 accounts per IP)
create or replace function check_ip_registration_rate_limit(
    request_ip text
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
    account_count int;
begin
    -- Count how many accounts were registered by this IP
    -- We assume 'kyno_user_security_logs' tracks registrations.
    -- Ensure you have this table created.
    select count(*)
    into account_count
    from kyno_user_security_logs
    where registration_ip = request_ip;

    if account_count >= 3 then
        return false; -- Block
    else
        return true; -- Allow
    end if;
end;
$$;
