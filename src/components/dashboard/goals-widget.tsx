import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Plus, Target, Calendar, TrendingUp, CheckCircle } from "lucide-react";
import { supabase } from '@/lib/supabase';
import { toast } from "sonner";
import { format } from "date-fns";

interface Goal {
  id: string;
  title: string;
  description: string;
  target_score: number;
  current_score: number;
  target_date: string;
  status: string;
  priority: string;
  category: string;
  progress: number;
  subjects?: {
    name: string;
    color?: string;
  };
}

interface GoalsWidgetProps {
  userId: string;
}

export function GoalsWidget({ userId }: GoalsWidgetProps) {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadGoals();
  }, [userId]);

  const loadGoals = async () => {
    try {
      const { data, error } = await supabase
        .from('goals')
        .select(`
          *,
          subjects (
            name,
            color
          )
        `)
        .eq('user_id', userId)
        .eq('status', 'active')
        .order('target_date', { ascending: true })
        .limit(5);

      if (error) {
        console.error("Error loading goals:", error);
        return;
      }

      setGoals(data || []);
    } catch (error) {
      console.error("Error loading goals:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'exam': return <Calendar className="h-4 w-4" />;
      case 'subject': return <Target className="h-4 w-4" />;
      case 'assignment': return <CheckCircle className="h-4 w-4" />;
      default: return <TrendingUp className="h-4 w-4" />;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Target className="h-5 w-5" />
            <span>Academic Goals</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-2 bg-gray-200 rounded w-full"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center space-x-2">
              <Target className="h-5 w-5" />
              <span>Academic Goals</span>
            </CardTitle>
            <CardDescription>Track your progress towards academic targets</CardDescription>
          </div>
          <Button size="sm" variant="outline">
            <Plus className="h-4 w-4 mr-1" />
            Add Goal
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {goals.length === 0 ? (
          <div className="text-center py-8 space-y-3">
            <Target className="h-8 w-8 text-gray-400 mx-auto" />
            <p className="text-gray-500">No active goals</p>
            <p className="text-sm text-gray-400">Set your first academic goal to get started!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {goals.map((goal) => (
              <div key={goal.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      {getCategoryIcon(goal.category)}
                      <h4 className="font-medium text-gray-900">{goal.title}</h4>
                      <Badge className={`text-xs ${getPriorityColor(goal.priority)}`}>
                        {goal.priority}
                      </Badge>
                    </div>
                    {goal.description && (
                      <p className="text-sm text-gray-600 mb-2">{goal.description}</p>
                    )}
                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      <span>Target: {goal.target_score}%</span>
                      <span>Current: {goal.current_score}%</span>
                      <span>Due: {format(new Date(goal.target_date), 'MMM dd')}</span>
                      {goal.subjects && (
                        <span className="flex items-center space-x-1">
                          <div 
                            className="w-2 h-2 rounded-full" 
                            style={{ backgroundColor: goal.subjects.color || '#3B82F6' }}
                          ></div>
                          <span>{goal.subjects.name}</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>Progress</span>
                    <span>{goal.progress.toFixed(0)}%</span>
                  </div>
                  <Progress value={goal.progress} className="h-2" />
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}