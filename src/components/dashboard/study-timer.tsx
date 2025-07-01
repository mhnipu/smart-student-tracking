import { useState, useEffect, useRef, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Play, Pause, Square, Clock, BookOpen, AlertCircle, RefreshCw, Settings } from "lucide-react";
import { supabase } from '@/lib/supabase';
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StudySessionList } from "./study-session-list";

interface Subject {
  id: string;
  name: string;
  color?: string;
}

interface StudyTimerProps {
  userId: string;
  subjects: Subject[];
}

interface TimerSettings {
  pomodoro: number;
  shortBreak: number;
  longBreak: number;
}

const MODES = {
  POMODORO: { id: 'pomodoro', label: 'Pomodoro' },
  SHORT_BREAK: { id: 'short_break', label: 'Short Break' },
  LONG_BREAK: { id: 'long_break', label: 'Long Break' },
};

export function StudyTimer({ userId, subjects }: StudyTimerProps) {
  const [timerSettings, setTimerSettings] = useState<TimerSettings>({
    pomodoro: 25,
    shortBreak: 5,
    longBreak: 15,
  });

  const [mode, setMode] = useState(MODES.POMODORO.id);
  const [isRunning, setIsRunning] = useState(false);
  const [time, setTime] = useState(timerSettings.pomodoro * 60);
  const [selectedSubject, setSelectedSubject] = useState<string>("");
  const [pomodoroCount, setPomodoroCount] = useState(0);
  const [currentSession, setCurrentSession] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [todayTime, setTodayTime] = useState("0h 0m");
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [userStats, setUserStats] = useState({
    total_study_time: 0,
    achievement_points: 0,
    current_streak: 0
  });

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  
  const getTimeForMode = (modeId: string) => {
    switch (modeId) {
      case MODES.POMODORO.id:
        return timerSettings.pomodoro * 60;
      case MODES.SHORT_BREAK.id:
        return timerSettings.shortBreak * 60;
      case MODES.LONG_BREAK.id:
        return timerSettings.longBreak * 60;
      default:
        return 0;
    }
  };
  
  const resetTimer = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setIsRunning(false);
    setTime(getTimeForMode(mode));
  }, [mode, timerSettings]);

  useEffect(() => {
    resetTimer();
  }, [mode, timerSettings, resetTimer]);
  
  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setTime(prev => {
          if (prev <= 1) {
            // Timer completion
            if (intervalRef.current) clearInterval(intervalRef.current);
            setIsRunning(false);
            if (mode === MODES.POMODORO.id) {
              setPomodoroCount(prev => prev + 1);
              toast.success("Pomodoro complete! Time for a break.");
              // Auto-switch to break
              const newMode = (pomodoroCount + 1) % 4 === 0 ? MODES.LONG_BREAK.id : MODES.SHORT_BREAK.id;
              setMode(newMode);
            } else {
              toast.info("Break's over! Back to work.");
              setMode(MODES.POMODORO.id);
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning, mode, pomodoroCount, timerSettings]);
  
  useEffect(() => {
    loadTodayStats();
    loadUserStats();
  }, [userId]);

  const loadUserStats = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('total_study_time, achievement_points, current_streak')
        .eq('id', userId)
        .single();
        
      if (error) {
        console.error("Error loading user stats:", error);
        return;
      }
      
      if (data) {
        setUserStats({
          total_study_time: data.total_study_time || 0,
          achievement_points: data.achievement_points || 0,
          current_streak: data.current_streak || 0
        });
      }
    } catch (err) {
      console.error("Failed to load user stats:", err);
    }
  };

  const loadTodayStats = async () => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const { data, error } = await supabase
        .from('study_sessions')
        .select('*')
        .eq('user_id', userId)
        .gte('start_time', today.toISOString());
        
      if (error) {
        console.error("Error loading today's stats:", error);
        setError("Couldn't load study statistics");
        return;
      }
      
      // Calculate total minutes from sessions
      let totalMinutes = 0;
      
      if (data && data.length > 0) {
        data.forEach(session => {
          // If we have end_time, calculate duration
          if (session.end_time && session.start_time) {
            const start = new Date(session.start_time);
            const end = new Date(session.end_time);
            const durationMinutes = Math.floor((end.getTime() - start.getTime()) / (1000 * 60));
            totalMinutes += durationMinutes;
          } 
          // If we have duration_minutes, use that
          else if (session.duration_minutes) {
            totalMinutes += session.duration_minutes;
          }
        });
      }
      
      const hours = Math.floor(totalMinutes / 60);
      const minutes = totalMinutes % 60;
      
      setTodayTime(`${hours}h ${minutes}m`);
    } catch (err) {
      console.error("Failed to load today's stats:", err);
      setTodayTime("0h 0m");
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStartPause = () => {
    if (isRunning) {
      pauseSession();
    } else {
      if (!selectedSubject && mode === MODES.POMODORO.id) {
        toast.error("Please select a subject for your Pomodoro session.");
        return;
      }
      startSession();
    }
  };
  
  const totalTime = getTimeForMode(mode);
  const progress = totalTime > 0 ? ((totalTime - time) / totalTime) * 100 : 0;
  
  const startSession = async () => {
    // If we're in a break mode, we can start without a subject
    if (!selectedSubject && mode === MODES.POMODORO.id) {
      // Check if any subjects are available
      if (subjects && subjects.length > 0) {
        toast.error("Please select a subject first");
        return;
      } else {
        // If no subjects available, create a general study session
        setSelectedSubject("general");
      }
    }
    
    // Always enable the timer to run
    setIsRunning(true);
    
    try {
      // Create a basic session with minimal fields
      const { data, error } = await supabase
        .from('study_sessions')
        .insert({
          user_id: userId,
          start_time: new Date().toISOString(),
          subject_id: selectedSubject || null,
          title: "Study Session"
        })
        .select()
        .single();

      if (error) {
        console.error("Error creating session:", error);
        toast.error("Could not save session to database");
        return;
      }

      if (data) {
        setCurrentSession(data);
        toast.success("Study session started!");
      }
    } catch (error) {
      console.error("Exception starting session:", error);
      toast.error("Could not start session");
    }
  };

  const pauseSession = () => {
    setIsRunning(false);
  };

  const resumeSession = () => {
    setIsRunning(true);
  };

  const endSession = async () => {
    if (!currentSession) return;
    
    // Calculate session duration
    const minutesCompleted = Math.max(1, Math.floor((totalTime - time) / 60));
    const secondsCompleted = totalTime - time;
    const formattedDuration = formatTime(secondsCompleted);
    
    // Ensure minimum duration (5 seconds) to count as a session
    if (secondsCompleted < 5) {
      setIsRunning(false);
      setCurrentSession(null);
      resetTimer();
      toast.info("Session was too short to record");
      return;
    }
    
    // Update UI state early for better responsiveness
    setIsRunning(false);
    setPomodoroCount(prev => prev + (mode === MODES.POMODORO.id && secondsCompleted > 60 ? 1 : 0));
    
    // Calculate achievement points earned
    const pointsEarned = Math.floor(minutesCompleted / 5) + (pomodoroCount * 2);
    
    try {
      // Update the session with end_time, duration_minutes, is_completed, and points_earned
      const { error } = await supabase
        .from('study_sessions')
        .update({
          end_time: new Date().toISOString(),
          duration_minutes: minutesCompleted,
          is_completed: true,
          points_earned: pointsEarned,
          pomodoro_count: mode === MODES.POMODORO.id ? pomodoroCount : 0
        })
        .eq('id', currentSession.id);

      if (error) {
        console.error("Error updating session:", error);
        toast.error("Could not save session details");
      } else {
        // Update user stats in database
        try {
          await supabase
            .from('users')
            .update({
              total_study_time: userStats.total_study_time + minutesCompleted,
              achievement_points: userStats.achievement_points + pointsEarned,
              current_streak: userStats.current_streak + 1,
              last_study_date: new Date().toISOString()
            })
            .eq('id', userId);
            
          // Update local user stats
          setUserStats(prev => ({
            total_study_time: prev.total_study_time + minutesCompleted,
            achievement_points: prev.achievement_points + pointsEarned,
            current_streak: prev.current_streak + 1
          }));
        } catch (statsError) {
          console.error("Error updating user stats:", statsError);
        }
      }
      
      // Dispatch a custom event with the session data
      const sessionEvent = new CustomEvent('study-session-completed', { 
        detail: { 
          totalStudyTime: userStats.total_study_time + minutesCompleted,
          sessionMinutes: minutesCompleted,
          pointsEarned: pointsEarned
        } 
      });
      window.dispatchEvent(sessionEvent);
      
      // Dispatch a refresh event for the study session list
      const refreshEvent = new CustomEvent('refresh-study-sessions');
      window.dispatchEvent(refreshEvent);
      
      setCurrentSession(null);
      resetTimer();
      
      // Refresh today's stats
      loadTodayStats();
      
      toast.success(
        <div className="space-y-1">
          <div className="font-medium">Study session completed!</div>
          <div className="text-sm flex items-center justify-between">
            <span>Duration:</span>
            <span className="font-medium">{formattedDuration}</span>
          </div>
          <div className="text-sm flex items-center justify-between">
            <span>Points earned:</span>
            <span className="font-medium text-yellow-300">+{pointsEarned}</span>
          </div>
          {mode === MODES.POMODORO.id && pomodoroCount > 0 && (
            <div className="text-sm flex items-center justify-between">
              <span>Pomodoros:</span>
              <span className="font-medium">{pomodoroCount}</span>
            </div>
          )}
        </div>,
        { duration: 4000 }
      );
    } catch (error) {
      console.error("Error ending session:", error);
      
      // Fall back to updating just local state
      setCurrentSession(null);
      resetTimer();
      
      toast.error("Could not save session details, but your time was counted!");
    }
  };

  const getSessionTypeColor = (type: string) => {
    switch (type) {
      case 'study': return 'bg-blue-100 text-blue-800';
      case 'review': return 'bg-green-100 text-green-800';
      case 'practice': return 'bg-purple-100 text-purple-800';
      case 'homework': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleModeChange = (newMode: string) => {
    if (isRunning) {
      toast.warning("Please stop the current session before switching modes.");
      return;
    }
    if(newMode) {
      setMode(newMode);
    }
  };

  const handleStop = () => {
    if (isRunning) {
      endSession();
    }
    resetTimer();
  };

  const handleSaveSettings = (newSettings: TimerSettings) => {
    setTimerSettings(newSettings);
    setIsSettingsOpen(false);
    toast.success("Timer settings saved!");
    resetTimer();
  }

  const getModeTheme = () => {
    switch(mode) {
      case MODES.POMODORO.id:
        return {
          bg: "bg-blue-50 dark:bg-blue-900/20",
          progressBg: "bg-blue-100 dark:bg-blue-800/30",
          progressFill: "bg-blue-500",
          button: "bg-blue-500 hover:bg-blue-600",
          text: "text-blue-500"
        };
      case MODES.SHORT_BREAK.id:
        return {
          bg: "bg-green-50 dark:bg-green-900/20",
          progressBg: "bg-green-100 dark:bg-green-800/30",
          progressFill: "bg-green-500",
          button: "bg-green-500 hover:bg-green-600",
          text: "text-green-500"
        };
      case MODES.LONG_BREAK.id:
        return {
          bg: "bg-indigo-50 dark:bg-indigo-900/20",
          progressBg: "bg-indigo-100 dark:bg-indigo-800/30",
          progressFill: "bg-indigo-500",
          button: "bg-indigo-500 hover:bg-indigo-600",
          text: "text-indigo-500"
        };
      default:
        return {
          bg: "bg-gray-50 dark:bg-gray-900/20",
          progressBg: "bg-gray-100 dark:bg-gray-800/30",
          progressFill: "bg-gray-500",
          button: "bg-gray-500 hover:bg-gray-600",
          text: "text-gray-500"
        };
    }
  }

  const theme = getModeTheme();
  
  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-red-600">
            <Clock className="h-5 w-5" />
            <span>Study Timer</span>
          </CardTitle>
          <CardDescription>Track your study time</CardDescription>
        </CardHeader>
        <CardContent className="text-center py-6 space-y-4">
          <AlertCircle className="h-8 w-8 text-red-500 mx-auto" />
          <p className="text-red-600">{error}</p>
          <Button onClick={loadTodayStats} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("transition-all duration-500", theme.bg)}>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Study Timer</CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">{todayTime} Today</Badge>
            <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Settings className="h-5 w-5" />
                </Button>
              </DialogTrigger>
              <TimerSettingsDialog currentSettings={timerSettings} onSave={handleSaveSettings} />
            </Dialog>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col items-center justify-center space-y-6">
        <ToggleGroup type="single" value={mode} onValueChange={handleModeChange} className="bg-white dark:bg-gray-800 p-1 rounded-full">
          {Object.values(MODES).map(m => (
            <ToggleGroupItem key={m.id} value={m.id} className="px-4 py-1.5 text-sm rounded-full data-[state=on]:bg-gray-200 dark:data-[state=on]:bg-gray-700">
              {m.label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
        
        <div className="relative w-48 h-48">
          <svg className="absolute top-0 left-0 w-full h-full" viewBox="0 0 100 100">
            {/* Background circle */}
            <circle
              className={cn("stroke-current transition-colors duration-500", theme.progressBg.replace('bg-','text-'))}
              strokeWidth="7"
              cx="50"
              cy="50"
              r="45"
              fill="transparent"
            />
            {/* Progress circle */}
            <circle
              className={cn("stroke-current transition-all duration-500 ease-linear", theme.progressFill.replace('bg-', 'text-'))}
              strokeWidth="7"
              cx="50"
              cy="50"
              r="45"
              fill="transparent"
              strokeDasharray="282.6"
              strokeDashoffset={282.6 - (progress / 100) * 282.6}
              strokeLinecap="round"
              transform="rotate(-90 50 50)"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-4xl font-bold tracking-tighter">{formatTime(time)}</span>
            <span className={cn("text-sm font-medium uppercase tracking-widest", theme.text)}>
              {mode === MODES.POMODORO.id ? MODES.POMODORO.label : 
               mode === MODES.SHORT_BREAK.id ? MODES.SHORT_BREAK.label : 
               mode === MODES.LONG_BREAK.id ? MODES.LONG_BREAK.label : 'Timer'}
            </span>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className={cn("w-3 h-3 rounded-full transition-all", i < pomodoroCount % 4 ? theme.progressFill : theme.progressBg)} />
          ))}
        </div>

        <div className="w-full space-y-4">
           {mode === MODES.POMODORO.id && (
            <Select onValueChange={setSelectedSubject} defaultValue={selectedSubject} disabled={isRunning}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a subject..." />
              </SelectTrigger>
              <SelectContent>
                {subjects.map((subject) => (
                  <SelectItem key={subject.id} value={subject.id}>
                    {subject.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          <div className="flex gap-4 w-full">
            <Button onClick={handleStartPause} className={cn("w-full text-lg", theme.button)} size="lg">
              {isRunning ? <Pause className="mr-2" /> : <Play className="mr-2" />}
              {isRunning ? 'Pause' : 'Start'}
            </Button>
            <Button onClick={handleStop} variant="outline" size="lg" className="text-lg">
              <Square className="mr-2" />
              Stop
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Define the interface for timer settings dialog props
interface TimerSettingsDialogProps {
  currentSettings: TimerSettings;
  onSave: (settings: TimerSettings) => void;
}

function TimerSettingsDialog({ currentSettings, onSave }: TimerSettingsDialogProps) {
  const [settings, setSettings] = useState(currentSettings);

  const handleSave = () => {
    onSave(settings);
  };

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Timer Settings</DialogTitle>
        <DialogDescription>
          Customize the length of your Pomodoro sessions and breaks.
        </DialogDescription>
      </DialogHeader>
      <div className="space-y-4 py-4">
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="pomodoro" className="text-right">Pomodoro</Label>
          <Input 
            id="pomodoro" 
            type="number" 
            value={settings.pomodoro}
            onChange={(e) => setSettings({...settings, pomodoro: parseInt(e.target.value)})}
            className="col-span-3"
          />
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="shortBreak" className="text-right">Short Break</Label>
          <Input
            id="shortBreak"
            type="number"
            value={settings.shortBreak}
            onChange={(e) => setSettings({...settings, shortBreak: parseInt(e.target.value)})}
            className="col-span-3"
          />
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="longBreak" className="text-right">Long Break</Label>
          <Input
            id="longBreak"
            type="number"
            value={settings.longBreak}
            onChange={(e) => setSettings({...settings, longBreak: parseInt(e.target.value)})}
            className="col-span-3"
          />
        </div>
      </div>
      <DialogFooter>
        <Button onClick={handleSave}>Save Changes</Button>
      </DialogFooter>
    </DialogContent>
  );
}