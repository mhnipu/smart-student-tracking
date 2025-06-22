"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Target, TrendingUp, AlertCircle, CheckCircle, X } from "lucide-react";

interface Suggestion {
  id: string;
  title: string;
  description: string;
  priority: string;
  type: string;
  subjects?: {
    name: string;
    color?: string;
  };
}

interface SuggestionCardProps {
  suggestion: Suggestion;
  onAction: (id: string, status: string) => void;
}

export function SuggestionCard({ suggestion, onAction }: SuggestionCardProps) {
  const getIcon = (type: string) => {
    switch (type) {
      case "study_method":
        return <BookOpen className="h-4 w-4" />;
      case "resource":
        return <Target className="h-4 w-4" />;
      case "practice":
        return <TrendingUp className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800";
      case "medium":
        return "bg-yellow-100 text-yellow-800";
      case "low":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-2">
            <div className="bg-blue-100 rounded-lg p-2">
              {getIcon(suggestion.type)}
            </div>
            <div>
              <CardTitle className="text-lg">{suggestion.title}</CardTitle>
              {suggestion.subjects && (
                <CardDescription className="text-sm text-gray-500">
                  {suggestion.subjects.name}
                </CardDescription>
              )}
            </div>
          </div>
          <Badge className={`text-xs ${getPriorityColor(suggestion.priority)}`}>
            {suggestion.priority} priority
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-gray-600">{suggestion.description}</p>
        
        <div className="flex items-center justify-between">
          <Badge variant="outline" className="text-xs">
            {suggestion.type.replace('_', ' ')}
          </Badge>
          
          <div className="flex space-x-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => onAction(suggestion.id, "dismissed")}
              className="text-xs"
            >
              <X className="h-3 w-3 mr-1" />
              Dismiss
            </Button>
            <Button
              size="sm"
              onClick={() => onAction(suggestion.id, "completed")}
              className="text-xs bg-green-600 hover:bg-green-700"
            >
              <CheckCircle className="h-3 w-3 mr-1" />
              Complete
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}