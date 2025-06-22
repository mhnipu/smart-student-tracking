/*
  # Professional UI Upgrade with Enhanced Features

  1. New Tables
    - `study_plans` - Structured study planning system
    - `flashcards` - Digital flashcard system for active recall
    - `progress_snapshots` - Historical performance tracking
    - `ai_insights` - AI-generated personalized insights
    - `collaboration_groups` - Study group functionality
    - `resource_library` - Curated learning resources

  2. Enhanced Features
    - Advanced analytics and predictions
    - Personalized AI coaching
    - Collaborative study features
    - Gamification elements
    - Smart scheduling system

  3. Security
    - Enable RLS on all new tables
    - Add comprehensive policies for data access
*/

-- Study Plans table for structured learning
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
  milestones jsonb DEFAULT '[]'::jsonb,
  resources jsonb DEFAULT '[]'::jsonb,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subject_id uuid REFERENCES subjects(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Flashcards for active recall learning
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

-- Progress snapshots for historical tracking
CREATE TABLE IF NOT EXISTS progress_snapshots (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
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

-- AI-generated insights and recommendations
CREATE TABLE IF NOT EXISTS ai_insights (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
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

-- Collaboration groups for study partnerships
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

-- Group memberships
CREATE TABLE IF NOT EXISTS group_memberships (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  group_id uuid NOT NULL REFERENCES collaboration_groups(id) ON DELETE CASCADE,
  role text DEFAULT 'member' CHECK (role IN ('admin', 'moderator', 'member')),
  joined_at timestamptz DEFAULT now(),
  is_active boolean DEFAULT true,
  UNIQUE(user_id, group_id)
);

-- Resource library for curated learning materials
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

-- User resource interactions
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

-- Enhanced suggestions with AI-powered recommendations
ALTER TABLE suggestions ADD COLUMN IF NOT EXISTS ai_generated boolean DEFAULT false;
ALTER TABLE suggestions ADD COLUMN IF NOT EXISTS confidence_score numeric DEFAULT 0 CHECK (confidence_score >= 0 AND confidence_score <= 100);
ALTER TABLE suggestions ADD COLUMN IF NOT EXISTS interaction_count integer DEFAULT 0;
ALTER TABLE suggestions ADD COLUMN IF NOT EXISTS effectiveness_rating numeric DEFAULT 0 CHECK (effectiveness_rating >= 0 AND effectiveness_rating <= 5);

-- Enhanced users table with preferences
ALTER TABLE users ADD COLUMN IF NOT EXISTS learning_style text DEFAULT 'visual' CHECK (learning_style IN ('visual', 'auditory', 'kinesthetic', 'reading'));
ALTER TABLE users ADD COLUMN IF NOT EXISTS study_preferences jsonb DEFAULT '{}'::jsonb;
ALTER TABLE users ADD COLUMN IF NOT EXISTS notification_settings jsonb DEFAULT '{}'::jsonb;
ALTER TABLE users ADD COLUMN IF NOT EXISTS timezone text DEFAULT 'UTC';
ALTER TABLE users ADD COLUMN IF NOT EXISTS weekly_study_goal integer DEFAULT 0;

-- Enhanced subjects with advanced tracking
ALTER TABLE subjects ADD COLUMN IF NOT EXISTS difficulty_level text DEFAULT 'medium' CHECK (difficulty_level IN ('easy', 'medium', 'hard'));
ALTER TABLE subjects ADD COLUMN IF NOT EXISTS exam_date date;
ALTER TABLE subjects ADD COLUMN IF NOT EXISTS study_method_preferences text[] DEFAULT ARRAY[]::text[];
ALTER TABLE subjects ADD COLUMN IF NOT EXISTS performance_trend text DEFAULT 'stable' CHECK (performance_trend IN ('improving', 'stable', 'declining'));

-- Enable RLS on new tables
ALTER TABLE study_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE flashcards ENABLE ROW LEVEL SECURITY;
ALTER TABLE progress_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE collaboration_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE resource_library ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_resources ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can manage own study plans"
  ON study_plans FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage own flashcards"
  ON flashcards FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read own progress snapshots"
  ON progress_snapshots FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can read own AI insights"
  ON ai_insights FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read public groups and manage own groups"
  ON collaboration_groups FOR SELECT
  TO authenticated
  USING (privacy_level = 'public' OR created_by = auth.uid());

CREATE POLICY "Users can manage own group memberships"
  ON group_memberships FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Anyone can read verified resources"
  ON resource_library FOR SELECT
  TO authenticated
  USING (is_verified = true);

CREATE POLICY "Users can manage own resource interactions"
  ON user_resources FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Insert enhanced achievements
INSERT INTO achievements (name, description, icon, category, criteria, points, rarity) VALUES
  ('Flashcard Master', 'Create and review 50 flashcards', 'BookOpen', 'milestone', '{"flashcards_created": 50}', 40, 'rare'),
  ('Study Planner', 'Complete your first study plan', 'Calendar', 'milestone', '{"study_plans_completed": 1}', 30, 'common'),
  ('Collaboration Champion', 'Join 3 study groups', 'Users', 'special', '{"groups_joined": 3}', 50, 'rare'),
  ('Resource Explorer', 'Complete 10 learning resources', 'ExternalLink', 'milestone', '{"resources_completed": 10}', 35, 'common'),
  ('AI Whisperer', 'Follow 20 AI recommendations', 'Brain', 'special', '{"ai_suggestions_followed": 20}', 75, 'epic'),
  ('Time Master', 'Study for 100 hours total', 'Clock', 'milestone', '{"total_study_hours": 100}', 100, 'legendary'),
  ('Prediction Pro', 'Achieve predicted grade in 3 subjects', 'TrendingUp', 'performance', '{"predictions_achieved": 3}', 80, 'epic'),
  ('Social Learner', 'Help 5 study group members', 'Heart', 'special', '{"members_helped": 5}', 60, 'rare')
ON CONFLICT (name) DO NOTHING;

-- Insert sample resources
INSERT INTO resource_library (title, description, resource_type, url, difficulty_level, estimated_time_minutes, rating, tags, is_free, is_verified, subject_id) VALUES
  ('Khan Academy Mathematics', 'Comprehensive math courses from basic to advanced', 'course', 'https://khanacademy.org/math', 'beginner', 1200, 4.8, ARRAY['math', 'free', 'interactive'], true, true, NULL),
  ('Coursera Study Skills', 'Learn effective study techniques and time management', 'course', 'https://coursera.org/learn/learning-how-to-learn', 'beginner', 480, 4.9, ARRAY['study-skills', 'productivity'], false, true, NULL),
  ('Anki Flashcards', 'Spaced repetition flashcard system for memorization', 'tool', 'https://apps.ankiweb.net', 'intermediate', 30, 4.7, ARRAY['flashcards', 'memory', 'spaced-repetition'], true, true, NULL),
  ('Pomodoro Timer', 'Time management technique for focused study sessions', 'tool', 'https://pomofocus.io', 'beginner', 5, 4.5, ARRAY['productivity', 'focus', 'time-management'], true, true, NULL)
ON CONFLICT DO NOTHING;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_study_plans_user_id ON study_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_study_plans_status ON study_plans(status);
CREATE INDEX IF NOT EXISTS idx_flashcards_user_id ON flashcards(user_id);
CREATE INDEX IF NOT EXISTS idx_flashcards_next_review ON flashcards(next_review);
CREATE INDEX IF NOT EXISTS idx_progress_snapshots_user_id ON progress_snapshots(user_id);
CREATE INDEX IF NOT EXISTS idx_progress_snapshots_date ON progress_snapshots(snapshot_date);
CREATE INDEX IF NOT EXISTS idx_ai_insights_user_id ON ai_insights(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_insights_type ON ai_insights(insight_type);
CREATE INDEX IF NOT EXISTS idx_group_memberships_user_id ON group_memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_group_memberships_group_id ON group_memberships(group_id);
CREATE INDEX IF NOT EXISTS idx_resource_library_tags ON resource_library USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_user_resources_user_id ON user_resources(user_id);

-- Add triggers for new tables
CREATE TRIGGER update_study_plans_updated_at BEFORE UPDATE ON study_plans FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_flashcards_updated_at BEFORE UPDATE ON flashcards FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_collaboration_groups_updated_at BEFORE UPDATE ON collaboration_groups FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_resource_library_updated_at BEFORE UPDATE ON resource_library FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_resources_updated_at BEFORE UPDATE ON user_resources FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

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

-- Trigger to generate insights on new marks
CREATE TRIGGER generate_insights_on_mark
  AFTER INSERT ON marks
  FOR EACH ROW EXECUTE FUNCTION generate_ai_insights();

-- Function to create weekly progress snapshots
CREATE OR REPLACE FUNCTION create_progress_snapshot()
RETURNS void AS $$
DECLARE
  user_record RECORD;
  user_avg numeric;
  subject_avgs jsonb;
  study_hours integer;
  goals_completed integer;
  achievements_earned integer;
  current_streak integer;
BEGIN
  FOR user_record IN SELECT id FROM users LOOP
    -- Calculate overall average
    SELECT AVG(percentage) INTO user_avg
    FROM marks 
    WHERE user_id = user_record.id 
    AND date >= CURRENT_DATE - INTERVAL '7 days';

    -- Calculate subject averages
    SELECT jsonb_object_agg(s.name, avg_score) INTO subject_avgs
    FROM (
      SELECT s.name, AVG(m.percentage) as avg_score
      FROM marks m
      JOIN subjects s ON m.subject_id = s.id
      WHERE m.user_id = user_record.id
      AND m.date >= CURRENT_DATE - INTERVAL '7 days'
      GROUP BY s.name
    ) s;

    -- Get study hours
    SELECT COALESCE(SUM(duration_minutes), 0) / 60 INTO study_hours
    FROM study_sessions
    WHERE user_id = user_record.id
    AND start_time >= CURRENT_DATE - INTERVAL '7 days';

    -- Get completed goals
    SELECT COUNT(*) INTO goals_completed
    FROM goals
    WHERE user_id = user_record.id
    AND status = 'completed'
    AND updated_at >= CURRENT_DATE - INTERVAL '7 days';

    -- Get achievements earned
    SELECT COUNT(*) INTO achievements_earned
    FROM user_achievements
    WHERE user_id = user_record.id
    AND earned_at >= CURRENT_DATE - INTERVAL '7 days';

    -- Get current streak
    SELECT current_streak INTO current_streak
    FROM users
    WHERE id = user_record.id;

    -- Insert snapshot if there's data
    IF user_avg IS NOT NULL THEN
      INSERT INTO progress_snapshots (
        user_id, snapshot_date, overall_average, subject_averages,
        study_hours_week, goals_completed, achievements_earned, streak_length
      ) VALUES (
        user_record.id, CURRENT_DATE, user_avg, COALESCE(subject_avgs, '{}'::jsonb),
        study_hours, goals_completed, achievements_earned, current_streak
      );
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;