-- Recreate study_sessions table from scratch
-- This script will drop the table if it exists and create a new one with the correct schema

-- Drop the table if it exists
DROP TABLE IF EXISTS public.study_sessions;

-- Create the study_sessions table with all required columns
CREATE TABLE public.study_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text DEFAULT 'Study Session',
  description text,
  start_time timestamptz DEFAULT now() NOT NULL,
  end_time timestamptz,
  duration_minutes integer,
  session_type text DEFAULT 'study',
  pomodoro_count integer DEFAULT 0,
  points_earned integer DEFAULT 0,
  is_completed boolean DEFAULT false,
  notes text,
  subject_id uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create RLS policy for study_sessions
CREATE POLICY "Allow authenticated users to manage their own study sessions"
ON public.study_sessions FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Enable RLS on study_sessions table
ALTER TABLE public.study_sessions ENABLE ROW LEVEL SECURITY;

-- Add foreign key constraints
DO $$
BEGIN
  BEGIN
    ALTER TABLE study_sessions 
    ADD CONSTRAINT study_sessions_subject_id_fkey 
    FOREIGN KEY (subject_id) 
    REFERENCES subjects(id) 
    ON DELETE SET NULL;
  EXCEPTION
    WHEN duplicate_object THEN
      RAISE NOTICE 'Foreign key constraint already exists';
    WHEN undefined_table THEN
      RAISE NOTICE 'Subjects table does not exist';
    WHEN others THEN
      RAISE NOTICE 'Foreign key constraint could not be added: %', SQLERRM;
  END;
  
  BEGIN
    ALTER TABLE study_sessions 
    ADD CONSTRAINT study_sessions_user_id_fkey 
    FOREIGN KEY (user_id) 
    REFERENCES auth.users(id) 
    ON DELETE CASCADE;
  EXCEPTION
    WHEN duplicate_object THEN
      RAISE NOTICE 'Foreign key constraint already exists';
    WHEN others THEN
      RAISE NOTICE 'Foreign key constraint could not be added: %', SQLERRM;
  END;
END $$;

-- Create an index on user_id for faster queries
CREATE INDEX IF NOT EXISTS study_sessions_user_id_idx ON public.study_sessions(user_id);

-- Create an index on start_time for faster date range queries
CREATE INDEX IF NOT EXISTS study_sessions_start_time_idx ON public.study_sessions(start_time);

-- Add a trigger to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_study_sessions_updated_at ON public.study_sessions;

CREATE TRIGGER update_study_sessions_updated_at
BEFORE UPDATE ON public.study_sessions
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column(); 