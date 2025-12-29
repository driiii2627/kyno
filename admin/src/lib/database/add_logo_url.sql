-- Add logo_url column to movies table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'movies' AND column_name = 'logo_url') THEN
        ALTER TABLE "movies" ADD COLUMN "logo_url" TEXT;
    END IF;
END $$;

-- Add logo_url column to series table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'series' AND column_name = 'logo_url') THEN
        ALTER TABLE "series" ADD COLUMN "logo_url" TEXT;
    END IF;
END $$;
