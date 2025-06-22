"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from '@/lib/supabase';
import { toast } from "sonner";

interface Subject {
  id: string;
  name: string;
  code: string;
}

interface AddMarkDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function AddMarkDialog({ open, onOpenChange, onSuccess }: AddMarkDialogProps) {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    score: "",
    maxScore: "",
    testType: "",
    testName: "",
    date: "",
    subjectId: "",
    semester: "",
  });

  useEffect(() => {
    if (open) {
      loadSubjects();
      // Set default date to today
      const today = new Date().toISOString().split('T')[0];
      setFormData(prev => ({ ...prev, date: today }));
    }
  }, [open]);

  const loadSubjects = async () => {
    try {
      const { data: subjects, error } = await supabase
        .from('subjects')
        .select('*')
        .order('name', { ascending: true });

      if (error) {
        console.error("Error loading subjects:", error);
        toast.error("Failed to load subjects");
        return;
      }

      setSubjects(subjects || []);
    } catch (error) {
      console.error("Error loading subjects:", error);
      toast.error("Failed to load subjects");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.score || !formData.maxScore || !formData.testType || !formData.testName || !formData.date || !formData.subjectId) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsLoading(true);

    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        toast.error("Authentication required");
        return;
      }

      const { error } = await supabase
        .from('marks')
        .insert({
          score: parseFloat(formData.score),
          max_score: parseFloat(formData.maxScore),
          test_type: formData.testType,
          test_name: formData.testName,
          date: formData.date,
          subject_id: formData.subjectId,
          user_id: user.id,
          semester: formData.semester || null,
        });

      if (error) {
        console.error("Error adding mark:", error);
        toast.error("Failed to add mark");
        return;
      }

      toast.success("Mark added successfully!");
      onSuccess();
      onOpenChange(false);
      setFormData({
        score: "",
        maxScore: "",
        testType: "",
        testName: "",
        date: "",
        subjectId: "",
        semester: "",
      });
    } catch (error) {
      console.error("Error adding mark:", error);
      toast.error("Failed to add mark");
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Assessment</DialogTitle>
          <DialogDescription>
            Record a new test, quiz, assignment, or project grade.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="score">Score *</Label>
              <Input
                id="score"
                type="number"
                step="0.1"
                min="0"
                value={formData.score}
                onChange={(e) => handleInputChange("score", e.target.value)}
                placeholder="85"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="maxScore">Max Score *</Label>
              <Input
                id="maxScore"
                type="number"
                step="0.1"
                min="1"
                value={formData.maxScore}
                onChange={(e) => handleInputChange("maxScore", e.target.value)}
                placeholder="100"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="testName">Assessment Name *</Label>
            <Input
              id="testName"
              value={formData.testName}
              onChange={(e) => handleInputChange("testName", e.target.value)}
              placeholder="e.g., Midterm Exam, Quiz 1, Final Project"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Test Type *</Label>
              <Select value={formData.testType} onValueChange={(value) => handleInputChange("testType", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="quiz">Quiz</SelectItem>
                  <SelectItem value="exam">Exam</SelectItem>
                  <SelectItem value="assignment">Assignment</SelectItem>
                  <SelectItem value="project">Project</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="date">Date *</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => handleInputChange("date", e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Subject *</Label>
            <Select value={formData.subjectId} onValueChange={(value) => handleInputChange("subjectId", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select subject" />
              </SelectTrigger>
              <SelectContent>
                {subjects.map((subject) => (
                  <SelectItem key={subject.id} value={subject.id}>
                    {subject.name} ({subject.code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="semester">Semester (Optional)</Label>
            <Input
              id="semester"
              value={formData.semester}
              onChange={(e) => handleInputChange("semester", e.target.value)}
              placeholder="e.g., Fall 2024, Spring 2025"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Adding..." : "Add Mark"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}