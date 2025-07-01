-- Fix the marks table test_type constraint
-- This will allow custom test types while still requiring the field to be non-empty

-- Drop the existing check constraint
ALTER TABLE marks 
  DROP CONSTRAINT IF EXISTS marks_test_type_check;

-- Add a new constraint that only requires test_type to be not null and not empty
ALTER TABLE marks 
  ADD CONSTRAINT marks_test_type_check 
  CHECK (test_type IS NOT NULL AND length(trim(test_type)) > 0);

-- Update any existing records to ensure test_type is lowercase for consistency
UPDATE marks
SET test_type = lower(test_type)
WHERE test_type != lower(test_type); 