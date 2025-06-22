import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Brain, TrendingUp, AlertCircle, CheckCircle, X, Lightbulb, Loader2, Sparkles } from "lucide-react";
import { supabase } from '@/lib/supabase';
import { toast } from "sonner";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

interface AIInsight {
  id: string;
  insight_type: string;
  title: string;
  content: string;
  confidence_score: number;
  priority: string;
  is_read: boolean;
  created_at: string;
  subjects?: {
    name: string;
    color?: string;
  };
}

interface AIInsightsWidgetProps {
  userId: string;
}

export function AIInsightsWidget({ userId }: AIInsightsWidgetProps) {
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    loadInsights();
  }, [userId]);

  const loadInsights = async () => {
    try {
      const { data, error } = await supabase
        .from('ai_insights')
        .select(`
          *,
          subjects (
            name,
            color
          )
        `)
        .eq('user_id', userId)
        .eq('is_read', false)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) {
        console.error("Error loading AI insights:", error);
        return;
      }

      setInsights(data || []);
    } catch (error) {
      console.error("Error loading AI insights:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const markAsRead = async (insightId: string) => {
    try {
      const { error } = await supabase
        .from('ai_insights')
        .update({ is_read: true })
        .eq('id', insightId);

      if (error) {
        console.error("Error marking insight as read:", error);
        return;
      }

      setInsights(prev => prev.filter(insight => insight.id !== insightId));
    } catch (error) {
      console.error("Error marking insight as read:", error);
    }
  };

  const generateNewInsights = async () => {
    setIsGenerating(true);
    toast.info("Requesting new insights from AI... This may take a moment.");

    try {
      const { error } = await supabase.functions.invoke('generate-insights', {
        body: { userId },
      });

      if (error) throw error;

      toast.success("New insights generated! Refreshing...");
      loadInsights();
    } catch (error) {
      toast.error(`Failed to generate insights: ${error.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'performance': return <TrendingUp className="h-4 w-4" />;
      case 'recommendation': return <Lightbulb className="h-4 w-4" />;
      case 'prediction': return <Brain className="h-4 w-4" />;
      default: return <AlertCircle className="h-4 w-4" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getConfidenceColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (isLoading) {
    return (
      <Card className="border-2 border-dashed border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Brain className="h-5 w-5 text-blue-600" />
            <span>AI Insights</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2].map((i) => (
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
              <Brain className="h-5 w-5 text-blue-600" />
              <span>AI Insights</span>
            </CardTitle>
            <CardDescription>Personalized recommendations powered by AI</CardDescription>
          </div>
          <Badge className="bg-blue-100 text-blue-800">
            {insights.length} new
          </Badge>
        </div>
        <Button size="sm" onClick={generateNewInsights} disabled={isGenerating}>
          {isGenerating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
          Generate
        </Button>
      </CardHeader>
      <CardContent>
        {insights.length === 0 ? (
          <div className="text-center py-8 space-y-3">
            <Brain className="h-8 w-8 text-blue-400 mx-auto" />
            <p className="text-blue-600 font-medium">All caught up!</p>
            <p className="text-sm text-blue-500">New insights will appear as you add more data</p>
          </div>
        ) : (
          <Accordion type="single" collapsible className="w-full space-y-3">
            {insights.map((insight) => (
              <AccordionItem key={insight.id} value={insight.id} className={`border rounded-lg ${getPriorityColor(insight.priority)}`}>
                 <AccordionTrigger className="p-4 hover:no-underline">
                   <div className="flex-1 text-left">
                     <div className="flex items-center space-x-2 mb-1">
                        <div className="bg-white rounded-lg p-1.5 shadow-sm">
                           {getInsightIcon(insight.insight_type)}
                        </div>
                        <h4 className="font-semibold text-gray-900">{insight.title}</h4>
                      </div>
                   </div>
                 </AccordionTrigger>
                 <AccordionContent className="p-4 pt-0">
                    <p className="text-sm text-gray-700 mb-3">{insight.content}</p>
                    <div className="flex items-center justify-between">
                         <div className="flex items-center space-x-3 text-xs">
                          <span className={`font-medium ${getConfidenceColor(insight.confidence_score)}`}>
                            {insight.confidence_score}% confidence
                          </span>
                           {insight.subjects && (
                             <Badge variant="outline" style={{
                               borderColor: insight.subjects.color,
                               color: insight.subjects.color,
                             }}>
                               {insight.subjects.name}
                             </Badge>
                           )}
                        </div>
                        <Button
                          size="sm"
                          onClick={() => markAsRead(insight.id)}
                          className="bg-white text-gray-700 hover:bg-gray-50 border"
                        >
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Got it
                        </Button>
                    </div>
                 </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}
      </CardContent>
    </Card>
  );
}