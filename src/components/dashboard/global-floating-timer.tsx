import { useEffect, useRef, useState } from "react";
import { useGlobalTimerStore } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Maximize, X, Pause, Play } from "lucide-react";
import { cn } from "@/lib/utils";
import { createPortal } from "react-dom";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { sendNotification } from "@/lib/notifications";

/**
 * Global floating timer component that persists across all pages
 * This gets rendered directly into the document body using a portal
 */
export function GlobalFloatingTimer() {
  const {
    isVisible, isRunning, mode, time, progress, userId, subjectId, sessionId,
    theme, position, setVisible, setRunning, setTime, setProgress, setSessionId, reset
  } = useGlobalTimerStore();
  
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const floatingRef = useRef<HTMLDivElement>(null);
  const workerRef = useRef<Worker | null>(null);

  // Initialize worker on component mount
  useEffect(() => {
    // Set up worker only if we're in the browser
    if (typeof window === 'undefined') return;
    
    try {
      // Create a blob with the worker code
      const workerCode = `
        let timer = null;
        let remainingTime = 0;
        
        self.onmessage = (e) => {
          const { action, time } = e.data;
          
          if (action === 'start') {
            remainingTime = time;
            clearInterval(timer);
            timer = setInterval(() => {
              remainingTime--;
              self.postMessage({ type: 'tick', time: remainingTime });
              
              if (remainingTime <= 0) {
                clearInterval(timer);
                self.postMessage({ type: 'complete' });
              }
            }, 1000);
          }
          else if (action === 'pause') {
            clearInterval(timer);
          }
          else if (action === 'reset') {
            clearInterval(timer);
            remainingTime = time;
            self.postMessage({ type: 'tick', time: remainingTime });
          }
          else if (action === 'sync') {
            self.postMessage({ type: 'tick', time: remainingTime });
          }
        };
      `;
      
      const blob = new Blob([workerCode], { type: 'text/javascript' });
      workerRef.current = new Worker(URL.createObjectURL(blob));
      
      // Set up message handler
      workerRef.current.onmessage = (e) => {
        const { type, time } = e.data;
        
        if (type === 'tick') {
          setTime(time);
          // Calculate progress percentage
          const totalTime = getModeTime(mode);
          if (totalTime > 0) {
            const newProgress = ((totalTime - time) / totalTime) * 100;
            setProgress(newProgress);
          }
        } else if (type === 'complete') {
          handleTimerComplete();
        }
      };
    } catch (err) {
      console.error("Error creating Web Worker:", err);
    }
    
    // Clean up
    return () => {
      workerRef.current?.terminate();
    };
  }, []);
  
  // Handle timer completion
  const handleTimerComplete = async () => {
    setRunning(false);
    
    if (mode === 'pomodoro') {
      toast.success("Pomodoro complete! Time for a break.");
      sendNotification(
        "Pomodoro Complete! ✅", 
        "Great job! You've completed your focus session. Time for a break."
      );
      
      // End session if we have one
      if (sessionId && userId) {
        try {
          await supabase
            .from('study_sessions')
            .update({
              end_time: new Date().toISOString(),
              is_completed: true
            })
            .eq('id', sessionId);
        } catch (err) {
          console.error("Error ending session:", err);
        }
      }
    } else {
      toast.info("Break's over! Back to work.");
      sendNotification(
        "Break Time Over ⏰", 
        "Your break has ended. Time to get back to work!"
      );
    }
  };
  
  // Get time for specific mode
  const getModeTime = (currentMode: string): number => {
    switch (currentMode) {
      case 'pomodoro': return 25 * 60; // 25 minutes
      case 'short_break': return 5 * 60; // 5 minutes
      case 'long_break': return 15 * 60; // 15 minutes
      default: return 25 * 60;
    }
  };

  // Format time display
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Toggle timer running state
  const handleToggleRunning = async () => {
    if (isRunning) {
      // Pause timer
      setRunning(false);
      if (workerRef.current) {
        workerRef.current.postMessage({ action: 'pause' });
      }
    } else {
      // Start timer
      setRunning(true);
      if (workerRef.current) {
        workerRef.current.postMessage({ 
          action: 'start',
          time: time 
        });
      }
      
      // Create session if we don't have one and it's a pomodoro
      if (!sessionId && userId && mode === 'pomodoro') {
        try {
          const { data, error } = await supabase
            .from('study_sessions')
            .insert({
              user_id: userId,
              start_time: new Date().toISOString(),
              subject_id: subjectId || null,
              title: "Study Session",
              test_type: "study"
            })
            .select()
            .single();

          if (!error && data) {
            setSessionId(data.id);
          }
        } catch (err) {
          console.error("Error creating study session:", err);
        }
      }
    }
  };
  
  // End the timer session
  const handleEndTimer = async () => {
    // Reset the worker
    if (workerRef.current) {
      workerRef.current.postMessage({ action: 'pause' });
    }
    
    // If we have an active session, close it
    if (sessionId && userId && isRunning) {
      try {
        await supabase
          .from('study_sessions')
          .update({
            end_time: new Date().toISOString(),
            is_completed: true
          })
          .eq('id', sessionId);
      } catch (err) {
        console.error("Error ending session:", err);
      }
    }
    
    // Reset the timer state
    reset();
    
    toast.info("Timer stopped");
  };
  
  // Mouse handlers for dragging
  const handleMouseDown = (e: React.MouseEvent) => {
    if (floatingRef.current) {
      setIsDragging(true);
      setDragOffset({
        x: e.clientX - floatingRef.current.getBoundingClientRect().left,
        y: e.clientY - floatingRef.current.getBoundingClientRect().top
      });
    }
  };
  
  // Effect for mouse dragging
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        const x = e.clientX - dragOffset.x;
        const y = e.clientY - dragOffset.y;
        
        // Make sure it stays within viewport bounds
        const maxX = window.innerWidth - (floatingRef.current?.offsetWidth || 100);
        const maxY = window.innerHeight - (floatingRef.current?.offsetHeight || 100);
        
        useGlobalTimerStore.setState({
          position: {
            x: Math.max(0, Math.min(x, maxX)),
            y: Math.max(0, Math.min(y, maxY))
          }
        });
      }
    };
    
    const handleMouseUp = () => {
      setIsDragging(false);
    };
    
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset]);
  
  // If not visible, don't render anything
  if (!isVisible) return null;
  
  // Make sure we have document access for the portal
  const portalContainer = typeof document !== 'undefined' ? document.body : null;
  if (!portalContainer) return null;

  return createPortal(
    <div 
      ref={floatingRef}
      className={cn(
        "fixed z-[9999] shadow-lg rounded-lg transition-all duration-300",
        theme.bg,
        isDragging ? "cursor-grabbing" : "cursor-grab"
      )}
      style={{
        top: `${position.y}px`,
        left: `${position.x}px`,
        width: "180px",
        opacity: 0.95
      }}
    >
      <div 
        className="h-8 flex items-center justify-between px-3 cursor-grab rounded-t-lg"
        onMouseDown={handleMouseDown}
      >
        <span className="text-sm font-medium truncate">
          {mode === 'pomodoro' ? 'Focus Time' : 
           mode === 'short_break' ? 'Short Break' : 'Long Break'}
        </span>
        <div className="flex items-center">
          <button 
            className="p-1 hover:bg-gray-200 rounded-full ml-2"
            onClick={() => setVisible(false)}
            title="Maximize"
          >
            <Maximize className="h-3 w-3" />
          </button>
          <button 
            className="p-1 hover:bg-gray-200 rounded-full ml-2"
            onClick={handleEndTimer}
            title="Stop Timer"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      </div>
      <div className="p-3 pt-1 flex flex-col items-center">
        <div className="relative w-20 h-20 mb-2">
          <svg className="w-full h-full" viewBox="0 0 100 100">
            {/* Background circle */}
            <circle
              className={cn("stroke-current", theme.progressBg.replace('bg-','text-'))}
              strokeWidth="8"
              cx="50"
              cy="50"
              r="45"
              fill="transparent"
            />
            {/* Progress circle */}
            <circle
              className={cn("stroke-current transition-all duration-500 ease-linear", theme.progressFill.replace('bg-', 'text-'))}
              strokeWidth="8"
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
            <span className="text-xl font-bold">{formatTime(time)}</span>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-2 w-full">
          <Button 
            onClick={handleToggleRunning} 
            className={cn("text-xs py-1 h-8", theme.button)}
            size="sm"
          >
            {isRunning ? 
              <><Pause className="h-3 w-3 mr-1" /> Pause</> : 
              <><Play className="h-3 w-3 mr-1" /> Start</>
            }
          </Button>
          <Button 
            onClick={handleEndTimer} 
            variant="outline" 
            className="text-xs py-1 h-8"
            size="sm"
          >
            Stop
          </Button>
        </div>
      </div>
    </div>,
    portalContainer
  );
} 