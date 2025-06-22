import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { BookOpen, Info, PlusCircle } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { AddSubjectDialog } from './add-subject-dialog';

interface SubjectBreakdownProps {
  data: Record<string, {
    name: string;
    totalMarks: number;
    averageScore: number;
    color?: string;
  }>;
  userId: string;
  onSubjectAdded: () => void;
}

export function SubjectBreakdown({ data, userId, onSubjectAdded }: SubjectBreakdownProps) {
  const subjects = Object.values(data);

  if (!subjects || subjects.length === 0) {
    return (
      <div className="h-[450px] w-full flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-800/20 rounded-lg text-center p-4">
        <Info className="w-12 h-12 text-gray-400 mb-4" />
        <p className="text-lg font-medium text-gray-500 dark:text-gray-400">No subject data available.</p>
        <p className="text-sm text-gray-400 dark:text-gray-500">Add subjects and marks to see your breakdown.</p>
        <AddSubjectDialog userId={userId} onSubjectAdded={onSubjectAdded}>
          <Button className="mt-4">
            <PlusCircle className="mr-2 h-4 w-4" />
            Add First Subject
          </Button>
        </AddSubjectDialog>
      </div>
    );
  }

  const getGradeLetter = (score: number) => {
    if (score >= 90) return "A";
    if (score >= 80) return "B";
    if (score >= 70) return "C";
    if (score >= 60) return "D";
    return "F";
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="p-2 bg-white border rounded-lg shadow-lg dark:bg-gray-800">
          <p className="font-bold">{label}</p>
          <p className="text-sm text-blue-500">Average: {payload[0].value.toFixed(1)}%</p>
        </div>
      );
    }
    return null;
  };
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold tracking-tight">Subject Breakdown</h2>
        <AddSubjectDialog userId={userId} onSubjectAdded={onSubjectAdded}>
            <Button variant="outline">
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Subject
            </Button>
        </AddSubjectDialog>
    </div>
      {/* Chart */}
      <div className="h-[250px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={subjects} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(128, 128, 128, 0.2)" />
            <XAxis type="number" domain={[0, 100]} tick={{ fill: '#666', fontSize: 12 }} />
            <YAxis type="category" dataKey="name" tick={{ fill: '#666', fontSize: 12 }} width={80} />
            <Tooltip cursor={{ fill: 'rgba(240, 240, 240, 0.5)' }} content={<CustomTooltip />} />
            <Bar dataKey="averageScore" radius={[0, 4, 4, 0]}>
              {subjects.map((entry) => (
                <Cell key={`cell-${entry.name}`} fill={entry.color || '#3b82f6'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Subject List */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200">Detailed Performance</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {subjects.map((subject) => (
            <Card key={subject.name} className="p-0 overflow-hidden bg-white/80 dark:bg-gray-800/50 backdrop-blur-md border-0 shadow-lg">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full" style={{ backgroundColor: `${subject.color}20` }}>
                      <BookOpen className="w-5 h-5" style={{ color: subject.color }} />
                    </div>
                    <h4 className="font-semibold text-gray-900 dark:text-gray-100">{subject.name}</h4>
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
                <Progress 
                  value={subject.averageScore} 
                  className="h-2 [&>div]:bg-transparent"
                  style={{ background: `${subject.color}30` }}
                >
                   <div className="h-full rounded-full" style={{ width: `${subject.averageScore}%`, backgroundColor: subject.color }} />
                </Progress>
                <div className="mt-2 flex justify-between text-xs text-gray-500 dark:text-gray-400">
                  <span>{subject.totalMarks} assessments</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}