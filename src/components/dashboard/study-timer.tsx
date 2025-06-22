import { useState, useEffect, useRef, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Play, Pause, Square, Clock, BookOpen, AlertCircle, RefreshCw, Settings, Music, BellOff } from "lucide-react";
import { supabase } from '@/lib/supabase';
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Subject {
  id: string;
  name: string;
  color?: string;
}

interface StudyTimerProps {
  userId: string;
  subjects: Subject[];
}

const MODES = {
  POMODORO: { id: 'pomodoro', label: 'Pomodoro' },
  SHORT_BREAK: { id: 'short_break', label: 'Short Break' },
  LONG_BREAK: { id: 'long_break', label: 'Long Break' },
};

export function StudyTimer({ userId, subjects }: StudyTimerProps) {
  const [timerSettings, setTimerSettings] = useState({
    pomodoro: 25,
    shortBreak: 5,
    longBreak: 15,
  });

  const [mode, setMode] = useState(MODES.POMODORO.id);
  const [isRunning, setIsRunning] = useState(false);
  const [time, setTime] = useState(timerSettings.pomodoro * 60);
  const [selectedSubject, setSelectedSubject] = useState<string>("");
  const [pomodoroCount, setPomodoroCount] = useState(0);
  const [sessionType, setSessionType] = useState<string>("study");
  const [currentSession, setCurrentSession] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [todayTime, setTodayTime] = useState("0h 0m");
  const [demoMode, setDemoMode] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

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
  }, [mode, timerSettings]);
  
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
  }, [userId]);

  const loadTodayStats = async () => {
    try {
      // Set a default value for demo mode
      if (subjects.some(s => s.id.startsWith('mock-'))) {
        setDemoMode(true);
        setTodayTime("2h 15m");
        return;
      }
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const { data, error } = await supabase
        .from('study_sessions')
        .select('duration_minutes')
        .eq('user_id', userId)
        .gte('start_time', today.toISOString());
        
      if (error) {
        console.error("Error loading today's stats:", error);
        // If database table doesn't exist, use demo data
        if (error.code === 'PGRST109') {
          setDemoMode(true);
          setTodayTime("2h 15m");
        } else {
          setError("Couldn't load study statistics");
        }
        return;
      }
      
      const totalMinutes = data?.reduce((sum, session) => sum + (session.duration_minutes || 0), 0) || 0;
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
    if (!selectedSubject && mode === MODES.POMODORO.id) {
      toast.error("Please select a subject first");
      return;
    }
    
    // Check if we should use demo mode
    if (demoMode || subjects.some(s => s.id.startsWith('mock-'))) {
      console.log("Using demo mode for session");
      setDemoMode(true);
      const mockSession = {
        id: `mock-session-${Date.now()}`,
        title: `${sessionType.charAt(0).toUpperCase() + sessionType.slice(1)} Session`,
        start_time: new Date().toISOString(),
        session_type: sessionType,
        user_id: userId,
        subject_id: selectedSubject
      };
      
      setCurrentSession(mockSession);
      setIsRunning(true);
      toast.success("Study session started! (Demo Mode)");
      return;
    }

    try {
      console.log("Trying to create real session");
      const { data, error } = await supabase
        .from('study_sessions')
        .insert({
          title: `${sessionType.charAt(0).toUpperCase() + sessionType.slice(1)} Session`,
          start_time: new Date().toISOString(),
          session_type: sessionType,
          user_id: userId,
          subject_id: selectedSubject
        })
        .select()
        .single();

      if (error) {
        console.error("Error starting session:", error);
        
        // Force demo mode for any database error
        // PGRST109 = table doesn't exist
        // PGRST204 = column doesn't exist in schema cache
        console.log("Falling back to demo mode due to database error code:", error.code);
        setDemoMode(true);
        const mockSession = {
          id: `mock-session-${Date.now()}`,
          title: `${sessionType.charAt(0).toUpperCase() + sessionType.slice(1)} Session`,
          start_time: new Date().toISOString(),
          session_type: sessionType,
          user_id: userId,
          subject_id: selectedSubject
        };
        
        setCurrentSession(mockSession);
        setIsRunning(true);
        toast.success("Study session started! (Demo Mode)");
        return;
      }

      setCurrentSession(data);
      setIsRunning(true);
      toast.success("Study session started!");
    } catch (error) {
      console.error("Error starting session:", error);
      
      // Fall back to demo mode on any error
      setDemoMode(true);
      const mockSession = {
        id: `mock-session-${Date.now()}`,
        title: `${sessionType.charAt(0).toUpperCase() + sessionType.slice(1)} Session`,
        start_time: new Date().toISOString(),
        session_type: sessionType,
        user_id: userId,
        subject_id: selectedSubject
      };
      
      setCurrentSession(mockSession);
      setIsRunning(true);
      toast.success("Study session started! (Demo Mode)");
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
    
    // In demo mode, just update local state
    if (demoMode || currentSession.id.startsWith('mock-')) {
      setIsRunning(false);
      setCurrentSession(null);
      
      // Update today's time
      const minutesCompleted = totalTime - time;
      const hours = Math.floor(minutesCompleted / 60 / 60);
      const mins = Math.floor((minutesCompleted / 60) % 60);
      
      // Parse current total hours
      const currentHours = parseInt(todayTime.split('h ')[0]) || 0;
      const currentMins = parseInt(todayTime.split('h ')[1]?.split('m')[0]) || 0;
      
      // Calculate new total
      let newMins = currentMins + mins;
      let newHours = currentHours + hours;
      
      // Handle minute overflow
      if (newMins >= 60) {
        newHours += Math.floor(newMins / 60);
        newMins = newMins % 60;
      }
      
      setTodayTime(`${newHours}h ${newMins}m`);
      
      toast.success(`Study session completed! Duration: ${formatTime(totalTime - time)}`);
      return;
    }

    try {
      const { error } = await supabase
        .from('study_sessions')
        .update({
          end_time: new Date().toISOString(),
          duration_minutes: Math.floor((totalTime - time) / 60),
          notes: `Session duration: ${formatTime(totalTime - time)}`
        })
        .eq('id', currentSession.id);

      if (error) {
        console.error("Error ending session:", error);
        
        // Fall back to demo mode on database error
        console.log("Using demo mode to end session due to database error:", error.code);
        
        setIsRunning(false);
        setCurrentSession(null);
        
        // Update today's time in demo mode
        const minutesCompleted = totalTime - time;
        const hours = Math.floor(minutesCompleted / 60 / 60);
        const mins = Math.floor((minutesCompleted / 60) % 60);
        
        // Parse current total hours
        const currentHours = parseInt(todayTime.split('h ')[0]) || 0;
        const currentMins = parseInt(todayTime.split('h ')[1]?.split('m')[0]) || 0;
        
        // Calculate new total
        let newMins = currentMins + mins;
        let newHours = currentHours + hours;
        
        // Handle minute overflow
        if (newMins >= 60) {
          newHours += Math.floor(newMins / 60);
          newMins = newMins % 60;
        }
        
        setTodayTime(`${newHours}h ${newMins}m`);
        
        toast.success(`Study session completed! Duration: ${formatTime(totalTime - time)} (Demo Mode)`);
        return;
      }

      setIsRunning(false);
      setCurrentSession(null);
      
      // Refresh today's stats
      loadTodayStats();
      
      toast.success(`Study session completed! Duration: ${formatTime(totalTime - time)}`);
    } catch (error) {
      console.error("Error ending session:", error);
      
      // Fall back to demo mode
      setIsRunning(false);
      setCurrentSession(null);
      
      // Update today's time in demo mode
      const minutesCompleted = totalTime - time;
      const hours = Math.floor(minutesCompleted / 60 / 60);
      const mins = Math.floor((minutesCompleted / 60) % 60);
      
      // Parse current total hours 
      const currentHours = parseInt(todayTime.split('h ')[0]) || 0;
      const currentMins = parseInt(todayTime.split('h ')[1]?.split('m')[0]) || 0;
      
      // Calculate new total
      let newMins = currentMins + mins;
      let newHours = currentHours + hours;
      
      // Handle minute overflow
      if (newMins >= 60) {
        newHours += Math.floor(newMins / 60);
        newMins = newMins % 60;
      }
      
      setTodayTime(`${newHours}h ${newMins}m`);
      
      toast.success(`Study session completed! Duration: ${formatTime(totalTime - time)} (Demo Mode)`);
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

  const handleSaveSettings = (newSettings) => {
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
            <span className={cn("text-sm font-medium uppercase tracking-widest", theme.text)}>{MODES[mode.toUpperCase()].label}</span>
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

function TimerSettingsDialog({ currentSettings, onSave }) {
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