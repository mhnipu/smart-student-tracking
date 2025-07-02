import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, RefreshCw, Loader2, BookOpen, Clock, Brain, CheckCircle, Target, ChevronRight, AlertCircle } from "lucide-react";
import { aiService } from "@/lib/ai-service";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";

interface ContextAwareAIProps {
  userId: string;
  updateCounter?: number; // Prop to trigger re-analysis when data changes
}

export function ContextAwareAI({ userId, updateCounter = 0 }: ContextAwareAIProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [insights, setInsights] = useState<any[]>([]);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [contextInfo, setContextInfo] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("suggestions");

  useEffect(() => {
    loadAIContent();
  }, [userId, updateCounter]);

  const loadAIContent = async () => {
    setIsLoading(true);
    try {
      // Load AI insights from database
      const { data: insightsData, error: insightsError } = await supabase
        .from('ai_insights')
        .select(`
          id, insight_type, title, content, confidence_score, priority, is_read, created_at,
          subjects (
            name, color
          )
        `)
        .eq('user_id', userId)
        .eq('is_read', false)
        .order('created_at', { ascending: false })
        .limit(10);

      if (insightsError) throw insightsError;
      
      // Load AI suggestions from database
      const { data: suggestionsData, error: suggestionsError } = await supabase
        .from('suggestions')
        .select(`
          id, title, description, type, priority, status, category, resource_url, 
          estimated_time, ai_generated, confidence_score, interaction_count, effectiveness_rating,
          subjects (
            name, color
          )
        `)
        .eq('user_id', userId)
        .eq('status', 'active')
        .eq('ai_generated', true)
        .order('confidence_score', { ascending: false })
        .limit(10);
      
      if (suggestionsError) throw suggestionsError;
      
      setInsights(insightsData || []);
      setSuggestions(suggestionsData || []);
      
      // Get context info for personalization
      const studentData = await aiService.prepareStudentData(userId);
      setContextInfo({
        overallAverage: studentData?.overallAverage || 0,
        totalStudyTime: studentData?.studyPatterns.totalStudyTime || 0,
        currentStreak: studentData?.studyPatterns.currentStreak || 0,
        weeklyStudyHours: studentData?.studyPatterns.weeklyStudyHours || 0,
        subjects: studentData?.subjects || [],
      });
      
    } catch (error) {
      console.error("Failed to load AI content:", error);
      toast.error("Failed to load personalized AI content");
    } finally {
      setIsLoading(false);
    }
  };

  const generateFreshInsights = async () => {
    setIsAnalyzing(true);
    
    try {
      toast.info("Analyzing your performance data...");
      
      // Try to use the serverless Edge Function first
      try {
        const { error } = await supabase.functions.invoke('generate-insights', {
          body: { userId }
        });

        if (error) {
          console.error("Edge function error:", error);
          throw error;
        }

        toast.success("New AI insights and suggestions generated!");
        // Reload the AI content to display the new items
        await loadAIContent();
        setIsAnalyzing(false);
        return;
      } catch (edgeFunctionError) {
        console.error("Edge function failed, falling back to local AI:", edgeFunctionError);
        toast.warning("Advanced AI unavailable, using basic AI analysis");
        
        // Fallback to local AI implementation
        const studentData = await aiService.prepareStudentData(userId);
        
        if (!studentData) {
          toast.error("Could not retrieve sufficient data for analysis");
          setIsAnalyzing(false);
          return;
        }
        
        // Generate new insights and suggestions
        const insights = await aiService.generateInsights(studentData);
        const suggestions = await aiService.generateSuggestions(studentData);
        
        // Save to database
        const insightsSaved = await aiService.saveInsights(userId, insights);
        const suggestionsSaved = await aiService.saveSuggestions(userId, suggestions);
        
        if (insightsSaved && suggestionsSaved) {
          toast.success("New AI insights and suggestions generated!");
          // Reload the AI content to display the new items
          await loadAIContent();
        } else {
          toast.error("Some content could not be saved");
        }
      }
    } catch (error) {
      console.error("Error generating AI insights:", error);
      toast.error("Could not generate new insights at this time");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const markInsightAsRead = async (insightId: string) => {
    try {
      const { error } = await supabase
        .from('ai_insights')
        .update({ is_read: true })
        .eq('id', insightId);

      if (error) throw error;

      setInsights(prev => prev.filter(insight => insight.id !== insightId));
      toast.success("Insight marked as read");
    } catch (error) {
      console.error("Error marking insight as read:", error);
      toast.error("Could not update insight");
    }
  };

  const handleSuggestionAction = async (suggestionId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('suggestions')
        .update({ 
          status, 
          interaction_count: supabase.rpc('increment', { x: 1 }),
          updated_at: new Date().toISOString()
        })
        .eq('id', suggestionId);

      if (error) throw error;

      setSuggestions(prev => prev.filter(suggestion => suggestion.id !== suggestionId));
      
      if (status === 'completed') {
        toast.success("Great job on completing this task!", {
          description: "You're making good progress towards your goals",
        });
      } else {
        toast.info("Suggestion dismissed", {
          description: "We'll show more relevant suggestions next time",
        });
      }
    } catch (error) {
      console.error("Error updating suggestion:", error);
      toast.error("Could not update suggestion");
    }
  };

  const getTypeIcon = (type: string) => {
    const iconMap: Record<string, React.ReactNode> = {
      study_method: <BookOpen className="h-4 w-4" />,
      resource: <Brain className="h-4 w-4" />,
      improvement: <Target className="h-4 w-4" />,
      time_management: <Clock className="h-4 w-4" />
    };
    return iconMap[type] || <Sparkles className="h-4 w-4" />;
  };

  const getPriorityColor = (priority: string): string => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  const getProgressColorByScore = (score: number): string => {
    if (score >= 90) return '[&>div]:bg-green-500';
    if (score >= 80) return '[&>div]:bg-blue-500';
    if (score >= 70) return '[&>div]:bg-yellow-500';
    return '[&>div]:bg-red-500';
  };

  const getConfidenceColor = (score: number): string => {
    if (score >= 90) return 'text-green-600';
    if (score >= 80) return 'text-blue-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (isLoading) {
    return (
      <Card className="border-2 border-dashed border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Brain className="h-5 w-5 text-blue-600" />
            <span>Context-Aware AI Assistant</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-16 bg-blue-100 rounded-lg"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-2 border-dashed border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center space-x-2">
              <Sparkles className="h-5 w-5 text-blue-600" />
              <span>Context-Aware AI Assistant</span>
            </CardTitle>
            <CardDescription>
              Personalized guidance based on your performance and study patterns
            </CardDescription>
          </div>
          
          <Button 
            size="sm" 
            onClick={generateFreshInsights} 
            disabled={isAnalyzing}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh Analysis
              </>
            )}
          </Button>
        </div>
        
        {contextInfo && (
          <div className="mt-3 p-3 bg-white/70 rounded-lg shadow-sm">
            <div className="text-sm font-medium text-gray-700 mb-2">Context Profile</div>
            <div className="grid grid-cols-3 gap-2">
              <div className="text-center">
                <div className="text-lg font-semibold">{contextInfo.overallAverage.toFixed(1)}%</div>
                <div className="text-xs text-gray-500">Average Score</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold">{contextInfo.currentStreak}</div>
                <div className="text-xs text-gray-500">Day Streak</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold">{contextInfo.weeklyStudyHours.toFixed(1)}h</div>
                <div className="text-xs text-gray-500">Weekly Study</div>
              </div>
            </div>
            
            <div className="mt-2">
              <div className="flex justify-between text-xs text-gray-600 mb-1">
                <span>Performance by Subject</span>
              </div>
              <div className="space-y-2">
                {contextInfo.subjects.slice(0, 3).map((subject: any) => (
                  <div key={subject.id}>
                    <div className="flex justify-between text-xs mb-1">
                      <span>{subject.name}</span>
                      <span>{subject.averageScore.toFixed(1)}%</span>
                    </div>
                                         <Progress 
                       value={subject.averageScore} 
                       max={100} 
                       className={`h-2 ${getProgressColorByScore(subject.averageScore)}`}
                     />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        
        <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="mt-2">
          <TabsList className="grid grid-cols-2">
            <TabsTrigger value="suggestions">
              Suggestions
              {suggestions.length > 0 && (
                <Badge variant="outline" className="ml-2 bg-blue-50">
                  {suggestions.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="insights">
              Insights
              {insights.length > 0 && (
                <Badge variant="outline" className="ml-2 bg-blue-50">
                  {insights.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="suggestions">
            {suggestions.length === 0 ? (
              <div className="text-center py-8 space-y-3">
                <Sparkles className="h-8 w-8 text-blue-400 mx-auto" />
                <p className="text-blue-600 font-medium">No active suggestions</p>
                <p className="text-sm text-blue-500">Click "Refresh Analysis" to generate new suggestions</p>
              </div>
            ) : (
              <div className="space-y-3 mt-3">
                {suggestions.slice(0, 5).map((suggestion) => (
                  <Card key={suggestion.id} className={`border ${getPriorityColor(suggestion.priority)}`}>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="bg-white p-2 rounded-full">
                          {getTypeIcon(suggestion.type)}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium mb-1">{suggestion.title}</h4>
                          <p className="text-sm text-gray-700 mb-2">{suggestion.description}</p>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-xs">
                              {suggestion.subjects && (
                                <Badge variant="outline" style={{
                                  borderColor: suggestion.subjects.color || '#3B82F6',
                                  color: suggestion.subjects.color || '#3B82F6'
                                }}>
                                  {suggestion.subjects.name}
                                </Badge>
                              )}
                              {suggestion.estimated_time && (
                                <span className="text-gray-600 flex items-center">
                                  <Clock className="h-3 w-3 mr-1" />
                                  {suggestion.estimated_time}
                                </span>
                              )}
                              <span className={getConfidenceColor(suggestion.confidence_score)}>
                                {suggestion.confidence_score}% match
                              </span>
                            </div>
                            <div className="flex gap-2">
                              <Button 
                                size="sm" 
                                variant="ghost" 
                                onClick={() => handleSuggestionAction(suggestion.id, 'dismissed')}
                              >
                                Dismiss
                              </Button>
                              <Button 
                                size="sm"
                                onClick={() => handleSuggestionAction(suggestion.id, 'completed')}
                              >
                                <CheckCircle className="h-3.5 w-3.5 mr-1" />
                                Complete
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                
                {suggestions.length > 5 && (
                  <Button 
                    variant="outline" 
                    className="w-full border-dashed border-blue-200 hover:border-blue-300"
                  >
                    View More Suggestions 
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                )}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="insights">
            {insights.length === 0 ? (
              <div className="text-center py-8 space-y-3">
                <Brain className="h-8 w-8 text-blue-400 mx-auto" />
                <p className="text-blue-600 font-medium">No unread insights</p>
                <p className="text-sm text-blue-500">Click "Refresh Analysis" to generate new insights</p>
              </div>
            ) : (
              <div className="space-y-3 mt-3">
                {insights.map((insight) => (
                  <Card key={insight.id} className={`border ${getPriorityColor(insight.priority)}`}>
                    <CardContent className="p-4">
                      <div className="flex gap-3">
                        <div className="bg-white p-2 rounded-full">
                          {insight.insight_type === 'performance' ? (
                            <Target className="h-4 w-4" />
                          ) : insight.insight_type === 'recommendation' ? (
                            <BookOpen className="h-4 w-4" />
                          ) : insight.insight_type === 'study_pattern' ? (
                            <Clock className="h-4 w-4" />
                          ) : (
                            <Brain className="h-4 w-4" />
                          )}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium mb-1">{insight.title}</h4>
                          <p className="text-sm text-gray-700 mb-2">{insight.content}</p>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-xs">
                              {insight.subjects && (
                                <Badge variant="outline" style={{
                                  borderColor: insight.subjects.color || '#3B82F6',
                                  color: insight.subjects.color || '#3B82F6'
                                }}>
                                  {insight.subjects.name}
                                </Badge>
                              )}
                              <span className={getConfidenceColor(insight.confidence_score)}>
                                {insight.confidence_score}% confidence
                              </span>
                            </div>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => markInsightAsRead(insight.id)}
                            >
                              <CheckCircle className="h-3.5 w-3.5 mr-1" />
                              Got it
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardHeader>
      
      <CardFooter className="px-6 py-4 bg-white/40 flex justify-between items-center">
        <div className="flex items-center text-xs text-gray-600">
          <AlertCircle className="h-3.5 w-3.5 mr-1.5" />
          AI suggestions are based on your performance data
        </div>
        <Button 
          size="sm" 
          variant="ghost"
        >
          <span className="text-xs">Settings</span>
        </Button>
      </CardFooter>
    </Card>
  );
}import { supabase } from "@/lib/supabase";

