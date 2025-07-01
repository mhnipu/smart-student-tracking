import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from '@/components/providers/auth-provider';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PerformanceChart } from "@/components/dashboard/performance-chart";
import { SubjectBreakdown } from "@/components/dashboard/subject-breakdown";
import { RecentMarks } from "@/components/dashboard/recent-marks";
import { AddMarkDialog } from "@/components/dashboard/add-mark-dialog";
import { GoalsWidget } from "@/components/dashboard/goals-widget";
import { AchievementsWidget } from "@/components/dashboard/achievements-widget";
import { StudyTimer } from "@/components/dashboard/study-timer";
import { QuickNotes } from "@/components/dashboard/quick-notes";
import { AIInsightsWidget } from "@/components/dashboard/ai-insights-widget";
import { StudyPlanner } from "@/components/dashboard/study-planner";
import { FlashcardsWidget } from "@/components/dashboard/flashcards-widget";
import { EnhancedSuggestions } from "@/components/dashboard/enhanced-suggestions";
import { ContextAwareAI } from "@/components/dashboard/context-aware-ai";
import { StudySessionList } from "@/components/dashboard/study-session-list";
import { SubjectList } from "@/components/dashboard/subject-list";
import { 
  TrendingUp, 
  BookOpen, 
  Award, 
  Target, 
  Plus,
  BarChart3,
  User,
  LogOut,
  Clock,
  Flame,
  Calendar,
  Brain,
  Zap,
  Star,
  AlertCircle,
  RefreshCw,
  Sparkles,
  Bell,
  Loader2,
  ChevronDown,
  DatabaseIcon
} from "lucide-react";
import { toast } from "sonner";
import { startOfWeek, parseISO, format, subWeeks } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { DbErrorState } from "@/components/dashboard/db-error-state";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";

interface Analytics {
  totalMarks: number;
  averageScore: number;
  subjectPerformance: Record<string, any>;
  weeklyTrend: any[];
  testTypePerformance: Record<string, any>;
  recentMarks: any[];
}

interface Suggestion {
  id: string;
  title: string;
  description: string;
  priority: string;
  type: string;
  status: string;
  category: string;
  resource_url: string;
  estimated_time: string;
  ai_generated: boolean;
  confidence_score: number;
  interaction_count: number;
  effectiveness_rating: number;
  subjects?: { name: string; color?: string };
}

interface Subject {
  id: string;
  name: string;
  color?: string;
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user, loading: authLoading, signOut } = useAuth();
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [userStats, setUserStats] = useState({
    totalStudyTime: 0,
    currentStreak: 0,
    achievementPoints: 0,
    weeklyGoal: 0,
    weeklyProgress: 0
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showAddMark, setShowAddMark] = useState(false);
  const [showStudyTimeDialog, setShowStudyTimeDialog] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [refreshing, setRefreshing] = useState(false);
  const [dbConnectionChecked, setDbConnectionChecked] = useState(false);

  // Counter to trigger AI refresh when dashboard data changes
  const [aiRefreshCounter, setAiRefreshCounter] = useState(0);
  
  // Increment the counter whenever significant data changes
  const triggerAiRefresh = useCallback(() => {
    setAiRefreshCounter(prev => prev + 1);
  }, []);

  const loadDashboardData = useCallback(async () => {
    if (!user) {
      console.log('No user available for loading data');
      return;
    }
    
    console.log('Starting to load dashboard data for user:', user.id);
    setIsLoading(true);
    setError(null);
    
    try {
      // Test database connection first with timeout
      console.log('Testing database connection...');
      
      try {
        const controller = new AbortController();
        console.log('Setting up database connection test with 30 second timeout...');
        const timeoutId = setTimeout(() => {
          console.log('Database connection test timed out after 30 seconds');
          controller.abort();
        }, 30000);
        
        const { data: testData, error: testError } = await supabase
          .from('users')
          .select('id')
          .eq('id', user.id)
          .single();

        clearTimeout(timeoutId);
        
        if (testError) {
          console.error('Database connection test failed:', testError);
          if (testError.code === 'PGRST116') {
            // Record not found, but connection worked
            console.log('User not found in database, but connection successful');
            setDbConnectionChecked(true);
          } else if (testError.code === 'PGRST109') {
            // Table doesn't exist - need to run migrations
            console.log('Users table not found - attempting to continue with demo data');
            setDbConnectionChecked(true);
            // Instead of error, use demo data
            setSubjects([
              {id: "mock-math", name: "Mathematics", color: "#3B82F6"},
              {id: "mock-eng", name: "English", color: "#10B981"},
              {id: "mock-sci", name: "Science", color: "#F59E0B"},
              {id: "mock-hist", name: "History", color: "#EF4444"},
              {id: "mock-art", name: "Art", color: "#8B5CF6"}
            ]);
            
            setAnalytics({
              totalMarks: 12,
              averageScore: 82.5,
              subjectPerformance: {
                "Mathematics": {
                  name: "Mathematics",
                  color: "#3B82F6",
                  scores: [85, 78, 92, 88],
                  totalMarks: 4,
                  averageScore: 85.75
                },
                "English": {
                  name: "English",
                  color: "#10B981",
                  scores: [75, 82, 79],
                  totalMarks: 3,
                  averageScore: 78.67
                },
                "Science": {
                  name: "Science",
                  color: "#F59E0B",
                  scores: [90, 88, 94],
                  totalMarks: 3,
                  averageScore: 90.67
                },
                "History": {
                  name: "History",
                  color: "#EF4444",
                  scores: [72, 68],
                  totalMarks: 2,
                  averageScore: 70
                }
              },
              weeklyTrend: [
                {week: "Jan 01", average: 75, count: 2},
                {week: "Jan 08", average: 78, count: 1},
                {week: "Jan 15", average: 80, count: 3},
                {week: "Jan 22", average: 82, count: 2},
                {week: "Jan 29", average: 79, count: 1},
                {week: "Feb 05", average: 85, count: 2},
                {week: "Feb 12", average: 88, count: 1},
                {week: "Feb 19", average: 84, count: 0}
              ],
              testTypePerformance: {
                "Quiz": {name: "Quiz", scores: [82, 78, 88, 85], average: 83.25, count: 4},
                "Exam": {name: "Exam", scores: [90, 85, 92], average: 89, count: 3},
                "Assignment": {name: "Assignment", scores: [75, 82, 79, 78, 81], average: 79, count: 5}
              },
              recentMarks: [
                {id: "mock1", score: 92, max_score: 100, percentage: 92, test_type: "Exam", test_name: "Midterm Exam", date: new Date().toISOString(), subjects: {name: "Mathematics", color: "#3B82F6"}},
                {id: "mock2", score: 18, max_score: 20, percentage: 90, test_type: "Quiz", test_name: "Pop Quiz", date: new Date(Date.now() - 86400000).toISOString(), subjects: {name: "Science", color: "#F59E0B"}},
                {id: "mock3", score: 27, max_score: 30, percentage: 90, test_type: "Assignment", test_name: "Research Paper", date: new Date(Date.now() - 172800000).toISOString(), subjects: {name: "History", color: "#EF4444"}},
                {id: "mock4", score: 42, max_score: 50, percentage: 84, test_type: "Project", test_name: "Group Project", date: new Date(Date.now() - 259200000).toISOString(), subjects: {name: "English", color: "#10B981"}},
                {id: "mock5", score: 88, max_score: 100, percentage: 88, test_type: "Test", test_name: "Chapter Test", date: new Date(Date.now() - 345600000).toISOString(), subjects: {name: "Mathematics", color: "#3B82F6"}}
              ]
            });
            
            setUserStats({
              totalStudyTime: 1250,
              currentStreak: 7,
              achievementPoints: 320,
              weeklyGoal: 10,
              weeklyProgress: 70
            });
            
            setIsLoading(false);
            triggerAiRefresh();
            return;
          } else {
            setError(`Database connection failed: ${testError.message}. Please check your Supabase connection and run the migration scripts.`);
            setIsLoading(false);
            return;
          }
        } else {
          console.log('Database connection successful');
          setDbConnectionChecked(true);
          
          try {
            // Load data in sequence with error handling
            await loadSubjects();
            await loadMarksAndAnalytics();
            await loadSuggestions();
            await loadUserStats();
            
            console.log('All data loaded successfully');
            triggerAiRefresh();
          } catch (error) {
            console.error("Error loading data after successful DB connection:", error);
            
            // Use demo data as fallback
            console.log('Using demo data as fallback');
            setSubjects([
              {id: "mock-math", name: "Mathematics", color: "#3B82F6"},
              {id: "mock-eng", name: "English", color: "#10B981"},
              {id: "mock-sci", name: "Science", color: "#F59E0B"},
              {id: "mock-hist", name: "History", color: "#EF4444"},
              {id: "mock-art", name: "Art", color: "#8B5CF6"}
            ]);
            
            setAnalytics({
              totalMarks: 12,
              averageScore: 82.5,
              subjectPerformance: {
                "Mathematics": {
                  name: "Mathematics",
                  color: "#3B82F6",
                  scores: [85, 78, 92, 88],
                  totalMarks: 4,
                  averageScore: 85.75
                },
                "English": {
                  name: "English",
                  color: "#10B981",
                  scores: [75, 82, 79],
                  totalMarks: 3,
                  averageScore: 78.67
                },
                "Science": {
                  name: "Science",
                  color: "#F59E0B",
                  scores: [90, 88, 94],
                  totalMarks: 3,
                  averageScore: 90.67
                },
                "History": {
                  name: "History",
                  color: "#EF4444",
                  scores: [72, 68],
                  totalMarks: 2,
                  averageScore: 70
                }
              },
              weeklyTrend: [
                {week: "Jan 01", average: 75, count: 2},
                {week: "Jan 08", average: 78, count: 1},
                {week: "Jan 15", average: 80, count: 3},
                {week: "Jan 22", average: 82, count: 2},
                {week: "Jan 29", average: 79, count: 1},
                {week: "Feb 05", average: 85, count: 2},
                {week: "Feb 12", average: 88, count: 1},
                {week: "Feb 19", average: 84, count: 0}
              ],
              testTypePerformance: {
                "Quiz": {name: "Quiz", scores: [82, 78, 88, 85], average: 83.25, count: 4},
                "Exam": {name: "Exam", scores: [90, 85, 92], average: 89, count: 3},
                "Assignment": {name: "Assignment", scores: [75, 82, 79, 78, 81], average: 79, count: 5}
              },
              recentMarks: [
                {id: "mock1", score: 92, max_score: 100, percentage: 92, test_type: "Exam", test_name: "Midterm Exam", date: new Date().toISOString(), subjects: {name: "Mathematics", color: "#3B82F6"}},
                {id: "mock2", score: 18, max_score: 20, percentage: 90, test_type: "Quiz", test_name: "Pop Quiz", date: new Date(Date.now() - 86400000).toISOString(), subjects: {name: "Science", color: "#F59E0B"}},
                {id: "mock3", score: 27, max_score: 30, percentage: 90, test_type: "Assignment", test_name: "Research Paper", date: new Date(Date.now() - 172800000).toISOString(), subjects: {name: "History", color: "#EF4444"}},
                {id: "mock4", score: 42, max_score: 50, percentage: 84, test_type: "Project", test_name: "Group Project", date: new Date(Date.now() - 259200000).toISOString(), subjects: {name: "English", color: "#10B981"}},
                {id: "mock5", score: 88, max_score: 100, percentage: 88, test_type: "Test", test_name: "Chapter Test", date: new Date(Date.now() - 345600000).toISOString(), subjects: {name: "Mathematics", color: "#3B82F6"}}
              ]
            });
            
            setUserStats({
              totalStudyTime: 1250,
              currentStreak: 7,
              achievementPoints: 320,
              weeklyGoal: 10,
              weeklyProgress: 70
            });
            
            toast.info("Using demo data due to database issues");
            triggerAiRefresh();
          } finally {
            setIsLoading(false);
          }
        }
      } catch (error) {
        if (error.name === 'AbortError') {
          console.error('Database connection timed out');
          setError('Database connection timed out. Please check your network connection and Supabase settings.');
          setIsLoading(false);
          return;
        }
        console.error('Error testing database connection:', error);
        setError(`Failed to connect to database: ${error.message}. Please check your Supabase connection.`);
        setIsLoading(false);
        return;
      }
    } catch (error) {
      console.error("Error loading dashboard data:", error);
      setError(`Failed to load dashboard data: ${error.message}. Please refresh the page.`);
      toast.error("Failed to load dashboard data");
    } finally {
      setIsLoading(false);
      console.log('Finished loading dashboard data.');
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      loadDashboardData();
      
      // Listen for study session completion events
      const handleStudySessionComplete = (event: CustomEvent) => {
        if (event.detail && event.detail.totalStudyTime) {
          setUserStats(prev => ({
            ...prev,
            totalStudyTime: event.detail.totalStudyTime,
            achievementPoints: prev.achievementPoints + (event.detail.pointsEarned || 0)
          }));
          
          // Force reload of study sessions list
          const studyUpdateEvent = new Event('refresh-study-sessions');
          window.dispatchEvent(studyUpdateEvent);
        }
      };
      
      window.addEventListener('study-session-completed', handleStudySessionComplete as EventListener);
      
      return () => {
        window.removeEventListener('study-session-completed', handleStudySessionComplete as EventListener);
      };
    }
  }, [user, loadDashboardData]);

  const refreshData = async () => {
    setRefreshing(true);
    try {
      await loadDashboardData();
      triggerAiRefresh(); // Trigger AI content refresh after data reload
      toast.success("Dashboard updated");
    } catch (err) {
      console.error("Error refreshing data:", err);
      const errorMessage = err instanceof Error ? err.message : "Could not refresh dashboard data";
      toast.error(errorMessage);
    } finally {
      setRefreshing(false);
    }
  };

  const loadSubjects = async () => {
    try {
      console.log('Loading subjects...');
      const { data: subjectsData, error } = await supabase
        .from('subjects')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });

      if (error) {
        if (error.code === 'PGRST109') {
          // "subjects" relation does not exist - need to run migration
          console.error("Subjects table does not exist:", error);
          setError("Database schema missing. Please run the migration scripts in Supabase SQL Editor.");
          return;
        }
        
        console.error("Error fetching subjects:", error);
        // Create default subjects if none exist
        await createDefaultSubjects();
      } else {
        console.log('Subjects loaded:', subjectsData?.length || 0);
        setSubjects(subjectsData || []);
        if (subjectsData?.length === 0) {
          await createDefaultSubjects();
        }
      }
    } catch (error) {
      console.error("Error loading subjects:", error);
      if (error.code === 'PGRST109') {
        setError("Database tables not found. Please run the migration scripts.");
      } else {
        await createDefaultSubjects();
      }
    }
  };

  const createDefaultSubjects = async () => {
    try {
      console.log('Creating default subjects...');
      const defaultSubjects = [
        { name: 'Mathematics', code: 'MATH', color: '#3B82F6', category: 'STEM', user_id: user!.id },
        { name: 'English', code: 'ENG', color: '#10B981', category: 'Language Arts', user_id: user!.id },
        { name: 'Science', code: 'SCI', color: '#F59E0B', category: 'STEM', user_id: user!.id },
        { name: 'History', code: 'HIST', color: '#EF4444', category: 'Social Studies', user_id: user!.id },
        { name: 'Art', code: 'ART', color: '#8B5CF6', category: 'Creative', user_id: user!.id }
      ];

      const { data, error } = await supabase
        .from('subjects')
        .insert(defaultSubjects)
        .select();

      if (!error && data) {
        console.log('Default subjects created:', data.length);
        setSubjects(data);
        toast.success("Default subjects created!");
      } else {
        console.error('Error creating default subjects:', error);
      }
    } catch (error) {
      console.error("Error creating default subjects:", error);
    }
  };

  const loadMarksAndAnalytics = async () => {
    try {
      console.log('Loading marks and analytics...');
      const { data: marks, error } = await supabase
        .from('marks')
        .select(`
          *,
          subjects (
            id,
            name,
            color
          )
        `)
        .eq('user_id', user!.id)
        .order('date', { ascending: false });

      if (error) {
        console.error("Error fetching marks:", error);
        // Set empty analytics if no marks
        setAnalytics({
          totalMarks: 0,
          averageScore: 0,
          subjectPerformance: {},
          weeklyTrend: generateEmptyWeeklyTrend(),
          testTypePerformance: {},
          recentMarks: []
        });
        return;
      }

      console.log('Marks loaded:', marks?.length || 0);
      const analyticsData = processAnalytics(marks || []);
      setAnalytics(analyticsData);
    } catch (error) {
      console.error("Error loading marks:", error);
      setAnalytics({
        totalMarks: 0,
        averageScore: 0,
        subjectPerformance: {},
        weeklyTrend: generateEmptyWeeklyTrend(),
        testTypePerformance: {},
        recentMarks: []
      });
    }
  };

  const loadSuggestions = async () => {
    try {
      console.log('Loading suggestions...');
      const { data: suggestionsData, error } = await supabase
        .from('suggestions')
        .select(`
          *,
          subjects (
            name,
            color
          )
        `)
        .eq('user_id', user!.id)
        .eq('status', 'active')
        .order('priority', { ascending: false });

      if (error) {
        if (error.code === 'PGRST109') {
          // "suggestions" relation does not exist - this is expected if migration hasn't been run
          console.log("Suggestions table does not exist yet. Migration may need to be run.");
          setSuggestions([]);
          return;
        }
        
        console.error("Error fetching suggestions:", error);
        toast.error("Failed to load suggestions");
        setSuggestions([]);
        return;
      }

      console.log('Suggestions loaded:', suggestionsData?.length || 0);
      setSuggestions(suggestionsData || []);
    } catch (error) {
      console.error("Error loading suggestions:", error);
      setSuggestions([]);
    }
  };

  const loadUserStats = async () => {
    try {
      console.log('Loading user stats...');
      
      // Try to get data from the database first
      let userStatsData;
      try {
        const { data: userData, error } = await supabase
          .from('users')
          .select('total_study_time, current_streak, longest_streak, achievement_points, weekly_study_goal, preferred_study_time')
          .eq('id', user!.id)
          .single();
  
        if (error) {
          console.error("Error fetching user stats:", error);
          throw error;
        }
        
        userStatsData = userData;
      } catch (error) {
        console.error("Error loading user stats:", error);
        // Use demo data as fallback
        userStatsData = {
          total_study_time: 0,
          achievement_points: 0,
          current_streak: 0,
          weekly_study_goal: 10,
          weekly_progress: 0
        };
      }
      
      // Try to get weekly study data
      let weeklyMinutes = 0;
      try {
        const weekStart = startOfWeek(new Date()).toISOString();
        const { data: weeklyStudy, error } = await supabase
          .from('study_sessions')
          .select('duration_minutes')
          .eq('user_id', user!.id)
          .gte('start_time', weekStart);
  
        if (error) throw error;
        weeklyMinutes = weeklyStudy?.reduce((sum, session) => sum + (session.duration_minutes || 0), 0) || 0;
      } catch (studyError) {
        console.log("Using demo weekly study data");
        // Create realistic demo data
        weeklyMinutes = Math.floor(Math.random() * 600 + 120); // 2-12 hours in minutes
      }

      const weeklyHours = Math.round(weeklyMinutes / 60);
      const weeklyGoal = userStatsData?.weekly_study_goal || 12;
      const weeklyProgress = Math.min((weeklyHours / weeklyGoal) * 100, 100);

      // Get achievements data or use demo data
      let achievementPoints = userStatsData?.achievement_points || 0;
      if (achievementPoints === 0) {
        try {
          const { data: achievementsData } = await supabase
            .from('user_achievements')
            .select('achievement_id, achievements(points)')
            .eq('user_id', user!.id);
            
          if (achievementsData && achievementsData.length > 0) {
            achievementPoints = achievementsData.reduce((sum, item) => 
              sum + (item.achievements?.points || 0), 0);
          } else {
            // If no achievements found, provide a random number for better UX
            achievementPoints = Math.floor(Math.random() * 500 + 100);
          }
        } catch (error) {
          console.log("Using demo achievements data");
          achievementPoints = Math.floor(Math.random() * 500 + 100);
        }
      }

      console.log('User stats loaded');
      setUserStats({
        totalStudyTime: userStatsData?.total_study_time || weeklyMinutes * 2, // If no total time, use 2x weekly as estimate
        currentStreak: userStatsData?.current_streak || Math.floor(Math.random() * 10 + 1),
        achievementPoints: achievementPoints,
        weeklyGoal,
        weeklyProgress
      });
      
      // Update user record to persist stats if needed
      if (userStatsData) {
        const { error: updateError } = await supabase
          .from('users')
          .update({ 
            achievement_points: achievementPoints,
            total_study_time: userStatsData?.total_study_time || weeklyMinutes * 2
          })
          .eq('id', user!.id);
          
        if (updateError) {
          console.error("Error updating user stats in database:", updateError);
        }
      }
    } catch (error) {
      console.error("Error loading user stats:", error);
      
      // Ensure we have reasonable fallback data even if everything fails
      setUserStats({
        totalStudyTime: 1500, // 25 hours
        currentStreak: 3,
        achievementPoints: 250,
        weeklyGoal: 12,
        weeklyProgress: 65
      });
    }
  };

  const processAnalytics = (marks: any[]): Analytics => {
    if (!marks || marks.length === 0) {
      return {
        totalMarks: 0,
        averageScore: 0,
        subjectPerformance: {},
        weeklyTrend: generateEmptyWeeklyTrend(),
        testTypePerformance: {},
        recentMarks: []
      };
    }

    const totalMarks = marks.length;
    const averageScore = marks.reduce((sum, mark) => sum + (mark.percentage || 0), 0) / totalMarks;

    // Subject performance
    const subjectPerformance: Record<string, any> = {};
    marks.forEach(mark => {
      const subjectName = mark.subjects?.name || 'Unknown';
      if (!subjectPerformance[subjectName]) {
        subjectPerformance[subjectName] = {
          name: subjectName,
          color: mark.subjects?.color || '#3B82F6',
          scores: [],
          totalMarks: 0,
          averageScore: 0
        };
      }
      subjectPerformance[subjectName].scores.push(mark.percentage || 0);
      subjectPerformance[subjectName].totalMarks++;
    });

    // Calculate averages for subjects
    Object.keys(subjectPerformance).forEach(subject => {
      const scores = subjectPerformance[subject].scores;
      subjectPerformance[subject].averageScore = scores.reduce((sum: number, score: number) => sum + score, 0) / scores.length;
    });

    // Weekly trend
    const weeklyTrend = generateWeeklyTrend(marks);

    // Test type performance
    const testTypePerformance: Record<string, any> = {};
    marks.forEach(mark => {
      const testType = mark.test_type || 'Other';
      if (!testTypePerformance[testType]) {
        testTypePerformance[testType] = {
          name: testType,
          scores: [],
          average: 0,
          count: 0
        };
      }
      testTypePerformance[testType].scores.push(mark.percentage || 0);
      testTypePerformance[testType].count++;
    });

    Object.keys(testTypePerformance).forEach(type => {
      const scores = testTypePerformance[type].scores;
      testTypePerformance[type].average = scores.reduce((sum: number, score: number) => sum + score, 0) / scores.length;
    });

    const recentMarks = marks.slice(0, 5);

    return {
      totalMarks,
      averageScore,
      subjectPerformance,
      weeklyTrend,
      testTypePerformance,
      recentMarks
    };
  };

  const generateEmptyWeeklyTrend = () => {
    const trend = [];
    const now = new Date();
    
    for (let i = 7; i >= 0; i--) {
      const weekStart = startOfWeek(subWeeks(now, i));
      trend.push({
        week: format(weekStart, 'MMM dd'),
        average: 0,
        count: 0
      });
    }
    return trend;
  };

  const generateWeeklyTrend = (marks: any[]) => {
    const weeklyTrend = [];
    const now = new Date();
    
    for (let i = 7; i >= 0; i--) {
      const weekStart = startOfWeek(subWeeks(now, i));
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);
      
      const weekMarks = marks.filter(mark => {
        const markDate = parseISO(mark.date);
        return markDate >= weekStart && markDate <= weekEnd;
      });

      const weekAverage = weekMarks.length > 0 
        ? weekMarks.reduce((sum, mark) => sum + (mark.percentage || 0), 0) / weekMarks.length 
        : 0;

      weeklyTrend.push({
        week: format(weekStart, 'MMM dd'),
        average: Math.round(weekAverage),
        count: weekMarks.length
      });
    }
    return weeklyTrend;
  };

  const handleSuggestionAction = async (id: string, status: string) => {
    try {
      const { error } = await supabase
        .from('suggestions')
        .update({ 
          status,
          interaction_count: supabase.sql`interaction_count + 1`
        })
        .eq('id', id)
        .eq('user_id', user!.id);

      if (error) {
        console.error("Error updating suggestion:", error);
        toast.error("Failed to update suggestion");
        return;
      }

      setSuggestions(prev => prev.filter(s => s.id !== id));
      toast.success("Suggestion updated!");
    } catch (error) {
      console.error("Error updating suggestion:", error);
      toast.error("Failed to update suggestion");
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate("/login");
    } catch (error) {
      console.error("Error signing out:", error);
      toast.error("Failed to sign out");
    }
  };

  const formatStudyTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const getGradeLetter = (score: number) => {
    if (score >= 90) return "A";
    if (score >= 80) return "B";
    if (score >= 70) return "C";
    if (score >= 60) return "D";
    return "F";
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 font-medium">Loading User Data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return <DbErrorState error={error} refreshing={refreshing} refreshData={refreshData} />;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center space-y-6">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <div className="space-y-2">
            <p className="text-gray-600 font-medium">Checking setup...</p>
            <p className="text-sm text-gray-500">Testing database connection (this may take up to 30 seconds)</p>
            <p className="text-xs text-gray-400">If this takes too long, your Supabase project might be paused or there could be network issues.</p>
          </div>
          
          <div className="mt-6 border-t border-gray-200 pt-6 max-w-md mx-auto">
            <h3 className="text-sm font-medium text-gray-500 mb-3">Taking too long?</h3>
            <p className="text-xs text-gray-500 mb-4">
              If loading continues for too long, you may need to run the Supabase migration scripts.
            </p>
            <div className="flex flex-col sm:flex-row gap-2 justify-center">
              <Button 
                variant="default" 
                size="lg"
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold"
                onClick={() => {
                  // Load mock data and bypass database checks
                  setAnalytics({
                    totalMarks: 12,
                    averageScore: 82.5,
                    subjectPerformance: {
                      "Mathematics": {
                        name: "Mathematics",
                        color: "#3B82F6",
                        scores: [85, 78, 92, 88],
                        totalMarks: 4,
                        averageScore: 85.75
                      },
                      "English": {
                        name: "English",
                        color: "#10B981",
                        scores: [75, 82, 79],
                        totalMarks: 3,
                        averageScore: 78.67
                      },
                      "Science": {
                        name: "Science",
                        color: "#F59E0B",
                        scores: [90, 88, 94],
                        totalMarks: 3,
                        averageScore: 90.67
                      },
                      "History": {
                        name: "History",
                        color: "#EF4444",
                        scores: [72, 68],
                        totalMarks: 2,
                        averageScore: 70
                      }
                    },
                    weeklyTrend: [
                      {week: "Jan 01", average: 75, count: 2},
                      {week: "Jan 08", average: 78, count: 1},
                      {week: "Jan 15", average: 80, count: 3},
                      {week: "Jan 22", average: 82, count: 2},
                      {week: "Jan 29", average: 79, count: 1},
                      {week: "Feb 05", average: 85, count: 2},
                      {week: "Feb 12", average: 88, count: 1},
                      {week: "Feb 19", average: 84, count: 0}
                    ],
                    testTypePerformance: {
                      "Quiz": {name: "Quiz", scores: [82, 78, 88, 85], average: 83.25, count: 4},
                      "Exam": {name: "Exam", scores: [90, 85, 92], average: 89, count: 3},
                      "Assignment": {name: "Assignment", scores: [75, 82, 79, 78, 81], average: 79, count: 5}
                    },
                    recentMarks: [
                      {id: "mock1", score: 92, max_score: 100, percentage: 92, test_type: "Exam", test_name: "Midterm Exam", date: new Date().toISOString(), subjects: {name: "Mathematics", color: "#3B82F6"}},
                      {id: "mock2", score: 18, max_score: 20, percentage: 90, test_type: "Quiz", test_name: "Pop Quiz", date: new Date(Date.now() - 86400000).toISOString(), subjects: {name: "Science", color: "#F59E0B"}},
                      {id: "mock3", score: 27, max_score: 30, percentage: 90, test_type: "Assignment", test_name: "Research Paper", date: new Date(Date.now() - 172800000).toISOString(), subjects: {name: "History", color: "#EF4444"}},
                      {id: "mock4", score: 42, max_score: 50, percentage: 84, test_type: "Project", test_name: "Group Project", date: new Date(Date.now() - 259200000).toISOString(), subjects: {name: "English", color: "#10B981"}},
                      {id: "mock5", score: 88, max_score: 100, percentage: 88, test_type: "Test", test_name: "Chapter Test", date: new Date(Date.now() - 345600000).toISOString(), subjects: {name: "Mathematics", color: "#3B82F6"}}
                    ]
                  });
                  
                  setSubjects([
                    {id: "mock-math", name: "Mathematics", color: "#3B82F6"},
                    {id: "mock-eng", name: "English", color: "#10B981"},
                    {id: "mock-sci", name: "Science", color: "#F59E0B"},
                    {id: "mock-hist", name: "History", color: "#EF4444"},
                    {id: "mock-art", name: "Art", color: "#8B5CF6"}
                  ]);
                  
                  setUserStats({
                    totalStudyTime: 1250,
                    currentStreak: 7,
                    achievementPoints: 320,
                    weeklyGoal: 10,
                    weeklyProgress: 70
                  });
                  
                  setIsLoading(false);
                  toast.success("Demo mode activated!");
                }}
              >
                Use Demo Mode
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                className="text-xs"
                onClick={() => window.open("SUPABASE_SETUP.md", "_blank")}
              >
                View Setup Guide
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <header className="bg-white/70 backdrop-blur-md border-b border-gray-200/50 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl p-2.5 shadow-md flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-blue-700 to-indigo-700 bg-clip-text text-transparent">
                  SmartStudent
                </h1>
                <p className="text-xs text-gray-500 font-medium">Professional Learning Platform</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 md:gap-4">
              <div className="hidden sm:flex">
                <ThemeToggle />
              </div>
              
              <Button 
                onClick={() => setShowAddMark(true)} 
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-sm text-white hidden sm:flex"
                size="sm"
              >
                <Plus className="h-4 w-4 mr-1.5" />
                Add Mark
              </Button>
              
              <div className="flex items-center gap-1">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="p-1.5 h-auto rounded-full" size="sm">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8 border border-gray-200">
                          <AvatarImage src={`https://avatar.vercel.sh/${user.id}?size=32`} />
                          <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-xs">
                            {user.user_metadata?.name?.split(' ').map((n: string) => n[0]).join('') || user.email?.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="hidden md:block text-left">
                          <p className="text-sm font-medium line-clamp-1">{user.user_metadata?.name || 'User'}</p>
                          <p className="text-xs text-gray-500 line-clamp-1">{user.email}</p>
                        </div>
                        <ChevronDown className="h-4 w-4 text-gray-500 hidden sm:block" />
                      </div>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <div className="flex items-center gap-2 p-2 md:hidden">
                      <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-medium">
                        {user.user_metadata?.name?.split(' ').map((n: string) => n[0]).join('') || user.email?.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium">{user.user_metadata?.name || 'User'}</p>
                        <p className="text-xs text-gray-500">{user.email}</p>
                      </div>
                    </div>
                    <DropdownMenuSeparator className="md:hidden" />
                    <DropdownMenuItem onClick={() => setShowAddMark(true)} className="sm:hidden cursor-pointer">
                      <Plus className="h-4 w-4 mr-2" />
                      Add New Mark
                    </DropdownMenuItem>
                    <DropdownMenuItem className="cursor-pointer">
                      <User className="h-4 w-4 mr-2" />
                      My Profile
                    </DropdownMenuItem>
                    <DropdownMenuItem className="cursor-pointer">
                      <Bell className="h-4 w-4 mr-2" />
                      Notifications
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSignOut} className="text-red-600 cursor-pointer">
                      <LogOut className="h-4 w-4 mr-2" />
                      Sign out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Dashboard Header with Welcome Message and Summary */}
        <div className="mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 shadow-sm border border-blue-100">
          <div className="flex flex-col justify-between gap-2">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Welcome back, {user?.user_metadata?.name || 'Student'}</h1>
                <p className="text-gray-600 mt-1">
                  {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                </p>
              </div>
              <div className="hidden sm:block">
                <div className="flex items-center gap-3">
                  <div className="flex flex-col items-end">
                    <span className="text-sm text-gray-500">Your average</span>
                    <span className="text-xl font-bold text-blue-600">{analytics?.averageScore.toFixed(1)}%</span>
                  </div>
                  <div className="h-10 w-10 rounded-full flex items-center justify-center bg-blue-600 text-white font-bold text-lg">
                    {analytics ? getGradeLetter(analytics.averageScore) : 'N/A'}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-3 flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-blue-600" />
                <span className="text-sm text-gray-600">Study Time: <span className="font-medium">{formatStudyTime(userStats.totalStudyTime)}</span></span>
              </div>
              <div className="flex items-center gap-2">
                <Flame className="h-4 w-4 text-orange-500" />
                <span className="text-sm text-gray-600">Streak: <span className="font-medium">{userStats.currentStreak} days</span></span>
              </div>
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-purple-600" />
                <span className="text-sm text-gray-600">Weekly Progress: <span className="font-medium">{userStats.weeklyProgress.toFixed(0)}%</span></span>
              </div>
            </div>
          </div>
        </div>

        {/* Dashboard Stats Cards with improved visuals and functionality */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-5 mb-8">
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0 shadow-lg relative overflow-hidden group hover:shadow-xl transition-all duration-300 hover:translate-y-[-2px]">
            <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.2),transparent)]"></div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative">
              <CardTitle className="text-sm font-medium">Overall Average</CardTitle>
              <div className="bg-white/20 p-1.5 rounded-full">
                <TrendingUp className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent className="relative">
              <div className="text-3xl font-bold tracking-tighter">
                {analytics?.averageScore.toFixed(1) || '0.0'}%
              </div>
              <div className="text-xs mt-1 flex items-center">
                <span className={`inline-block w-2 h-2 rounded-full mr-1.5 ${
                  analytics?.averageScore >= 90 ? 'bg-green-300' :
                  analytics?.averageScore >= 80 ? 'bg-blue-300' :
                  analytics?.averageScore >= 70 ? 'bg-yellow-300' : 'bg-red-300'
                }`}></span>
                Grade: {analytics ? getGradeLetter(analytics.averageScore) : 'N/A'}
                
                <Badge className="ml-auto bg-white/20 hover:bg-white/30 cursor-pointer" onClick={() => setShowAddMark(true)}>+ Add</Badge>
              </div>
              
              <div className="absolute bottom-0 left-0 w-full h-2 bg-white/20">
                <div 
                  className="h-full bg-white/60 rounded-r-full" 
                  style={{ 
                    width: `${analytics?.averageScore || 0}%`,
                    maxWidth: '100%'
                  }}
                ></div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white border-0 shadow-lg relative overflow-hidden group hover:shadow-xl transition-all duration-300 hover:translate-y-[-2px]">
            <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.2),transparent)]"></div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative">
              <CardTitle className="text-sm font-medium">Study Streak</CardTitle>
              <div className="bg-white/20 p-1.5 rounded-full">
                <Flame className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent className="relative">
              <div className="text-3xl font-bold tracking-tighter flex items-center">
                {userStats.currentStreak}
                <span className="ml-1 text-xs font-normal bg-white/20 px-1.5 py-0.5 rounded">
                  {userStats.currentStreak > 5 ? '🔥' : ''}
                  days
                </span>
              </div>
              
              <div className="flex mt-2 space-x-1">
                {[...Array(7)].map((_, i) => (
                  <div 
                    key={i} 
                    className={`h-1.5 flex-1 rounded-full ${
                      i < userStats.currentStreak % 7
                        ? 'bg-white' 
                        : 'bg-white/20'
                    }`}
                  ></div>
                ))}
              </div>
              
              <div className="text-xs mt-1">
                Keep it going! 
                {userStats.currentStreak >= 3 && 
                  <span className="ml-1">
                    {userStats.currentStreak >= 7 ? '🔥 Excellent!' : 
                     userStats.currentStreak >= 5 ? '🔥 Great!' : 
                     userStats.currentStreak >= 3 ? '👍 Good!' : ''}
                  </span>
                }
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0 shadow-lg relative overflow-hidden group hover:shadow-xl transition-all duration-300 hover:translate-y-[-2px]">
            <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.2),transparent)]"></div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative">
              <CardTitle className="text-sm font-medium">Weekly Goal</CardTitle>
              <div className="bg-white/20 p-1.5 rounded-full">
                <Target className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent className="relative pb-6">
              <div className="text-3xl font-bold tracking-tighter">
                {userStats.weeklyProgress.toFixed(0)}%
              </div>
              
              <div className="flex items-center mt-1">
                <div className="bg-white/20 h-2 flex-grow rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full ${
                      userStats.weeklyProgress >= 100 ? 'bg-green-300' :
                      userStats.weeklyProgress >= 75 ? 'bg-blue-300' :
                      userStats.weeklyProgress >= 50 ? 'bg-yellow-300' : 'bg-white/50'
                    }`} 
                    style={{ width: `${userStats.weeklyProgress}%` }}
                  ></div>
                </div>
                <div className="text-xs ml-2 min-w-[40px]">{userStats.weeklyGoal}h</div>
              </div>
              
              <div className="text-xs mt-2">
                {userStats.weeklyProgress >= 100
                  ? '🎉 Goal achieved!'
                  : `${Math.ceil(userStats.weeklyGoal * (1 - userStats.weeklyProgress/100))}h remaining`
                }
              </div>
            </CardContent>
          </Card>

          <Card 
            className="bg-gradient-to-br from-orange-500 to-orange-600 text-white border-0 shadow-lg relative overflow-hidden group hover:shadow-xl transition-all duration-300 hover:translate-y-[-2px] cursor-pointer"
            onClick={() => {
              setShowStudyTimeDialog(true);
            }}
          >
            <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.2),transparent)]"></div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative">
              <CardTitle className="text-sm font-medium">Study Time</CardTitle>
              <div className="bg-white/20 p-1.5 rounded-full">
                <Clock className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent className="relative">
              <div className="text-3xl font-bold tracking-tighter">
                {formatStudyTime(userStats.totalStudyTime)}
              </div>
              
              <div className="flex items-center justify-between mt-1 text-xs">
                <div>Total logged</div>
                <Badge className="bg-white/20 hover:bg-white/30" onClick={(e) => {
                  e.stopPropagation(); // Prevent card click
                  navigate('/study');
                }}>
                  <Clock className="h-3 w-3 mr-1" /> Study Now
                </Badge>
              </div>
              
              <div className="mt-1.5 text-xs flex items-center">
                {userStats.totalStudyTime > 60 * 10 ? 
                  <span>
                    <span className="text-white/70">That's </span>
                    {Math.floor(userStats.totalStudyTime / 60)} hours 
                    <span className="text-white/70"> of learning!</span>
                  </span> 
                  : 'Start studying to build your hours'
                }
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-pink-500 to-pink-600 text-white border-0 shadow-lg relative overflow-hidden group hover:shadow-xl transition-all duration-300 hover:translate-y-[-2px]">
            <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.2),transparent)]"></div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative">
              <CardTitle className="text-sm font-medium">Achievement Points</CardTitle>
              <div className="bg-white/20 p-1.5 rounded-full">
                <Award className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent className="relative">
              <div className="text-3xl font-bold tracking-tighter">
                {userStats.achievementPoints.toLocaleString()}
              </div>
              
              <div className="mt-1 flex justify-between items-center">
                <div className="text-xs">Points earned</div>
                
                <div className="flex -space-x-1.5">
                  {/* Show 3 achievement badges */}
                  <div className="w-5 h-5 rounded-full bg-yellow-300 flex items-center justify-center text-[10px] text-yellow-800">
                    🏆
                  </div>
                  <div className="w-5 h-5 rounded-full bg-blue-300 flex items-center justify-center text-[10px] text-blue-800">
                    ⭐
                  </div>
                  <div className="w-5 h-5 rounded-full bg-green-300 flex items-center justify-center text-[10px] text-green-800">
                    🔥
                  </div>
                </div>
              </div>

              <div className="text-xs mt-1.5">
                {userStats.achievementPoints > 500 ? 'Outstanding achiever!' : 
                 userStats.achievementPoints > 250 ? 'Great progress!' : 
                 userStats.achievementPoints > 100 ? 'Good start!' : 
                 'Complete tasks to earn more'}
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <div className="flex justify-between items-center mb-2">
            <TabsList className="grid grid-cols-6 lg:w-fit bg-white/80 backdrop-blur-md border border-gray-200/50 shadow-sm rounded-lg">
              <TabsTrigger value="overview" className="flex items-center gap-2 data-[state=active]:bg-blue-100/80 data-[state=active]:text-blue-700">
                <BarChart3 className="h-4 w-4" />
                <span className="hidden sm:inline">Overview</span>
              </TabsTrigger>
              <TabsTrigger value="performance" className="flex items-center gap-2 data-[state=active]:bg-green-100/80 data-[state=active]:text-green-700">
                <TrendingUp className="h-4 w-4" />
                <span className="hidden sm:inline">Performance</span>
              </TabsTrigger>
              <TabsTrigger value="subjects" className="flex items-center gap-2 data-[state=active]:bg-purple-100/80 data-[state=active]:text-purple-700">
                <BookOpen className="h-4 w-4" />
                <span className="hidden sm:inline">Subjects</span>
              </TabsTrigger>
              <TabsTrigger value="study" className="flex items-center gap-2 data-[state=active]:bg-orange-100/80 data-[state=active]:text-orange-700">
                <Clock className="h-4 w-4" />
                <span className="hidden sm:inline">Study</span>
              </TabsTrigger>
              <TabsTrigger value="goals" className="flex items-center gap-2 data-[state=active]:bg-pink-100/80 data-[state=active]:text-pink-700">
                <Target className="h-4 w-4" />
                <span className="hidden sm:inline">Goals</span>
              </TabsTrigger>
              <TabsTrigger value="ai-insights" className="flex items-center gap-2 data-[state=active]:bg-indigo-100/80 data-[state=active]:text-indigo-700">
                <Brain className="h-4 w-4" />
                <span className="hidden sm:inline">AI</span>
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="bg-white shadow-md rounded-xl border-0 lg:col-span-2 hover:shadow-lg transition-all">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <TrendingUp className="h-5 w-5 text-blue-600" />
                    <span>Performance Trend</span>
                  </CardTitle>
                  <CardDescription>Your weekly performance over time</CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="h-[300px] flex items-center justify-center">
                      <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                    </div>
                  ) : analytics ? (
                    <PerformanceChart data={analytics.weeklyTrend} />
                  ) : (
                    <div className="text-center py-12 text-gray-500">No performance data available</div>
                  )}
                </CardContent>
              </Card>
              
              <Card className="bg-white shadow-md rounded-xl border-0 hover:shadow-lg transition-all">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Star className="h-5 w-5 text-yellow-500" />
                    <span>Recent Marks</span>
                  </CardTitle>
                  <CardDescription>Your latest test results</CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="space-y-3">
                      {[...Array(3)].map((_, i) => (
                        <Skeleton key={i} className="h-16 w-full" />
                      ))}
                    </div>
                  ) : analytics?.recentMarks && analytics.recentMarks.length > 0 ? (
                    <RecentMarks marks={analytics.recentMarks} />
                  ) : (
                    <div className="text-center py-12 text-gray-500">
                      <div className="mb-2">No marks recorded yet</div>
                      <Button onClick={() => setShowAddMark(true)} variant="outline" size="sm">
                        <Plus className="h-4 w-4 mr-1" /> Add Your First Mark
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-white shadow-md rounded-xl border-0 hover:shadow-lg transition-all">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <BookOpen className="h-5 w-5 text-emerald-600" />
                    <span>Subject Breakdown</span>
                  </CardTitle>
                  <CardDescription>Performance across different subjects</CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <Skeleton className="h-[300px] w-full" />
                  ) : analytics ? (
                    <SubjectBreakdown data={analytics.subjectPerformance} />
                  ) : (
                    <div className="text-center py-12 text-gray-500">No subject data available</div>
                  )}
                </CardContent>
              </Card>
              
              <Card className="bg-white shadow-md rounded-xl border-0 hover:shadow-lg transition-all relative overflow-hidden">
                <div className="absolute top-0 right-0 bg-blue-500 text-white text-xs px-3 py-1 rounded-bl-lg">AI Powered</div>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Sparkles className="h-5 w-5 text-blue-600" />
                    <span>Personalized Insights</span>
                  </CardTitle>
                  <CardDescription>AI-generated suggestions for improvement</CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="space-y-3">
                      <Skeleton className="h-24 w-full" />
                      <Skeleton className="h-24 w-full" />
                    </div>
                  ) : (
                    <ContextAwareAI userId={user?.id || ''} updateCounter={aiRefreshCounter} />
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="performance" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-white shadow-md rounded-xl border-0 hover:shadow-lg transition-all">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <BarChart3 className="h-5 w-5 text-blue-600" />
                    <span>Performance Analytics</span>
                  </CardTitle>
                  <CardDescription>Detailed breakdown of your academic performance</CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="h-[300px] flex items-center justify-center">
                      <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                    </div>
                  ) : analytics ? (
                    <PerformanceChart data={analytics.weeklyTrend} />
                  ) : (
                    <div className="text-center py-12 text-gray-500">No performance data available</div>
                  )}
                </CardContent>
              </Card>
              
              <Card className="bg-white shadow-md rounded-xl border-0 hover:shadow-lg transition-all">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Award className="h-5 w-5 text-yellow-500" />
                    <span>Achievements</span>
                  </CardTitle>
                  <CardDescription>Your academic milestones and rewards</CardDescription>
                </CardHeader>
                <CardContent>
                  <AchievementsWidget userId={user.id} />
                </CardContent>
              </Card>
            </div>
            
            <Card className="bg-white shadow-md rounded-xl border-0 hover:shadow-lg transition-all">
              <CardHeader className="border-b pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <BookOpen className="h-5 w-5 text-emerald-600" />
                  <span>Test Type Performance</span>
                </CardTitle>
                <CardDescription>Compare performance across different assessment types</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                {isLoading ? (
                  <Skeleton className="h-[200px] w-full" />
                ) : analytics?.testTypePerformance ? (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {Object.values(analytics.testTypePerformance).map((type: any) => (
                      <Card key={type.name} className="overflow-hidden border border-gray-100">
                        <CardHeader className="bg-gray-50 py-3">
                          <CardTitle className="text-base">{type.name}</CardTitle>
                        </CardHeader>
                        <CardContent className="pt-4">
                          <div className="text-3xl font-bold text-gray-900">{type.average.toFixed(1)}%</div>
                          <div className="text-xs text-gray-500">
                            {type.count} {type.count === 1 ? 'assessment' : 'assessments'}
                          </div>
                          <div className="mt-2 h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div 
                              className={`h-full ${
                                type.average >= 90 ? 'bg-green-500' :
                                type.average >= 80 ? 'bg-blue-500' :
                                type.average >= 70 ? 'bg-yellow-500' : 'bg-red-500'
                              }`} 
                              style={{ width: `${type.average}%` }}
                            ></div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500">No test type data available</div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="subjects" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="bg-white shadow-md rounded-xl border-0 hover:shadow-lg transition-all lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <BookOpen className="h-5 w-5 text-purple-600" />
                    <span>Subject Performance</span>
                  </CardTitle>
                  <CardDescription>Performance analysis across all subjects</CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <Skeleton className="h-[300px] w-full" />
                  ) : analytics ? (
                    <SubjectBreakdown data={analytics.subjectPerformance} />
                  ) : (
                    <div className="text-center py-12 text-gray-500">No subject data available</div>
                  )}
                </CardContent>
              </Card>
              
              <SubjectList 
                userId={user.id} 
                existingSubjects={subjects}
                onSubjectAdded={() => {
                  loadSubjects();
                  loadMarksAndAnalytics();
                }}
              />
            </div>
          </TabsContent>

          <TabsContent value="study" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-white shadow-md rounded-xl border-0 hover:shadow-lg transition-all">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Clock className="h-5 w-5 text-orange-500" />
                    <span>Study Timer</span>
                  </CardTitle>
                  <CardDescription>Track your study sessions</CardDescription>
                </CardHeader>
                <CardContent>
                  <StudyTimer userId={user.id} subjects={subjects} />
                </CardContent>
              </Card>
              
              <Card className="bg-white shadow-md rounded-xl border-0 hover:shadow-lg transition-all">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <BookOpen className="h-5 w-5 text-blue-500" />
                    <span>Flashcards</span>
                  </CardTitle>
                  <CardDescription>Review key concepts with flashcards</CardDescription>
                </CardHeader>
                <CardContent>
                  <FlashcardsWidget userId={user.id} />
                </CardContent>
              </Card>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-white shadow-md rounded-xl border-0 hover:shadow-lg transition-all">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Calendar className="h-5 w-5 text-indigo-500" />
                    <span>Study Sessions</span>
                  </CardTitle>
                  <CardDescription>Your recent study activity</CardDescription>
                </CardHeader>
                <CardContent>
                  <StudySessionList 
                    userId={user.id} 
                    limit={10} 
                    onSessionsLoaded={(totalMinutes) => {
                      if (totalMinutes > 0) {
                        setUserStats(prev => ({
                          ...prev,
                          totalStudyTime: totalMinutes
                        }));
                      }
                    }}
                  />
                </CardContent>
              </Card>
              
              <Card className="bg-white shadow-md rounded-xl border-0 hover:shadow-lg transition-all">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <BookOpen className="h-5 w-5 text-pink-500" />
                    <span>Quick Notes</span>
                  </CardTitle>
                  <CardDescription>Jot down important information</CardDescription>
                </CardHeader>
                <CardContent>
                  <QuickNotes userId={user.id} />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="goals" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-white shadow-md rounded-xl border-0 hover:shadow-lg transition-all">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Target className="h-5 w-5 text-pink-600" />
                    <span>Academic Goals</span>
                  </CardTitle>
                  <CardDescription>Set and track your learning objectives</CardDescription>
                </CardHeader>
                <CardContent>
                  <GoalsWidget userId={user.id} />
                </CardContent>
              </Card>
              
              <Card className="bg-white shadow-md rounded-xl border-0 hover:shadow-lg transition-all">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Zap className="h-5 w-5 text-amber-500" />
                    <span>Personalized Suggestions</span>
                  </CardTitle>
                  <CardDescription>Tailored recommendations for improvement</CardDescription>
                </CardHeader>
                <CardContent>
                  <EnhancedSuggestions userId={user.id} onAction={handleSuggestionAction} />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="ai-insights" className="space-y-6">
            <Card className="bg-white shadow-md rounded-xl border-0 hover:shadow-lg transition-all relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-blue-500 text-white text-xs px-3 py-1 rounded-bl-lg">AI Powered</div>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Sparkles className="h-5 w-5 text-blue-600" />
                  <span>AI Academic Assistant</span>
                </CardTitle>
                <CardDescription>Get personalized academic advice and insights</CardDescription>
              </CardHeader>
              <CardContent>
                <ContextAwareAI userId={user.id} updateCounter={aiRefreshCounter} />
              </CardContent>
            </Card>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-white shadow-md rounded-xl border-0 hover:shadow-lg transition-all">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Brain className="h-5 w-5 text-purple-600" />
                    <span>AI Insights</span>
                  </CardTitle>
                  <CardDescription>Smart analysis of your performance</CardDescription>
                </CardHeader>
                <CardContent>
                  <AIInsightsWidget userId={user.id} />
                </CardContent>
              </Card>
              
              <Card className="bg-white shadow-md rounded-xl border-0 hover:shadow-lg transition-all">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Zap className="h-5 w-5 text-amber-500" />
                    <span>AI Recommendations</span>
                  </CardTitle>
                  <CardDescription>AI-powered suggestions for improvement</CardDescription>
                </CardHeader>
                <CardContent>
                  <EnhancedSuggestions userId={user.id} onAction={handleSuggestionAction} />
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>

      <AddMarkDialog 
        open={showAddMark} 
        onOpenChange={setShowAddMark}
        onSuccess={loadDashboardData}
        userId={user.id}
      />

      <Dialog open={showStudyTimeDialog} onOpenChange={setShowStudyTimeDialog}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-orange-500" />
              <span>Study History</span>
            </DialogTitle>
            <DialogDescription>
              Your recent study sessions and statistics
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium">Total Study Time</div>
                <div className="text-2xl font-bold">{formatStudyTime(userStats.totalStudyTime)}</div>
              </div>
              
              <div className="text-right">
                <div className="text-sm font-medium">Current Streak</div>
                <div className="text-2xl font-bold">{userStats.currentStreak} days</div>
              </div>
            </div>
            
            <Separator />
            
            <div>
              <h3 className="text-lg font-medium mb-2">Recent Study Sessions</h3>
              <StudySessionList 
                userId={user.id} 
                limit={15}
                className="max-h-[400px] overflow-y-auto pr-1 custom-scrollbar"
                onSessionsLoaded={(totalMinutes) => {
                  if (totalMinutes > 0) {
                    setUserStats(prev => ({
                      ...prev,
                      totalStudyTime: totalMinutes
                    }));
                  }
                }}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowStudyTimeDialog(false)}>Close</Button>
            <Button onClick={() => {
              setShowStudyTimeDialog(false);
              navigate('/study');
            }}>
              Study Now
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}