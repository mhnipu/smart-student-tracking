/*
  # Enhanced Student Performance Tracker - Complete Database Setup

  1. New Tables
    - `goals` - Student academic goals and targets
    - `achievements` - Unlockable achievements and badges
    - `user_achievements` - User's earned achievements
    - `study_sessions` - Track study time and sessions
    - `notes` - Personal notes for subjects/topics
    - `flashcards` - Digital flashcard system
    - `study_plans` - Structured study planning
    - `progress_snapshots` - Historical performance tracking
    - `ai_insights` - AI-generated personalized insights
    - `suggestions` - Enhanced suggestions system
    - `reminders` - Study reminders and notifications
    - `improvement_plans` - Academic improvement tracking
    - `performance_logs` - Performance analytics
    - `collaboration_groups` - Study group functionality
    - `group_memberships` - Group membership tracking
    - `resource_library` - Curated learning resources
    - `user_resources` - User resource interactions

  2. Enhanced Tables
    - Add new columns to existing tables for better functionality
    - Add grade prediction and trend analysis

  3. Security
    - Enable RLS on all new tables
    - Add appropriate policies for user data access
*/

-- Create update_updated_at_column function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Goals table for academic targets
CREATE TABLE IF NOT EXISTS goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  target_score numeric NOT NULL CHECK (target_score >= 0 AND target_score <= 100),
  current_score numeric DEFAULT 0 CHECK (current_score >= 0 AND current_score <= 100),
  target_date date NOT NULL,
  status text DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused', 'cancelled')),
  priority text DEFAULT 'medium' CHECK (priority IN ('high', 'medium', 'low')),
  category text DEFAULT 'general' CHECK (category IN ('general', 'subject', 'exam', 'assignment')),
  progress numeric DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subject_id uuid REFERENCES subjects(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Achievements system
CREATE TABLE IF NOT EXISTS achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  description text NOT NULL,
  icon text NOT NULL,
  category text NOT NULL CHECK (category IN ('performance', 'consistency', 'improvement', 'milestone', 'special')),
  criteria jsonb NOT NULL,
  points integer DEFAULT 0,
  rarity text DEFAULT 'common' CHECK (rarity IN ('common', 'rare', 'epic', 'legendary')),
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- User achievements junction table
CREATE TABLE IF NOT EXISTS user_achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  achievement_id uuid NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
  earned_at timestamptz DEFAULT now(),
  progress numeric DEFAULT 100 CHECK (progress >= 0 AND progress <= 100),
  UNIQUE(user_id, achievement_id)
);

-- Study sessions tracking
CREATE TABLE IF NOT EXISTS study_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  start_time timestamptz NOT NULL,
  end_time timestamptz,
  duration_minutes integer,
  session_type text DEFAULT 'study' CHECK (session_type IN ('study', 'review', 'practice', 'homework')),
  productivity_rating integer CHECK (productivity_rating >= 1 AND productivity_rating <= 5),
  notes text,
  tags text[] DEFAULT ARRAY[]::text[],
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subject_id uuid REFERENCES subjects(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Personal notes system
CREATE TABLE IF NOT EXISTS notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text NOT NULL,
  note_type text DEFAULT 'general' CHECK (note_type IN ('general', 'lesson', 'reminder', 'insight')),
  tags text[] DEFAULT ARRAY[]::text[],
  is_pinned boolean DEFAULT false,
  color text DEFAULT '#3B82F6',
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subject_id uuid REFERENCES subjects(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enhanced suggestions system
CREATE TABLE IF NOT EXISTS suggestions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  type text NOT NULL CHECK (type IN ('study_method', 'resource', 'practice', 'improvement')),
  priority text NOT NULL CHECK (priority IN ('high', 'medium', 'low')),
  status text DEFAULT 'active' CHECK (status IN ('active', 'completed', 'dismissed')),
  category text,
  resource_url text,
  estimated_time text,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subject_id uuid REFERENCES subjects(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  ai_generated boolean DEFAULT false,
  confidence_score numeric DEFAULT 0 CHECK (confidence_score >= 0 AND confidence_score <= 100),
  interaction_count integer DEFAULT 0,
  effectiveness_rating numeric DEFAULT 0 CHECK (effectiveness_rating >= 0 AND effectiveness_rating <= 5)
);

-- Flashcards for active recall learning
CREATE TABLE IF NOT EXISTS flashcards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  front_text text NOT NULL,
  back_text text NOT NULL,
  difficulty_rating integer DEFAULT 3 CHECK (difficulty_rating >= 1 AND difficulty_rating <= 5),
  last_reviewed timestamptz,
  next_review timestamptz,
  review_count integer DEFAULT 0,
  success_rate numeric DEFAULT 0 CHECK (success_rate >= 0 AND success_rate <= 100),
  tags text[] DEFAULT ARRAY[]::text[],
  is_favorite boolean DEFAULT false,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subject_id uuid REFERENCES subjects(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Study Plans table for structured learning
CREATE TABLE IF NOT EXISTS study_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  start_date date NOT NULL,
  end_date date NOT NULL,
  total_hours integer NOT NULL,
  completed_hours integer DEFAULT 0,
  difficulty_level text DEFAULT 'medium' CHECK (difficulty_level IN ('easy', 'medium', 'hard')),
  plan_type text DEFAULT 'custom' CHECK (plan_type IN ('custom', 'exam_prep', 'skill_building', 'review')),
  status text DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused', 'cancelled')),
  milestones jsonb DEFAULT '[]'::jsonb,
  resources jsonb DEFAULT '[]'::jsonb,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subject_id uuid REFERENCES subjects(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- AI-generated insights and recommendations
CREATE TABLE IF NOT EXISTS ai_insights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  insight_type text NOT NULL CHECK (insight_type IN ('performance', 'study_pattern', 'prediction', 'recommendation')),
  title text NOT NULL,
  content text NOT NULL,
  confidence_score numeric DEFAULT 0 CHECK (confidence_score >= 0 AND confidence_score <= 100),
  priority text DEFAULT 'medium' CHECK (priority IN ('high', 'medium', 'low')),
  is_read boolean DEFAULT false,
  expires_at timestamptz,
  metadata jsonb DEFAULT '{}'::jsonb,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subject_id uuid REFERENCES subjects(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

-- Progress snapshots for historical tracking
CREATE TABLE IF NOT EXISTS progress_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  snapshot_date date NOT NULL,
  overall_average numeric NOT NULL,
  subject_averages jsonb NOT NULL,
  study_hours_week integer DEFAULT 0,
  goals_completed integer DEFAULT 0,
  achievements_earned integer DEFAULT 0,
  streak_length integer DEFAULT 0,
  insights jsonb DEFAULT '{}'::jsonb,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

-- Resource library for curated learning materials
CREATE TABLE IF NOT EXISTS resource_library (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  resource_type text NOT NULL CHECK (resource_type IN ('video', 'article', 'book', 'course', 'practice', 'tool')),
  url text,
  difficulty_level text DEFAULT 'medium' CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')),
  estimated_time_minutes integer,
  rating numeric DEFAULT 0 CHECK (rating >= 0 AND rating <= 5),
  tags text[] DEFAULT ARRAY[]::text[],
  is_free boolean DEFAULT true,
  is_verified boolean DEFAULT false,
  subject_id uuid REFERENCES subjects(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- User resource interactions
CREATE TABLE IF NOT EXISTS user_resources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  resource_id uuid NOT NULL REFERENCES resource_library(id) ON DELETE CASCADE,
  status text DEFAULT 'saved' CHECK (status IN ('saved', 'in_progress', 'completed', 'dismissed')),
  rating integer CHECK (rating >= 1 AND rating <= 5),
  notes text,
  time_spent_minutes integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, resource_id)
);

-- Reminders and notifications
CREATE TABLE IF NOT EXISTS reminders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  reminder_date timestamptz NOT NULL,
  reminder_type text DEFAULT 'study' CHECK (reminder_type IN ('study', 'exam', 'assignment', 'goal', 'general')),
  is_completed boolean DEFAULT false,
  is_recurring boolean DEFAULT false,
  recurrence_pattern text,
  priority text DEFAULT 'medium' CHECK (priority IN ('high', 'medium', 'low')),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subject_id uuid REFERENCES subjects(id) ON DELETE SET NULL,
  goal_id uuid REFERENCES goals(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Improvement plans
CREATE TABLE IF NOT EXISTS improvement_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  target_score numeric,
  current_score numeric,
  start_date date NOT NULL,
  end_date date NOT NULL,
  status text DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused')),
  milestones jsonb DEFAULT '[]'::jsonb,
  progress numeric DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subject_id uuid NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Performance logs
CREATE TABLE IF NOT EXISTS performance_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date date NOT NULL,
  average_score numeric NOT NULL,
  total_tests integer NOT NULL,
  subject_breakdown jsonb DEFAULT '{}'::jsonb,
  trends jsonb DEFAULT '{}'::jsonb,
  achievements text[] DEFAULT ARRAY[]::text[],
  notes text,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

-- Collaboration groups for study partnerships
CREATE TABLE IF NOT EXISTS collaboration_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  group_type text DEFAULT 'study' CHECK (group_type IN ('study', 'project', 'exam_prep')),
  privacy_level text DEFAULT 'private' CHECK (privacy_level IN ('public', 'private', 'invite_only')),
  max_members integer DEFAULT 10,
  current_members integer DEFAULT 1,
  is_active boolean DEFAULT true,
  created_by uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subject_id uuid REFERENCES subjects(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Group memberships
CREATE TABLE IF NOT EXISTS group_memberships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  group_id uuid NOT NULL REFERENCES collaboration_groups(id) ON DELETE CASCADE,
  role text DEFAULT 'member' CHECK (role IN ('admin', 'moderator', 'member')),
  joined_at timestamptz DEFAULT now(),
  is_active boolean DEFAULT true,
  UNIQUE(user_id, group_id)
);

-- Add new columns to existing tables safely
DO $$
BEGIN
  -- Add columns to users table
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'total_study_time') THEN
    ALTER TABLE users ADD COLUMN total_study_time integer DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'achievement_points') THEN
    ALTER TABLE users ADD COLUMN achievement_points integer DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'current_streak') THEN
    ALTER TABLE users ADD COLUMN current_streak integer DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'longest_streak') THEN
    ALTER TABLE users ADD COLUMN longest_streak integer DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'weekly_study_goal') THEN
    ALTER TABLE users ADD COLUMN weekly_study_goal integer DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'learning_style') THEN
    ALTER TABLE users ADD COLUMN learning_style text DEFAULT 'visual' CHECK (learning_style IN ('visual', 'auditory', 'kinesthetic', 'reading'));
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'study_preferences') THEN
    ALTER TABLE users ADD COLUMN study_preferences jsonb DEFAULT '{}'::jsonb;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'notification_settings') THEN
    ALTER TABLE users ADD COLUMN notification_settings jsonb DEFAULT '{}'::jsonb;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'timezone') THEN
    ALTER TABLE users ADD COLUMN timezone text DEFAULT 'UTC';
  END IF;

  -- Add columns to subjects table
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'subjects' AND column_name = 'target_grade') THEN
    ALTER TABLE subjects ADD COLUMN target_grade text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'subjects' AND column_name = 'current_grade') THEN
    ALTER TABLE subjects ADD COLUMN current_grade text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'subjects' AND column_name = 'study_priority') THEN
    ALTER TABLE subjects ADD COLUMN study_priority integer DEFAULT 3 CHECK (study_priority >= 1 AND study_priority <= 5);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'subjects' AND column_name = 'total_study_time') THEN
    ALTER TABLE subjects ADD COLUMN total_study_time integer DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'subjects' AND column_name = 'difficulty_level') THEN
    ALTER TABLE subjects ADD COLUMN difficulty_level text DEFAULT 'medium' CHECK (difficulty_level IN ('easy', 'medium', 'hard'));
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'subjects' AND column_name = 'exam_date') THEN
    ALTER TABLE subjects ADD COLUMN exam_date date;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'subjects' AND column_name = 'study_method_preferences') THEN
    ALTER TABLE subjects ADD COLUMN study_method_preferences text[] DEFAULT ARRAY[]::text[];
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'subjects' AND column_name = 'performance_trend') THEN
    ALTER TABLE subjects ADD COLUMN performance_trend text DEFAULT 'stable' CHECK (performance_trend IN ('improving', 'stable', 'declining'));
  END IF;

  -- Add columns to marks table
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'marks' AND column_name = 'predicted_grade') THEN
    ALTER TABLE marks ADD COLUMN predicted_grade text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'marks' AND column_name = 'difficulty_rating') THEN
    ALTER TABLE marks ADD COLUMN difficulty_rating integer CHECK (difficulty_rating >= 1 AND difficulty_rating <= 5);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'marks' AND column_name = 'time_spent_minutes') THEN
    ALTER TABLE marks ADD COLUMN time_spent_minutes integer;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'marks' AND column_name = 'notes') THEN
    ALTER TABLE marks ADD COLUMN notes text;
  END IF;
END $$;

-- Enable RLS on all new tables
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

-- Create RLS policies
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

  -- Suggestions policies
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'suggestions' AND policyname = 'Users can read own suggestions') THEN
    CREATE POLICY "Users can read own suggestions" ON suggestions FOR SELECT TO authenticated USING (auth.uid() = user_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'suggestions' AND policyname = 'Users can insert own suggestions') THEN
    CREATE POLICY "Users can insert own suggestions" ON suggestions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'suggestions' AND policyname = 'Users can update own suggestions') THEN
    CREATE POLICY "Users can update own suggestions" ON suggestions FOR UPDATE TO authenticated USING (auth.uid() = user_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'suggestions' AND policyname = 'Users can delete own suggestions') THEN
    CREATE POLICY "Users can delete own suggestions" ON suggestions FOR DELETE TO authenticated USING (auth.uid() = user_id);
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

-- Insert sample achievements (only if they don't exist)
INSERT INTO achievements (name, description, icon, category, criteria, points, rarity) VALUES
  ('First Steps', 'Add your first test score', 'Trophy', 'milestone', '{"marks_count": 1}', 10, 'common'),
  ('Perfect Score', 'Achieve a 100% score on any test', 'Star', 'performance', '{"perfect_score": true}', 50, 'rare'),
  ('Consistent Performer', 'Maintain above 80% average for 5 consecutive tests', 'Target', 'consistency', '{"consecutive_high_scores": 5, "threshold": 80}', 75, 'epic'),
  ('Study Warrior', 'Complete 10 study sessions', 'BookOpen', 'milestone', '{"study_sessions": 10}', 25, 'common'),
  ('Improvement Master', 'Improve your average by 15% in any subject', 'TrendingUp', 'improvement', '{"improvement_percentage": 15}', 100, 'legendary'),
  ('Subject Expert', 'Achieve 90%+ average in any subject with at least 5 tests', 'Award', 'performance', '{"subject_average": 90, "min_tests": 5}', 60, 'epic'),
  ('Goal Crusher', 'Complete your first academic goal', 'CheckCircle', 'milestone', '{"completed_goals": 1}', 40, 'common'),
  ('Streak Master', 'Maintain a 7-day study streak', 'Flame', 'consistency', '{"study_streak": 7}', 80, 'epic'),
  ('Flashcard Master', 'Create and review 50 flashcards', 'BookOpen', 'milestone', '{"flashcards_created": 50}', 40, 'rare'),
  ('Study Planner', 'Complete your first study plan', 'Calendar', 'milestone', '{"study_plans_completed": 1}', 30, 'common')
ON CONFLICT (name) DO NOTHING;

-- Insert sample resources (only if they don't exist)
INSERT INTO resource_library (title, description, resource_type, url, difficulty_level, estimated_time_minutes, rating, tags, is_free, is_verified) VALUES
  ('Khan Academy Mathematics', 'Comprehensive math courses from basic to advanced', 'course', 'https://khanacademy.org/math', 'beginner', 1200, 4.8, ARRAY['math', 'free', 'interactive'], true, true),
  ('Coursera Study Skills', 'Learn effective study techniques and time management', 'course', 'https://coursera.org/learn/learning-how-to-learn', 'beginner', 480, 4.9, ARRAY['study-skills', 'productivity'], false, true),
  ('Anki Flashcards', 'Spaced repetition flashcard system for memorization', 'tool', 'https://apps.ankiweb.net', 'intermediate', 30, 4.7, ARRAY['flashcards', 'memory', 'spaced-repetition'], true, true),
  ('Pomodoro Timer', 'Time management technique for focused study sessions', 'tool', 'https://pomofocus.io', 'beginner', 5, 4.5, ARRAY['productivity', 'focus', 'time-management'], true, true)
ON CONFLICT DO NOTHING;

-- Create indexes for performance (only if they don't exist)
CREATE INDEX IF NOT EXISTS idx_goals_user_id ON goals(user_id);
CREATE INDEX IF NOT EXISTS idx_goals_status ON goals(status);
CREATE INDEX IF NOT EXISTS idx_goals_target_date ON goals(target_date);
CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_study_sessions_user_id ON study_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_study_sessions_start_time ON study_sessions(start_time);
CREATE INDEX IF NOT EXISTS idx_notes_user_id ON notes(user_id);
CREATE INDEX IF NOT EXISTS idx_notes_tags ON notes USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_suggestions_user_id ON suggestions(user_id);
CREATE INDEX IF NOT EXISTS idx_suggestions_status ON suggestions(status);
CREATE INDEX IF NOT EXISTS idx_flashcards_user_id ON flashcards(user_id);
CREATE INDEX IF NOT EXISTS idx_flashcards_next_review ON flashcards(next_review);
CREATE INDEX IF NOT EXISTS idx_study_plans_user_id ON study_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_study_plans_status ON study_plans(status);
CREATE INDEX IF NOT EXISTS idx_ai_insights_user_id ON ai_insights(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_insights_type ON ai_insights(insight_type);
CREATE INDEX IF NOT EXISTS idx_progress_snapshots_user_id ON progress_snapshots(user_id);
CREATE INDEX IF NOT EXISTS idx_progress_snapshots_date ON progress_snapshots(snapshot_date);
CREATE INDEX IF NOT EXISTS idx_resource_library_tags ON resource_library USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_user_resources_user_id ON user_resources(user_id);
CREATE INDEX IF NOT EXISTS idx_reminders_user_id ON reminders(user_id);
CREATE INDEX IF NOT EXISTS idx_reminders_date ON reminders(reminder_date);
CREATE INDEX IF NOT EXISTS idx_improvement_plans_user_id ON improvement_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_performance_logs_user_id ON performance_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_group_memberships_user_id ON group_memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_group_memberships_group_id ON group_memberships(group_id);
CREATE INDEX IF NOT EXISTS idx_marks_user_id ON marks(user_id);
CREATE INDEX IF NOT EXISTS idx_marks_subject_id ON marks(subject_id);
CREATE INDEX IF NOT EXISTS idx_marks_date ON marks(date);

-- Add triggers for updated_at columns (only if they don't exist)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_goals_updated_at') THEN
    CREATE TRIGGER update_goals_updated_at BEFORE UPDATE ON goals FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_study_sessions_updated_at') THEN
    CREATE TRIGGER update_study_sessions_updated_at BEFORE UPDATE ON study_sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_notes_updated_at') THEN
    CREATE TRIGGER update_notes_updated_at BEFORE UPDATE ON notes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_suggestions_updated_at') THEN
    CREATE TRIGGER update_suggestions_updated_at BEFORE UPDATE ON suggestions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_flashcards_updated_at') THEN
    CREATE TRIGGER update_flashcards_updated_at BEFORE UPDATE ON flashcards FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_study_plans_updated_at') THEN
    CREATE TRIGGER update_study_plans_updated_at BEFORE UPDATE ON study_plans FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_resource_library_updated_at') THEN
    CREATE TRIGGER update_resource_library_updated_at BEFORE UPDATE ON resource_library FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_user_resources_updated_at') THEN
    CREATE TRIGGER update_user_resources_updated_at BEFORE UPDATE ON user_resources FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_reminders_updated_at') THEN
    CREATE TRIGGER update_reminders_updated_at BEFORE UPDATE ON reminders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_improvement_plans_updated_at') THEN
    CREATE TRIGGER update_improvement_plans_updated_at BEFORE UPDATE ON improvement_plans FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_collaboration_groups_updated_at') THEN
    CREATE TRIGGER update_collaboration_groups_updated_at BEFORE UPDATE ON collaboration_groups FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_subjects_updated_at') THEN
    CREATE TRIGGER update_subjects_updated_at BEFORE UPDATE ON subjects FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_users_updated_at') THEN
    CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_marks_updated_at') THEN
    CREATE TRIGGER update_marks_updated_at BEFORE UPDATE ON marks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- Function to calculate and update user streaks
CREATE OR REPLACE FUNCTION update_user_streak()
RETURNS TRIGGER AS $$
DECLARE
  last_session_date date;
  current_streak integer := 0;
  temp_streak integer := 0;
  session_date date;
BEGIN
  -- Get all study session dates for the user, ordered by date
  FOR session_date IN 
    SELECT DISTINCT DATE(start_time) 
    FROM study_sessions 
    WHERE user_id = NEW.user_id 
    ORDER BY DATE(start_time) DESC
  LOOP
    IF last_session_date IS NULL THEN
      -- First iteration
      last_session_date := session_date;
      temp_streak := 1;
    ELSIF last_session_date - session_date = 1 THEN
      -- Consecutive day
      temp_streak := temp_streak + 1;
      last_session_date := session_date;
    ELSE
      -- Break in streak
      EXIT;
    END IF;
  END LOOP;

  current_streak := temp_streak;

  -- Update user's streak information
  UPDATE users 
  SET 
    current_streak = current_streak,
    longest_streak = GREATEST(longest_streak, current_streak)
  WHERE id = NEW.user_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to check and award achievements
CREATE OR REPLACE FUNCTION check_achievements()
RETURNS TRIGGER AS $$
DECLARE
  achievement_record RECORD;
  user_marks_count integer;
  user_study_sessions_count integer;
  perfect_scores_count integer;
  user_avg numeric;
BEGIN
  -- Check for achievements based on the trigger
  FOR achievement_record IN SELECT * FROM achievements WHERE is_active = true LOOP
    -- Skip if user already has this achievement
    IF EXISTS (
      SELECT 1 FROM user_achievements 
      WHERE user_id = NEW.user_id AND achievement_id = achievement_record.id
    ) THEN
      CONTINUE;
    END IF;

    -- Check different achievement criteria
    CASE achievement_record.name
      WHEN 'First Steps' THEN
        SELECT COUNT(*) INTO user_marks_count FROM marks WHERE user_id = NEW.user_id;
        IF user_marks_count >= 1 THEN
          INSERT INTO user_achievements (user_id, achievement_id) VALUES (NEW.user_id, achievement_record.id);
        END IF;
        
      WHEN 'Perfect Score' THEN
        SELECT COUNT(*) INTO perfect_scores_count 
        FROM marks 
        WHERE user_id = NEW.user_id AND percentage >= 100;
        IF perfect_scores_count >= 1 THEN
          INSERT INTO user_achievements (user_id, achievement_id) VALUES (NEW.user_id, achievement_record.id);
        END IF;
        
      WHEN 'Study Warrior' THEN
        SELECT COUNT(*) INTO user_study_sessions_count 
        FROM study_sessions 
        WHERE user_id = NEW.user_id AND end_time IS NOT NULL;
        IF user_study_sessions_count >= 10 THEN
          INSERT INTO user_achievements (user_id, achievement_id) VALUES (NEW.user_id, achievement_record.id);
        END IF;
    END CASE;
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to generate AI insights
CREATE OR REPLACE FUNCTION generate_ai_insights()
RETURNS TRIGGER AS $$
DECLARE
  user_avg numeric;
  recent_trend text;
  study_hours integer;
BEGIN
  -- Calculate user's recent performance
  SELECT AVG(percentage) INTO user_avg
  FROM marks 
  WHERE user_id = NEW.user_id 
  AND date >= CURRENT_DATE - INTERVAL '30 days';

  -- Determine trend
  IF user_avg >= 85 THEN
    recent_trend := 'excellent';
  ELSIF user_avg >= 75 THEN
    recent_trend := 'good';
  ELSIF user_avg >= 65 THEN
    recent_trend := 'average';
  ELSE
    recent_trend := 'needs_improvement';
  END IF;

  -- Get recent study hours
  SELECT COALESCE(SUM(duration_minutes), 0) / 60 INTO study_hours
  FROM study_sessions
  WHERE user_id = NEW.user_id
  AND start_time >= CURRENT_DATE - INTERVAL '7 days';

  -- Generate personalized insights
  CASE recent_trend
    WHEN 'excellent' THEN
      INSERT INTO ai_insights (user_id, insight_type, title, content, confidence_score, priority)
      VALUES (NEW.user_id, 'performance', 'Outstanding Performance!', 
              'You''re performing exceptionally well with an average of ' || user_avg::text || '%. Consider challenging yourself with advanced topics or helping peers.', 
              95, 'medium');
    
    WHEN 'needs_improvement' THEN
      INSERT INTO ai_insights (user_id, insight_type, title, content, confidence_score, priority)
      VALUES (NEW.user_id, 'recommendation', 'Focus Areas Identified', 
              'Your recent average of ' || user_avg::text || '% suggests room for improvement. Consider increasing study time and using active recall techniques.', 
              90, 'high');
  END CASE;

  -- Study time recommendations
  IF study_hours < 5 THEN
    INSERT INTO ai_insights (user_id, insight_type, title, content, confidence_score, priority)
    VALUES (NEW.user_id, 'study_pattern', 'Increase Study Time', 
            'You studied ' || study_hours::text || ' hours this week. Research shows 10-15 hours per week leads to better outcomes.', 
            85, 'medium');
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for achievements and insights (only if they don't exist)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_streak_on_study_session') THEN
    CREATE TRIGGER update_streak_on_study_session
      AFTER INSERT ON study_sessions
      FOR EACH ROW EXECUTE FUNCTION update_user_streak();
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'check_achievements_on_mark') THEN
    CREATE TRIGGER check_achievements_on_mark
      AFTER INSERT ON marks
      FOR EACH ROW EXECUTE FUNCTION check_achievements();
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'check_achievements_on_study_session') THEN
    CREATE TRIGGER check_achievements_on_study_session
      AFTER INSERT OR UPDATE ON study_sessions
      FOR EACH ROW EXECUTE FUNCTION check_achievements();
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'generate_insights_on_mark') THEN
    CREATE TRIGGER generate_insights_on_mark
      AFTER INSERT ON marks
      FOR EACH ROW EXECUTE FUNCTION generate_ai_insights();
  END IF;
END $$;