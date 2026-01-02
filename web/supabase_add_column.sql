-- Migration: Add textless_poster_url column to store vertical mobile banners
-- Run this in your Supabase SQL Editor

ALTER TABLE public.movies
ADD COLUMN IF NOT EXISTS textless_poster_url text;

ALTER TABLE public.series
ADD COLUMN IF NOT EXISTS textless_poster_url text;
