-- Create a whitelist table for admin emails
CREATE TABLE IF NOT EXISTS public.admin_whitelist (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.admin_whitelist ENABLE ROW LEVEL SECURITY;

-- Insert the initial admin email
INSERT INTO public.admin_whitelist (email)
VALUES ('kaicolivsantos@gmail.com')
ON CONFLICT (email) DO NOTHING;

-- Policies

-- Policy 1: Service Role (Server-side) has full access
CREATE POLICY "Service Role has full access"
ON public.admin_whitelist
AS PERMISSIVE
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Policy 2: Authenticated users can ONLY read their own entry (to verify if they are admins)
-- This allows the middleware (using the user's session) to check if the user is authorized without needing the service key.
CREATE POLICY "Admins can read their own entry"
ON public.admin_whitelist
AS PERMISSIVE
FOR SELECT
TO authenticated
USING (email = auth.email());

-- Lock down access for everyone else (Public/Anon have no access)
