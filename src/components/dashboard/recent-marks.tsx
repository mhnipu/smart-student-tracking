import { Badge } from "@/components/ui/badge";
import { Calendar, BookOpen, TrendingUp, TrendingDown, ChevronRight, Award, Filter } from "lucide-react";
import { format } from "date-fns";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
  const [filterTestType, setFilterTestType] = useState<string | null>(null);
  const [visibleMarks, setVisibleMarks] = useState(8);

  const getGradeColor = (percentage: number) => {
    if (percentage >= 90) return "bg-green-100 text-green-800";
    if (percentage >= 80) return "bg-blue-100 text-blue-800";
    if (percentage >= 70) return "bg-yellow-100 text-yellow-800";
    if (percentage >= 60) return "bg-orange-100 text-orange-800";
    if (percentage >= 50) return "bg-purple-100 text-purple-800";
    return "bg-red-100 text-red-800";
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 90) return "bg-green-500";
    if (percentage >= 80) return "bg-blue-500";
    if (percentage >= 70) return "bg-yellow-500";
    if (percentage >= 60) return "bg-orange-500";
    if (percentage >= 50) return "bg-purple-500";
    return "bg-red-500";
  };

  const getGradeLetter = (percentage: number) => {
    if (percentage >= 90) return "A";
    if (percentage >= 80) return "B";
    if (percentage >= 70) return "C";
    if (percentage >= 60) return "D";
    if (percentage >= 50) return "E";
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
  const subjects = [...new Set(marks.map(mark => mark.subjects.name))].sort();

  // Filter marks based on active tab and subject filter
  const filteredMarks = marks.filter(mark => {
    // When using dropdown filters, we ignore the tab filter
    if (filterTestType && mark.test_type !== filterTestType) return false;
    if (filterSubject && mark.subjects.name !== filterSubject) return false;
    
    // If no dropdown filters are active, use tab filter
    if (!filterTestType && activeTab !== "all" && mark.test_type !== activeTab) return false;
    
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

  const handleShowMore = () => {
    setVisibleMarks(prev => prev + 8);
  };
  
  // Reset filters
  const resetFilters = () => {
    setFilterSubject(null);
    setFilterTestType(null);
    setActiveTab("all");
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
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        {/* Filter controls */}
        <div className="flex items-center gap-2">
          {/* Subject Filter Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className={cn(
                "h-8 gap-1", 
                filterSubject && "bg-blue-50 text-blue-700 border-blue-200"
              )}>
                <span className="text-xs">Subject: {filterSubject || "All"}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="max-h-[300px] overflow-y-auto">
              <DropdownMenuLabel>Filter by Subject</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                className={cn("text-sm cursor-pointer", !filterSubject && "bg-blue-50 text-blue-700")}
                onClick={() => setFilterSubject(null)}
              >
                All Subjects
              </DropdownMenuItem>
              {subjects.map(subject => (
                <DropdownMenuItem 
                  key={subject} 
                  className={cn("text-sm cursor-pointer flex items-center", 
                    filterSubject === subject && "bg-blue-50 text-blue-700"
                  )}
                  onClick={() => setFilterSubject(subject)}
                >
                  <div className="w-2 h-2 rounded-full mr-2" style={{ 
                    backgroundColor: marks.find(m => m.subjects.name === subject)?.subjects.color || '#888'
                  }}/>
                  {subject}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Test Type Filter Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className={cn(
                "h-8 gap-1", 
                filterTestType && "bg-purple-50 text-purple-700 border-purple-200"
              )}>
                <span className="text-xs">Type: {filterTestType || "All"}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="max-h-[300px] overflow-y-auto">
              <DropdownMenuLabel>Filter by Test Type</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                className={cn("text-sm cursor-pointer", !filterTestType && "bg-purple-50 text-purple-700")}
                onClick={() => setFilterTestType(null)}
              >
                All Types
              </DropdownMenuItem>
              {testTypes.map(type => (
                <DropdownMenuItem 
                  key={type} 
                  className={cn("text-sm cursor-pointer", 
                    filterTestType === type && "bg-purple-50 text-purple-700"
                  )}
                  onClick={() => setFilterTestType(type)}
                >
                  {type}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          
          {/* Reset filters button - only show if filters are active */}
          {(filterSubject || filterTestType) && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 text-xs text-gray-600"
              onClick={resetFilters}
            >
              Reset
            </Button>
          )}
        </div>
      </div>

      {/* Active filters summary */}
      {(filterSubject || filterTestType) && (
        <div className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded-md text-xs">
          <div className="flex flex-wrap gap-2">
            <span className="text-gray-500">Filters:</span>
            {filterSubject && (
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                Subject: {filterSubject}
              </Badge>
            )}
            {filterTestType && (
              <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                Type: {filterTestType}
              </Badge>
            )}
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-6 p-0 text-gray-500"
            onClick={resetFilters}
          >
            Clear
          </Button>
        </div>
      )}

      <ScrollArea className="h-[340px] pr-4">
        <div className="space-y-3 animate-fade-in">
          {filteredMarks.slice(0, visibleMarks).map((mark, index) => {
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
                      <div 
                        className="w-2 h-2 rounded-full shrink-0" 
                        style={{ backgroundColor: mark.subjects.color || '#888' }}
                      />
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
                          className={`h-2 ${getProgressColor(mark.percentage)}`}
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

                      {mark.percentage < 50 && (
                        <div className="flex items-center space-x-1 text-xs text-red-600">
                          <TrendingDown className="h-3 w-3" />
                          <span>This score needs significant improvement. Consider getting help in this subject.</span>
                        </div>
                      )}

                      {mark.percentage >= 50 && mark.percentage < 60 && (
                        <div className="flex items-center space-x-1 text-xs text-purple-600">
                          <TrendingDown className="h-3 w-3" />
                          <span>Barely passing, needs significant improvement.</span>
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

          {filteredMarks.length > visibleMarks && (
            <Button variant="outline" className="w-full mt-2" onClick={handleShowMore}>
              Show More ({filteredMarks.length - visibleMarks} remaining)
            </Button>
          )}
        </div>
      </ScrollArea>
      
      <div className="flex items-center justify-between text-sm text-gray-500 pt-2 border-t border-gray-100">
        <span>Total marks: {filteredMarks.length}</span>
        <span>Average: {
          filteredMarks.length > 0 
            ? (filteredMarks.reduce((sum, mark) => sum + mark.percentage, 0) / filteredMarks.length).toFixed(1) + '%'
            : 'N/A'
        }</span>
      </div>
    </div>
  );
}