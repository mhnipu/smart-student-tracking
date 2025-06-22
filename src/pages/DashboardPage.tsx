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
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [refreshing, setRefreshing] = useState(false);
  const [dbConnectionChecked, setDbConnectionChecked] = useState(false);

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
    }
  }, [user, loadDashboardData]);

  const refreshData = async () => {
    console.log('Refreshing data...');
    setRefreshing(true);
    toast.info("Refreshing data...");
    
    try {
      await loadDashboardData();
      toast.success("Data refreshed successfully!");
    } catch (error) {
      toast.error("Failed to refresh data");
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
        .order('name', { ascending: true });

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
        { name: 'Mathematics', code: 'MATH', color: '#3B82F6', category: 'STEM' },
        { name: 'English', code: 'ENG', color: '#10B981', category: 'Language Arts' },
        { name: 'Science', code: 'SCI', color: '#F59E0B', category: 'STEM' },
        { name: 'History', code: 'HIST', color: '#EF4444', category: 'Social Studies' },
        { name: 'Art', code: 'ART', color: '#8B5CF6', category: 'Creative' }
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
      const { data: userData, error } = await supabase
        .from('users')
        .select('total_study_time, current_streak, achievement_points, weekly_study_goal')
        .eq('id', user!.id)
        .single();

      if (error) {
        console.error("Error fetching user stats:", error);
        return;
      }

      // Calculate weekly progress
      const weekStart = startOfWeek(new Date()).toISOString();
      const { data: weeklyStudy } = await supabase
        .from('study_sessions')
        .select('duration_minutes')
        .eq('user_id', user!.id)
        .gte('start_time', weekStart);

      const weeklyMinutes = weeklyStudy?.reduce((sum, session) => sum + (session.duration_minutes || 0), 0) || 0;
      const weeklyHours = Math.round(weeklyMinutes / 60);
      const weeklyGoal = userData?.weekly_study_goal || 10;
      const weeklyProgress = Math.min((weeklyHours / weeklyGoal) * 100, 100);

      console.log('User stats loaded');
      setUserStats({
        totalStudyTime: userData?.total_study_time || 0,
        currentStreak: userData?.current_streak || 0,
        achievementPoints: userData?.achievement_points || 0,
        weeklyGoal,
        weeklyProgress
      });
    } catch (error) {
      console.error("Error loading user stats:", error);
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
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-200/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl p-2.5 shadow-lg">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                  SmartStudent
                </h1>
                <p className="text-xs text-gray-500">Professional Learning Platform</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <Button 
                onClick={() => setShowAddMark(true)} 
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Assessment
              </Button>
              
              <div className="flex items-center space-x-3">
                <div className="bg-gradient-to-r from-gray-100 to-gray-200 rounded-full p-2">
                  <User className="h-5 w-5 text-gray-600" />
                </div>
                <div className="text-sm">
                  <p className="font-medium text-gray-900">{user.user_metadata?.name || user.email}</p>
                  <p className="text-gray-500">{user.email}</p>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={handleSignOut}
                  className="hover:bg-red-50 hover:text-red-600"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0 shadow-xl">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium opacity-90">Overall Average</CardTitle>
              <TrendingUp className="h-4 w-4 opacity-90" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {analytics?.averageScore.toFixed(1) || '0.0'}%
              </div>
              <div className="text-xs opacity-90">
                Grade: {analytics ? getGradeLetter(analytics.averageScore) : 'N/A'}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white border-0 shadow-xl">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium opacity-90">Study Streak</CardTitle>
              <Flame className="h-4 w-4 opacity-90" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {userStats.currentStreak}
              </div>
              <div className="text-xs opacity-90">Days in a row</div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0 shadow-xl">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium opacity-90">Weekly Goal</CardTitle>
              <Target className="h-4 w-4 opacity-90" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {userStats.weeklyProgress.toFixed(0)}%
              </div>
              <div className="text-xs opacity-90">{userStats.weeklyGoal}h goal</div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white border-0 shadow-xl">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium opacity-90">Study Time</CardTitle>
              <Clock className="h-4 w-4 opacity-90" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatStudyTime(userStats.totalStudyTime)}
              </div>
              <div className="text-xs opacity-90">Total logged</div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-pink-500 to-pink-600 text-white border-0 shadow-xl">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium opacity-90">Achievement Points</CardTitle>
              <Award className="h-4 w-4 opacity-90" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {userStats.achievementPoints}
              </div>
              <div className="text-xs opacity-90">Points earned</div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6 lg:w-fit bg-white/80 backdrop-blur-md border border-gray-200/50">
            <TabsTrigger value="overview" className="flex items-center space-x-2 data-[state=active]:bg-blue-100">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">Overview</span>
            </TabsTrigger>
            <TabsTrigger value="performance" className="flex items-center space-x-2 data-[state=active]:bg-green-100">
              <TrendingUp className="h-4 w-4" />
              <span className="hidden sm:inline">Performance</span>
            </TabsTrigger>
            <TabsTrigger value="subjects" className="flex items-center space-x-2 data-[state=active]:bg-purple-100">
              <BookOpen className="h-4 w-4" />
              <span className="hidden sm:inline">Subjects</span>
            </TabsTrigger>
            <TabsTrigger value="study" className="flex items-center space-x-2 data-[state=active]:bg-orange-100">
              <Clock className="h-4 w-4" />
              <span className="hidden sm:inline">Study</span>
            </TabsTrigger>
            <TabsTrigger value="goals" className="flex items-center space-x-2 data-[state=active]:bg-pink-100">
              <Target className="h-4 w-4" />
              <span className="hidden sm:inline">Goals</span>
            </TabsTrigger>
            <TabsTrigger value="ai" className="flex items-center space-x-2 data-[state=active]:bg-indigo-100">
              <Brain className="h-4 w-4" />
              <span className="hidden sm:inline">AI</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <Card className="bg-white/80 backdrop-blur-md border-0 shadow-xl">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <TrendingUp className="h-5 w-5 text-blue-600" />
                      <span>Performance Trend</span>
                    </CardTitle>
                    <CardDescription>Your weekly performance over the last month</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {analytics && <PerformanceChart data={analytics.weeklyTrend} />}
                  </CardContent>
                </Card>
              </div>

              <Card className="bg-white/80 backdrop-blur-md border-0 shadow-xl">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Star className="h-5 w-5 text-yellow-600" />
                    <span>Recent Assessments</span>
                  </CardTitle>
                  <CardDescription>Your latest test results</CardDescription>
                </CardHeader>
                <CardContent>
                  {analytics && <RecentMarks marks={analytics.recentMarks} />}
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <AchievementsWidget userId={user.id} />
              <AIInsightsWidget userId={user.id} />
            </div>
          </TabsContent>

          <TabsContent value="performance" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-white/80 backdrop-blur-md border-0 shadow-xl">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <BarChart3 className="h-5 w-5 text-blue-600" />
                    <span>Performance Analytics</span>
                  </CardTitle>
                  <CardDescription>Detailed breakdown of your academic performance</CardDescription>
                </CardHeader>
                <CardContent>
                  {analytics && <PerformanceChart data={analytics.weeklyTrend} />}
                </CardContent>
              </Card>
              
              <div className="space-y-6">
                <AchievementsWidget userId={user.id} />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="subjects" className="space-y-6">
            <Card className="bg-white/80 backdrop-blur-md border-0 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BookOpen className="h-5 w-5 text-purple-600" />
                  <span>Subject Breakdown</span>
                </CardTitle>
                <CardDescription>Performance analysis by subject</CardDescription>
              </CardHeader>
              <CardContent>
                {analytics && <SubjectBreakdown data={analytics.subjectPerformance} />}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="study" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <StudyTimer userId={user.id} subjects={subjects} />
              <FlashcardsWidget userId={user.id} />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <StudyPlanner userId={user.id} subjects={subjects} />
              <QuickNotes userId={user.id} />
            </div>
          </TabsContent>

          <TabsContent value="goals" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <GoalsWidget userId={user.id} />
              <EnhancedSuggestions userId={user.id} onAction={handleSuggestionAction} />
            </div>
          </TabsContent>

          <TabsContent value="ai" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <AIInsightsWidget userId={user.id} />
              <EnhancedSuggestions userId={user.id} onAction={handleSuggestionAction} />
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
    </div>
  );
}