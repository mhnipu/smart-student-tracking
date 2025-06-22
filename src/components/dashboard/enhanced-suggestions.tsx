import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Lightbulb, 
  BookOpen, 
  Target, 
  TrendingUp, 
  Clock, 
  Users, 
  ExternalLink,
  CheckCircle, 
  X,
  Star,
  Brain,
  ArrowRight,
  ThumbsUp,
  ThumbsDown,
  Sparkles,
  Calendar,
  Link2,
  BarChart,
  Plus,
  RefreshCw
} from "lucide-react";
import { supabase } from '@/lib/supabase';
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface EnhancedSuggestion {
  id: string;
  title: string;
  description: string;
  type: string;
  priority: string;
  status: string;
  category: string;
  resource_url: string;
  estimated_time: string;
  ai_generated: boolean;
  confidence_score: number;
  interaction_count: number;
  effectiveness_rating: number;
  subjects?: {
    name: string;
    color?: string;
  };
}

interface EnhancedSuggestionsProps {
  userId: string;
  onAction?: (id: string, status: string) => void;
}

export function EnhancedSuggestions({ userId, onAction }: EnhancedSuggestionsProps) {
  const [suggestions, setSuggestions] = useState<EnhancedSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isAnyExpanded, setIsAnyExpanded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadSuggestions();
  }, [userId]);

  useEffect(() => {
    setIsAnyExpanded(expandedId !== null);
  }, [expandedId]);

  // Load suggestions from the database or use fallback data
  const loadSuggestions = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase
        .from('suggestions')
        .select(`
          *,
          subjects (
            name,
            color
          )
        `)
        .eq('user_id', userId)
        .eq('status', 'active')
        .order('priority', { ascending: false });
        
      if (error) {
        console.error("Error loading suggestions:", error);
        
        // If table doesn't exist, use fallback data instead of showing an error
        if (error.code === 'PGRST109') {
          console.log("Using fallback suggestions data since table doesn't exist yet");
          setSuggestions(getFallbackSuggestions());
        } else {
          setError(error.message);
        }
      } else {
        setSuggestions(data || []);
      }
    } catch (err) {
      console.error("Failed to load suggestions:", err);
      setSuggestions(getFallbackSuggestions());
    } finally {
      setIsLoading(false);
    }
  };

  // Fallback suggestions when database isn't available
  const getFallbackSuggestions = () => {
    return [
      {
        id: "fallback-1",
        title: "Try the Pomodoro Study Technique",
        description: "The Pomodoro Technique involves studying in focused 25-minute intervals with 5-minute breaks. This method can help improve concentration and reduce burnout during long study sessions.",
        type: "study_method",
        priority: "high",
        status: "active",
        category: "time_management",
        resource_url: "https://pomofocus.io/",
        estimated_time: "25 min",
        ai_generated: true,
        confidence_score: 95,
        interaction_count: 0,
        effectiveness_rating: 4.8
      },
      {
        id: "fallback-2",
        title: "Create Flashcards for Key Concepts",
        description: "Converting your notes into flashcards can help with active recall, one of the most effective study techniques. Focus on the areas where you scored lowest in recent assessments.",
        type: "improvement",
        priority: "medium",
        status: "active",
        category: "study_technique",
        resource_url: "",
        estimated_time: "30 min",
        ai_generated: true,
        confidence_score: 92,
        interaction_count: 0,
        effectiveness_rating: 4.5
      },
      {
        id: "fallback-3",
        title: "Use Khan Academy for Math Practice",
        description: "Khan Academy offers excellent free resources for mathematics practice. Based on your recent math scores, focusing on additional practice could help improve your understanding.",
        type: "resource",
        priority: "medium",
        status: "active",
        category: "external_resource",
        resource_url: "https://www.khanacademy.org/",
        estimated_time: "45 min",
        ai_generated: false,
        confidence_score: 88,
        interaction_count: 0,
        effectiveness_rating: 4.7
      }
    ];
  };

  const handleAction = async (id: string, status: string) => {
    try {
      // For fallback suggestions or when onAction isn't provided, just remove from local state
      if (id.startsWith('fallback') || !onAction) {
        setSuggestions(prev => prev.filter(s => s.id !== id));
        
        if (status === 'completed') {
          toast.success("Suggestion marked as completed", {
            description: "Great job on taking action!",
            icon: <CheckCircle className="h-5 w-5 text-green-500" />,
          });
        } else if (status === 'dismissed') {
          toast.info("Suggestion dismissed", {
            description: "We'll show you more relevant suggestions next time.",
          });
        }
        return;
      }
      
      // Use the provided onAction callback for database-backed suggestions
      onAction(id, status);
      
      if (status === 'completed') {
        toast.success("Suggestion marked as completed", {
          description: "Great job on taking action!",
          icon: <CheckCircle className="h-5 w-5 text-green-500" />,
        });
      } else if (status === 'dismissed') {
        toast.info("Suggestion dismissed", {
          description: "We'll show you more relevant suggestions next time.",
        });
      }
    } catch (error) {
      console.error("Error updating suggestion:", error);
    }
  };

  const handleExpand = (id: string) => {
    if (expandedId === id) {
      setExpandedId(null);
    } else {
      setExpandedId(id);
      // Scroll expanded suggestion into view if needed
      setTimeout(() => {
        if (containerRef.current) {
          const element = document.getElementById(`suggestion-${id}`);
          if (element) {
            const container = containerRef.current;
            const elementRect = element.getBoundingClientRect();
            const containerRect = container.getBoundingClientRect();
            
            if (elementRect.bottom > containerRect.bottom) {
              element.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }
          }
        }
      }, 100);
    }
  };

  const getIcon = (type: string) => {
    const iconMap: Record<string, any> = {
      study_method: BookOpen,
      resource: ExternalLink,
      practice: Target,
      improvement: TrendingUp,
      collaboration: Users,
      time_management: Clock,
      performance: BarChart,
      schedule: Calendar
    };
    const IconComponent = iconMap[type] || Lightbulb;
    return <IconComponent className="h-4 w-4" />;
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-50 text-red-800 border-red-200 hover:bg-red-100';
      case 'medium': return 'bg-yellow-50 text-yellow-800 border-yellow-200 hover:bg-yellow-100';
      case 'low': return 'bg-green-50 text-green-800 border-green-200 hover:bg-green-100';
      default: return 'bg-gray-50 text-gray-800 border-gray-200 hover:bg-gray-100';
    }
  };

  const getConfidenceColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const filteredSuggestions = suggestions.filter(suggestion => {
    if (filter === 'all') return true;
    if (filter === 'ai') return suggestion.ai_generated;
    if (filter === 'high_priority') return suggestion.priority === 'high';
    return suggestion.type === filter;
  });

  // Loading state
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Lightbulb className="h-5 w-5 text-blue-600" />
            <span>Smart Suggestions</span>
          </CardTitle>
          <CardDescription>Loading personalized recommendations...</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-red-600">
            <Lightbulb className="h-5 w-5" />
            <span>Smart Suggestions</span>
          </CardTitle>
          <CardDescription>Could not load suggestions</CardDescription>
        </CardHeader>
        <CardContent className="text-center py-6 space-y-4">
          <p className="text-red-600">{error}</p>
          <Button onClick={loadSuggestions} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Empty state
  if (suggestions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Lightbulb className="h-5 w-5 text-blue-600" />
            <span>Smart Suggestions</span>
          </CardTitle>
          <CardDescription>Personalized recommendations to improve your performance</CardDescription>
        </CardHeader>
        <CardContent className="text-center py-10 space-y-4">
          <div className="rounded-full bg-blue-100 p-3 w-16 h-16 mx-auto flex items-center justify-center">
            <Lightbulb className="h-8 w-8 text-blue-600" />
          </div>
          <h3 className="text-lg font-medium text-gray-900">No suggestions yet</h3>
          <p className="text-gray-500 max-w-md mx-auto">
            Add more assessments to receive personalized suggestions to improve your performance
          </p>
          <Button className="mt-4" variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            Add Assessment
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Lightbulb className="h-5 w-5 text-blue-600" />
          <span>Smart Suggestions</span>
        </CardTitle>
        <CardDescription>Personalized recommendations to improve your performance</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4" ref={containerRef}>
        {/* Filter Pills */}
        <div className="flex flex-wrap gap-2">
          {[
            { key: 'all', label: 'All', icon: Sparkles },
            { key: 'ai', label: 'AI Generated', icon: Brain },
            { key: 'high_priority', label: 'High Priority', icon: Target },
            { key: 'study_method', label: 'Study Methods', icon: BookOpen },
            { key: 'resource', label: 'Resources', icon: Link2 }
          ].map(({ key, label, icon: Icon }) => (
            <Button
              key={key}
              size="sm"
              variant={filter === key ? "default" : "outline"}
              onClick={() => setFilter(key)}
              className={cn(
                "text-xs rounded-full px-3 transition-all",
                filter === key ? "bg-blue-600" : "hover:bg-blue-50 hover:text-blue-700"
              )}
            >
              <Icon className="h-3 w-3 mr-1.5" />
              {label}
            </Button>
          ))}
        </div>

        {/* Suggestions List */}
        {filteredSuggestions.length === 0 ? (
          <div className="text-center py-6 space-y-3 bg-gray-50 rounded-lg">
            <Lightbulb className="h-6 w-6 text-gray-400 mx-auto" />
            <p className="text-gray-500">No matching suggestions</p>
            <p className="text-xs text-gray-400">
              Try adjusting your filter to see more suggestions
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence>
              {filteredSuggestions.map((suggestion) => (
                <motion.div
                  key={suggestion.id}
                  id={`suggestion-${suggestion.id}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className={cn(
                    "border rounded-lg overflow-hidden transition-all duration-200",
                    getPriorityColor(suggestion.priority),
                    expandedId === suggestion.id ? "shadow-md" : "",
                    isAnyExpanded && expandedId !== suggestion.id ? "opacity-70" : ""
                  )}
                >
                  <div 
                    className="p-4 cursor-pointer" 
                    onClick={() => handleExpand(suggestion.id)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <div className="bg-white rounded-lg p-1.5 shadow-sm">
                            {getIcon(suggestion.type)}
                          </div>
                          <h4 className="font-semibold text-gray-900">{suggestion.title}</h4>
                          {suggestion.ai_generated && (
                            <Badge className="bg-blue-100 text-blue-800 text-xs">
                              <Brain className="h-3 w-3 mr-1" />
                              AI
                            </Badge>
                          )}
                        </div>
                        
                        <p className="text-sm text-gray-700 line-clamp-2">{suggestion.description}</p>
                        
                        <div className="flex items-center space-x-4 text-xs text-gray-600 mt-2">
                          <Badge variant="outline" className="text-xs capitalize">
                            {suggestion.type.replace(/_/g, ' ')}
                          </Badge>
                          
                          {suggestion.estimated_time && (
                            <span className="flex items-center space-x-1">
                              <Clock className="h-3 w-3" />
                              <span>{suggestion.estimated_time}</span>
                            </span>
                          )}
                          
                          {suggestion.subjects?.name && (
                            <span className="flex items-center space-x-1">
                              <BookOpen className="h-3 w-3" />
                              <span>{suggestion.subjects.name}</span>
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex flex-col items-end ml-4">
                        <Badge className={cn(
                          "rounded-full px-2 py-0.5 text-xs font-medium mb-2 capitalize",
                          suggestion.priority === 'high' ? 'bg-red-100 text-red-800' :
                          suggestion.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        )}>
                          {suggestion.priority}
                        </Badge>
                        
                        {suggestion.ai_generated && (
                          <div className="text-xs text-gray-500 flex items-center space-x-1">
                            <span className={getConfidenceColor(suggestion.confidence_score)}>
                              {suggestion.confidence_score}%
                            </span>
                            <span>confident</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Expanded details */}
                    <AnimatePresence>
                      {expandedId === suggestion.id && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.2 }}
                          className="mt-4 pt-4 border-t"
                        >
                          <p className="text-sm text-gray-700 mb-4">{suggestion.description}</p>
                          
                          {suggestion.resource_url && (
                            <div className="mb-4">
                              <a 
                                href={suggestion.resource_url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="inline-flex items-center text-sm bg-blue-50 text-blue-700 px-3 py-1.5 rounded-md hover:bg-blue-100 transition-colors"
                              >
                                <ExternalLink className="h-3 w-3 mr-1.5" />
                                View Resource
                              </a>
                            </div>
                          )}
                          
                          <div className="flex space-x-2 mt-4">
                            <Button 
                              size="sm" 
                              className="bg-green-600 hover:bg-green-700"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAction(suggestion.id, 'completed');
                              }}
                            >
                              <CheckCircle className="h-4 w-4 mr-1.5" />
                              Mark as Done
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              className="text-gray-700"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAction(suggestion.id, 'dismissed');
                              }}
                            >
                              <X className="h-4 w-4 mr-1.5" />
                              Dismiss
                            </Button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </CardContent>
    </Card>
  );
}