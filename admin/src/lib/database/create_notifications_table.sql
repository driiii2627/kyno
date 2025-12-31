-- Create Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  message text NOT NULL,
  image_url text,
  action_buttons jsonb DEFAULT '[]'::jsonb, -- Array of objects: { label, url, style, color }
  type text NOT NULL DEFAULT 'info', -- 'info', 'warning', 'update', 'promo'
  target_audience text NOT NULL DEFAULT 'all',
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz,
  is_active boolean DEFAULT true
);

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Policy: Admin (Service Role) has full access
-- Note: If you have a specific 'admin' role in auth.users, add that too. 
-- For now, we assume the Admin Panel uses the Service Role Key or bypasses RLS via admin client.
CREATE POLICY "Admins can do everything"
ON notifications
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Policy: Authenticated Users can READ active notifications
CREATE POLICY "Users can view active notifications"
ON notifications
FOR SELECT
TO authenticated
USING (
  is_active = true 
  AND (expires_at IS NULL OR expires_at > now())
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_is_active ON notifications(is_active);
