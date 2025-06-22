import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Plus, Target, Calendar, TrendingUp, CheckCircle, MoreHorizontal, Edit, Trash2 } from "lucide-react";
import { supabase } from '@/lib/supabase';
import { toast } from "sonner";
import { format, formatDistanceToNow } from "date-fns";
import { AddGoalDialog } from "./add-goal-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

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
  const [showAddGoalDialog, setShowAddGoalDialog] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | undefined>(undefined);
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [goalToDelete, setGoalToDelete] = useState<string | null>(null);

  useEffect(() => {
    loadGoals();
  }, [userId]);

  const loadGoals = async () => {
    setIsLoading(true);
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
        toast.error("Failed to load goals.");
        return;
      }

      setGoals(data.map(g => ({...g, progress: calculateProgress(g)})) || []);
    } catch (error) {
      console.error("Error loading goals:", error);
      toast.error("An unexpected error occurred while loading goals.");
    } finally {
      setIsLoading(false);
    }
  };
  
  const calculateProgress = (goal: Goal) => {
    if (goal.status === 'completed') return 100;
    if (!goal.target_score || !goal.current_score) return 0;
    return Math.min((goal.current_score / goal.target_score) * 100, 100);
  }

  const handleEdit = (goal: Goal) => {
    setEditingGoal(goal);
    setShowAddGoalDialog(true);
  };

  const handleAddNew = () => {
    setEditingGoal(undefined);
    setShowAddGoalDialog(true);
  };
  
  const handleComplete = async (goalId: string) => {
    // Optimistic update
    setGoals(goals.filter(g => g.id !== goalId));

    const { error } = await supabase
      .from('goals')
      .update({ status: 'completed', progress: 100 })
      .eq('id', goalId);

    if (error) {
      toast.error("Failed to mark goal as complete.");
      // Revert optimistic update
      loadGoals();
    } else {
      toast.success("Goal completed! 🎉");
    }
  };
  
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
      case 'low': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
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

  const handleDelete = async () => {
    if (!goalToDelete) return;

    const originalGoals = [...goals];
    setGoals(goals.filter(g => g.id !== goalToDelete));

    const { error } = await supabase
      .from('goals')
      .delete()
      .eq('id', goalToDelete);

    if (error) {
      toast.error("Failed to delete goal.");
      setGoals(originalGoals); // Revert optimistic update
    } else {
      toast.success("Goal deleted.");
    }
    
    setGoalToDelete(null);
    setIsAlertOpen(false);
  };

  const openDeleteConfirm = (goalId: string) => {
    setGoalToDelete(goalId);
    setIsAlertOpen(true);
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
          <Button size="sm" onClick={handleAddNew}>
            <Plus className="h-4 w-4 mr-1" />
            Add Goal
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {goals.length === 0 ? (
          <div className="text-center py-8 space-y-3">
            <Target className="h-8 w-8 text-gray-400 mx-auto" />
            <p className="text-gray-500 dark:text-gray-400">No active goals</p>
            <p className="text-sm text-gray-400 dark:text-gray-500">Set your first academic goal to get started!</p>
            <Button size="sm" onClick={handleAddNew} className="mt-4">
              <Plus className="h-4 w-4 mr-1" />
              Create First Goal
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {goals.map((goal) => (
              <div key={goal.id} className="border dark:border-gray-700 rounded-lg p-4 space-y-3 transition-all hover:shadow-md hover:border-blue-500/50 dark:hover:border-blue-500/50">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <div className="p-1.5 rounded-full" style={{ backgroundColor: `${goal.subjects?.color || '#cccccc'}20` }}>
                        {getCategoryIcon(goal.category)}
                      </div>
                      <h4 className="font-semibold text-gray-900 dark:text-gray-100">{goal.title}</h4>
                    </div>
                    
                    <div className="flex items-center flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500 dark:text-gray-400 ml-9">
                       <Badge variant="outline" className={`${getPriorityColor(goal.priority)} border-0`}>
                         {goal.priority} priority
                       </Badge>
                       <span>Due {formatDistanceToNow(new Date(goal.target_date), { addSuffix: true })}</span>
                       {goal.subjects && (
                         <span className="flex items-center space-x-1.5">
                           <div 
                             className="w-2 h-2 rounded-full" 
                             style={{ backgroundColor: goal.subjects.color || '#3B82F6' }}
                           ></div>
                           <span>{goal.subjects.name}</span>
                         </span>
                       )}
                    </div>
                  </div>
                   <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleEdit(goal)}>
                        <Edit className="mr-2 h-4 w-4" />
                        <span>Edit</span>
                      </DropdownMenuItem>
                       <DropdownMenuItem onClick={() => handleComplete(goal.id)}>
                        <CheckCircle className="mr-2 h-4 w-4" />
                        <span>Mark as Complete</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        className="text-red-500"
                        onClick={() => openDeleteConfirm(goal.id)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        <span>Delete</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <div className="space-y-1 pt-2">
                   <div className="flex justify-between text-xs font-medium text-gray-600 dark:text-gray-300">
                    <span className="text-gray-500 dark:text-gray-400">Progress</span>
                     <span>
                      {goal.current_score || 0}% / <span className="text-gray-500">{goal.target_score || 100}%</span>
                    </span>
                  </div>
                  <Progress value={goal.progress} className="h-2" />
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
      <AddGoalDialog
        open={showAddGoalDialog}
        onOpenChange={setShowAddGoalDialog}
        onSuccess={loadGoals}
        userId={userId}
        goal={editingGoal}
      />
      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the goal.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Continue</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}