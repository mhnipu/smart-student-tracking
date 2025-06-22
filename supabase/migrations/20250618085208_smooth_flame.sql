/*
  # Enhanced Student Performance Tracker Features

  1. New Tables
    - `goals` - Student academic goals and targets
    - `achievements` - Unlockable achievements and badges
    - `user_achievements` - User's earned achievements
    - `study_sessions` - Track study time and sessions
    - `notes` - Personal notes for subjects/topics
    - `reminders` - Study reminders and notifications

  2. Enhanced Tables
    - Add new columns to existing tables for better functionality
    - Add grade prediction and trend analysis

  3. Security
    - Enable RLS on all new tables
    - Add appropriate policies for user data access
*/

-- Goals table for academic targets
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

-- Achievements system
CREATE TABLE IF NOT EXISTS achievements (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text UNIQUE NOT NULL,
  description text NOT NULL,
  icon text NOT NULL,
  category text NOT NULL CHECK (category IN ('performance', 'consistency', 'improvement', 'milestone', 'special')),
  criteria jsonb NOT NULL, -- Conditions to unlock achievement
  points integer DEFAULT 0,
  rarity text DEFAULT 'common' CHECK (rarity IN ('common', 'rare', 'epic', 'legendary')),
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- User achievements junction table
CREATE TABLE IF NOT EXISTS user_achievements (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  achievement_id uuid NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
  earned_at timestamptz DEFAULT now(),
  progress numeric DEFAULT 100 CHECK (progress >= 0 AND progress <= 100),
  UNIQUE(user_id, achievement_id)
);

-- Study sessions tracking
CREATE TABLE IF NOT EXISTS study_sessions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  title text NOT NULL,
  description text,
  start_time timestamptz NOT NULL,
  end_time timestamptz,
  duration_minutes integer GENERATED ALWAYS AS (
    CASE 
      WHEN end_time IS NOT NULL THEN 
        EXTRACT(EPOCH FROM (end_time - start_time)) / 60
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

-- Personal notes system
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

-- Reminders and notifications
CREATE TABLE IF NOT EXISTS reminders (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  title text NOT NULL,
  description text,
  reminder_date timestamptz NOT NULL,
  reminder_type text DEFAULT 'study' CHECK (reminder_type IN ('study', 'exam', 'assignment', 'goal', 'general')),
  is_completed boolean DEFAULT false,
  is_recurring boolean DEFAULT false,
  recurrence_pattern text, -- 'daily', 'weekly', 'monthly'
  priority text DEFAULT 'medium' CHECK (priority IN ('high', 'medium', 'low')),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subject_id uuid REFERENCES subjects(id) ON DELETE SET NULL,
  goal_id uuid REFERENCES goals(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add new columns to existing tables
ALTER TABLE users ADD COLUMN IF NOT EXISTS total_study_time integer DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS achievement_points integer DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS current_streak integer DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS longest_streak integer DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS preferred_study_time text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS study_goals jsonb DEFAULT '{}'::jsonb;

ALTER TABLE marks ADD COLUMN IF NOT EXISTS predicted_grade text;
ALTER TABLE marks ADD COLUMN IF NOT EXISTS difficulty_rating integer CHECK (difficulty_rating >= 1 AND difficulty_rating <= 5);
ALTER TABLE marks ADD COLUMN IF NOT EXISTS time_spent_minutes integer;
ALTER TABLE marks ADD COLUMN IF NOT EXISTS notes text;

ALTER TABLE subjects ADD COLUMN IF NOT EXISTS target_grade text;
ALTER TABLE subjects ADD COLUMN IF NOT EXISTS current_grade text;
ALTER TABLE subjects ADD COLUMN IF NOT EXISTS study_priority integer DEFAULT 3 CHECK (study_priority >= 1 AND study_priority <= 5);
ALTER TABLE subjects ADD COLUMN IF NOT EXISTS total_study_time integer DEFAULT 0;

-- Enable RLS on new tables
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Goals
DROP POLICY IF EXISTS "Users can manage own goals" ON goals;
CREATE POLICY "Users can manage own goals"
  ON goals FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for Achievements (read-only for users)
DROP POLICY IF EXISTS "Anyone can read achievements" ON achievements;
CREATE POLICY "Anyone can read achievements"
  ON achievements FOR SELECT
  TO authenticated
  USING (true);

-- RLS Policies for User Achievements
DROP POLICY IF EXISTS "Users can manage own achievements" ON user_achievements;
CREATE POLICY "Users can manage own achievements"
  ON user_achievements FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for Study Sessions
DROP POLICY IF EXISTS "Users can manage own study sessions" ON study_sessions;
CREATE POLICY "Users can manage own study sessions"
  ON study_sessions FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for Notes
DROP POLICY IF EXISTS "Users can manage own notes" ON notes;
CREATE POLICY "Users can manage own notes"
  ON notes FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for Reminders
DROP POLICY IF EXISTS "Users can manage own reminders" ON reminders;
CREATE POLICY "Users can manage own reminders"
  ON reminders FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Insert sample achievements
INSERT INTO achievements (name, description, icon, category, criteria, points, rarity) VALUES
  ('First Steps', 'Add your first test score', 'Trophy', 'milestone', '{"marks_count": 1}', 10, 'common'),
  ('Perfect Score', 'Achieve a 100% score on any test', 'Star', 'performance', '{"perfect_score": true}', 50, 'rare'),
  ('Consistent Performer', 'Maintain above 80% average for 5 consecutive tests', 'Target', 'consistency', '{"consecutive_high_scores": 5, "threshold": 80}', 75, 'epic'),
  ('Study Warrior', 'Complete 10 study sessions', 'BookOpen', 'milestone', '{"study_sessions": 10}', 25, 'common'),
  ('Improvement Master', 'Improve your average by 15% in any subject', 'TrendingUp', 'improvement', '{"improvement_percentage": 15}', 100, 'legendary'),
  ('Subject Expert', 'Achieve 90%+ average in any subject with at least 5 tests', 'Award', 'performance', '{"subject_average": 90, "min_tests": 5}', 60, 'epic'),
  ('Early Bird', 'Complete 5 morning study sessions', 'Sunrise', 'special', '{"morning_sessions": 5}', 30, 'rare'),
  ('Night Owl', 'Complete 5 evening study sessions', 'Moon', 'special', '{"evening_sessions": 5}', 30, 'rare'),
  ('Goal Crusher', 'Complete your first academic goal', 'CheckCircle', 'milestone', '{"completed_goals": 1}', 40, 'common'),
  ('Streak Master', 'Maintain a 7-day study streak', 'Flame', 'consistency', '{"study_streak": 7}', 80, 'epic')
ON CONFLICT (name) DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_goals_user_id ON goals(user_id);
CREATE INDEX IF NOT EXISTS idx_goals_status ON goals(status);
CREATE INDEX IF NOT EXISTS idx_goals_target_date ON goals(target_date);
CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_study_sessions_user_id ON study_sessions(user_id);
ALTER TABLE study_sessions ADD COLUMN IF NOT EXISTS start_time timestamptz NOT NULL DEFAULT now();
CREATE INDEX IF NOT EXISTS idx_study_sessions_start_time ON study_sessions(start_time);
CREATE INDEX IF NOT EXISTS idx_notes_user_id ON notes(user_id);
CREATE INDEX IF NOT EXISTS idx_notes_tags ON notes USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_reminders_user_id ON reminders(user_id);
CREATE INDEX IF NOT EXISTS idx_reminders_date ON reminders(reminder_date);

-- Add updated_at triggers for new tables
DROP TRIGGER IF EXISTS update_goals_updated_at ON goals;
CREATE TRIGGER update_goals_updated_at BEFORE UPDATE ON goals FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
DROP TRIGGER IF EXISTS update_study_sessions_updated_at ON study_sessions;
CREATE TRIGGER update_study_sessions_updated_at BEFORE UPDATE ON study_sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
DROP TRIGGER IF EXISTS update_notes_updated_at ON notes;
CREATE TRIGGER update_notes_updated_at BEFORE UPDATE ON notes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
DROP TRIGGER IF EXISTS update_reminders_updated_at ON reminders;
CREATE TRIGGER update_reminders_updated_at BEFORE UPDATE ON reminders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

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

DROP TRIGGER IF EXISTS update_streak_on_study_session ON study_sessions;
CREATE TRIGGER update_streak_on_study_session
  AFTER INSERT ON study_sessions
  FOR EACH ROW EXECUTE FUNCTION update_user_streak();

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

DROP TRIGGER IF EXISTS check_achievements_on_mark ON marks;
CREATE TRIGGER check_achievements_on_mark
  AFTER INSERT ON marks
  FOR EACH ROW EXECUTE FUNCTION check_achievements();

DROP TRIGGER IF EXISTS check_achievements_on_study_session ON study_sessions;
CREATE TRIGGER check_achievements_on_study_session
  AFTER INSERT OR UPDATE ON study_sessions
  FOR EACH ROW EXECUTE FUNCTION check_achievements();