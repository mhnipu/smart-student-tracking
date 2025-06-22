import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Calendar, Plus, Clock, Target, CheckCircle } from "lucide-react";
import { supabase } from '@/lib/supabase';
import { toast } from "sonner";
import { format, differenceInDays } from "date-fns";

interface StudyPlan {
  id: string;
  title: string;
  description: string;
  start_date: string;
  end_date: string;
  total_hours: number;
  completed_hours: number;
  difficulty_level: string;
  plan_type: string;
  status: string;
  subjects?: {
    name: string;
    color?: string;
  };
}

interface Subject {
  id: string;
  name: string;
  color?: string;
}

interface StudyPlannerProps {
  userId: string;
  subjects: Subject[];
}

export function StudyPlanner({ userId, subjects }: StudyPlannerProps) {
  const [plans, setPlans] = useState<StudyPlan[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [newPlan, setNewPlan] = useState({
    title: "",
    description: "",
    start_date: "",
    end_date: "",
    total_hours: "",
    difficulty_level: "medium",
    plan_type: "custom",
    subject_id: ""
  });

  useEffect(() => {
    loadPlans();
  }, [userId]);

  const loadPlans = async () => {
    try {
      const { data, error } = await supabase
        .from('study_plans')
        .select(`
          *,
          subjects (
            name,
            color
          )
        `)
        .eq('user_id', userId)
        .eq('status', 'active')
        .order('start_date', { ascending: true })
        .limit(5);

      if (error) {
        console.error("Error loading study plans:", error);
        return;
      }

      setPlans(data || []);
    } catch (error) {
      console.error("Error loading study plans:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const createPlan = async () => {
    if (!newPlan.title || !newPlan.start_date || !newPlan.end_date || !newPlan.total_hours) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      const { error } = await supabase
        .from('study_plans')
        .insert({
          title: newPlan.title,
          description: newPlan.description,
          start_date: newPlan.start_date,
          end_date: newPlan.end_date,
          total_hours: parseInt(newPlan.total_hours),
          difficulty_level: newPlan.difficulty_level,
          plan_type: newPlan.plan_type,
          user_id: userId,
          subject_id: newPlan.subject_id || null
        });

      if (error) {
        console.error("Error creating study plan:", error);
        toast.error("Failed to create study plan");
        return;
      }

      setNewPlan({
        title: "",
        description: "",
        start_date: "",
        end_date: "",
        total_hours: "",
        difficulty_level: "medium",
        plan_type: "custom",
        subject_id: ""
      });
      setIsCreating(false);
      loadPlans();
      toast.success("Study plan created successfully!");
    } catch (error) {
      console.error("Error creating study plan:", error);
      toast.error("Failed to create study plan");
    }
  };

  const getDifficultyColor = (level: string) => {
    switch (level) {
      case 'easy': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'hard': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPlanTypeIcon = (type: string) => {
    switch (type) {
      case 'exam_prep': return <Target className="h-4 w-4" />;
      case 'skill_building': return <CheckCircle className="h-4 w-4" />;
      case 'review': return <Clock className="h-4 w-4" />;
      default: return <Calendar className="h-4 w-4" />;
    }
  };

  const calculateProgress = (plan: StudyPlan) => {
    return Math.min((plan.completed_hours / plan.total_hours) * 100, 100);
  };

  const getDaysRemaining = (endDate: string) => {
    return differenceInDays(new Date(endDate), new Date());
  };

  if (isLoading) {
    return (
      <Card className="border-2 border-dashed border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calendar className="h-5 w-5 text-purple-600" />
            <span>Study Planner</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-20 bg-purple-100 rounded-lg"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-2 border-dashed border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center space-x-2">
              <Calendar className="h-5 w-5 text-purple-600" />
              <span>Study Planner</span>
            </CardTitle>
            <CardDescription>Create structured study plans for better organization</CardDescription>
          </div>
          <Button 
            size="sm" 
            variant="outline"
            onClick={() => setIsCreating(!isCreating)}
            className="border-purple-300 text-purple-700 hover:bg-purple-100"
          >
            <Plus className="h-4 w-4 mr-1" />
            New Plan
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Create Plan Form */}
        {isCreating && (
          <div className="border border-purple-200 rounded-lg p-4 space-y-3 bg-white">
            <div className="grid grid-cols-2 gap-3">
              <Input
                placeholder="Plan title..."
                value={newPlan.title}
                onChange={(e) => setNewPlan(prev => ({ ...prev, title: e.target.value }))}
              />
              <Select value={newPlan.plan_type} onValueChange={(value) => setNewPlan(prev => ({ ...prev, plan_type: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="custom">Custom Plan</SelectItem>
                  <SelectItem value="exam_prep">Exam Preparation</SelectItem>
                  <SelectItem value="skill_building">Skill Building</SelectItem>
                  <SelectItem value="review">Review Session</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <Textarea
              placeholder="Plan description (optional)..."
              value={newPlan.description}
              onChange={(e) => setNewPlan(prev => ({ ...prev, description: e.target.value }))}
              rows={2}
            />
            
            <div className="grid grid-cols-3 gap-3">
              <Input
                type="date"
                value={newPlan.start_date}
                onChange={(e) => setNewPlan(prev => ({ ...prev, start_date: e.target.value }))}
              />
              <Input
                type="date"
                value={newPlan.end_date}
                onChange={(e) => setNewPlan(prev => ({ ...prev, end_date: e.target.value }))}
              />
              <Input
                type="number"
                placeholder="Total hours"
                value={newPlan.total_hours}
                onChange={(e) => setNewPlan(prev => ({ ...prev, total_hours: e.target.value }))}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <Select value={newPlan.difficulty_level} onValueChange={(value) => setNewPlan(prev => ({ ...prev, difficulty_level: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="easy">Easy</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="hard">Hard</SelectItem>
                </SelectContent>
              </Select>
              <Select value={newPlan.subject_id} onValueChange={(value) => setNewPlan(prev => ({ ...prev, subject_id: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select subject (optional)" />
                </SelectTrigger>
                <SelectContent>
                  {subjects.map((subject) => (
                    <SelectItem key={subject.id} value={subject.id}>
                      <div className="flex items-center space-x-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: subject.color || '#3B82F6' }}
                        ></div>
                        <span>{subject.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex space-x-2">
              <Button size="sm" onClick={createPlan} className="bg-purple-600 hover:bg-purple-700">
                Create Plan
              </Button>
              <Button size="sm" variant="outline" onClick={() => setIsCreating(false)}>
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Plans List */}
        {plans.length === 0 ? (
          <div className="text-center py-8 space-y-3">
            <Calendar className="h-8 w-8 text-purple-400 mx-auto" />
            <p className="text-purple-600 font-medium">No active study plans</p>
            <p className="text-sm text-purple-500">Create your first study plan to get organized!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {plans.map((plan) => {
              const progress = calculateProgress(plan);
              const daysRemaining = getDaysRemaining(plan.end_date);
              
              return (
                <div
                  key={plan.id}
                  className="border border-purple-200 rounded-lg p-4 space-y-3 bg-white hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        {getPlanTypeIcon(plan.plan_type)}
                        <h4 className="font-semibold text-gray-900">{plan.title}</h4>
                        <Badge className={`text-xs ${getDifficultyColor(plan.difficulty_level)}`}>
                          {plan.difficulty_level}
                        </Badge>
                      </div>
                      {plan.description && (
                        <p className="text-sm text-gray-600 mb-2">{plan.description}</p>
                      )}
                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        <span>
                          {format(new Date(plan.start_date), 'MMM dd')} - {format(new Date(plan.end_date), 'MMM dd')}
                        </span>
                        <span>{plan.completed_hours}h / {plan.total_hours}h</span>
                        <span className={daysRemaining < 0 ? 'text-red-600' : 'text-gray-500'}>
                          {daysRemaining < 0 ? 'Overdue' : `${daysRemaining} days left`}
                        </span>
                        {plan.subjects && (
                          <span className="flex items-center space-x-1">
                            <div 
                              className="w-2 h-2 rounded-full" 
                              style={{ backgroundColor: plan.subjects.color || '#3B82F6' }}
                            ></div>
                            <span>{plan.subjects.name}</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>Progress</span>
                      <span>{progress.toFixed(0)}%</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}