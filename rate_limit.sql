-- Create table for rate limits
create table if not exists auth_rate_limits (
    id uuid primary key default gen_random_uuid(),
    ip_address text,
    email text,
    attempt_type text not null, -- 'login' or 'register'
    failed_attempts int default 0,
    last_attempt_at timestamptz default now(),
    blocked_until timestamptz
);

create index if not exists idx_rate_limits_ip on auth_rate_limits(ip_address);
create index if not exists idx_rate_limits_email on auth_rate_limits(email);

-- RPC function to check and update rate limits
create or replace function check_and_update_rate_limit(
    request_ip text,
    request_email text,
    request_type text,
    max_attempts int,
    block_duration_seconds int
)
returns json
language plpgsql
security definer
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
    -- Optional: also check email if provided? For now mostly IP based for login attacks
    -- but you could create separate rows for email. Let's stick to IP+Type for simplicity or User+Type.
    -- To adhere to "4 tries per account", we should probably track email.
    -- But attackers can spam multiple emails.
    -- Let's stick to IP for now as it's more robust against botnets trying many emails.
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

    -- 4. If record exists, increment
    -- If enough time passed since last block/attempt (e.g. 1 hour), maybe reset?
    -- For this simple version, we mainly reset on success (handled by client/server logic calling a reset function)
    -- or manually via DB.
    -- Here we just increment.
    
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
            blocked_until = null -- Clear block if it was expired
        where id = record_id;
        
        return json_build_object('allowed', true);
    end if;
end;
$$;

-- Reset function (call this on successful login)
create or replace function reset_rate_limit(
    request_ip text,
    request_type text
)
returns void
language plpgsql
security definer
as $$
begin
    delete from auth_rate_limits
    where ip_address = request_ip
    and attempt_type = request_type;
end;
$$;
