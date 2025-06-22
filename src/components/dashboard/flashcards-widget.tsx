import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Plus, RotateCcw, Star, Brain, Edit, Trash2, ArrowLeft } from "lucide-react";
import { supabase } from '@/lib/supabase';
import { toast } from "sonner";
import { FlashcardDialog } from './flashcard-dialog';
import { cn } from "@/lib/utils";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

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
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [newCard, setNewCard] = useState({
    front_text: "",
    back_text: ""
  });

  const [showDialog, setShowDialog] = useState(false);
  const [editingCard, setEditingCard] = useState<Flashcard | undefined>(undefined);
  const [showAlert, setShowAlert] = useState(false);
  const [cardToDelete, setCardToDelete] = useState<string | null>(null);

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
      toast.error("No flashcards to review!");
      return;
    }
    setCurrentCardIndex(0);
    setIsFlipped(false);
    setIsReviewing(true);
  };

  const handleNextCard = (correct: boolean) => {
    // Logic to update card stats
    // ...
    setIsFlipped(false);
    setTimeout(() => {
        if (currentCardIndex < flashcards.length - 1) {
            setCurrentCardIndex(currentCardIndex + 1);
        } else {
            setIsReviewing(false);
            toast.success("Review session complete! 🎉");
            loadFlashcards();
        }
    }, 200); // Allow flip back animation to be seen
  };

  const currentCard = isReviewing ? flashcards[currentCardIndex] : null;

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

  const handleDeleteClick = (cardId: string) => {
    setCardToDelete(cardId);
    setShowAlert(true);
  };

  const deleteFlashcard = async () => {
    if (!cardToDelete) return;

    try {
      const { error } = await supabase.from("flashcards").delete().eq("id", cardToDelete);
      if (error) throw error;
      toast.success("Flashcard deleted!");
      loadFlashcards();
    } catch (error) {
      toast.error("Failed to delete flashcard.");
    } finally {
      setShowAlert(false);
      setCardToDelete(null);
    }
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
      <Card className="flex flex-col">
        <CardHeader>
          <Button variant="ghost" size="sm" onClick={() => setIsReviewing(false)} className="self-start">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to List
          </Button>
        </CardHeader>
        <CardContent className="flex-grow flex flex-col items-center justify-center space-y-4">
            <div className="w-full max-w-sm h-64 perspective-1000">
                <div
                    className={cn(
                        "relative w-full h-full transform-style-preserve-3d transition-transform duration-500",
                        isFlipped ? "rotate-y-180" : ""
                    )}
                    onClick={() => setIsFlipped(!isFlipped)}
                >
                    {/* Front of card */}
                    <div className="absolute w-full h-full backface-hidden flex items-center justify-center p-6 rounded-xl bg-white dark:bg-gray-800 shadow-lg border">
                        <p className="text-xl text-center font-semibold">{currentCard.front_text}</p>
                    </div>
                    {/* Back of card */}
                    <div className="absolute w-full h-full backface-hidden rotate-y-180 flex items-center justify-center p-6 rounded-xl bg-blue-100 dark:bg-blue-900/50 shadow-lg border">
                         <p className="text-xl text-center font-semibold">{currentCard.back_text}</p>
                    </div>
                </div>
            </div>
            
            <div className="flex space-x-4">
              <Button onClick={() => handleNextCard(false)} variant="outline" className="w-32">Incorrect</Button>
              <Button onClick={() => handleNextCard(true)} className="w-32">Correct</Button>
            </div>
             <p className="text-sm text-gray-500">Card {currentCardIndex + 1} of {flashcards.length}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
       <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <BookOpen className="h-5 w-5 text-green-600" />
              <span>Flashcards</span>
            </CardTitle>
            <div className="flex gap-2">
                 <Button size="sm" variant="outline" onClick={startReview} disabled={flashcards.length === 0}>
                    <Brain className="h-4 w-4 mr-2" />
                    Review
                </Button>
                <Button size="sm" onClick={() => { setEditingCard(undefined); setShowDialog(true); }}>
                    <Plus className="h-4 w-4 mr-2" />
                    New Card
                </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
            {flashcards.length > 0 ? (
                <ul className="space-y-2">
                    {flashcards.map(card => (
                        <li key={card.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
                            <p className="font-medium">{card.front_text}</p>
                            <div>
                                <Button variant="ghost" size="icon" onClick={() => { setEditingCard(card); setShowDialog(true); }}>
                                    <Edit className="h-4 w-4" />
                                </Button>
                                 <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="text-red-500"
                                    onClick={() => handleDeleteClick(card.id)}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        </li>
                    ))}
                </ul>
            ) : (
                <div className="text-center py-8">
                    <p className="text-gray-500">You have no flashcards yet.</p>
                </div>
            )}
        </CardContent>
      <FlashcardDialog
        open={showDialog}
        onOpenChange={setShowDialog}
        onSuccess={loadFlashcards}
        userId={userId}
        flashcard={editingCard}
      />
      <AlertDialog open={showAlert} onOpenChange={setShowAlert}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                    This will permanently delete this flashcard. This action cannot be undone.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={deleteFlashcard}>Delete</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}