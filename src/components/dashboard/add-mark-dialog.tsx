import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from '@/lib/supabase';
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Sparkles, Trophy, BookOpen } from "lucide-react";

interface Subject {
  id: string;
  name: string;
  code: string;
  color?: string;
}

interface AddMarkDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  userId: string;
}

export function AddMarkDialog({ open, onOpenChange, onSuccess, userId }: AddMarkDialogProps) {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("manual");
  const [percentage, setPercentage] = useState(0);
  const [formData, setFormData] = useState({
    score: "",
    maxScore: "100",
    testType: "",
    testName: "",
    date: "",
    subjectId: "",
    semester: "",
  });
  const [recentTests, setRecentTests] = useState<any[]>([]);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open) {
      loadSubjects();
      loadRecentTests();
      // Set default date to today
      const today = new Date().toISOString().split('T')[0];
      setFormData(prev => ({ ...prev, date: today }));
    }
  }, [open]);

  useEffect(() => {
    // Calculate percentage when score or maxScore changes
    if (formData.score && formData.maxScore) {
      const score = parseFloat(formData.score);
      const maxScore = parseFloat(formData.maxScore);
      if (!isNaN(score) && !isNaN(maxScore) && maxScore > 0) {
        setPercentage((score / maxScore) * 100);
      } else {
        setPercentage(0);
      }
    } else {
      setPercentage(0);
    }
  }, [formData.score, formData.maxScore]);

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

  const loadRecentTests = async () => {
    try {
      if (!userId) {
        console.error("User not authenticated");
        return;
      }

      const { data, error } = await supabase
        .from('marks')
        .select(`
          test_name,
          test_type,
          subject_id,
          subjects(name, code)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) {
        console.error("Error loading recent tests:", error);
        return;
      }

      setRecentTests(data || []);
    } catch (error) {
      console.error("Error loading recent tests:", error);
    }
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    
    if (!formData.score) errors.score = "Score is required";
    else if (isNaN(parseFloat(formData.score))) errors.score = "Score must be a number";
    else if (parseFloat(formData.score) < 0) errors.score = "Score cannot be negative";
    
    if (!formData.maxScore) errors.maxScore = "Max score is required";
    else if (isNaN(parseFloat(formData.maxScore))) errors.maxScore = "Max score must be a number";
    else if (parseFloat(formData.maxScore) <= 0) errors.maxScore = "Max score must be positive";
    
    if (parseFloat(formData.score) > parseFloat(formData.maxScore)) {
      errors.score = "Score cannot exceed max score";
    }
    
    if (!formData.testName) errors.testName = "Assessment name is required";
    if (!formData.testType) errors.testType = "Test type is required";
    if (!formData.date) errors.date = "Date is required";
    if (!formData.subjectId) errors.subjectId = "Subject is required";
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error("Please correct the errors in the form");
      return;
    }

    setIsLoading(true);

    try {
      if (!userId) {
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
          user_id: userId,
          semester: formData.semester || null,
        });

      if (error) {
        console.error("Error adding mark:", error);
        toast.error("Failed to add mark");
        return;
      }

      toast.success("Mark added successfully!", {
        description: `${formData.testName} - ${percentage.toFixed(1)}%`,
        icon: percentage >= 80 ? <Trophy className="h-5 w-5 text-yellow-500" /> : <Sparkles className="h-5 w-5" />,
      });
      
      onSuccess();
      onOpenChange(false);
      setFormData({
        score: "",
        maxScore: "100",
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
    
    // Clear error for this field when user types
    if (formErrors[field]) {
      setFormErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const applyRecentTest = (test: any) => {
    setFormData(prev => ({
      ...prev,
      testName: test.test_name,
      testType: test.test_type?.toLowerCase() || '',
      subjectId: test.subject_id,
    }));
  };

  const getGradeColor = (percentage: number) => {
    if (percentage >= 90) return "bg-green-500";
    if (percentage >= 80) return "bg-blue-500";
    if (percentage >= 70) return "bg-yellow-500";
    if (percentage >= 60) return "bg-orange-500";
    return "bg-red-500";
  };

  const getGradeLetter = (percentage: number) => {
    if (percentage >= 90) return "A";
    if (percentage >= 80) return "B";
    if (percentage >= 70) return "C";
    if (percentage >= 60) return "D";
    return "F";
  };

  const getGradeMessage = (percentage: number) => {
    if (percentage >= 90) return "Excellent!";
    if (percentage >= 80) return "Very good!";
    if (percentage >= 70) return "Good job";
    if (percentage >= 60) return "Satisfactory";
    if (percentage > 0) return "Needs improvement";
    return "";
  };

  const selectedSubject = subjects.find(s => s.id === formData.subjectId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Trophy className="h-6 w-6 text-yellow-500" />
              <span>Add New Assessment</span>
            </DialogTitle>
            <DialogDescription>
              Enter the details of a past test, exam, or assignment to track your progress.
            </DialogDescription>
          </DialogHeader>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="manual">Manual Entry</TabsTrigger>
              <TabsTrigger value="templates">Use a Template</TabsTrigger>
            </TabsList>
            <TabsContent value="manual" className="mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Left Column: Main Details */}
                <div className="space-y-6">
                  <div>
                    <Label htmlFor="testName" className="text-base">Assessment Name</Label>
                    <Input
                      id="testName"
                      value={formData.testName}
                      onChange={(e) => handleInputChange("testName", e.target.value)}
                      placeholder="e.g., Midterm Exam, Chapter 5 Quiz"
                      className={cn("text-lg p-4", formErrors.testName && "border-red-500")}
                    />
                    {formErrors.testName && <p className="text-red-500 text-sm mt-1">{formErrors.testName}</p>}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="testType">Type</Label>
                      <Select value={formData.testType} onValueChange={(value) => handleInputChange("testType", value)}>
                        <SelectTrigger className={cn(formErrors.testType && "border-red-500")}>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="quiz">Quiz</SelectItem>
                          <SelectItem value="exam">Exam</SelectItem>
                          <SelectItem value="assignment">Assignment</SelectItem>
                          <SelectItem value="project">Project</SelectItem>
                        </SelectContent>
                      </Select>
                      {formErrors.testType && <p className="text-red-500 text-sm mt-1">{formErrors.testType}</p>}
                    </div>
                    <div>
                      <Label htmlFor="subjectId">Subject</Label>
                      <Select value={formData.subjectId} onValueChange={(value) => handleInputChange("subjectId", value)}>
                        <SelectTrigger className={cn(formErrors.subjectId && "border-red-500")}>
                          <SelectValue placeholder="Select subject" />
                        </SelectTrigger>
                        <SelectContent>
                          {subjects.map((subject) => (
                            <SelectItem key={subject.id} value={subject.id}>
                              <div className="flex items-center">
                                <span className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: subject.color || '#ccc' }}></span>
                                {subject.name}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {formErrors.subjectId && <p className="text-red-500 text-sm mt-1">{formErrors.subjectId}</p>}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="date">Date</Label>
                      <Input
                        id="date"
                        type="date"
                        value={formData.date}
                        onChange={(e) => handleInputChange("date", e.target.value)}
                        className={cn(formErrors.date && "border-red-500")}
                      />
                      {formErrors.date && <p className="text-red-500 text-sm mt-1">{formErrors.date}</p>}
                    </div>
                    <div>
                      <Label htmlFor="semester">Semester <span className="text-gray-500">(Optional)</span></Label>
                      <Input
                        id="semester"
                        value={formData.semester}
                        onChange={(e) => handleInputChange("semester", e.target.value)}
                        placeholder="e.g., Fall 2024"
                      />
                    </div>
                  </div>
                </div>

                {/* Right Column: Score & Grade */}
                <div className="space-y-4 bg-gray-50 dark:bg-gray-800 p-6 rounded-lg border">
                  <div className="text-center">
                    <Label className="text-sm font-medium text-gray-500">YOUR GRADE</Label>
                    <div className={cn("text-7xl font-bold mt-2", getGradeColor(percentage).replace('bg-', 'text-'))}>
                      {getGradeLetter(percentage)}
                    </div>
                    <p className="text-gray-600 dark:text-gray-400 font-medium">{getGradeMessage(percentage)}</p>
                  </div>
                  
                  <div className="pt-4 space-y-2">
                    <Label>Score Percentage: {percentage.toFixed(1)}%</Label>
                    <Progress value={percentage} className={cn("w-full h-3", getGradeColor(percentage))} />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 pt-4">
                    <div>
                      <Label htmlFor="score">Your Score</Label>
                      <Input
                        id="score"
                        type="number"
                        value={formData.score}
                        onChange={(e) => handleInputChange("score", e.target.value)}
                        placeholder="e.g., 85"
                        className={cn(formErrors.score && "border-red-500")}
                      />
                      {formErrors.score && <p className="text-red-500 text-sm mt-1">{formErrors.score}</p>}
                    </div>
                    <div>
                      <Label htmlFor="maxScore">Max Score</Label>
                      <Input
                        id="maxScore"
                        type="number"
                        value={formData.maxScore}
                        onChange={(e) => handleInputChange("maxScore", e.target.value)}
                        placeholder="e.g., 100"
                        className={cn(formErrors.maxScore && "border-red-500")}
                      />
                      {formErrors.maxScore && <p className="text-red-500 text-sm mt-1">{formErrors.maxScore}</p>}
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="templates">
              <div className="py-4">
                <Alert>
                  <BookOpen className="h-4 w-4" />
                  <AlertDescription>
                    Quickly fill the form by selecting a recent assessment type as a template.
                  </AlertDescription>
                </Alert>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-4">
                  {recentTests.length > 0 ? (
                    recentTests.map((test, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => applyRecentTest(test)}
                        className="text-left p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors focus:ring-2 focus:ring-blue-500"
                      >
                        <p className="font-semibold">{test.test_name}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{test.test_type}</p>
                        {test.subjects && <Badge variant="outline" className="mt-2" style={{ borderColor: test.subjects.color, color: test.subjects.color }}>{test.subjects.name}</Badge>}
                      </button>
                    ))
                  ) : (
                    <p className="text-gray-500 col-span-full text-center py-8">No recent assessments found to use as templates.</p>
                  )}
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter className="pt-8">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading} size="lg">
              {isLoading ? "Saving..." : "Save Assessment"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}