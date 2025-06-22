import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Plus, RotateCcw, Star, Brain } from "lucide-react";
import { supabase } from '@/lib/supabase';
import { toast } from "sonner";

interface Flashcard {
  id: string;
  front_text: string;
  back_text: string;
  difficulty_rating: number;
  review_count: number;
  success_rate: number;
  is_favorite: boolean;
  subjects?: {
    name: string;
    color?: string;
  };
}

interface FlashcardsWidgetProps {
  userId: string;
}

export function FlashcardsWidget({ userId }: FlashcardsWidgetProps) {
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [isReviewing, setIsReviewing] = useState(false);
  const [currentCard, setCurrentCard] = useState<Flashcard | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [newCard, setNewCard] = useState({
    front_text: "",
    back_text: ""
  });

  useEffect(() => {
    loadFlashcards();
  }, [userId]);

  const loadFlashcards = async () => {
    try {
      const { data, error } = await supabase
        .from('flashcards')
        .select(`
          *,
          subjects (
            name,
            color
          )
        `)
        .eq('user_id', userId)
        .order('last_reviewed', { ascending: true, nullsFirst: true })
        .limit(10);

      if (error) {
        console.error("Error loading flashcards:", error);
        return;
      }

      setFlashcards(data || []);
    } catch (error) {
      console.error("Error loading flashcards:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const createFlashcard = async () => {
    if (!newCard.front_text.trim() || !newCard.back_text.trim()) {
      toast.error("Please fill in both front and back text");
      return;
    }

    try {
      const { error } = await supabase
        .from('flashcards')
        .insert({
          front_text: newCard.front_text,
          back_text: newCard.back_text,
          user_id: userId
        });

      if (error) {
        console.error("Error creating flashcard:", error);
        toast.error("Failed to create flashcard");
        return;
      }

      setNewCard({ front_text: "", back_text: "" });
      setIsCreating(false);
      loadFlashcards();
      toast.success("Flashcard created successfully!");
    } catch (error) {
      console.error("Error creating flashcard:", error);
      toast.error("Failed to create flashcard");
    }
  };

  const startReview = () => {
    if (flashcards.length === 0) {
      toast.error("No flashcards available for review");
      return;
    }
    setCurrentCard(flashcards[0]);
    setIsReviewing(true);
    setShowAnswer(false);
  };

  const reviewCard = async (correct: boolean) => {
    if (!currentCard) return;

    try {
      const newSuccessRate = correct 
        ? Math.min(currentCard.success_rate + 10, 100)
        : Math.max(currentCard.success_rate - 10, 0);

      const { error } = await supabase
        .from('flashcards')
        .update({
          last_reviewed: new Date().toISOString(),
          review_count: currentCard.review_count + 1,
          success_rate: newSuccessRate
        })
        .eq('id', currentCard.id);

      if (error) {
        console.error("Error updating flashcard:", error);
        return;
      }

      // Move to next card or end review
      const currentIndex = flashcards.findIndex(card => card.id === currentCard.id);
      if (currentIndex < flashcards.length - 1) {
        setCurrentCard(flashcards[currentIndex + 1]);
        setShowAnswer(false);
      } else {
        setIsReviewing(false);
        setCurrentCard(null);
        toast.success("Review session completed!");
        loadFlashcards();
      }
    } catch (error) {
      console.error("Error reviewing flashcard:", error);
    }
  };

  const getDifficultyColor = (rating: number) => {
    if (rating <= 2) return 'bg-green-100 text-green-800';
    if (rating <= 3) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  const getSuccessRateColor = (rate: number) => {
    if (rate >= 80) return 'text-green-600';
    if (rate >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (isLoading) {
    return (
      <Card className="border-2 border-dashed border-green-200 bg-gradient-to-br from-green-50 to-emerald-50">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <BookOpen className="h-5 w-5 text-green-600" />
            <span>Flashcards</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse">
            <div className="h-32 bg-green-100 rounded-lg"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isReviewing && currentCard) {
    return (
      <Card className="border-2 border-dashed border-green-200 bg-gradient-to-br from-green-50 to-emerald-50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <Brain className="h-5 w-5 text-green-600" />
              <span>Review Mode</span>
            </CardTitle>
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => setIsReviewing(false)}
            >
              Exit Review
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-white rounded-lg p-6 min-h-[200px] flex items-center justify-center border-2 border-green-200">
            <div className="text-center space-y-4">
              <div className="text-lg font-medium text-gray-900">
                {showAnswer ? currentCard.back_text : currentCard.front_text}
              </div>
              {!showAnswer && (
                <Button 
                  onClick={() => setShowAnswer(true)}
                  className="bg-green-600 hover:bg-green-700"
                >
                  Show Answer
                </Button>
              )}
            </div>
          </div>
          
          {showAnswer && (
            <div className="flex space-x-3">
              <Button 
                onClick={() => reviewCard(false)}
                variant="outline"
                className="flex-1 border-red-300 text-red-700 hover:bg-red-50"
              >
                Incorrect
              </Button>
              <Button 
                onClick={() => reviewCard(true)}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                Correct
              </Button>
            </div>
          )}
          
          <div className="text-center text-sm text-gray-500">
            Card {flashcards.findIndex(card => card.id === currentCard.id) + 1} of {flashcards.length}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-2 border-dashed border-green-200 bg-gradient-to-br from-green-50 to-emerald-50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center space-x-2">
              <BookOpen className="h-5 w-5 text-green-600" />
              <span>Flashcards</span>
            </CardTitle>
            <CardDescription>Active recall learning with spaced repetition</CardDescription>
          </div>
          <div className="flex space-x-2">
            <Button 
              size="sm" 
              variant="outline"
              onClick={startReview}
              disabled={flashcards.length === 0}
              className="border-green-300 text-green-700 hover:bg-green-100"
            >
              <RotateCcw className="h-4 w-4 mr-1" />
              Review
            </Button>
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => setIsCreating(!isCreating)}
              className="border-green-300 text-green-700 hover:bg-green-100"
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Card
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Create Card Form */}
        {isCreating && (
          <div className="border border-green-200 rounded-lg p-4 space-y-3 bg-white">
            <Textarea
              placeholder="Front of card (question/prompt)..."
              value={newCard.front_text}
              onChange={(e) => setNewCard(prev => ({ ...prev, front_text: e.target.value }))}
              rows={2}
            />
            <Textarea
              placeholder="Back of card (answer/explanation)..."
              value={newCard.back_text}
              onChange={(e) => setNewCard(prev => ({ ...prev, back_text: e.target.value }))}
              rows={2}
            />
            <div className="flex space-x-2">
              <Button size="sm" onClick={createFlashcard} className="bg-green-600 hover:bg-green-700">
                Create Card
              </Button>
              <Button size="sm" variant="outline" onClick={() => setIsCreating(false)}>
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Cards List */}
        {flashcards.length === 0 ? (
          <div className="text-center py-8 space-y-3">
            <BookOpen className="h-8 w-8 text-green-400 mx-auto" />
            <p className="text-green-600 font-medium">No flashcards yet</p>
            <p className="text-sm text-green-500">Create your first flashcard to start learning!</p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm text-green-700">
              <span>{flashcards.length} cards available</span>
              <span>Ready for review</span>
            </div>
            {flashcards.slice(0, 3).map((card) => (
              <div
                key={card.id}
                className="border border-green-200 rounded-lg p-3 space-y-2 bg-white hover:shadow-sm transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 line-clamp-2">
                      {card.front_text}
                    </p>
                    <div className="flex items-center space-x-3 mt-2 text-xs text-gray-500">
                      <span>Reviewed {card.review_count} times</span>
                      <span className={getSuccessRateColor(card.success_rate)}>
                        {card.success_rate}% success
                      </span>
                      <Badge className={`text-xs ${getDifficultyColor(card.difficulty_rating)}`}>
                        Level {card.difficulty_rating}
                      </Badge>
                    </div>
                  </div>
                  {card.is_favorite && (
                    <Star className="h-4 w-4 text-yellow-500 fill-current" />
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}