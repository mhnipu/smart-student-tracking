-- Fix study_sessions table schema
-- Run this script in the Supabase SQL Editor

-- Create the study_sessions table if it doesn't exist
CREATE TABLE IF NOT EXISTS study_sessions (
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

-- Add missing columns if they don't exist
DO $$ 
BEGIN
  -- Add title column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'study_sessions' AND column_name = 'title'
  ) THEN
    ALTER TABLE study_sessions ADD COLUMN title text DEFAULT 'Study Session';
  END IF;
  
  -- Add session_type column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'study_sessions' AND column_name = 'session_type'
  ) THEN
    ALTER TABLE study_sessions ADD COLUMN session_type text DEFAULT 'study';
  END IF;
  
  -- Add pomodoro_count column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'study_sessions' AND column_name = 'pomodoro_count'
  ) THEN
    ALTER TABLE study_sessions ADD COLUMN pomodoro_count integer DEFAULT 0;
  END IF;
  
  -- Add points_earned column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'study_sessions' AND column_name = 'points_earned'
  ) THEN
    ALTER TABLE study_sessions ADD COLUMN points_earned integer DEFAULT 0;
  END IF;
  
  -- Add is_completed column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'study_sessions' AND column_name = 'is_completed'
  ) THEN
    ALTER TABLE study_sessions ADD COLUMN is_completed boolean DEFAULT false;
  END IF;
  
  -- Check for end_time column and add if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'study_sessions' AND column_name = 'end_time'
  ) THEN
    ALTER TABLE study_sessions ADD COLUMN end_time timestamptz;
  END IF;
  
  -- Ensure duration_minutes is present for calculations
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'study_sessions' AND column_name = 'duration_minutes'
  ) THEN
    ALTER TABLE study_sessions ADD COLUMN duration_minutes integer;
  END IF;
  
  -- Update duration_minutes if null but we have start_time and end_time
  UPDATE study_sessions 
  SET duration_minutes = EXTRACT(EPOCH FROM (end_time - start_time)) / 60
  WHERE duration_minutes IS NULL 
    AND end_time IS NOT NULL 
    AND start_time IS NOT NULL;
  
  -- Update is_completed based on end_time
  UPDATE study_sessions
  SET is_completed = true
  WHERE end_time IS NOT NULL AND is_completed = false;
END $$;

-- Create RLS policy for study_sessions if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'study_sessions' 
    AND policyname = 'Allow authenticated users to manage their own study sessions'
  ) THEN
    CREATE POLICY "Allow authenticated users to manage their own study sessions"
    ON public.study_sessions FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- Enable RLS on study_sessions table
ALTER TABLE public.study_sessions ENABLE ROW LEVEL SECURITY;

-- Add foreign key constraints if possible
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