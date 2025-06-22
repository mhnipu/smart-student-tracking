/*
  # Complete Database Setup Migration
  
  This migration creates all necessary tables, functions, triggers, and policies
  for the SmartStudent application while avoiding conflicts with existing objects.
  
  1. Tables: users, subjects, marks, goals, achievements, study_sessions, notes, flashcards, etc.
  2. Security: Row Level Security policies for all tables
  3. Functions: User profile creation, streak tracking, achievement checking
  4. Sample Data: Default subjects, achievements, and learning resources
*/

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  name text,
  student_id text UNIQUE,
  profile_image text,
  grade text,
  school text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  total_study_time integer DEFAULT 0,
  achievement_points integer DEFAULT 0,
  current_streak integer DEFAULT 0,
  longest_streak integer DEFAULT 0,
  preferred_study_time text,
  study_goals jsonb DEFAULT '{}',
  learning_style text DEFAULT 'visual' CHECK (learning_style IN ('visual', 'auditory', 'kinesthetic', 'reading')),
  study_preferences jsonb DEFAULT '{}',
  notification_settings jsonb DEFAULT '{}',
  timezone text DEFAULT 'UTC',
  weekly_study_goal integer DEFAULT 0
);

-- Enable RLS if not already enabled
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE tablename = 'users' 
    AND rowsecurity = true
  ) THEN
    ALTER TABLE users ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- Create subjects table
CREATE TABLE IF NOT EXISTS subjects (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text UNIQUE NOT NULL,
  code text UNIQUE NOT NULL,
  description text,
  category text,
  color text DEFAULT '#3B82F6',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  target_grade text,
  current_grade text,
  study_priority integer DEFAULT 3 CHECK (study_priority >= 1 AND study_priority <= 5),
  total_study_time integer DEFAULT 0,
  difficulty_level text DEFAULT 'medium' CHECK (difficulty_level IN ('easy', 'medium', 'hard')),
  exam_date date,
  study_method_preferences text[] DEFAULT ARRAY[]::text[],
  performance_trend text DEFAULT 'stable' CHECK (performance_trend IN ('improving', 'stable', 'declining'))
);

ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;

-- Create marks table
CREATE TABLE IF NOT EXISTS marks (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  score numeric NOT NULL CHECK (score >= 0),
  max_score numeric NOT NULL CHECK (max_score > 0),
  percentage numeric GENERATED ALWAYS AS ((score / max_score) * 100) STORED,
  test_type text NOT NULL CHECK (test_type IN ('quiz', 'exam', 'assignment', 'project')),
  test_name text NOT NULL,
  date date NOT NULL,
  semester text,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subject_id uuid NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  predicted_grade text,
  difficulty_rating integer CHECK (difficulty_rating >= 1 AND difficulty_rating <= 5),
  time_spent_minutes integer,
  notes text
);

ALTER TABLE marks ENABLE ROW LEVEL SECURITY;

-- Create goals table
CREATE TABLE IF NOT EXISTS goals (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
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

ALTER TABLE goals ENABLE ROW LEVEL SECURITY;

-- Create achievements table
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

ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;

-- Create user_achievements table
CREATE TABLE IF NOT EXISTS user_achievements (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  achievement_id uuid NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
  earned_at timestamptz DEFAULT now(),
  progress numeric DEFAULT 100 CHECK (progress >= 0 AND progress <= 100),
  UNIQUE(user_id, achievement_id)
);

ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;

-- Create study_sessions table
CREATE TABLE IF NOT EXISTS study_sessions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  title text NOT NULL,
  description text,
  start_time timestamptz NOT NULL,
  end_time timestamptz,
  duration_minutes integer GENERATED ALWAYS AS (
    CASE 
      WHEN end_time IS NOT NULL THEN 
        EXTRACT(epoch FROM (end_time - start_time)) / 60
      ELSE NULL 
    END
  ) STORED,
  session_type text DEFAULT 'study' CHECK (session_type IN ('study', 'review', 'practice', 'homework')),
  productivity_rating integer CHECK (productivity_rating >= 1 AND productivity_rating <= 5),
  notes text,
  tags text[] DEFAULT ARRAY[]::text[],
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subject_id uuid REFERENCES subjects(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE study_sessions ENABLE ROW LEVEL SECURITY;

-- Create notes table
CREATE TABLE IF NOT EXISTS notes (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
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

ALTER TABLE notes ENABLE ROW LEVEL SECURITY;

-- Create flashcards table
CREATE TABLE IF NOT EXISTS flashcards (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
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

ALTER TABLE flashcards ENABLE ROW LEVEL SECURITY;

-- Create suggestions table
CREATE TABLE IF NOT EXISTS suggestions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
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

ALTER TABLE suggestions ENABLE ROW LEVEL SECURITY;

-- Create ai_insights table
CREATE TABLE IF NOT EXISTS ai_insights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  insight_type text NOT NULL CHECK (insight_type IN ('performance', 'study_pattern', 'prediction', 'recommendation')),
  title text NOT NULL,
  content text NOT NULL,
  confidence_score numeric DEFAULT 0 CHECK (confidence_score >= 0 AND confidence_score <= 100),
  priority text DEFAULT 'medium' CHECK (priority IN ('high', 'medium', 'low')),
  is_read boolean DEFAULT false,
  expires_at timestamptz,
  metadata jsonb DEFAULT '{}',
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subject_id uuid REFERENCES subjects(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE ai_insights ENABLE ROW LEVEL SECURITY;

-- Create study_plans table
CREATE TABLE IF NOT EXISTS study_plans (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  title text NOT NULL,
  description text,
  start_date date NOT NULL,
  end_date date NOT NULL,
  total_hours integer NOT NULL,
  completed_hours integer DEFAULT 0,
  difficulty_level text DEFAULT 'medium' CHECK (difficulty_level IN ('easy', 'medium', 'hard')),
  plan_type text DEFAULT 'custom' CHECK (plan_type IN ('custom', 'exam_prep', 'skill_building', 'review')),
  status text DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused', 'cancelled')),
  milestones jsonb DEFAULT '[]',
  resources jsonb DEFAULT '[]',
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subject_id uuid REFERENCES subjects(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE study_plans ENABLE ROW LEVEL SECURITY;

-- Create progress_snapshots table
CREATE TABLE IF NOT EXISTS progress_snapshots (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  snapshot_date date NOT NULL,
  overall_average numeric NOT NULL,
  subject_averages jsonb NOT NULL,
  study_hours_week integer DEFAULT 0,
  goals_completed integer DEFAULT 0,
  achievements_earned integer DEFAULT 0,
  streak_length integer DEFAULT 0,
  insights jsonb DEFAULT '{}',
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE progress_snapshots ENABLE ROW LEVEL SECURITY;

-- Create reminders table
CREATE TABLE IF NOT EXISTS reminders (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
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

ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;

-- Create improvement_plans table
CREATE TABLE IF NOT EXISTS improvement_plans (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  title text NOT NULL,
  description text NOT NULL,
  target_score numeric,
  current_score numeric,
  start_date date NOT NULL,
  end_date date NOT NULL,
  status text DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused')),
  milestones jsonb DEFAULT '[]',
  progress numeric DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subject_id uuid NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE improvement_plans ENABLE ROW LEVEL SECURITY;

-- Create performance_logs table
CREATE TABLE IF NOT EXISTS performance_logs (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  date date NOT NULL,
  average_score numeric NOT NULL,
  total_tests integer NOT NULL,
  subject_breakdown jsonb DEFAULT '{}',
  trends jsonb DEFAULT '{}',
  achievements text[] DEFAULT ARRAY[]::text[],
  notes text,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE performance_logs ENABLE ROW LEVEL SECURITY;

-- Create resource_library table
CREATE TABLE IF NOT EXISTS resource_library (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
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

ALTER TABLE resource_library ENABLE ROW LEVEL SECURITY;

-- Create user_resources table
CREATE TABLE IF NOT EXISTS user_resources (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
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

ALTER TABLE user_resources ENABLE ROW LEVEL SECURITY;

-- Create collaboration_groups table
CREATE TABLE IF NOT EXISTS collaboration_groups (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
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

ALTER TABLE collaboration_groups ENABLE ROW LEVEL SECURITY;

-- Create group_memberships table
CREATE TABLE IF NOT EXISTS group_memberships (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  group_id uuid NOT NULL REFERENCES collaboration_groups(id) ON DELETE CASCADE,
  role text DEFAULT 'member' CHECK (role IN ('admin', 'moderator', 'member')),
  joined_at timestamptz DEFAULT now(),
  is_active boolean DEFAULT true,
  UNIQUE(user_id, group_id)
);

ALTER TABLE group_memberships ENABLE ROW LEVEL SECURITY;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_marks_user_id ON marks(user_id);
CREATE INDEX IF NOT EXISTS idx_marks_subject_id ON marks(subject_id);
CREATE INDEX IF NOT EXISTS idx_marks_date ON marks(date);
CREATE INDEX IF NOT EXISTS idx_goals_user_id ON goals(user_id);
CREATE INDEX IF NOT EXISTS idx_goals_status ON goals(status);
CREATE INDEX IF NOT EXISTS idx_goals_target_date ON goals(target_date);
CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_study_sessions_user_id ON study_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_study_sessions_start_time ON study_sessions(start_time);
CREATE INDEX IF NOT EXISTS idx_notes_user_id ON notes(user_id);
CREATE INDEX IF NOT EXISTS idx_notes_tags ON notes USING gin(tags);
CREATE INDEX IF NOT EXISTS idx_flashcards_user_id ON flashcards(user_id);
CREATE INDEX IF NOT EXISTS idx_flashcards_next_review ON flashcards(next_review);
CREATE INDEX IF NOT EXISTS idx_suggestions_user_id ON suggestions(user_id);
CREATE INDEX IF NOT EXISTS idx_suggestions_status ON suggestions(status);
CREATE INDEX IF NOT EXISTS idx_ai_insights_user_id ON ai_insights(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_insights_type ON ai_insights(insight_type);
CREATE INDEX IF NOT EXISTS idx_study_plans_user_id ON study_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_study_plans_status ON study_plans(status);
CREATE INDEX IF NOT EXISTS idx_progress_snapshots_user_id ON progress_snapshots(user_id);
CREATE INDEX IF NOT EXISTS idx_progress_snapshots_date ON progress_snapshots(snapshot_date);
CREATE INDEX IF NOT EXISTS idx_reminders_user_id ON reminders(user_id);
CREATE INDEX IF NOT EXISTS idx_reminders_date ON reminders(reminder_date);
CREATE INDEX IF NOT EXISTS idx_improvement_plans_user_id ON improvement_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_performance_logs_user_id ON performance_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_resource_library_tags ON resource_library USING gin(tags);
CREATE INDEX IF NOT EXISTS idx_user_resources_user_id ON user_resources(user_id);
CREATE INDEX IF NOT EXISTS idx_group_memberships_user_id ON group_memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_group_memberships_group_id ON group_memberships(group_id);

-- Create user profile trigger function
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create streak update function
CREATE OR REPLACE FUNCTION update_user_streak()
RETURNS TRIGGER AS $$
DECLARE
  last_session_date date;
  current_streak integer;
BEGIN
  -- Get the date of the last study session before this one
  SELECT DATE(start_time) INTO last_session_date
  FROM study_sessions 
  WHERE user_id = NEW.user_id 
    AND id != NEW.id
    AND start_time < NEW.start_time
  ORDER BY start_time DESC 
  LIMIT 1;

  -- Get current streak
  SELECT COALESCE(current_streak, 0) INTO current_streak
  FROM users WHERE id = NEW.user_id;

  -- Update streak logic
  IF last_session_date IS NULL THEN
    -- First session ever
    current_streak := 1;
  ELSIF DATE(NEW.start_time) = last_session_date + INTERVAL '1 day' THEN
    -- Consecutive day
    current_streak := current_streak + 1;
  ELSIF DATE(NEW.start_time) = last_session_date THEN
    -- Same day, no change to streak
    current_streak := current_streak;
  ELSE
    -- Gap in days, reset streak
    current_streak := 1;
  END IF;

  -- Update user record
  UPDATE users 
  SET 
    current_streak = current_streak,
    longest_streak = GREATEST(longest_streak, current_streak)
  WHERE id = NEW.user_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create achievement checking function
CREATE OR REPLACE FUNCTION check_achievements()
RETURNS TRIGGER AS $$
BEGIN
  -- This is a placeholder for achievement checking logic
  -- In a real implementation, this would check various conditions
  -- and award achievements based on user progress
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create AI insights generation function
CREATE OR REPLACE FUNCTION generate_ai_insights()
RETURNS TRIGGER AS $$
BEGIN
  -- This is a placeholder for AI insights generation
  -- In a real implementation, this would analyze user data
  -- and generate personalized insights
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing triggers if they exist and recreate them
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Create triggers with proper checks
DO $$ 
BEGIN
  -- Users table triggers
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_users_updated_at') THEN
    CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;

  -- Subjects table triggers
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_subjects_updated_at') THEN
    CREATE TRIGGER update_subjects_updated_at BEFORE UPDATE ON subjects FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;

  -- Marks table triggers
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_marks_updated_at') THEN
    CREATE TRIGGER update_marks_updated_at BEFORE UPDATE ON marks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'check_achievements_on_mark') THEN
    CREATE TRIGGER check_achievements_on_mark AFTER INSERT ON marks FOR EACH ROW EXECUTE FUNCTION check_achievements();
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'generate_insights_on_mark') THEN
    CREATE TRIGGER generate_insights_on_mark AFTER INSERT ON marks FOR EACH ROW EXECUTE FUNCTION generate_ai_insights();
  END IF;

  -- Goals table triggers
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_goals_updated_at') THEN
    CREATE TRIGGER update_goals_updated_at BEFORE UPDATE ON goals FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;

  -- Study sessions table triggers
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_study_sessions_updated_at') THEN
    CREATE TRIGGER update_study_sessions_updated_at BEFORE UPDATE ON study_sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_streak_on_study_session') THEN
    CREATE TRIGGER update_streak_on_study_session AFTER INSERT ON study_sessions FOR EACH ROW EXECUTE FUNCTION update_user_streak();
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'check_achievements_on_study_session') THEN
    CREATE TRIGGER check_achievements_on_study_session AFTER INSERT OR UPDATE ON study_sessions FOR EACH ROW EXECUTE FUNCTION check_achievements();
  END IF;

  -- Notes table triggers
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_notes_updated_at') THEN
    CREATE TRIGGER update_notes_updated_at BEFORE UPDATE ON notes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;

  -- Flashcards table triggers
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_flashcards_updated_at') THEN
    CREATE TRIGGER update_flashcards_updated_at BEFORE UPDATE ON flashcards FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;

  -- Suggestions table triggers
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_suggestions_updated_at') THEN
    CREATE TRIGGER update_suggestions_updated_at BEFORE UPDATE ON suggestions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;

  -- Study plans table triggers
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_study_plans_updated_at') THEN
    CREATE TRIGGER update_study_plans_updated_at BEFORE UPDATE ON study_plans FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;

  -- Reminders table triggers
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_reminders_updated_at') THEN
    CREATE TRIGGER update_reminders_updated_at BEFORE UPDATE ON reminders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;

  -- Improvement plans table triggers
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_improvement_plans_updated_at') THEN
    CREATE TRIGGER update_improvement_plans_updated_at BEFORE UPDATE ON improvement_plans FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;

  -- Resource library table triggers
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_resource_library_updated_at') THEN
    CREATE TRIGGER update_resource_library_updated_at BEFORE UPDATE ON resource_library FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;

  -- User resources table triggers
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_user_resources_updated_at') THEN
    CREATE TRIGGER update_user_resources_updated_at BEFORE UPDATE ON user_resources FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;

  -- Collaboration groups table triggers
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_collaboration_groups_updated_at') THEN
    CREATE TRIGGER update_collaboration_groups_updated_at BEFORE UPDATE ON collaboration_groups FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- Row Level Security Policies (with conflict handling)

-- Users policies
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'users' AND policyname = 'Users can read own profile') THEN
    CREATE POLICY "Users can read own profile" ON users FOR SELECT TO authenticated USING (auth.uid() = id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'users' AND policyname = 'Users can update own profile') THEN
    CREATE POLICY "Users can update own profile" ON users FOR UPDATE TO authenticated USING (auth.uid() = id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'users' AND policyname = 'Users can insert own profile') THEN
    CREATE POLICY "Users can insert own profile" ON users FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
  END IF;
END $$;

-- Subjects policies (public read access)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'subjects' AND policyname = 'Anyone can read subjects') THEN
    CREATE POLICY "Anyone can read subjects" ON subjects FOR SELECT TO authenticated USING (true);
  END IF;
END $$;

-- Marks policies
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'marks' AND policyname = 'Users can read own marks') THEN
    CREATE POLICY "Users can read own marks" ON marks FOR SELECT TO authenticated USING (auth.uid() = user_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'marks' AND policyname = 'Users can insert own marks') THEN
    CREATE POLICY "Users can insert own marks" ON marks FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'marks' AND policyname = 'Users can update own marks') THEN
    CREATE POLICY "Users can update own marks" ON marks FOR UPDATE TO authenticated USING (auth.uid() = user_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'marks' AND policyname = 'Users can delete own marks') THEN
    CREATE POLICY "Users can delete own marks" ON marks FOR DELETE TO authenticated USING (auth.uid() = user_id);
  END IF;
END $$;

-- Goals policies
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'goals' AND policyname = 'Users can manage own goals') THEN
    CREATE POLICY "Users can manage own goals" ON goals FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- Achievements policies (public read access)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'achievements' AND policyname = 'Anyone can read achievements') THEN
    CREATE POLICY "Anyone can read achievements" ON achievements FOR SELECT TO authenticated USING (true);
  END IF;
END $$;

-- User achievements policies
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_achievements' AND policyname = 'Users can manage own achievements') THEN
    CREATE POLICY "Users can manage own achievements" ON user_achievements FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- Study sessions policies
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'study_sessions' AND policyname = 'Users can manage own study sessions') THEN
    CREATE POLICY "Users can manage own study sessions" ON study_sessions FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- Notes policies
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'notes' AND policyname = 'Users can manage own notes') THEN
    CREATE POLICY "Users can manage own notes" ON notes FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- Flashcards policies
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'flashcards' AND policyname = 'Users can manage own flashcards') THEN
    CREATE POLICY "Users can manage own flashcards" ON flashcards FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- Suggestions policies
DO $$ 
BEGIN
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
END $$;

-- AI insights policies
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'ai_insights' AND policyname = 'Users can read own AI insights') THEN
    CREATE POLICY "Users can read own AI insights" ON ai_insights FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- Study plans policies
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'study_plans' AND policyname = 'Users can manage own study plans') THEN
    CREATE POLICY "Users can manage own study plans" ON study_plans FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- Progress snapshots policies
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'progress_snapshots' AND policyname = 'Users can read own progress snapshots') THEN
    CREATE POLICY "Users can read own progress snapshots" ON progress_snapshots FOR SELECT TO authenticated USING (auth.uid() = user_id);
  END IF;
END $$;

-- Reminders policies
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'reminders' AND policyname = 'Users can manage own reminders') THEN
    CREATE POLICY "Users can manage own reminders" ON reminders FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- Improvement plans policies
DO $$ 
BEGIN
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
END $$;

-- Performance logs policies
DO $$ 
BEGIN
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
END $$;

-- Resource library policies (public read for verified resources)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'resource_library' AND policyname = 'Anyone can read verified resources') THEN
    CREATE POLICY "Anyone can read verified resources" ON resource_library FOR SELECT TO authenticated USING (is_verified = true);
  END IF;
END $$;

-- User resources policies
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_resources' AND policyname = 'Users can manage own resource interactions') THEN
    CREATE POLICY "Users can manage own resource interactions" ON user_resources FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- Collaboration groups policies
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'collaboration_groups' AND policyname = 'Users can read public groups and manage own groups') THEN
    CREATE POLICY "Users can read public groups and manage own groups" ON collaboration_groups FOR SELECT TO authenticated USING (privacy_level = 'public' OR created_by = auth.uid());
  END IF;
END $$;

-- Group memberships policies
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'group_memberships' AND policyname = 'Users can manage own group memberships') THEN
    CREATE POLICY "Users can manage own group memberships" ON group_memberships FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- Insert default subjects (with conflict handling)
INSERT INTO subjects (name, code, description, category, color) VALUES
  ('Mathematics', 'MATH', 'Core mathematics including algebra, geometry, and calculus', 'STEM', '#3B82F6'),
  ('English Language Arts', 'ELA', 'Reading, writing, literature, and communication skills', 'Language Arts', '#10B981'),
  ('Science', 'SCI', 'General science including biology, chemistry, and physics', 'STEM', '#F59E0B'),
  ('History', 'HIST', 'World history, social studies, and cultural studies', 'Social Studies', '#EF4444'),
  ('Art', 'ART', 'Visual arts, creative expression, and design', 'Creative Arts', '#8B5CF6'),
  ('Physical Education', 'PE', 'Physical fitness, sports, and health education', 'Health & Fitness', '#06B6D4'),
  ('Computer Science', 'CS', 'Programming, algorithms, and computer technology', 'STEM', '#6366F1'),
  ('Foreign Language', 'LANG', 'Second language learning and cultural studies', 'Language Arts', '#EC4899')
ON CONFLICT (name) DO NOTHING;

-- Insert sample achievements (with conflict handling)
INSERT INTO achievements (name, description, icon, category, criteria, points, rarity) VALUES
  ('First Steps', 'Complete your first study session', '🎯', 'milestone', '{"study_sessions": 1}', 10, 'common'),
  ('Consistent Learner', 'Study for 7 days in a row', '🔥', 'consistency', '{"streak_days": 7}', 50, 'rare'),
  ('High Achiever', 'Score 90% or higher on 5 tests', '⭐', 'performance', '{"high_scores": 5, "threshold": 90}', 100, 'epic'),
  ('Study Marathon', 'Complete 50 hours of study time', '⏰', 'milestone', '{"total_hours": 50}', 200, 'epic'),
  ('Perfect Score', 'Achieve a 100% score on any test', '💯', 'performance', '{"perfect_scores": 1}', 75, 'rare'),
  ('Goal Crusher', 'Complete 10 academic goals', '🎯', 'milestone', '{"completed_goals": 10}', 150, 'epic'),
  ('Note Taker', 'Create 25 study notes', '📝', 'milestone', '{"notes_created": 25}', 30, 'common'),
  ('Flashcard Master', 'Review 100 flashcards', '🃏', 'milestone', '{"flashcards_reviewed": 100}', 40, 'common'),
  ('Improvement Champion', 'Improve grade by 20% in any subject', '📈', 'improvement', '{"grade_improvement": 20}', 125, 'epic'),
  ('Study Legend', 'Maintain a 30-day study streak', '👑', 'consistency', '{"streak_days": 30}', 500, 'legendary')
ON CONFLICT (name) DO NOTHING;

-- Insert sample learning resources (with conflict handling)
INSERT INTO resource_library (title, description, resource_type, url, difficulty_level, estimated_time_minutes, rating, tags, is_verified) VALUES
  ('Khan Academy Math', 'Comprehensive math lessons from basic arithmetic to advanced calculus', 'course', 'https://www.khanacademy.org/math', 'beginner', 30, 4.8, ARRAY['math', 'free', 'interactive'], true),
  ('Crash Course Science', 'Engaging science videos covering biology, chemistry, and physics', 'video', 'https://www.youtube.com/user/crashcourse', 'intermediate', 15, 4.7, ARRAY['science', 'video', 'free'], true),
  ('Duolingo Language Learning', 'Interactive language learning platform', 'course', 'https://www.duolingo.com', 'beginner', 20, 4.5, ARRAY['language', 'interactive', 'free'], true),
  ('MIT OpenCourseWare', 'Free course materials from MIT', 'course', 'https://ocw.mit.edu', 'advanced', 120, 4.9, ARRAY['university', 'advanced', 'free'], true),
  ('TED-Ed Educational Videos', 'Short educational videos on various topics', 'video', 'https://ed.ted.com', 'intermediate', 10, 4.6, ARRAY['educational', 'video', 'free'], true)
ON CONFLICT DO NOTHING;

-- Policies for 'users' table
DROP POLICY IF EXISTS "Allow authenticated users to read their own user record" ON public.users;
CREATE POLICY "Allow authenticated users to read their own user record"
ON public.users FOR SELECT
USING (auth.uid() = id);

DROP POLICY IF EXISTS "Allow authenticated users to update their own user record" ON public.users;
CREATE POLICY "Allow authenticated users to update their own user record"
ON public.users FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);


-- Policies for 'subjects' table
DROP POLICY IF EXISTS "Allow authenticated users to view all subjects" ON public.subjects;
CREATE POLICY "Allow authenticated users to view all subjects"
ON public.subjects FOR SELECT
USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Allow authenticated users to insert subjects" ON public.subjects;
CREATE POLICY "Allow authenticated users to insert subjects"
ON public.subjects FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Allow authenticated users to update subjects" ON public.subjects;
CREATE POLICY "Allow authenticated users to update subjects"
ON public.subjects FOR UPDATE
USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Allow authenticated users to delete subjects" ON public.subjects;
CREATE POLICY "Allow authenticated users to delete subjects"
ON public.subjects FOR DELETE
USING (auth.role() = 'authenticated');


-- Policies for 'marks' table
DROP POLICY IF EXISTS "Allow authenticated users to manage their own marks" ON public.marks;
CREATE POLICY "Allow authenticated users to manage their own marks"
ON public.marks FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);


-- Policies for 'goals' table
DROP POLICY IF EXISTS "Allow authenticated users to manage their own goals" ON public.goals;
CREATE POLICY "Allow authenticated users to manage their own goals"
ON public.goals FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);


-- Policies for 'suggestions' table
DROP POLICY IF EXISTS "Allow authenticated users to manage their own suggestions" ON public.suggestions;
CREATE POLICY "Allow authenticated users to manage their own suggestions"
ON public.suggestions FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);


-- Policies for 'ai_insights' table
DROP POLICY IF EXISTS "Allow authenticated users to manage their own ai_insights" ON public.ai_insights;
CREATE POLICY "Allow authenticated users to manage their own ai_insights"
ON public.ai_insights FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Policies for 'notes' table
DROP POLICY IF EXISTS "Allow users to manage their own notes" ON public.notes;
CREATE POLICY "Allow users to manage their own notes"
ON public.notes FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Policies for 'flashcards' table
DROP POLICY IF EXISTS "Allow users to manage their own flashcards" ON public.flashcards;
CREATE POLICY "Allow users to manage their own flashcards"
ON public.flashcards FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Policies for 'study_sessions' table
DROP POLICY IF EXISTS "Allow users to manage their own study sessions" ON public.study_sessions;
CREATE POLICY "Allow users to manage their own study sessions"
ON public.study_sessions FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);