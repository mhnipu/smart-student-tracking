import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";

const flashcardSchema = z.object({
  front_text: z.string().min(1, "Front text cannot be empty."),
  back_text: z.string().min(1, "Back text cannot be empty."),
});

type FlashcardFormValues = z.infer<typeof flashcardSchema>;

interface FlashcardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  userId: string;
  flashcard?: FlashcardFormValues & { id: string };
}

export function FlashcardDialog({ open, onOpenChange, onSuccess, userId, flashcard }: FlashcardDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FlashcardFormValues>({
    resolver: zodResolver(flashcardSchema),
    defaultValues: flashcard || { front_text: "", back_text: "" },
  });

  useEffect(() => {
    form.reset(flashcard || { front_text: "", back_text: "" });
  }, [flashcard, form]);

  const onSubmit = async (values: FlashcardFormValues) => {
    setIsSubmitting(true);
    try {
      const cardData = {
        ...values,
        user_id: userId,
      };

      const { error } = flashcard
        ? await supabase.from("flashcards").update(cardData).eq("id", flashcard.id)
        : await supabase.from("flashcards").insert(cardData);

      if (error) throw error;

      toast.success(flashcard ? "Flashcard updated!" : "Flashcard created!");
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      toast.error(`Error: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{flashcard ? "Edit Flashcard" : "Create Flashcard"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="front_text"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Front</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Enter the question or term..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="back_text"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Back</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Enter the answer or definition..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {flashcard ? "Save Changes" : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
} 