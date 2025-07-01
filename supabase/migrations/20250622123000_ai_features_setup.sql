-- AI Features Database Setup
-- Sets up the tables needed for the AI integration and context-aware suggestions

-- Create the ai_insights table if it doesn't exist
CREATE TABLE IF NOT EXISTS ai_insights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  insight_type text NOT NULL, -- Types: performance, study_pattern, goal_progress, subject_specific
  title text NOT NULL,
  content text NOT NULL,
  confidence_score integer DEFAULT 0, -- 0-100
  priority text DEFAULT 'medium', -- high, medium, low
  subject_id uuid,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create the suggestions table if it doesn't exist (for AI-generated suggestions)
CREATE TABLE IF NOT EXISTS suggestions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  type text NOT NULL, -- resource, study_method, improvement, time_management
  priority text DEFAULT 'medium', -- high, medium, low
  status text DEFAULT 'active', -- active, completed, dismissed
  category text NOT NULL, -- general, subject_specific, exam_prep, etc.
  resource_url text,
  estimated_time text,
  subject_id uuid,
  ai_generated boolean DEFAULT true,
  confidence_score integer DEFAULT 0, -- 0-100
  interaction_count integer DEFAULT 0,
  effectiveness_rating integer,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create RLS policies for ai_insights
CREATE POLICY "Allow authenticated users to manage their own insights"
ON public.ai_insights FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Create RLS policies for suggestions
CREATE POLICY "Allow authenticated users to manage their own suggestions"
ON public.suggestions FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Enable RLS on the tables
ALTER TABLE public.ai_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suggestions ENABLE ROW LEVEL SECURITY;

-- Add foreign key constraints
DO $$
BEGIN
  BEGIN
    ALTER TABLE ai_insights 
    ADD CONSTRAINT ai_insights_subject_id_fkey 
    FOREIGN KEY (subject_id) 
    REFERENCES subjects(id) 
    ON DELETE SET NULL;
  EXCEPTION
    WHEN duplicate_object THEN
      RAISE NOTICE 'Foreign key constraint already exists for ai_insights';
    WHEN undefined_table THEN
      RAISE NOTICE 'Subjects table does not exist for ai_insights constraint';
    WHEN others THEN
      RAISE NOTICE 'Foreign key constraint could not be added to ai_insights: %', SQLERRM;
  END;
  
  BEGIN
    ALTER TABLE suggestions 
    ADD CONSTRAINT suggestions_subject_id_fkey 
    FOREIGN KEY (subject_id) 
    REFERENCES subjects(id) 
    ON DELETE SET NULL;
  EXCEPTION
    WHEN duplicate_object THEN
      RAISE NOTICE 'Foreign key constraint already exists for suggestions';
    WHEN undefined_table THEN
      RAISE NOTICE 'Subjects table does not exist for suggestions constraint';
    WHEN others THEN
      RAISE NOTICE 'Foreign key constraint could not be added to suggestions: %', SQLERRM;
  END;
  
  BEGIN
    ALTER TABLE ai_insights 
    ADD CONSTRAINT ai_insights_user_id_fkey 
    FOREIGN KEY (user_id) 
    REFERENCES auth.users(id) 
    ON DELETE CASCADE;
  EXCEPTION
    WHEN duplicate_object THEN
      RAISE NOTICE 'Foreign key constraint already exists for ai_insights user';
    WHEN others THEN
      RAISE NOTICE 'Foreign key constraint could not be added to ai_insights user: %', SQLERRM;
  END;
  
  BEGIN
    ALTER TABLE suggestions 
    ADD CONSTRAINT suggestions_user_id_fkey 
    FOREIGN KEY (user_id) 
    REFERENCES auth.users(id) 
    ON DELETE CASCADE;
  EXCEPTION
    WHEN duplicate_object THEN
      RAISE NOTICE 'Foreign key constraint already exists for suggestions user';
    WHEN others THEN
      RAISE NOTICE 'Foreign key constraint could not be added to suggestions user: %', SQLERRM;
  END;
END $$; 