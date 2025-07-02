-- Fix study_sessions test_type not-null constraint
-- This migration modifies the test_type column to allow NULL values
-- and sets a default value to prevent errors

-- First, drop the existing check constraint
ALTER TABLE public.study_sessions
DROP CONSTRAINT IF EXISTS study_sessions_test_type_check;

-- Then modify the column to allow NULL values and set a default
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