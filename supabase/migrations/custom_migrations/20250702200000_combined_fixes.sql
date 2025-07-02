-- Combined fixes for student tracking application
-- This migration includes:
-- 1. Fix for study_sessions test_type column
-- 2. Add last_study_date to users table
-- 3. Update marks constraint

-- ============================================
-- 1. Fix study_sessions test_type not-null constraint
-- ============================================

-- Drop the existing check constraint
ALTER TABLE public.study_sessions
DROP CONSTRAINT IF EXISTS study_sessions_test_type_check;

-- Modify the column to allow NULL values and set a default
ALTER TABLE public.study_sessions
ALTER COLUMN test_type DROP NOT NULL,
ALTER COLUMN test_type SET DEFAULT 'study';

-- Add a new check constraint that allows for our values and NULL
ALTER TABLE public.study_sessions
ADD CONSTRAINT study_sessions_test_type_check
CHECK (test_type IS NULL OR test_type IN ('quiz', 'exam', 'assignment', 'project', 'study'));

-- Update any existing NULL test_type values to 'study'
UPDATE public.study_sessions 
SET test_type = 'study' 
WHERE test_type IS NULL;

-- ============================================
-- 2. Add last_study_date column to users table
-- ============================================

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

-- ============================================
-- 3. Update marks constraint
-- ============================================

-- Alter the marks table to relax the constraint on max_score
DO $$
BEGIN
  -- First check if the constraint exists
  IF EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'marks_max_score_check'
  ) THEN
    -- Drop the existing constraint
    ALTER TABLE public.marks
    DROP CONSTRAINT marks_max_score_check;
    
    -- Add the new relaxed constraint
    ALTER TABLE public.marks
    ADD CONSTRAINT marks_max_score_check 
    CHECK (max_score > 0);
    
    RAISE NOTICE 'Updated max_score constraint for marks table';
  ELSE
    -- Add the constraint if it doesn't exist
    ALTER TABLE public.marks
    ADD CONSTRAINT marks_max_score_check 
    CHECK (max_score > 0);
    
    RAISE NOTICE 'Added max_score constraint to marks table';
  END IF;
END $$; 