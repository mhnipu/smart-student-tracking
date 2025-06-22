-- Fix RLS Policies Migration
-- This migration adds only the missing policies without conflicts

-- Users table policies (these are the most critical for fixing the loading issue)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'users' 
    AND policyname = 'Allow authenticated users to read their own user record'
  ) THEN
    CREATE POLICY "Allow authenticated users to read their own user record"
    ON public.users FOR SELECT
    USING (auth.uid() = id);
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'users' 
    AND policyname = 'Allow authenticated users to update their own user record'
  ) THEN
    CREATE POLICY "Allow authenticated users to update their own user record"
    ON public.users FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);
  END IF;
END $$;

-- Ensure RLS is enabled on users table
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Subjects table policy (needed for the dashboard to load)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'subjects' 
    AND policyname = 'Allow authenticated users to view all subjects'
  ) THEN
    CREATE POLICY "Allow authenticated users to view all subjects"
    ON public.subjects FOR SELECT
    USING (auth.role() = 'authenticated');
  END IF;
END $$;

-- Marks table policy
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'marks' 
    AND policyname = 'Allow authenticated users to manage their own marks'
  ) THEN
    CREATE POLICY "Allow authenticated users to manage their own marks"
    ON public.marks FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- Goals table policy
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'goals' 
    AND policyname = 'Allow authenticated users to manage their own goals'
  ) THEN
    CREATE POLICY "Allow authenticated users to manage their own goals"
    ON public.goals FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- Suggestions table policy
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'suggestions' 
    AND policyname = 'Allow authenticated users to manage their own suggestions'
  ) THEN
    CREATE POLICY "Allow authenticated users to manage their own suggestions"
    ON public.suggestions FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
  END IF;
END $$; 