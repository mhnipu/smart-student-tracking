-- Simple migration to add any missing tables and columns
-- This migration is safe to run on existing databases

-- Create update_updated_at_column function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add missing columns to existing tables safely
DO $$
BEGIN
  -- Add AI-related columns to suggestions table if they don't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'suggestions' AND column_name = 'ai_generated') THEN
    ALTER TABLE suggestions ADD COLUMN ai_generated boolean DEFAULT false;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'suggestions' AND column_name = 'confidence_score') THEN
    ALTER TABLE suggestions ADD COLUMN confidence_score numeric DEFAULT 0 CHECK (confidence_score >= 0 AND confidence_score <= 100);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'suggestions' AND column_name = 'interaction_count') THEN
    ALTER TABLE suggestions ADD COLUMN interaction_count integer DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'suggestions' AND column_name = 'effectiveness_rating') THEN
    ALTER TABLE suggestions ADD COLUMN effectiveness_rating numeric DEFAULT 0 CHECK (effectiveness_rating >= 0 AND effectiveness_rating <= 5);
  END IF;
END $$;

-- Ensure RLS is enabled on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE marks ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE flashcards ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE progress_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE resource_library ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE improvement_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE collaboration_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_memberships ENABLE ROW LEVEL SECURITY;

-- Ensure basic policies exist (only create if they don't exist)
DO $$
BEGIN
  -- Goals policies
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'goals' AND policyname = 'Users can manage own goals') THEN
    CREATE POLICY "Users can manage own goals" ON goals FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;

  -- Achievements policies
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'achievements' AND policyname = 'Anyone can read achievements') THEN
    CREATE POLICY "Anyone can read achievements" ON achievements FOR SELECT TO authenticated USING (true);
  END IF;

  -- User achievements policies
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_achievements' AND policyname = 'Users can manage own achievements') THEN
    CREATE POLICY "Users can manage own achievements" ON user_achievements FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;

  -- Study sessions policies
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'study_sessions' AND policyname = 'Users can manage own study sessions') THEN
    CREATE POLICY "Users can manage own study sessions" ON study_sessions FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;

  -- Notes policies
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'notes' AND policyname = 'Users can manage own notes') THEN
    CREATE POLICY "Users can manage own notes" ON notes FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;

  -- Flashcards policies
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'flashcards' AND policyname = 'Users can manage own flashcards') THEN
    CREATE POLICY "Users can manage own flashcards" ON flashcards FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;

  -- Study plans policies
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'study_plans' AND policyname = 'Users can manage own study plans') THEN
    CREATE POLICY "Users can manage own study plans" ON study_plans FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;

  -- AI insights policies
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'ai_insights' AND policyname = 'Users can read own AI insights') THEN
    CREATE POLICY "Users can read own AI insights" ON ai_insights FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;

  -- Progress snapshots policies
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'progress_snapshots' AND policyname = 'Users can read own progress snapshots') THEN
    CREATE POLICY "Users can read own progress snapshots" ON progress_snapshots FOR SELECT TO authenticated USING (auth.uid() = user_id);
  END IF;

  -- Resource library policies
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'resource_library' AND policyname = 'Anyone can read verified resources') THEN
    CREATE POLICY "Anyone can read verified resources" ON resource_library FOR SELECT TO authenticated USING (is_verified = true);
  END IF;

  -- User resources policies
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_resources' AND policyname = 'Users can manage own resource interactions') THEN
    CREATE POLICY "Users can manage own resource interactions" ON user_resources FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;

  -- Reminders policies
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'reminders' AND policyname = 'Users can manage own reminders') THEN
    CREATE POLICY "Users can manage own reminders" ON reminders FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;

  -- Improvement plans policies
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'improvement_plans' AND policyname = 'Users can read own improvement plans') THEN
    CREATE POLICY "Users can read own improvement plans" ON improvement_plans FOR SELECT TO authenticated USING (auth.uid() = user_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'improvement_plans' AND policyname = 'Users can insert own improvement plans') THEN
    CREATE POLICY "Users can insert own improvement plans" ON improvement_plans FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'improvement_plans' AND policyname = 'Users can update own improvement plans') THEN
    CREATE POLICY "Users can update own improvement plans" ON improvement_plans FOR UPDATE TO authenticated USING (auth.uid() = user_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'improvement_plans' AND policyname = 'Users can delete own improvement plans') THEN
    CREATE POLICY "Users can delete own improvement plans" ON improvement_plans FOR DELETE TO authenticated USING (auth.uid() = user_id);
  END IF;

  -- Performance logs policies
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'performance_logs' AND policyname = 'Users can read own performance logs') THEN
    CREATE POLICY "Users can read own performance logs" ON performance_logs FOR SELECT TO authenticated USING (auth.uid() = user_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'performance_logs' AND policyname = 'Users can insert own performance logs') THEN
    CREATE POLICY "Users can insert own performance logs" ON performance_logs FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'performance_logs' AND policyname = 'Users can update own performance logs') THEN
    CREATE POLICY "Users can update own performance logs" ON performance_logs FOR UPDATE TO authenticated USING (auth.uid() = user_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'performance_logs' AND policyname = 'Users can delete own performance logs') THEN
    CREATE POLICY "Users can delete own performance logs" ON performance_logs FOR DELETE TO authenticated USING (auth.uid() = user_id);
  END IF;

  -- Collaboration groups policies
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'collaboration_groups' AND policyname = 'Users can read public groups and manage own groups') THEN
    CREATE POLICY "Users can read public groups and manage own groups" ON collaboration_groups FOR SELECT TO authenticated USING (privacy_level = 'public' OR created_by = auth.uid());
  END IF;

  -- Group memberships policies
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'group_memberships' AND policyname = 'Users can manage own group memberships') THEN
    CREATE POLICY "Users can manage own group memberships" ON group_memberships FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- Create basic indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_marks_user_id ON marks(user_id);
CREATE INDEX IF NOT EXISTS idx_marks_subject_id ON marks(subject_id);
CREATE INDEX IF NOT EXISTS idx_marks_date ON marks(date);
CREATE INDEX IF NOT EXISTS idx_suggestions_user_id ON suggestions(user_id);
CREATE INDEX IF NOT EXISTS idx_suggestions_status ON suggestions(status);

-- Function to handle new user creation (safe to recreate)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, name, student_id)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', ''),
    NEW.raw_user_meta_data->>'student_id'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically create user profile (safe to recreate)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();