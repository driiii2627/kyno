-- Migration: Add Rate Limit Columns
-- Run this to update the existing 'profiles' table

ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS last_name_update timestamptz,
ADD COLUMN IF NOT EXISTS last_avatar_update timestamptz;

-- Optional: Update the trigger if you modified the function in the DB
-- (If you haven't updated the function in the DB yet, you might need to drop and recreate the function from the full schema)
-- But for now, just adding columns fixes the immediate table structure issue.
