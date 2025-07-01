/*
  # Update Marks Table Constraint

  This migration modifies the marks table to allow custom test types.
  It drops the existing CHECK constraint and adds a new one that validates
  the test_type is not empty, rather than restricting to predefined types.
*/

-- Drop the existing check constraint on test_type
ALTER TABLE marks 
  DROP CONSTRAINT IF EXISTS marks_test_type_check;

-- Add a new constraint that only requires the test_type to be not null and not empty
ALTER TABLE marks 
  ADD CONSTRAINT marks_test_type_check 
  CHECK (test_type IS NOT NULL AND length(trim(test_type)) > 0);

-- Update any existing records to ensure test_type is lowercase
UPDATE marks
SET test_type = lower(test_type)
WHERE test_type != lower(test_type); 