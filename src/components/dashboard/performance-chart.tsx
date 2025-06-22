import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Area, AreaChart } from 'recharts';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';

interface PerformanceChartProps {
  data: Array<{
    week: string;
    average: number;
    count: number;
  }>;
}

export function PerformanceChart({ data }: PerformanceChartProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  
  // Get the trend based on the last two data points
  const trend = data.length >= 2 
    ? data[data.length - 1].average - data[data.length - 2].average 
    : 0;
  
  // Calculate average of all scores
  const overallAverage = data.length > 0
    ? data.reduce((sum, item) => sum + item.average, 0) / data.length
    : 0;

  const handleMouseOver = (data: any, index: number) => {
    setActiveIndex(index);
  };

  const handleMouseLeave = () => {
    setActiveIndex(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">Overall Average</p>
          <div className="text-2xl font-bold">{overallAverage.toFixed(1)}%</div>
        </div>
        <Badge 
          className={`px-2 py-1 text-sm ${trend >= 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}
        >
          {trend >= 0 ? '↑' : '↓'} {Math.abs(trend).toFixed(1)}% from last week
        </Badge>
      </div>

      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart 
            data={data} 
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            onMouseLeave={handleMouseLeave}
          >
            <defs>
              <linearGradient id="colorAvg" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="week" 
              stroke="#666"
              fontSize={12}
              tick={{ fill: '#666' }}
            />
            <YAxis 
              stroke="#666"
              fontSize={12}
              domain={[0, 100]}
              tick={{ fill: '#666' }}
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: '#fff',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
              }}
              formatter={(value: number, name: string) => [
                `${value.toFixed(1)}%`,
                name === 'average' ? 'Average Score' : 'Test Count'
              ]}
              labelFormatter={(label) => `Week: ${label}`}
            />
            <Legend 
              verticalAlign="top" 
              height={36}
              formatter={(value) => value === 'average' ? 'Average Score' : 'Number of Tests'}
            />
            <Area 
              type="monotone" 
              dataKey="average" 
              name="average"
              stroke="#3b82f6" 
              strokeWidth={3}
              fillOpacity={1}
              fill="url(#colorAvg)"
              activeDot={{ 
                r: 8, 
                stroke: '#3b82f6', 
                strokeWidth: 2,
                onClick: (data, index) => {
                  // Handle click on dot if needed
                  console.log(`Clicked on week ${data.payload.week}`);
                }
              }}
              onMouseOver={handleMouseOver}
            />
            <Line 
              type="monotone" 
              dataKey="count" 
              name="count"
              stroke="#f59e0b" 
              strokeWidth={2}
              dot={{ fill: '#f59e0b', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, stroke: '#f59e0b', strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      
      {/* Quick data stats */}
      <div className="grid grid-cols-3 gap-2 mt-2">
        {data.length > 0 && (
          <>
            <div className="text-center p-2 bg-blue-50 rounded-lg">
              <p className="text-xs text-gray-500">Highest</p>
              <p className="font-medium">{Math.max(...data.map(d => d.average)).toFixed(1)}%</p>
            </div>
            <div className="text-center p-2 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-500">Lowest</p>
              <p className="font-medium">{Math.min(...data.map(d => d.average)).toFixed(1)}%</p>
            </div>
            <div className="text-center p-2 bg-blue-50 rounded-lg">
              <p className="text-xs text-gray-500">Total Tests</p>
              <p className="font-medium">{data.reduce((sum, item) => sum + item.count, 0)}</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}