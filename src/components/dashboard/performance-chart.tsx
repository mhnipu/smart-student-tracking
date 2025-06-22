import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Area, AreaChart } from 'recharts';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Star, BarChartHorizontal, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PerformanceChartProps {
  data: Array<{
    week: string;
    average: number;
    count: number;
  }>;
}

const timeRanges = {
  '4W': 4,
  '8W': 8,
  '12W': 12,
  'ALL': Infinity,
};

type TimeRangeKey = keyof typeof timeRanges;

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const average = payload.find(p => p.dataKey === 'average');
    const count = payload.find(p => p.dataKey === 'count');

    return (
      <div className="p-3 bg-white border border-gray-200 rounded-lg shadow-lg dark:bg-gray-800 dark:border-gray-700">
        <p className="text-sm font-bold text-gray-900 dark:text-gray-100">{label}</p>
        {average && (
          <p className="text-sm text-blue-600 dark:text-blue-400">
            Average Score: {average.value.toFixed(1)}%
          </p>
        )}
        {count && (
          <p className="text-sm text-amber-600 dark:text-amber-400">
            Tests Taken: {count.value}
          </p>
        )}
      </div>
    );
  }

  return null;
};

export function PerformanceChart({ data }: PerformanceChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="h-[450px] w-full flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-800/20 rounded-lg text-center p-4">
        <Info className="w-12 h-12 text-gray-400 mb-4" />
        <p className="text-lg font-medium text-gray-500 dark:text-gray-400">No performance data yet.</p>
        <p className="text-sm text-gray-400 dark:text-gray-500">As you add marks for your tests, your progress will be shown here.</p>
      </div>
    );
  }

  const [timeRange, setTimeRange] = useState<TimeRangeKey>('8W');

  const filteredData = data.slice(-timeRanges[timeRange]);

  const trend = filteredData.length >= 2 
    ? filteredData[filteredData.length - 1].average - filteredData[filteredData.length - 2].average 
    : 0;
  
  const overallAverage = filteredData.length > 0
    ? filteredData.reduce((sum, item) => sum + item.average, 0) / filteredData.length
    : 0;

  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  
  const handleMouseOver = (data: any, index: number) => {
    setActiveIndex(index);
  };

  const handleMouseLeave = () => {
    setActiveIndex(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start justify-between">
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400">Overall Weekly Average</p>
          <div className="text-3xl font-bold text-gray-800 dark:text-gray-100">{overallAverage.toFixed(1)}%</div>
        </div>
        <div className="flex flex-col items-end gap-2 mt-2 sm:mt-0">
          <div className="flex items-center gap-1">
            {Object.keys(timeRanges).map((range) => (
              <Button
                key={range}
                size="sm"
                variant={timeRange === range ? 'default' : 'outline'}
                onClick={() => setTimeRange(range as TimeRangeKey)}
                className="text-xs"
              >
                {range}
              </Button>
            ))}
          </div>
          <Badge 
            className={`flex items-center gap-1 px-2 py-1 text-xs ${trend >= 0 ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'}`}
          >
            {trend >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            <span>{Math.abs(trend).toFixed(1)}% vs last period</span>
          </Badge>
        </div>
      </div>

      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart 
            data={filteredData} 
            margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
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
              axisLine={{ stroke: 'transparent' }}
              tickLine={{ stroke: 'transparent' }}
            />
            <Tooltip 
              cursor={{ stroke: '#3b82f6', strokeWidth: 1, strokeDasharray: '3 3' }}
              contentStyle={{
                backgroundColor: 'rgba(255, 255, 255, 0.8)',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                backdropFilter: 'blur(4px)',
              }}
              content={<CustomTooltip />}
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
        {filteredData.length > 0 && (
          <>
            <div className="flex items-center p-4 bg-gray-100/50 dark:bg-gray-800/50 rounded-lg">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-full mr-4">
                <Star className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Highest Week</p>
                <p className="font-semibold text-lg text-gray-800 dark:text-gray-100">{Math.max(...filteredData.map(d => d.average)).toFixed(1)}%</p>
              </div>
            </div>
            <div className="flex items-center p-4 bg-gray-100/50 dark:bg-gray-800/50 rounded-lg">
              <div className="p-2 bg-red-100 dark:bg-red-900/50 rounded-full mr-4">
                <TrendingDown className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Lowest Week</p>
                <p className="font-semibold text-lg text-gray-800 dark:text-gray-100">{Math.min(...filteredData.map(d => d.average)).toFixed(1)}%</p>
              </div>
            </div>
            <div className="flex items-center p-4 bg-gray-100/50 dark:bg-gray-800/50 rounded-lg">
               <div className="p-2 bg-green-100 dark:bg-green-900/50 rounded-full mr-4">
                <BarChartHorizontal className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Total Tests</p>
                <p className="font-semibold text-lg text-gray-800 dark:text-gray-100">{filteredData.reduce((sum, item) => sum + item.count, 0)}</p>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}