-- Allow public (anon) access to view active notifications
-- This is necessary because the client-side app might not be using Supabase Auth strictly for session management,
-- or we want site visitors to see announcements even if not fully logged in to Supabase.

DROP POLICY IF EXISTS "Users can view active notifications" ON notifications;

CREATE POLICY "Public can view active notifications"
ON notifications
FOR SELECT
TO anon, authenticated
USING (
  is_active = true 
  AND (expires_at IS NULL OR expires_at > now())
);
