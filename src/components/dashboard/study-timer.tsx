import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Play, Pause, Square, Clock, BookOpen, AlertCircle, RefreshCw } from "lucide-react";
import { supabase } from '@/lib/supabase';
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

export function StudyTimer({ userId, subjects }: StudyTimerProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [time, setTime] = useState(0); // in seconds
  const [selectedSubject, setSelectedSubject] = useState<string>("");
  const [sessionType, setSessionType] = useState<string>("study");
  const [currentSession, setCurrentSession] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [todayTime, setTodayTime] = useState("0h 0m");
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Track if we're in demo mode
  const [demoMode, setDemoMode] = useState(false);

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setTime(prev => prev + 1);
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning]);
  
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
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const startSession = async () => {
    if (!selectedSubject) {
      toast.error("Please select a subject first");
      return;
    }
    
    // In demo mode, just set state locally
    if (demoMode || subjects.some(s => s.id.startsWith('mock-'))) {
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
      toast.success("Study session started!");
      return;
    }

    try {
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
        
        // If database table doesn't exist, use demo mode
        if (error.code === 'PGRST109') {
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
        } else {
          toast.error("Failed to start study session");
        }
        return;
      }

      setCurrentSession(data);
      setIsRunning(true);
      toast.success("Study session started!");
    } catch (error) {
      console.error("Error starting session:", error);
      toast.error("Failed to start study session");
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
      setTime(0);
      setCurrentSession(null);
      
      // Update today's time
      const minutes = Math.floor(time / 60);
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      const currentTotal = todayTime.split('h ')[0];
      const newHours = parseInt(currentTotal) + hours;
      setTodayTime(`${newHours}h ${mins}m`);
      
      toast.success(`Study session completed! Duration: ${formatTime(time)}`);
      return;
    }

    try {
      const { error } = await supabase
        .from('study_sessions')
        .update({
          end_time: new Date().toISOString(),
          duration_minutes: Math.floor(time / 60),
          notes: `Session duration: ${formatTime(time)}`
        })
        .eq('id', currentSession.id);

      if (error) {
        console.error("Error ending session:", error);
        toast.error("Failed to end study session");
        return;
      }

      setIsRunning(false);
      setTime(0);
      setCurrentSession(null);
      
      // Refresh today's stats
      loadTodayStats();
      
      toast.success(`Study session completed! Duration: ${formatTime(time)}`);
    } catch (error) {
      console.error("Error ending session:", error);
      toast.error("Failed to end study session");
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

  // If there's an error, show error state
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
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Clock className="h-5 w-5" />
          <span>Study Timer</span>
          {demoMode && (
            <Badge variant="outline" className="ml-2 text-xs">
              Demo Mode
            </Badge>
          )}
        </CardTitle>
        <CardDescription>Track your study time and build consistent habits</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Timer Display */}
        <div className="text-center">
          <div className="text-4xl font-mono font-bold text-gray-900 mb-2">
            {formatTime(time)}
          </div>
          {currentSession && (
            <Badge className={getSessionTypeColor(sessionType)}>
              {sessionType} session
            </Badge>
          )}
        </div>

        {/* Controls */}
        {!currentSession ? (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  Subject
                </label>
                <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select subject" />
                  </SelectTrigger>
                  <SelectContent>
                    {subjects.map((subject) => (
                      <SelectItem key={subject.id} value={subject.id}>
                        <div className="flex items-center space-x-2">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: subject.color || '#3B82F6' }}
                          ></div>
                          <span>{subject.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  Type
                </label>
                <Select value={sessionType} onValueChange={setSessionType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="study">Study</SelectItem>
                    <SelectItem value="review">Review</SelectItem>
                    <SelectItem value="practice">Practice</SelectItem>
                    <SelectItem value="homework">Homework</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button 
              onClick={startSession} 
              className="w-full bg-green-600 hover:bg-green-700"
              disabled={!selectedSubject}
            >
              <Play className="h-4 w-4 mr-2" />
              Start Session
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex space-x-2">
              {isRunning ? (
                <Button onClick={pauseSession} variant="outline" className="flex-1">
                  <Pause className="h-4 w-4 mr-2" />
                  Pause
                </Button>
              ) : (
                <Button onClick={resumeSession} className="flex-1 bg-green-600 hover:bg-green-700">
                  <Play className="h-4 w-4 mr-2" />
                  Resume
                </Button>
              )}
              <Button onClick={endSession} variant="destructive" className="flex-1">
                <Square className="h-4 w-4 mr-2" />
                End Session
              </Button>
            </div>
          </div>
        )}

        {/* Quick Stats */}
        <div className="border-t pt-3">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span className="flex items-center space-x-1">
              <BookOpen className="h-4 w-4" />
              <span>Today's Study Time</span>
            </span>
            <span className="font-medium">{todayTime}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}