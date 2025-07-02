import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { BookOpen, Info, Target, TrendingUp, TrendingDown, BarChart3, PieChart as PieChartIcon, Calculator } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface SubjectBreakdownProps {
  data: Record<string, {
    name: string;
    totalMarks: number;
    averageScore: number;
    color?: string;
  }>;
}

export function SubjectBreakdown({ data }: SubjectBreakdownProps) {
  const subjects = Object.values(data);
  const [chartType, setChartType] = useState<'bar' | 'pie' | 'radar'>('bar');

  if (!subjects || subjects.length === 0) {
    return (
      <div className="h-[450px] w-full flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-800/20 rounded-lg text-center p-4">
        <Info className="w-12 h-12 text-gray-400 mb-4" />
        <p className="text-lg font-medium text-gray-500 dark:text-gray-400">No subject data available.</p>
        <p className="text-sm text-gray-400 dark:text-gray-500">Add subjects and marks to see your breakdown.</p>
      </div>
    );
  }

  const getGradeLetter = (score: number) => {
    if (score >= 90) return "A";
    if (score >= 80) return "B";
    if (score >= 70) return "C";
    if (score >= 60) return "D";
    if (score >= 50) return "E";
    return "F";
  };

  const getGradeColor = (score: number) => {
    if (score >= 90) return "bg-green-100 text-green-800 border-green-200";
    if (score >= 80) return "bg-blue-100 text-blue-800 border-blue-200";
    if (score >= 70) return "bg-yellow-100 text-yellow-800 border-yellow-200";
    if (score >= 60) return "bg-orange-100 text-orange-800 border-orange-200";
    if (score >= 50) return "bg-purple-100 text-purple-800 border-purple-200";
    return "bg-red-100 text-red-800 border-red-200";
  };

  const getBadgeColor = (score: number) => {
    if (score >= 90) return "bg-green-500/10 text-green-600 ring-green-500/20";
    if (score >= 80) return "bg-blue-500/10 text-blue-600 ring-blue-500/20";
    if (score >= 70) return "bg-yellow-500/10 text-yellow-600 ring-yellow-500/20";
    if (score >= 60) return "bg-orange-500/10 text-orange-600 ring-orange-500/20";
    if (score >= 50) return "bg-purple-500/10 text-purple-600 ring-purple-500/20";
    return "bg-red-500/10 text-red-600 ring-red-500/20";
  };

  const getPerformanceText = (score: number) => {
    if (score >= 90) return "Excellent";
    if (score >= 80) return "Good";
    if (score >= 70) return "Satisfactory";
    if (score >= 60) return "Passing";
    if (score >= 50) return "Needs Improvement";
    return "Critical";
  };

  // Sort subjects by average score
  const sortedSubjects = [...subjects].sort((a, b) => b.averageScore - a.averageScore);
  
  // Calculate overall average
  const overallAverage = subjects.reduce((acc, subject) => acc + subject.averageScore, 0) / subjects.length;
  
  // Get best and worst subjects
  const bestSubject = sortedSubjects[0] || { name: 'N/A', averageScore: 0 };
  const worstSubject = sortedSubjects[sortedSubjects.length - 1] || { name: 'N/A', averageScore: 0 };
  
  // Prepare data for radar chart
  const radarData = sortedSubjects.map(subject => ({
    subject: subject.name,
    score: subject.averageScore
  }));

  const CustomBarTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="p-2 bg-white border rounded-lg shadow-lg dark:bg-gray-800">
          <p className="font-bold">{label}</p>
          <p className="text-sm text-blue-500">Average: {payload[0].value.toFixed(1)}%</p>
          <p className="text-xs text-gray-500">Grade: {getGradeLetter(payload[0].value)}</p>
          <p className="text-xs text-gray-500">Assessments: {payload[0].payload.totalMarks}</p>
        </div>
      );
    }
    return null;
  };
  
  const CustomPieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="p-2 bg-white border rounded-lg shadow-lg dark:bg-gray-800">
          <p className="font-bold">{data.name}</p>
          <p className="text-sm text-blue-500">Average: {data.averageScore.toFixed(1)}%</p>
          <p className="text-xs text-gray-500">Grade: {getGradeLetter(data.averageScore)}</p>
          <p className="text-xs text-gray-500">Assessments: {data.totalMarks}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200">Subject Performance</h3>
          <p className="text-sm text-gray-500">Compare performance across all subjects</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant={chartType === 'bar' ? "default" : "outline"} 
            onClick={() => setChartType('bar')}
            className="h-8 px-3"
          >
            <BarChart3 className="h-4 w-4 mr-1" />
            Bar
          </Button>
          <Button 
            variant={chartType === 'pie' ? "default" : "outline"} 
            onClick={() => setChartType('pie')}
            className="h-8 px-3"
          >
            <PieChartIcon className="h-4 w-4 mr-1" />
            Pie
          </Button>
          <Button 
            variant={chartType === 'radar' ? "default" : "outline"} 
            onClick={() => setChartType('radar')}
            className="h-8 px-3"
          >
            <Target className="h-4 w-4 mr-1" />
            Radar
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-100">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="p-2 rounded-full bg-blue-100">
                <Calculator className="h-5 w-5 text-blue-600" />
              </div>
              <Badge className={cn("font-medium", getBadgeColor(overallAverage))}>
                Grade {getGradeLetter(overallAverage)}
              </Badge>
            </div>
            <h3 className="mt-3 text-lg font-semibold">Overall Average</h3>
            <div className="mt-1 text-3xl font-bold text-blue-600">{overallAverage.toFixed(1)}%</div>
            <p className="mt-1 text-sm text-gray-500">{subjects.length} subjects total</p>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-100">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="p-2 rounded-full bg-green-100">
                <TrendingUp className="h-5 w-5 text-green-600" />
              </div>
              <Badge className={cn("font-medium", getBadgeColor(bestSubject.averageScore))}>
                Grade {getGradeLetter(bestSubject.averageScore)}
              </Badge>
            </div>
            <h3 className="mt-3 text-lg font-semibold">Best Subject</h3>
            <div className="mt-1 text-3xl font-bold text-green-600">{bestSubject.name}</div>
            <p className="mt-1 text-sm text-gray-500">{bestSubject.averageScore.toFixed(1)}% average</p>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-amber-50 to-yellow-50 border-amber-100">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="p-2 rounded-full bg-amber-100">
                <TrendingDown className="h-5 w-5 text-amber-600" />
              </div>
              <Badge className={cn("font-medium", getBadgeColor(worstSubject.averageScore))}>
                Grade {getGradeLetter(worstSubject.averageScore)}
              </Badge>
            </div>
            <h3 className="mt-3 text-lg font-semibold">Needs Focus</h3>
            <div className="mt-1 text-3xl font-bold text-amber-600">{worstSubject.name}</div>
            <p className="mt-1 text-sm text-gray-500">{worstSubject.averageScore.toFixed(1)}% average</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Visualization</CardTitle>
        </CardHeader>
        <CardContent>
          <div className={`w-full custom-scrollbar overflow-auto ${subjects.length > 6 ? 'h-[400px]' : ''}`} style={{
            height: chartType === 'bar' && subjects.length > 6 ? `${Math.min(600, 200 + (subjects.length * 30))}px` : '350px'
          }}>
            <ResponsiveContainer width="100%" height="100%">
              {chartType === 'bar' && (
                <BarChart data={sortedSubjects} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(128, 128, 128, 0.2)" />
                  <XAxis type="number" domain={[0, 100]} tick={{ fill: '#666', fontSize: 12 }} />
                  <YAxis type="category" dataKey="name" tick={{ fill: '#666', fontSize: 12 }} width={80} />
                  <Tooltip content={<CustomBarTooltip />} />
                  <Legend />
                  <Bar dataKey="averageScore" name="Average Score" radius={[0, 4, 4, 0]}>
                    {sortedSubjects.map((entry) => (
                      <Cell key={`cell-${entry.name}`} fill={entry.color || '#3b82f6'} />
                    ))}
                  </Bar>
                </BarChart>
              )}
              
              {chartType === 'pie' && (
                <PieChart>
                  <Pie
                    data={sortedSubjects}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={120}
                    fill="#8884d8"
                    paddingAngle={2}
                    dataKey="averageScore"
                    nameKey="name"
                    label={({ name, percent }: any) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {sortedSubjects.map((entry) => (
                      <Cell key={`cell-${entry.name}`} fill={entry.color || '#3b82f6'} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomPieTooltip />} />
                  <Legend />
                </PieChart>
              )}
              
              {chartType === 'radar' && (
                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="subject" />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} />
                  <Radar name="Performance" dataKey="score" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
                  <Legend />
                </RadarChart>
              )}
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Subject Detailed List */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200">Detailed Performance</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sortedSubjects.map((subject) => (
            <Card key={subject.name} className="overflow-hidden bg-white/80 dark:bg-gray-800/50 backdrop-blur-md border-0 shadow-lg">
              <CardContent className="p-4">
                {/* Header */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full" style={{ backgroundColor: `${subject.color}20` }}>
                      <BookOpen className="w-5 h-5" style={{ color: subject.color }} />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-gray-100">{subject.name}</h4>
                      <p className="text-xs text-gray-500">{subject.totalMarks} assessments recorded</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-xl text-gray-800 dark:text-gray-50">
                      {subject.averageScore.toFixed(1)}%
                    </span>
                    <span className="ml-2 px-2 py-1 text-xs rounded-full" style={{ backgroundColor: `${subject.color}30`, color: subject.color }}>
                      {getGradeLetter(subject.averageScore)}
                    </span>
                  </div>
                </div>
                
                {/* Progress Bar */}
                <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full rounded-full" 
                    style={{ 
                      width: `${subject.averageScore}%`, 
                      backgroundColor: subject.color 
                    }} 
                  />
                </div>
                
                {/* Footer */}
                <div className="mt-3 flex justify-between items-center">
                  <Badge 
                    variant="outline" 
                    className={cn("text-xs font-medium", 
                      getBadgeColor(subject.averageScore)
                    )}
                  >
                    {getPerformanceText(subject.averageScore)}
                  </Badge>
                  
                  <div className="flex items-center gap-2">
                    {subject.averageScore > overallAverage ? (
                      <div className="flex items-center text-xs text-green-600">
                        <TrendingUp className="h-3 w-3 mr-1" />
                        <span>{(subject.averageScore - overallAverage).toFixed(1)}% above avg.</span>
                      </div>
                    ) : subject.averageScore < overallAverage ? (
                      <div className="flex items-center text-xs text-red-600">
                        <TrendingDown className="h-3 w-3 mr-1" />
                        <span>{(overallAverage - subject.averageScore).toFixed(1)}% below avg.</span>
                      </div>
                    ) : (
                      <div className="flex items-center text-xs text-gray-600">
                        At average
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}