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
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"
import { useState } from "react"

const subjectSchema = z.object({
  name: z.string().min(2, { message: "Subject name must be at least 2 characters." }),
  code: z.string().min(2, { message: "Subject code must be at least 2 characters." }),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, { message: "Must be a valid hex color code." }),
})

interface AddSubjectDialogProps {
  userId: string;
  onSubjectAdded: () => void;
  children: React.ReactNode;
}

export function AddSubjectDialog({ userId, onSubjectAdded, children }: AddSubjectDialogProps) {
  const [isOpen, setIsOpen] = useState(false)

  const form = useForm<z.infer<typeof subjectSchema>>({
    resolver: zodResolver(subjectSchema),
    defaultValues: {
      name: "",
      code: "",
      color: "#3b82f6",
    },
  })

  async function onSubmit(values: z.infer<typeof subjectSchema>) {
    const { data, error } = await supabase
      .from("subjects")
      .insert([{ ...values, user_id: userId }])
      .select()

    if (error) {
      toast.error("Failed to add subject. Please try again.")
      console.error(error)
    } else {
      toast.success("Subject added successfully!")
      onSubjectAdded()
      setIsOpen(false)
      form.reset()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Subject</DialogTitle>
          <DialogDescription>
            Enter the details for your new subject. Click save when you're done.
          </DialogDescription>
        </DialogHeader>
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
            <DialogFooter>
              <Button type="submit">Save changes</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
} 