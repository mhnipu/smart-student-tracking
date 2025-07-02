-- Add last_study_date column to users table
-- This migration adds the last_study_date column that's referenced in the study timer component

-- Check if column exists and add it if it doesn't
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'last_study_date'
  ) THEN
    -- Add last_study_date column
    ALTER TABLE public.users
    ADD COLUMN last_study_date timestamptz DEFAULT NULL;
    
    RAISE NOTICE 'Added last_study_date column to users table';
  ELSE
    RAISE NOTICE 'last_study_date column already exists in users table';
  END IF;
END $$; 