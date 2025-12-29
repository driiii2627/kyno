-- Add logo_url and overview columns to movies table if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'movies' AND column_name = 'logo_url') THEN
        ALTER TABLE "movies" ADD COLUMN "logo_url" TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'movies' AND column_name = 'overview') THEN
        ALTER TABLE "movies" ADD COLUMN "overview" TEXT;
    END IF;
END $$;

-- Add logo_url and overview columns to series table if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'series' AND column_name = 'logo_url') THEN
        ALTER TABLE "series" ADD COLUMN "logo_url" TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'series' AND column_name = 'overview') THEN
        ALTER TABLE "series" ADD COLUMN "overview" TEXT;
    END IF;
END $$;
