import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, BookOpen } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { formatDistanceToNow, format } from "date-fns";

interface StudySessionListProps {
  userId: string;
  onSessionsLoaded?: (totalMinutes: number) => void;
  limit?: number;
  showHeader?: boolean;
  className?: string;
}

interface StudySession {
  id: string;
  start_time: string;
  end_time?: string;
  duration_minutes?: number;
  subject_id?: string | null;
  title?: string;
  session_type?: string;
  points_earned?: number;
  is_completed?: boolean;
  pomodoro_count?: number;
  subject_name?: string;
  subject_color?: string;
}

export function StudySessionList({ 
  userId, 
  onSessionsLoaded, 
  limit = 5, 
  showHeader = true,
  className = ""
}: StudySessionListProps) {
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalStudyTime, setTotalStudyTime] = useState(0);
  const [sortBy, setSortBy] = useState<'date' | 'duration'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    loadSessions();
    
    // Listen for refresh events
    const handleRefresh = () => {
      loadSessions();
    };
    
    window.addEventListener('refresh-study-sessions', handleRefresh);
    
    return () => {
      window.removeEventListener('refresh-study-sessions', handleRefresh);
    };
  }, [userId]);

  const loadSessions = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Use all the new fields from the schema
      const { data, error } = await supabase
        .from('study_sessions')
        .select('id, title, start_time, end_time, duration_minutes, subject_id, session_type, points_earned, is_completed, pomodoro_count')
        .eq('user_id', userId)
        .order('start_time', { ascending: false })
        .limit(limit);
        
      if (error) {
        console.error("Error loading study sessions:", error);
        setError("Could not load study sessions");
        setLoading(false);
        return;
      }
      
      if (data && data.length > 0) {
        // Process the data - use duration_minutes from database if available
        const processedSessions: StudySession[] = data.map(session => {
          // Calculate duration if not available and we have start and end time
          let duration = session.duration_minutes || 0;
          if (!duration && session.end_time && session.start_time) {
            const start = new Date(session.start_time);
            const end = new Date(session.end_time);
            duration = Math.floor((end.getTime() - start.getTime()) / (1000 * 60)); // minutes
          }
          
          return {
            ...session,
            duration_minutes: duration
          };
        });
        
        // Try to load subject data if we have subject_ids
        const subjectIds = processedSessions
          .filter(s => s.subject_id)
          .map(s => s.subject_id as string);
          
        if (subjectIds.length > 0) {
          try {
            const { data: subjectsData } = await supabase
              .from('subjects')
              .select('id, name, color')
              .in('id', subjectIds);
              
            if (subjectsData && subjectsData.length > 0) {
              // Add subject info to sessions
              processedSessions.forEach(session => {
                if (session.subject_id) {
                  const subject = subjectsData.find(s => s.id === session.subject_id);
                  if (subject) {
                    session.subject_name = subject.name;
                    session.subject_color = subject.color;
                  }
                }
              });
            }
          } catch (err) {
            console.error("Error loading subject data:", err);
          }
        }
        
        // Sort the sessions
        const sortedSessions = sortSessions(processedSessions, sortBy, sortOrder);
        setSessions(sortedSessions);
        
        // Calculate total study time
        const totalMinutes = processedSessions.reduce((sum, session) => 
          sum + (session.duration_minutes || 0), 0);
        setTotalStudyTime(totalMinutes);
        
        // Notify parent component if callback provided
        if (onSessionsLoaded) {
          onSessionsLoaded(totalMinutes);
        }
      } else {
        // No sessions found
        setSessions([]);
        setTotalStudyTime(0);
        
        if (onSessionsLoaded) {
          onSessionsLoaded(0);
        }
      }
    } catch (err) {
      console.error("Failed to load study sessions:", err);
      setError("Could not load study sessions");
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };
  
  // Function to sort sessions based on criteria
  const sortSessions = (sessions: StudySession[], sortBy: 'date' | 'duration', sortOrder: 'asc' | 'desc'): StudySession[] => {
    return [...sessions].sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'date':
          comparison = new Date(b.start_time).getTime() - new Date(a.start_time).getTime();
          break;
        case 'duration':
          comparison = (b.duration_minutes || 0) - (a.duration_minutes || 0);
          break;
      }
      
      return sortOrder === 'asc' ? -comparison : comparison;
    });
  };

  if (loading) {
    return (
      <Card className={`bg-white/80 backdrop-blur-md border-0 shadow-md ${className}`}>
        {showHeader && (
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-blue-600" />
              <span>Study Sessions</span>
            </CardTitle>
            <CardDescription>Your recent study activity</CardDescription>
          </CardHeader>
        )}
        <CardContent>
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center space-x-4 p-3 bg-gray-50 rounded-md animate-pulse">
                <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                <div className="space-y-2 flex-1">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={`bg-white/80 backdrop-blur-md border-0 shadow-md ${className}`}>
        {showHeader && (
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-blue-600" />
              <span>Study Sessions</span>
            </CardTitle>
            <CardDescription>Your recent study activity</CardDescription>
          </CardHeader>
        )}
        <CardContent>
          <div className="p-4 text-center text-red-500">
            {error}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`bg-white/80 backdrop-blur-md border-0 shadow-md ${className}`}>
      {showHeader && (
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-blue-600" />
              <span className="font-medium">Study Sessions</span>
            </div>
          </div>
          <div className="flex justify-between items-center mt-2">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-500">Sort by:</span>
              <select 
                className="text-xs border rounded px-1 py-0.5 bg-transparent"
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value as 'date' | 'duration');
                  // Re-sort the sessions
                  setSessions(sortSessions(sessions, e.target.value as 'date' | 'duration', sortOrder));
                }}
              >
                <option value="date">Date</option>
                <option value="duration">Duration</option>
              </select>
              <button 
                className="text-xs p-1 rounded hover:bg-gray-100"
                onClick={() => {
                  const newOrder = sortOrder === 'asc' ? 'desc' : 'asc';
                  setSortOrder(newOrder);
                  // Re-sort the sessions
                  setSessions(sortSessions(sessions, sortBy, newOrder));
                }}
              >
                {sortOrder === 'asc' ? '↑' : '↓'}
              </button>
            </div>
            <span className="font-medium">Total: {formatDuration(totalStudyTime)}</span>
          </div>
        </CardHeader>
      )}
      <CardContent>
        {sessions.length === 0 ? (
          <div className="text-center py-6 text-gray-500">
            <Clock className="h-12 w-12 mx-auto mb-2 opacity-20" />
            <p>No study sessions recorded yet.</p>
            <p className="text-sm mt-1">Start a timer to track your study time!</p>
          </div>
        ) : (
          <div className="max-h-[400px] overflow-y-auto pr-1 custom-scrollbar">
            <div className="space-y-3">
              {sessions.map((session) => (
                <div key={session.id} className="flex items-start mb-4">
                  <div 
                    className="w-12 h-12 rounded-full mr-4 flex items-center justify-center text-white flex-shrink-0"
                    style={{ backgroundColor: session.subject_color || '#3B82F6' }}
                  >
                    <BookOpen className="h-6 w-6" />
                  </div>
                  <div className="flex-grow">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-medium text-base">{session.subject_name || 'General Study'}</div>
                        <div className="text-xs text-gray-500">
                          {format(new Date(session.start_time), 'MMM d, yyyy')} • {formatDuration(session.duration_minutes || 0)}
                        </div>
                      </div>
                      <Badge className="bg-blue-100 text-blue-800 ml-2">
                        Study
                      </Badge>
                    </div>
                    
                    <div className="flex justify-between items-center text-xs mt-2">
                      <div className="flex items-center">
                        <Clock className="h-3 w-3 mr-1 text-gray-400" />
                        <span>{formatDistanceToNow(new Date(session.start_time), { addSuffix: true })}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              
              {sessions.length >= limit && (
                <div className="text-center py-3 sticky bottom-0 bg-white/90 backdrop-blur-sm">
                  <Badge 
                    variant="outline" 
                    className="hover:bg-gray-100 cursor-pointer px-4 py-1.5"
                    onClick={() => loadSessions()}
                  >
                    View more sessions
                  </Badge>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 