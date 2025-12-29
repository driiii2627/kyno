-- Add trailer columns to movies table
ALTER TABLE movies 
ADD COLUMN IF NOT EXISTS trailer_url TEXT,
ADD COLUMN IF NOT EXISTS show_trailer BOOLEAN DEFAULT TRUE;

-- Add trailer columns to series table
ALTER TABLE series 
ADD COLUMN IF NOT EXISTS trailer_url TEXT,
ADD COLUMN IF NOT EXISTS show_trailer BOOLEAN DEFAULT TRUE;
