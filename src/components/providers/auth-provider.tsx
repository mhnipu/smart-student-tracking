'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { User, Session } from '@supabase/supabase-js';
import { toast } from 'sonner';

type AuthContextType = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
  configError: boolean;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  signOut: async () => {},
  configError: false,
});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Simple function to validate if Supabase is properly configured
export const isSupabaseConfigured = () => {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  
  return !(!supabaseUrl || !supabaseKey || 
    supabaseUrl.includes('your-project') || 
    supabaseKey.includes('your-anon-key'));
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<Error | null>(null);
  const [configError, setConfigError] = useState<boolean>(false);

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
      toast.success("You have been signed out");
    } catch (error) {
      console.error("Error signing out:", error);
      toast.error("Failed to sign out");
    }
  };

  /*
  const ensureUserProfile = async (authUser: User) => {
    try {
      console.log('Ensuring user profile for:', authUser.id);
      
      // Check if user profile exists in public.users
      const { data: existingUser, error: fetchError } = await supabase
        .from('users')
        .select('id')
        .eq('id', authUser.id)
        .single();

      if (fetchError) {
        if (fetchError.code === 'PGRST116') {
          // User doesn't exist, create profile
          console.log('Creating user profile...');
          
          try {
            const { error: insertError } = await supabase
              .from('users')
              .insert({
                id: authUser.id,
                email: authUser.email || '',
                name: authUser.user_metadata?.name || '',
                student_id: authUser.user_metadata?.student_id || null,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                total_study_time: 0,
                achievement_points: 0,
                current_streak: 0,
                longest_streak: 0,
                weekly_study_goal: 5
              });

            if (insertError) {
              if (insertError.code === 'PGRST109') {
                // Table doesn't exist yet (migration not run)
                console.log('Users table not found - migrations may need to be run');
              } else {
                console.error('Error creating user profile:', insertError);
              }
            } else {
              console.log('User profile created successfully');
            }
          } catch (err) {
            console.error('Error in profile creation:', err);
          }
        } else {
          console.error('Error checking user profile:', fetchError);
        }
      } else {
        console.log('User profile already exists');
      }
    } catch (error) {
      console.error('Error ensuring user profile:', error);
    }
  };
  */

  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      try {
        setLoading(true);
        console.log('Initializing auth...');
        
        // Check if Supabase is properly configured
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
        
        if (!supabaseUrl || !supabaseKey || 
            supabaseUrl.includes('your-project') || 
            supabaseKey.includes('your-anon-key')) {
          console.error('Supabase not properly configured. Please update your .env file.');
          setConfigError(true);
          setLoading(false);
          return;
        }

        // First check for existing session
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('Error getting session:', sessionError);
          setAuthError(sessionError);
          return;
        }

        if (sessionData?.session) {
          console.log('Found existing session');
          setSession(sessionData.session);
          setUser(sessionData.session.user);
          
          // Ensure user profile exists
          // await ensureUserProfile(sessionData.session.user);
        } else {
          console.log('No existing session found');
        }
      } catch (error) {
        console.error('Error in initAuth:', error);
        setAuthError(error as Error);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initAuth();

    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;

        console.log('Auth state change:', event, !!session?.user);

        try {
          if (session?.user) {
            setUser(session.user);
            setSession(session);
            // await ensureUserProfile(session.user);
          } else {
            setUser(null);
            setSession(null);
          }
        } catch (error) {
          console.error('Error in auth state change:', error);
          setAuthError(error as Error);
        } finally {
          if (mounted) {
            setLoading(false);
          }
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ 
      user, 
      session, 
      loading, 
      signOut,
      configError
    }}>
      {children}
    </AuthContext.Provider>
  );
}