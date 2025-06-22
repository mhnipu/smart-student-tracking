-- Fix RLS Policies for Users Table
-- This script will add the missing policies that are causing the loading issue

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Allow authenticated users to read their own user record" ON public.users;
DROP POLICY IF EXISTS "Allow authenticated users to update their own user record" ON public.users;

-- Create policies for users table
CREATE POLICY "Allow authenticated users to read their own user record"
ON public.users FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Allow authenticated users to update their own user record"
ON public.users FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Ensure RLS is enabled on users table
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Add policies for other critical tables if they don't exist
DROP POLICY IF EXISTS "Allow authenticated users to manage their own marks" ON public.marks;
CREATE POLICY "Allow authenticated users to manage their own marks"
ON public.marks FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Allow authenticated users to manage their own goals" ON public.goals;
CREATE POLICY "Allow authenticated users to manage their own goals"
ON public.goals FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Allow authenticated users to manage their own suggestions" ON public.suggestions;
CREATE POLICY "Allow authenticated users to manage their own suggestions"
ON public.suggestions FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Make sure subjects are readable by all authenticated users
DROP POLICY IF EXISTS "Allow authenticated users to view all subjects" ON public.subjects;
CREATE POLICY "Allow authenticated users to view all subjects"
ON public.subjects FOR SELECT
USING (auth.role() = 'authenticated'); 