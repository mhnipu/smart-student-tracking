"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface SubjectBreakdownProps {
  data: Record<string, {
    totalMarks: number;
    averageScore: number;
    color?: string;
  }>;
}

export function SubjectBreakdown({ data }: SubjectBreakdownProps) {
  const subjects = Object.entries(data).map(([name, stats]) => ({
    name,
    value: stats.averageScore,
    totalMarks: stats.totalMarks,
    color: stats.color || '#3b82f6',
  }));

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

  return (
    <div className="space-y-6">
      {/* Chart */}
      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={subjects}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, value }) => `${name}: ${value.toFixed(1)}%`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {subjects.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip 
              formatter={(value: number) => [`${value.toFixed(1)}%`, 'Average Score']}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Subject List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {subjects.map((subject, index) => (
          <Card key={subject.name} className="p-4">
            <CardContent className="p-0 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-gray-900">{subject.name}</h4>
                <span className="text-sm font-medium text-gray-600">
                  {subject.value.toFixed(1)}%
                </span>
              </div>
              <Progress 
                value={subject.value} 
                className="h-2"
                style={{ 
                  '--progress-background': COLORS[index % COLORS.length] 
                } as any}
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>{subject.totalMarks} assessments</span>
                <span>
                  {subject.value >= 90 ? 'A' : 
                   subject.value >= 80 ? 'B' : 
                   subject.value >= 70 ? 'C' : 
                   subject.value >= 60 ? 'D' : 'F'}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}