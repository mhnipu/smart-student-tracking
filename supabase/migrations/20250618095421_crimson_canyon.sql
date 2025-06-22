/*
  # Fix missing foreign key relationship for achievements

  1. Database Changes
    - Add missing foreign key constraint between user_achievements and achievements tables
    - Ensure proper relationship exists for Supabase queries to work

  2. Security
    - No changes to existing RLS policies
    - Maintains existing security model
*/

-- Add the missing foreign key constraint between user_achievements and achievements
DO $$
BEGIN
  -- Check if the foreign key constraint already exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'user_achievements_achievement_id_fkey'
    AND table_name = 'user_achievements'
  ) THEN
    -- Add the foreign key constraint
    ALTER TABLE user_achievements 
    ADD CONSTRAINT user_achievements_achievement_id_fkey 
    FOREIGN KEY (achievement_id) REFERENCES achievements(id) ON DELETE CASCADE;
  END IF;
END $$;