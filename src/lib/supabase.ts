import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

console.log('Supabase Config Check:');
console.log('URL:', supabaseUrl ? (supabaseUrl.includes('your-project') ? 'Invalid (placeholder)' : 'Valid') : 'Missing');
console.log('Key:', supabaseAnonKey ? (supabaseAnonKey.includes('your-anon-key') ? 'Invalid (placeholder)' : 'Valid') : 'Missing');

let configError = null;

if (!supabaseUrl || !supabaseAnonKey) {
  configError = 'Missing Supabase environment variables. Please check your .env file and make sure it contains VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.';
  console.error(configError);
  console.error('You can find these values in your Supabase Dashboard -> Settings -> API');
} else if (supabaseUrl.includes('your-project') || supabaseAnonKey.includes('your-anon-key')) {
  configError = 'Please replace the placeholder values in your .env file with your actual Supabase credentials.';
  console.error(configError);
  console.error('You can find these values in your Supabase Dashboard -> Settings -> API');
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key',
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      flowType: 'pkce'
    },
    global: {
      headers: {
        'X-Client-Info': 'supabase-js-web'
      }
    }
  }
);

export const isSupabaseConfigured = () => {
  return !configError;
};

export const testDatabaseConnection = async () => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id')
      .limit(1);
    
    if (error) {
      if (error.code === 'PGRST109') {
        return { success: false, error: 'Database tables not found. Please run the migration scripts.' };
      }
      return { success: false, error: error.message };
    }
    
    return { success: true, data };
  } catch (err) {
    return { success: false, error: err.message };
  }
};

export const supabaseConfigError = configError;

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          name: string | null;
          student_id: string | null;
          profile_image: string | null;
          grade: string | null;
          school: string | null;
          total_study_time: number;
          achievement_points: number;
          current_streak: number;
          longest_streak: number;
          preferred_study_time: string | null;
          study_goals: any;
          learning_style: string;
          study_preferences: any;
          notification_settings: any;
          timezone: string;
          weekly_study_goal: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          name?: string | null;
          student_id?: string | null;
          profile_image?: string | null;
          grade?: string | null;
          school?: string | null;
          total_study_time?: number;
          achievement_points?: number;
          current_streak?: number;
          longest_streak?: number;
          preferred_study_time?: string | null;
          study_goals?: any;
          learning_style?: string;
          study_preferences?: any;
          notification_settings?: any;
          timezone?: string;
          weekly_study_goal?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          name?: string | null;
          student_id?: string | null;
          profile_image?: string | null;
          grade?: string | null;
          school?: string | null;
          total_study_time?: number;
          achievement_points?: number;
          current_streak?: number;
          longest_streak?: number;
          preferred_study_time?: string | null;
          study_goals?: any;
          learning_style?: string;
          study_preferences?: any;
          notification_settings?: any;
          timezone?: string;
          weekly_study_goal?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      subjects: {
        Row: {
          id: string;
          name: string;
          code: string;
          description: string | null;
          category: string | null;
          color: string | null;
          target_grade: string | null;
          current_grade: string | null;
          study_priority: number;
          total_study_time: number;
          difficulty_level: string;
          exam_date: string | null;
          study_method_preferences: string[];
          performance_trend: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          code: string;
          description?: string | null;
          category?: string | null;
          color?: string | null;
          target_grade?: string | null;
          current_grade?: string | null;
          study_priority?: number;
          total_study_time?: number;
          difficulty_level?: string;
          exam_date?: string | null;
          study_method_preferences?: string[];
          performance_trend?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          code?: string;
          description?: string | null;
          category?: string | null;
          color?: string | null;
          target_grade?: string | null;
          current_grade?: string | null;
          study_priority?: number;
          total_study_time?: number;
          difficulty_level?: string;
          exam_date?: string | null;
          study_method_preferences?: string[];
          performance_trend?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      marks: {
        Row: {
          id: string;
          score: number;
          max_score: number;
          percentage: number;
          test_type: string;
          test_name: string;
          date: string;
          semester: string | null;
          predicted_grade: string | null;
          difficulty_rating: number | null;
          time_spent_minutes: number | null;
          notes: string | null;
          user_id: string;
          subject_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          score: number;
          max_score: number;
          percentage?: number;
          test_type: string;
          test_name: string;
          date: string;
          semester?: string | null;
          predicted_grade?: string | null;
          difficulty_rating?: number | null;
          time_spent_minutes?: number | null;
          notes?: string | null;
          user_id: string;
          subject_id: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          score?: number;
          max_score?: number;
          percentage?: number;
          test_type?: string;
          test_name?: string;
          date?: string;
          semester?: string | null;
          predicted_grade?: string | null;
          difficulty_rating?: number | null;
          time_spent_minutes?: number | null;
          notes?: string | null;
          user_id?: string;
          subject_id?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
};