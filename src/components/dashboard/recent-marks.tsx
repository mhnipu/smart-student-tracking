import { Badge } from "@/components/ui/badge";
import { Calendar, BookOpen, TrendingUp, TrendingDown, ChevronRight, Award } from "lucide-react";
import { format } from "date-fns";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";

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
  const [activeTab, setActiveTab] = useState<string>("all");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [filterSubject, setFilterSubject] = useState<string | null>(null);

  const getGradeColor = (percentage: number) => {
    if (percentage >= 90) return "bg-green-100 text-green-800";
    if (percentage >= 80) return "bg-blue-100 text-blue-800";
    if (percentage >= 70) return "bg-yellow-100 text-yellow-800";
    if (percentage >= 60) return "bg-orange-100 text-orange-800";
    return "bg-red-100 text-red-800";
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 90) return "bg-green-500";
    if (percentage >= 80) return "bg-blue-500";
    if (percentage >= 70) return "bg-yellow-500";
    if (percentage >= 60) return "bg-orange-500";
    return "bg-red-500";
  };

  const getGradeLetter = (percentage: number) => {
    if (percentage >= 90) return "A";
    if (percentage >= 80) return "B";
    if (percentage >= 70) return "C";
    if (percentage >= 60) return "D";
    return "F";
  };

  const getGradeIcon = (percentage: number, prevPercentage?: number) => {
    if (!prevPercentage) return null;
    
    const diff = percentage - prevPercentage;
    if (diff > 5) return <TrendingUp className="h-3 w-3 text-green-600" />;
    if (diff < -5) return <TrendingDown className="h-3 w-3 text-red-600" />;
    return null;
  };

  // Get unique test types and subjects for filtering
  const testTypes = [...new Set(marks.map(mark => mark.test_type))];
  const subjects = [...new Set(marks.map(mark => mark.subjects.name))];

  // Filter marks based on active tab and subject filter
  const filteredMarks = marks.filter(mark => {
    if (activeTab !== "all" && mark.test_type !== activeTab) return false;
    if (filterSubject && mark.subjects.name !== filterSubject) return false;
    return true;
  });

  // Get previous mark for same subject if available (for trend)
  const getPreviousMark = (mark: Mark, index: number) => {
    for (let i = index + 1; i < marks.length; i++) {
      if (marks[i].subjects.name === mark.subjects.name) {
        return marks[i];
      }
    }
    return null;
  };

  if (marks.length === 0) {
    return (
      <div className="text-center space-y-3 py-8 animate-fade-in">
        <BookOpen className="h-8 w-8 text-gray-400 mx-auto" />
        <p className="text-gray-500">No marks recorded yet</p>
        <p className="text-sm text-gray-400">Add your first assessment to get started!</p>
        <Button variant="outline" className="mt-4">
          Add Assessment
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 lg:grid-cols-5">
            <TabsTrigger value="all" className="text-xs">All</TabsTrigger>
            {testTypes.slice(0, activeTab === "all" ? 2 : 4).map((type) => (
              <TabsTrigger key={type} value={type} className="text-xs capitalize">
                {type}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {filterSubject && (
        <div className="flex items-center justify-between bg-blue-50 px-3 py-1.5 rounded-md">
          <span className="text-xs text-blue-800">Filtering by: {filterSubject}</span>
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-6 p-0 text-blue-600"
            onClick={() => setFilterSubject(null)}
          >
            Clear
          </Button>
        </div>
      )}

      <div className="space-y-3 animate-fade-in">
        {filteredMarks.slice(0, 5).map((mark, index) => {
          const prevMark = getPreviousMark(mark, index);
          return (
            <div 
              key={mark.id} 
              className={cn(
                "rounded-lg border border-gray-100 transition-all duration-200",
                expanded === mark.id ? "bg-white shadow-md" : "bg-gray-50 hover:bg-gray-100"
              )}
            >
              <div 
                className="flex items-center justify-between p-3 cursor-pointer"
                onClick={() => setExpanded(expanded === mark.id ? null : mark.id)}
              >
                <div className="flex-1 space-y-1">
                  <div className="flex items-center space-x-2">
                    <h4 className="font-medium text-gray-900 text-sm">{mark.test_name}</h4>
                    <Badge variant="outline" className="text-xs capitalize">
                      {mark.test_type}
                    </Badge>
                    {getGradeIcon(mark.percentage, prevMark?.percentage)}
                  </div>
                  <div className="flex items-center space-x-4 text-xs text-gray-500">
                    <span 
                      className="flex items-center space-x-1 cursor-pointer hover:text-blue-600"
                      onClick={(e) => {
                        e.stopPropagation();
                        setFilterSubject(mark.subjects.name);
                      }}
                    >
                      <BookOpen className="h-3 w-3" />
                      <span>{mark.subjects.name}</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <Calendar className="h-3 w-3" />
                      <span>{format(new Date(mark.date), 'MMM dd, yyyy')}</span>
                    </span>
                  </div>
                </div>
                <div className="text-right space-y-1">
                  <div className="text-sm font-medium text-gray-900 flex items-center justify-end space-x-1">
                    <span>{mark.score}/{mark.max_score}</span>
                    <ChevronRight 
                      className={cn(
                        "h-4 w-4 text-gray-400 transition-transform", 
                        expanded === mark.id && "rotate-90"
                      )} 
                    />
                  </div>
                  <Badge className={`text-xs ${getGradeColor(mark.percentage)}`}>
                    {getGradeLetter(mark.percentage)} ({mark.percentage.toFixed(1)}%)
                  </Badge>
                </div>
              </div>

              {/* Expanded details */}
              {expanded === mark.id && (
                <div className="px-3 pb-3 pt-1 border-t border-gray-100 animate-fade-in">
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>Score percentage</span>
                        <span>{mark.percentage.toFixed(1)}%</span>
                      </div>
                      <Progress 
                        value={mark.percentage} 
                        max={100} 
                        className="h-2"
                        indicatorClassName={getProgressColor(mark.percentage)}
                      />
                    </div>

                    {prevMark && (
                      <div className="text-xs flex items-center justify-between">
                        <span className="text-gray-500">Previous {mark.subjects.name} mark:</span>
                        <Badge className={`${getGradeColor(prevMark.percentage)}`}>
                          {prevMark.percentage.toFixed(1)}% ({getGradeLetter(prevMark.percentage)})
                        </Badge>
                      </div>
                    )}

                    {mark.percentage >= 90 && (
                      <div className="flex items-center space-x-1 text-xs text-green-600">
                        <Award className="h-3 w-3" />
                        <span>Excellent work! This is one of your highest scores.</span>
                      </div>
                    )}

                    {mark.percentage < 60 && (
                      <div className="flex items-center space-x-1 text-xs text-red-600">
                        <TrendingDown className="h-3 w-3" />
                        <span>This score needs improvement. Consider focusing on this subject.</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {filteredMarks.length === 0 && (
          <div className="text-center py-6 text-gray-500">
            No marks found matching your filters
          </div>
        )}

        {filteredMarks.length > 5 && (
          <Button variant="outline" className="w-full mt-2">
            View All Marks ({filteredMarks.length})
          </Button>
        )}
      </div>
    </div>
  );
}