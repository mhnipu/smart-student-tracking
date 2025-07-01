import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Play, 
  Pause, 
  SkipForward, 
  Settings, 
  Clock, 
  BookOpen, 
  Coffee, 
  StopCircle,
  CheckCircle,
  BarChart
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

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

// Define timer modes
const MODES = {
  POMODORO: { id: 'pomodoro', label: 'Focus', icon: <BookOpen className="h-4 w-4" /> },
  SHORT_BREAK: { id: 'shortBreak', label: 'Short Break', icon: <Coffee className="h-4 w-4" /> },
  LONG_BREAK: { id: 'longBreak', label: 'Long Break', icon: <Coffee className="h-4 w-4" /> }
};

export function StudyTimer({ userId, subjects }: StudyTimerProps) {
  // Timer state
  const [time, setTime] = useState(25 * 60); // Default: 25 minutes in seconds
  const [isRunning, setIsRunning] = useState(false);
  const [mode, setMode] = useState(MODES.POMODORO.id);
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [currentSession, setCurrentSession] = useState<any>(null);
  const [pomodoroCount, setPomodoroCount] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [timerSettings, setTimerSettings] = useState<TimerSettings>({
    pomodoro: 25,
    shortBreak: 5,
    longBreak: 15
  });
  const [userStats, setUserStats] = useState({
    total_study_time: 0,
    achievement_points: 0,
    current_streak: 0
  });
  const [todayStats, setTodayStats] = useState({
    sessions: 0,
    minutes: 0,
    pomodoros: 0
  });
  
  // Timer interval ref
  const timerRef = useRef<number | null>(null);
  
  useEffect(() => {
    loadUserStats();
    loadTodayStats();
    
    return () => {
      if (timerRef.current !== null) {
        clearInterval(timerRef.current);
      }
    };
  }, [userId]);
  
  const getTimeForMode = (modeId: string) => {
    switch (modeId) {
      case MODES.POMODORO.id:
        return timerSettings.pomodoro * 60;
      case MODES.SHORT_BREAK.id:
        return timerSettings.shortBreak * 60;
      case MODES.LONG_BREAK.id:
        return timerSettings.longBreak * 60;
      default:
        return 25 * 60;
    }
  };
  
  // Reset timer when mode changes
  useEffect(() => {
    resetTimer();
  }, [mode]);
  
  // Timer tick function
  useEffect(() => {
    if (isRunning) {
      timerRef.current = window.setInterval(() => {
        setTime(prevTime => {
          if (prevTime <= 1) {
            // Timer completed
            clearInterval(timerRef.current!);
            
            // Play sound if available
            const audio = new Audio('/timer-end.mp3');
            audio.play().catch(err => console.log('Audio play failed:', err));
            
            // Show notification
            if (mode === MODES.POMODORO.id) {
              toast.success("Focus session completed! Take a break.");
              
              // Auto switch to break mode
              setMode(MODES.SHORT_BREAK.id);
              
              // End the current session
              if (currentSession) {
                endSession();
              }
              
              return getTimeForMode(MODES.SHORT_BREAK.id);
            } else {
              toast.success("Break completed! Ready to focus?");
              setMode(MODES.POMODORO.id);
              return getTimeForMode(MODES.POMODORO.id);
            }
          }
          return prevTime - 1;
        });
      }, 1000);
    } else if (timerRef.current !== null) {
      clearInterval(timerRef.current);
    }
    
    return () => {
      if (timerRef.current !== null) {
        clearInterval(timerRef.current);
      }
    };
  }, [isRunning, mode]);
  
  const resetTimer = () => {
    if (timerRef.current !== null) {
      clearInterval(timerRef.current);
    }
    setTime(getTimeForMode(mode));
    setIsRunning(false);
  };
  
  const loadUserStats = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('total_study_time, achievement_points, current_streak')
        .eq('id', userId)
        .single();
        
      if (error) {
        console.error("Error loading user stats:", error);
        // Use default values if we can't load from DB
        setUserStats({
          total_study_time: 0,
          achievement_points: 0,
          current_streak: 0
        });
        return;
      }
      
      if (data) {
        setUserStats({
          total_study_time: data.total_study_time || 0,
          achievement_points: data.achievement_points || 0,
          current_streak: data.current_streak || 0
        });
      }
    } catch (error) {
      console.error("Failed to load user stats:", error);
    }
  };
  
  const loadTodayStats = async () => {
    try {
      // Get today's date range
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      const { data, error } = await supabase
        .from('study_sessions')
        .select('duration_minutes, pomodoro_count')
        .eq('user_id', userId)
        .gte('start_time', today.toISOString())
        .lt('start_time', tomorrow.toISOString());
        
      if (error) {
        console.error("Error loading today's stats:", error);
        return;
      }
      
      if (data) {
        const totalMinutes = data.reduce((sum, session) => sum + (session.duration_minutes || 0), 0);
        const totalPomodoros = data.reduce((sum, session) => sum + (session.pomodoro_count || 0), 0);
        
        setTodayStats({
          sessions: data.length,
          minutes: totalMinutes,
          pomodoros: totalPomodoros
        });
      }
    } catch (error) {
      console.error("Failed to load today's stats:", error);
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
      // Create a basic session with minimal fields - FIXED VERSION WITHOUT TITLE
      const { data, error } = await supabase
        .from('study_sessions')
        .insert({
          user_id: userId,
          start_time: new Date().toISOString(),
          subject_id: selectedSubject || null
          // Title field removed to fix the error
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
      // Update the session with just end_time
      const { error } = await supabase
        .from('study_sessions')
        .update({
          end_time: new Date().toISOString(),
          duration_minutes: minutesCompleted,
          is_completed: true,
          points_earned: pointsEarned
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
      const confirmStop = window.confirm("Are you sure you want to stop the current session?");
      if (confirmStop) {
        endSession();
      }
    } else {
      resetTimer();
    }
  };

  const handleSaveSettings = (newSettings: TimerSettings) => {
    setTimerSettings(newSettings);
    setShowSettings(false);
    resetTimer();
  };
  
  const getModeTheme = () => {
    switch (mode) {
      case MODES.POMODORO.id:
        return {
          bg: 'bg-gradient-to-br from-blue-50 to-indigo-50',
          border: 'border-blue-200',
          progress: 'bg-blue-600',
          button: 'bg-blue-600 hover:bg-blue-700',
          text: 'text-blue-600'
        };
      case MODES.SHORT_BREAK.id:
        return {
          bg: 'bg-gradient-to-br from-green-50 to-emerald-50',
          border: 'border-green-200',
          progress: 'bg-green-600',
          button: 'bg-green-600 hover:bg-green-700',
          text: 'text-green-600'
        };
      case MODES.LONG_BREAK.id:
        return {
          bg: 'bg-gradient-to-br from-purple-50 to-indigo-50',
          border: 'border-purple-200',
          progress: 'bg-purple-600',
          button: 'bg-purple-600 hover:bg-purple-700',
          text: 'text-purple-600'
        };
      default:
        return {
          bg: 'bg-gradient-to-br from-blue-50 to-indigo-50',
          border: 'border-blue-200',
          progress: 'bg-blue-600',
          button: 'bg-blue-600 hover:bg-blue-700',
          text: 'text-blue-600'
        };
    }
  };
  
  const theme = getModeTheme();

  return (
    <Card className={`${theme.bg} border-2 border-dashed ${theme.border} shadow-md`}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center space-x-2">
            <Clock className={`h-5 w-5 ${theme.text}`} />
            <span>Study Timer</span>
          </CardTitle>
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => setShowSettings(true)}
            className="h-8 w-8"
          >
            <Settings className="h-4 w-4" />
          </Button>
        </div>
        <CardDescription>
          Track your study sessions and earn points
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Mode Selector */}
        <div className="flex justify-center space-x-2 mb-4">
          {Object.values(MODES).map((modeOption) => (
            <Badge
              key={modeOption.id}
              variant={mode === modeOption.id ? "default" : "outline"}
              className={`cursor-pointer px-3 py-1.5 ${
                mode === modeOption.id 
                  ? theme.button
                  : "hover:bg-gray-100"
              }`}
              onClick={() => handleModeChange(modeOption.id)}
            >
              <div className="flex items-center space-x-1">
                {modeOption.icon}
                <span>{modeOption.label}</span>
              </div>
            </Badge>
          ))}
        </div>
        
        {/* Subject Selector (only for Pomodoro mode) */}
        {mode === MODES.POMODORO.id && (
          <div className="mb-4">
            <Select
              value={selectedSubject || ""}
              onValueChange={setSelectedSubject}
              disabled={isRunning}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a subject" />
              </SelectTrigger>
              <SelectContent>
                {subjects && subjects.length > 0 ? (
                  subjects.map((subject) => (
                    <SelectItem key={subject.id} value={subject.id}>
                      <div className="flex items-center">
                        <div 
                          className="w-3 h-3 rounded-full mr-2" 
                          style={{ backgroundColor: subject.color || '#888888' }}
                        />
                        {subject.name}
                      </div>
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="general">General Study</SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>
        )}
        
        {/* Timer Display */}
        <div className="text-center py-6">
          <div className={`text-6xl font-bold mb-2 ${theme.text}`}>
            {formatTime(time)}
          </div>
          
          <Progress 
            value={progress} 
            className={`h-2 mb-4 [&>div]:${theme.progress}`} 
          />
          
          <div className="flex justify-center space-x-2 mt-4">
            <Button
              onClick={handleStartPause}
              className={`${theme.button} px-6`}
            >
              {isRunning ? (
                <><Pause className="mr-2 h-4 w-4" /> Pause</>
              ) : (
                <><Play className="mr-2 h-4 w-4" /> Start</>
              )}
            </Button>
            
            <Button
              variant="outline"
              onClick={handleStop}
              disabled={!isRunning && time === getTimeForMode(mode)}
            >
              <StopCircle className="mr-2 h-4 w-4" />
              {isRunning ? "Stop" : "Reset"}
            </Button>
            
            {!isRunning && (
              <Button
                variant="outline"
                onClick={() => handleModeChange(
                  mode === MODES.POMODORO.id 
                    ? MODES.SHORT_BREAK.id 
                    : MODES.POMODORO.id
                )}
              >
                <SkipForward className="mr-2 h-4 w-4" />
                Skip
              </Button>
            )}
          </div>
        </div>
        
        {/* Today's Stats */}
        <div className="bg-white/60 rounded-lg p-3 space-y-2">
          <h4 className="text-sm font-medium flex items-center">
            <BarChart className="h-4 w-4 mr-1.5" />
            Today's Progress
          </h4>
          
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-white/80 rounded p-2 text-center">
              <div className="text-lg font-bold">{todayStats.sessions}</div>
              <div className="text-xs text-gray-500">Sessions</div>
            </div>
            <div className="bg-white/80 rounded p-2 text-center">
              <div className="text-lg font-bold">{todayStats.minutes}</div>
              <div className="text-xs text-gray-500">Minutes</div>
            </div>
            <div className="bg-white/80 rounded p-2 text-center">
              <div className="text-lg font-bold">{todayStats.pomodoros}</div>
              <div className="text-xs text-gray-500">Pomodoros</div>
            </div>
          </div>
        </div>
      </CardContent>
      
      {/* Settings Dialog */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent>
          <TimerSettingsDialog 
            currentSettings={timerSettings} 
            onSave={handleSaveSettings} 
          />
        </DialogContent>
      </Dialog>
    </Card>
  );
}

interface TimerSettingsDialogProps {
  currentSettings: TimerSettings;
  onSave: (settings: TimerSettings) => void;
}

function TimerSettingsDialog({ currentSettings, onSave }: TimerSettingsDialogProps) {
  const [settings, setSettings] = useState<TimerSettings>({ ...currentSettings });
  
  const handleSave = () => {
    onSave(settings);
  };
  
  return (
    <>
      <DialogHeader>
        <DialogTitle>Timer Settings</DialogTitle>
        <DialogDescription>
          Customize your timer durations. All times are in minutes.
        </DialogDescription>
      </DialogHeader>
      
      <div className="grid gap-4 py-4">
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="pomodoro" className="text-right">
            Focus Time
          </Label>
          <Input
            id="pomodoro"
            type="number"
            min="1"
            max="60"
            className="col-span-3"
            value={settings.pomodoro}
            onChange={(e) => setSettings({ ...settings, pomodoro: parseInt(e.target.value) || 25 })}
          />
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="shortBreak" className="text-right">
            Short Break
          </Label>
          <Input
            id="shortBreak"
            type="number"
            min="1"
            max="30"
            className="col-span-3"
            value={settings.shortBreak}
            onChange={(e) => setSettings({ ...settings, shortBreak: parseInt(e.target.value) || 5 })}
          />
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="longBreak" className="text-right">
            Long Break
          </Label>
          <Input
            id="longBreak"
            type="number"
            min="1"
            max="60"
            className="col-span-3"
            value={settings.longBreak}
            onChange={(e) => setSettings({ ...settings, longBreak: parseInt(e.target.value) || 15 })}
          />
        </div>
      </div>
      
      <DialogFooter>
        <Button type="submit" onClick={handleSave}>Save Changes</Button>
      </DialogFooter>
    </>
  );
} 