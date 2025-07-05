import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { create } from "zustand";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Global timer state to persist across navigation
export interface TimerState {
  isVisible: boolean;
  isRunning: boolean;
  mode: string;
  time: number;
  progress: number;
  userId: string | null;
  subjectId: string | null;
  sessionId: string | null;
  theme: {
    bg: string;
    progressBg: string;
    progressFill: string;
    button: string;
    text: string;
  };
  position: {
    x: number;
    y: number;
  };
  // Actions
  setVisible: (visible: boolean) => void;
  setRunning: (running: boolean) => void;
  setMode: (mode: string) => void;
  setTime: (time: number) => void;
  setProgress: (progress: number) => void;
  setUserId: (userId: string | null) => void;
  setSubjectId: (subjectId: string | null) => void;
  setSessionId: (sessionId: string | null) => void;
  setTheme: (theme: TimerState['theme']) => void;
  setPosition: (position: TimerState['position']) => void;
  reset: () => void;
}

// Create global store for timer state
export const useGlobalTimerStore = create<TimerState>((set) => ({
  isVisible: false,
  isRunning: false,
  mode: 'pomodoro',
  time: 1500, // 25 minutes default
  progress: 0,
  userId: null,
  subjectId: null,
  sessionId: null,
  theme: {
    bg: "bg-blue-50",
    progressBg: "bg-blue-100",
    progressFill: "bg-blue-500",
    button: "bg-blue-500 hover:bg-blue-600",
    text: "text-blue-500"
  },
  position: {
    x: 20,
    y: 20
  },
  // Actions
  setVisible: (visible) => set({ isVisible: visible }),
  setRunning: (running) => set({ isRunning: running }),
  setMode: (mode) => set({ mode }),
  setTime: (time) => set({ time }),
  setProgress: (progress) => set({ progress }),
  setUserId: (userId) => set({ userId }),
  setSubjectId: (subjectId) => set({ subjectId }),
  setSessionId: (sessionId) => set({ sessionId }),
  setTheme: (theme) => set({ theme }),
  setPosition: (position) => set({ position }),
  reset: () => set({
    isVisible: false,
    isRunning: false,
    mode: 'pomodoro',
    time: 1500,
    progress: 0,
    subjectId: null,
    sessionId: null
  })
}));