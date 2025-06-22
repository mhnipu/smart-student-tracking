"use client";

import { Badge } from "@/components/ui/badge";
import { Calendar, BookOpen } from "lucide-react";
import { format } from "date-fns";

interface Mark {
  id: string;
  score: number;
  max_score: number;
  percentage: number;
  test_name: string;
  test_type: string;
  date: string;
  subjects: {
    name: string;
    color?: string;
  };
}

interface RecentMarksProps {
  marks: Mark[];
}

export function RecentMarks({ marks }: RecentMarksProps) {
  const getGradeColor = (percentage: number) => {
    if (percentage >= 90) return "bg-green-100 text-green-800";
    if (percentage >= 80) return "bg-blue-100 text-blue-800";
    if (percentage >= 70) return "bg-yellow-100 text-yellow-800";
    return "bg-red-100 text-red-800";
  };

  const getGradeLetter = (percentage: number) => {
    if (percentage >= 90) return "A";
    if (percentage >= 80) return "B";
    if (percentage >= 70) return "C";
    if (percentage >= 60) return "D";
    return "F";
  };

  if (marks.length === 0) {
    return (
      <div className="text-center space-y-3 py-8">
        <BookOpen className="h-8 w-8 text-gray-400 mx-auto" />
        <p className="text-gray-500">No marks recorded yet</p>
        <p className="text-sm text-gray-400">Add your first assessment to get started!</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {marks.slice(0, 5).map((mark) => (
        <div key={mark.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
          <div className="flex-1 space-y-1">
            <div className="flex items-center space-x-2">
              <h4 className="font-medium text-gray-900 text-sm">{mark.test_name}</h4>
              <Badge variant="outline" className="text-xs">
                {mark.test_type}
              </Badge>
            </div>
            <div className="flex items-center space-x-4 text-xs text-gray-500">
              <span className="flex items-center space-x-1">
                <BookOpen className="h-3 w-3" />
                <span>{mark.subjects.name}</span>
              </span>
              <span className="flex items-center space-x-1">
                <Calendar className="h-3 w-3" />
                <span>{format(new Date(mark.date), 'MMM dd')}</span>
              </span>
            </div>
          </div>
          <div className="text-right space-y-1">
            <div className="text-sm font-medium text-gray-900">
              {mark.score}/{mark.max_score}
            </div>
            <Badge className={`text-xs ${getGradeColor(mark.percentage)}`}>
              {getGradeLetter(mark.percentage)} ({mark.percentage.toFixed(1)}%)
            </Badge>
          </div>
        </div>
      ))}
    </div>
  );
}