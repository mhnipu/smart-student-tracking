import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"
import { useState, useEffect } from "react"

const subjectSchema = z.object({
  name: z.string().min(2, { message: "Subject name must be at least 2 characters." }),
  code: z.string().min(2, { message: "Subject code must be at least 2 characters." }),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, { message: "Must be a valid hex color code." }),
  description: z.string().optional(),
  category: z.string().optional(),
})

interface Subject {
  id: string;
  name: string;
  code: string;
  color?: string;
  description?: string;
  category?: string;
}

interface EditSubjectDialogProps {
  userId: string;
  subjectId: string;
  onSubjectUpdated: () => void;
  children: React.ReactNode;
}

export function EditSubjectDialog({ userId, subjectId, onSubjectUpdated, children }: EditSubjectDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [subject, setSubject] = useState<Subject | null>(null)

  const form = useForm<z.infer<typeof subjectSchema>>({
    resolver: zodResolver(subjectSchema),
    defaultValues: {
      name: "",
      code: "",
      color: "#3b82f6",
      description: "",
      category: "",
    },
  })

  useEffect(() => {
    if (isOpen && subjectId) {
      loadSubjectData();
    }
  }, [isOpen, subjectId]);

  const loadSubjectData = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("subjects")
        .select("*")
        .eq("id", subjectId)
        .single();
      
      if (error) {
        toast.error("Failed to load subject data");
        console.error(error);
        return;
      }
      
      if (data) {
        setSubject(data);
        form.reset({
          name: data.name || "",
          code: data.code || "",
          color: data.color || "#3b82f6",
          description: data.description || "",
          category: data.category || "",
        });
      }
    } catch (error) {
      console.error("Error loading subject:", error);
      toast.error("Failed to load subject data");
    } finally {
      setLoading(false);
    }
  };

  async function onSubmit(values: z.infer<typeof subjectSchema>) {
    setLoading(true);
    try {
      const { error } = await supabase
        .from("subjects")
        .update({ ...values })
        .eq("id", subjectId);

      if (error) {
        toast.error("Failed to update subject. Please try again.");
        console.error(error);
      } else {
        toast.success("Subject updated successfully!");
        onSubjectUpdated();
        setIsOpen(false);
      }
    } catch (error) {
      console.error("Error updating subject:", error);
      toast.error("Failed to update subject");
    } finally {
      setLoading(false);
    }
  }

  const categories = [
    { value: "STEM", label: "STEM" },
    { value: "Language Arts", label: "Language Arts" },
    { value: "Social Studies", label: "Social Studies" },
    { value: "Creative Arts", label: "Creative Arts" },
    { value: "Health & Fitness", label: "Health & Fitness" },
    { value: "Business", label: "Business" },
    { value: "Others", label: "Others" },
  ]

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Subject</DialogTitle>
          <DialogDescription>
            Update the details for your subject. Click save when you're done.
          </DialogDescription>
        </DialogHeader>
        
        {loading ? (
          <div className="flex justify-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Subject Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Computer Science" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Subject Code</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., CS101" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="color"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Color</FormLabel>
                    <FormControl>
                      <div className="flex items-center gap-2">
                        <Input type="color" className="w-12 h-10 p-1" {...field} />
                        <Input
                          type="text"
                          placeholder="#3b82f6"
                          className="flex-1"
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category.value} value={category.value}>
                            {category.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Add a short description about this subject"
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="submit" disabled={loading}>
                  {loading ? "Saving..." : "Save changes"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  )
} 