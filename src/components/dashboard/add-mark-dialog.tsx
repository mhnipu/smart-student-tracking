import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from '@/lib/supabase';
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Sparkles, Trophy, BookOpen, Plus, X, CheckCircle2, Star, Award, Lightbulb, TrendingUp, TrendingDown, Settings, Save } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";

interface Subject {
  id: string;
  name: string;
  code: string;
  color?: string;
}

interface GradeScale {
  id: string;
  name: string;
  A: string;
  B: string;
  C: string;
  D: string;
  E: string;
  F: string;
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
    customTestType: "",
  });
  const [recentTests, setRecentTests] = useState<any[]>([]);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [customTypes, setCustomTypes] = useState<string[]>([]);
  const [isAddingCustomType, setIsAddingCustomType] = useState(false);
  const [subjectAverage, setSubjectAverage] = useState<number | null>(null);
  const [testTypeAverage, setTestTypeAverage] = useState<number | null>(null);
  const [showGradeConfig, setShowGradeConfig] = useState(false);
  const [customGradeScale, setCustomGradeScale] = useState<GradeScale>({
    id: "default",
    name: "Default",
    A: "90",
    B: "80",
    C: "70",
    D: "60",
    E: "50",
    F: "0"
  });
  const [savedGradeScales, setSavedGradeScales] = useState<GradeScale[]>([]);
  const [selectedGradeScaleId, setSelectedGradeScaleId] = useState<string>("default");
  const [newGradeScaleName, setNewGradeScaleName] = useState<string>("");
  const [useCustomGradeScale, setUseCustomGradeScale] = useState(false);

  // Standard test types with icons
  const standardTestTypes = [
    { value: "quiz", label: "Quiz", icon: <BookOpen className="h-4 w-4" /> },
    { value: "exam", label: "Exam", icon: <Award className="h-4 w-4" /> },
    { value: "assignment", label: "Assignment", icon: <CheckCircle2 className="h-4 w-4" /> },
    { value: "project", label: "Project", icon: <Star className="h-4 w-4" /> }
  ];

  useEffect(() => {
    if (open) {
      loadSubjects();
      loadRecentTests();
      loadCustomTestTypes();
      loadGradeScaleSettings();
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

  // Load subject average when subject changes
  useEffect(() => {
    if (formData.subjectId) {
      loadSubjectAverage(formData.subjectId);
    } else {
      setSubjectAverage(null);
    }
  }, [formData.subjectId]);

  // Load test type average when test type changes
  useEffect(() => {
    if (formData.testType) {
      loadTestTypeAverage(formData.testType);
    } else if (formData.customTestType && isAddingCustomType) {
      loadTestTypeAverage(formData.customTestType);
    } else {
      setTestTypeAverage(null);
    }
  }, [formData.testType, formData.customTestType, isAddingCustomType]);

  // Save custom grade scale settings when they change
  useEffect(() => {
    if (useCustomGradeScale) {
      saveGradeScaleSettings();
    } else {
      localStorage.setItem('useCustomGradeScale', 'false');
    }
  }, [customGradeScale, useCustomGradeScale, selectedGradeScaleId]);

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
          subjects(name, code, color)
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

  const loadCustomTestTypes = async () => {
    try {
      if (!userId) {
        console.error("User not authenticated");
        return;
      }

      const { data, error } = await supabase
        .from('marks')
        .select('test_type')
        .eq('user_id', userId)
        .order('test_type', { ascending: true });

      if (error) {
        console.error("Error loading custom test types:", error);
        return;
      }

      if (data) {
        // Get unique types that aren't in the standard list
        const uniqueTypes = [...new Set(data.map(item => item.test_type))];
        const customTypesList = uniqueTypes.filter(type => 
          type && !standardTestTypes.some(t => t.value === type.toLowerCase())
        );
        setCustomTypes(customTypesList);
      }
    } catch (error) {
      console.error("Error loading custom test types:", error);
    }
  };

  const loadSubjectAverage = async (subjectId: string) => {
    try {
      if (!userId) return;
      
      const { data, error } = await supabase
        .from('marks')
        .select('score, max_score')
        .eq('user_id', userId)
        .eq('subject_id', subjectId);
        
      if (error) {
        console.error("Error loading subject average:", error);
        return;
      }
      
      if (data && data.length > 0) {
        const total = data.reduce((sum, mark) => {
          const percentage = (mark.score / mark.max_score) * 100;
          return sum + percentage;
        }, 0);
        setSubjectAverage(total / data.length);
      } else {
        setSubjectAverage(null);
      }
    } catch (error) {
      console.error("Error loading subject average:", error);
    }
  };
  
  const loadTestTypeAverage = async (testType: string) => {
    try {
      if (!userId) return;
      
      const { data, error } = await supabase
        .from('marks')
        .select('score, max_score')
        .eq('user_id', userId)
        .eq('test_type', testType);
        
      if (error) {
        console.error("Error loading test type average:", error);
        return;
      }
      
      if (data && data.length > 0) {
        const total = data.reduce((sum, mark) => {
          const percentage = (mark.score / mark.max_score) * 100;
          return sum + percentage;
        }, 0);
        setTestTypeAverage(total / data.length);
      } else {
        setTestTypeAverage(null);
      }
    } catch (error) {
      console.error("Error loading test type average:", error);
    }
  };

  const loadGradeScaleSettings = () => {
    try {
      const savedScalesStr = localStorage.getItem('savedGradeScales');
      const useCustomScale = localStorage.getItem('useCustomGradeScale');
      const selectedScaleId = localStorage.getItem('selectedGradeScaleId');
      
      if (savedScalesStr) {
        const savedScales = JSON.parse(savedScalesStr) as GradeScale[];
        setSavedGradeScales(savedScales);
        
        if (selectedScaleId) {
          setSelectedGradeScaleId(selectedScaleId);
          const selectedScale = savedScales.find(scale => scale.id === selectedScaleId);
          if (selectedScale) {
            setCustomGradeScale(selectedScale);
          }
        } else if (savedScales.length > 0) {
          setCustomGradeScale(savedScales[0]);
          setSelectedGradeScaleId(savedScales[0].id);
        }
      } else {
        // Initialize with default grade scale
        const defaultScale: GradeScale = {
          id: "default",
          name: "Default",
          A: "90",
          B: "80",
          C: "70",
          D: "60",
          E: "50",
          F: "0"
        };
        setSavedGradeScales([defaultScale]);
        setCustomGradeScale(defaultScale);
        setSelectedGradeScaleId("default");
      }
      
      if (useCustomScale === 'true') {
        setUseCustomGradeScale(true);
      } else {
        setUseCustomGradeScale(false);
      }
    } catch (error) {
      console.error('Error loading grade scale settings:', error);
    }
  };
  
  const saveGradeScaleSettings = () => {
    localStorage.setItem('savedGradeScales', JSON.stringify(savedGradeScales));
    localStorage.setItem('useCustomGradeScale', 'true');
    localStorage.setItem('selectedGradeScaleId', selectedGradeScaleId);
  };
  
  const saveNewGradeScale = () => {
    if (!newGradeScaleName.trim()) {
      toast.error("Please enter a name for the grade scale");
      return;
    }
    
    const newScale: GradeScale = {
      ...customGradeScale,
      id: Date.now().toString(),
      name: newGradeScaleName
    };
    
    const updatedScales = [...savedGradeScales, newScale];
    setSavedGradeScales(updatedScales);
    setSelectedGradeScaleId(newScale.id);
    setCustomGradeScale(newScale);
    setNewGradeScaleName("");
    
    localStorage.setItem('savedGradeScales', JSON.stringify(updatedScales));
    toast.success(`Grade scale "${newGradeScaleName}" saved`);
  };
  
  const handleGradeScaleSelect = (scaleId: string) => {
    const selectedScale = savedGradeScales.find(scale => scale.id === scaleId);
    if (selectedScale) {
      setCustomGradeScale(selectedScale);
      setSelectedGradeScaleId(scaleId);
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
    
    // Validate test type - either standard selection or custom type must be provided
    if (!formData.testType && !formData.customTestType) {
      errors.testType = "Test type is required";
    }
    
    if (isAddingCustomType && !formData.customTestType) {
      errors.customTestType = "Custom test type is required";
    }
    
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

      // Determine the test type to use (either selected or custom)
      const testType = isAddingCustomType ? formData.customTestType : formData.testType;
      
      // Always convert to lowercase to avoid potential issues
      const normalizedTestType = testType.toLowerCase();

      const { error } = await supabase
        .from('marks')
        .insert({
          score: parseFloat(formData.score),
          max_score: parseFloat(formData.maxScore),
          test_type: normalizedTestType,
          test_name: formData.testName,
          date: formData.date,
          subject_id: formData.subjectId,
          user_id: userId,
          semester: formData.semester || null,
        });

      if (error) {
        console.error("Error adding mark:", error);
        toast.error("Failed to add mark. Database constraint might be preventing this.");
        return;
      }

      // If we used a custom type that's not in our list, add it
      if (isAddingCustomType && !customTypes.includes(formData.customTestType)) {
        setCustomTypes(prev => [...prev, formData.customTestType]);
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
        customTestType: "",
      });
      setIsAddingCustomType(false);
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
      testType: test.test_type,
      subjectId: test.subject_id,
    }));
    setActiveTab("manual");
    
    // Reset custom type mode
    setIsAddingCustomType(false);
  };

  const getGradeColor = (percentage: number) => {
    if (useCustomGradeScale) {
      if (percentage >= parseFloat(customGradeScale.A)) return "bg-green-100 text-green-800 border-green-200";
      if (percentage >= parseFloat(customGradeScale.B)) return "bg-blue-100 text-blue-800 border-blue-200";
      if (percentage >= parseFloat(customGradeScale.C)) return "bg-yellow-100 text-yellow-800 border-yellow-200";
      if (percentage >= parseFloat(customGradeScale.D)) return "bg-orange-100 text-orange-800 border-orange-200";
      if (percentage >= parseFloat(customGradeScale.E)) return "bg-purple-100 text-purple-800 border-purple-200";
      return "bg-red-100 text-red-800 border-red-200";
    } else {
      if (percentage >= 90) return "bg-green-100 text-green-800 border-green-200";
      if (percentage >= 80) return "bg-blue-100 text-blue-800 border-blue-200";
      if (percentage >= 70) return "bg-yellow-100 text-yellow-800 border-yellow-200";
      if (percentage >= 60) return "bg-orange-100 text-orange-800 border-orange-200";
      if (percentage >= 50) return "bg-purple-100 text-purple-800 border-purple-200";
      return "bg-red-100 text-red-800 border-red-200";
    }
  };

  const getProgressColor = (percentage: number) => {
    if (useCustomGradeScale) {
      if (percentage >= parseFloat(customGradeScale.A)) return "bg-green-500";
      if (percentage >= parseFloat(customGradeScale.B)) return "bg-blue-500";
      if (percentage >= parseFloat(customGradeScale.C)) return "bg-yellow-500";
      if (percentage >= parseFloat(customGradeScale.D)) return "bg-orange-500";
      if (percentage >= parseFloat(customGradeScale.E)) return "bg-purple-500";
      return "bg-red-500";
    } else {
      if (percentage >= 90) return "bg-green-500";
      if (percentage >= 80) return "bg-blue-500";
      if (percentage >= 70) return "bg-yellow-500";
      if (percentage >= 60) return "bg-orange-500";
      if (percentage >= 50) return "bg-purple-500";
      return "bg-red-500";
    }
  };

  const getGradeLetter = (percentage: number) => {
    if (useCustomGradeScale) {
      if (percentage >= parseFloat(customGradeScale.A)) return "A";
      if (percentage >= parseFloat(customGradeScale.B)) return "B";
      if (percentage >= parseFloat(customGradeScale.C)) return "C";
      if (percentage >= parseFloat(customGradeScale.D)) return "D";
      if (percentage >= parseFloat(customGradeScale.E)) return "E";
      return "F";
    } else {
      if (percentage >= 90) return "A";
      if (percentage >= 80) return "B";
      if (percentage >= 70) return "C";
      if (percentage >= 60) return "D";
      if (percentage >= 50) return "E";
      return "F";
    }
  };

  const getGradeMessage = (percentage: number) => {
    if (useCustomGradeScale) {
      if (percentage >= parseFloat(customGradeScale.A)) return "Excellent work!";
      if (percentage >= parseFloat(customGradeScale.B)) return "Good job!";
      if (percentage >= parseFloat(customGradeScale.C)) return "Satisfactory result.";
      if (percentage >= parseFloat(customGradeScale.D)) return "Passing, but needs improvement.";
      if (percentage >= parseFloat(customGradeScale.E)) return "Barely passing, needs significant improvement.";
      return "Not passing, serious improvement needed.";
    } else {
      if (percentage >= 90) return "Excellent work!";
      if (percentage >= 80) return "Good job!";
      if (percentage >= 70) return "Satisfactory result.";
      if (percentage >= 60) return "Passing, but needs improvement.";
      if (percentage >= 50) return "Barely passing, needs significant improvement.";
      return "Not passing, serious improvement needed.";
    }
  };

  const getComparisonIcon = (current: number, average: number | null) => {
    if (!average) return null;
    
    const diff = current - average;
    if (diff > 5) return <TrendingUp className="h-3 w-3 text-green-600" />;
    if (diff < -5) return <TrendingDown className="h-3 w-3 text-red-600" />;
    return null;
  };

  const selectedSubject = subjects.find(s => s.id === formData.subjectId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add New Assessment</DialogTitle>
          <DialogDescription>
            Record a new test, quiz, assignment, or project grade.
          </DialogDescription>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="manual">Manual Entry</TabsTrigger>
            <TabsTrigger value="recent">Recent Tests</TabsTrigger>
          </TabsList>
          
          <TabsContent value="manual">
            <form onSubmit={handleSubmit} className="space-y-4 py-2">
              <div className="grid grid-cols-1 gap-4">
                {/* Top row - Test name & Subject */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="testName">Assessment Name</Label>
                    <Input
                      id="testName"
                      value={formData.testName}
                      onChange={(e) => handleInputChange("testName", e.target.value)}
                      placeholder="e.g., Midterm Exam"
                      className={cn(formErrors.testName && "border-red-500")}
                    />
                    {formErrors.testName && <p className="text-red-500 text-sm mt-1">{formErrors.testName}</p>}
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
                    
                    {subjectAverage !== null && (
                      <div className="text-xs text-gray-500 mt-1 flex items-center">
                        <span>Subject average: {subjectAverage.toFixed(1)}%</span>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Middle row - Test type & Date */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="testType">Assessment Type</Label>
                    {!isAddingCustomType ? (
                      <div className="flex gap-2 items-center">
                        <Select value={formData.testType} onValueChange={(value) => handleInputChange("testType", value)}>
                          <SelectTrigger className={cn(formErrors.testType && "border-red-500")}>
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                          <SelectContent>
                            {standardTestTypes.map((type) => (
                              <SelectItem key={type.value} value={type.value}>
                                <div className="flex items-center gap-2">
                                  {type.icon}
                                  {type.label}
                                </div>
                              </SelectItem>
                            ))}
                            {customTypes.map(type => (
                              <SelectItem key={type} value={type}>
                                <div className="flex items-center gap-2">
                                  <Lightbulb className="h-4 w-4" />
                                  {type}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button
                          type="button"
                          size="icon"
                          variant="outline"
                          className="shrink-0"
                          onClick={() => setIsAddingCustomType(true)}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex gap-2 items-center">
                        <Input
                          value={formData.customTestType}
                          onChange={(e) => handleInputChange("customTestType", e.target.value)}
                          placeholder="Enter custom type..."
                          className={cn(formErrors.customTestType && "border-red-500")}
                          autoFocus
                        />
                        <Button
                          type="button"
                          size="sm"
                          variant="default"
                          className="shrink-0 bg-emerald-600 hover:bg-emerald-700"
                          onClick={() => {
                            if (formData.customTestType.trim()) {
                              setCustomTypes(prev => {
                                if (!prev.includes(formData.customTestType)) {
                                  return [...prev, formData.customTestType];
                                }
                                return prev;
                              });
                              setIsAddingCustomType(false);
                            } else {
                              setFormErrors(prev => ({ ...prev, customTestType: "Type is required" }));
                            }
                          }}
                        >
                          Add
                        </Button>
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          onClick={() => {
                            setIsAddingCustomType(false);
                            setFormData(prev => ({ ...prev, customTestType: "" }));
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                    {!isAddingCustomType && formErrors.testType && <p className="text-red-500 text-sm mt-1">{formErrors.testType}</p>}
                    {isAddingCustomType && formErrors.customTestType && <p className="text-red-500 text-sm mt-1">{formErrors.customTestType}</p>}
                    
                    {testTypeAverage !== null && (
                      <div className="text-xs text-gray-500 mt-1 flex items-center">
                        <span>Type average: {testTypeAverage.toFixed(1)}%</span>
                      </div>
                    )}
                  </div>
                  
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
                </div>
                
                {/* Bottom row - Scores */}
                <div className="grid grid-cols-2 gap-4">
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
                
                {/* Grade preview - Always visible with skeleton state if no scores */}
                <Card className="mt-2">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="text-xl font-bold flex items-center">
                        {formData.score && formData.maxScore && parseFloat(formData.maxScore) > 0 ? (
                          <>
                            Grade: <span className={getGradeColor(percentage).replace('bg-', 'text-').replace('-100', '-500').replace(' border-green-200', '')}>
                              {getGradeLetter(percentage)}
                            </span>
                          </>
                        ) : (
                          <>
                            Grade: <div className="w-8 h-8 ml-2 bg-gray-200 animate-pulse rounded"></div>
                          </>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {formData.score && formData.maxScore && parseFloat(formData.maxScore) > 0 ? (
                          <Badge className={getGradeColor(percentage)}>
                            {percentage.toFixed(1)}%
                          </Badge>
                        ) : (
                          <div className="w-16 h-6 bg-gray-200 animate-pulse rounded"></div>
                        )}
                        
                        <Popover open={showGradeConfig} onOpenChange={setShowGradeConfig}>
                          <PopoverTrigger asChild>
                            <Button 
                              variant="outline" 
                              size="icon" 
                              className="h-7 w-7 rounded-full"
                              aria-label="Configure grading scale"
                            >
                              <Settings className="h-3.5 w-3.5" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-80">
                            <div className="space-y-4">
                              <h3 className="font-medium text-sm">Grading Scale Configuration</h3>
                              
                              <div className="flex items-center justify-between">
                                <span className="text-sm">Use Custom Grading Scale</span>
                                <Switch 
                                  checked={useCustomGradeScale} 
                                  onCheckedChange={setUseCustomGradeScale}
                                />
                              </div>
                              
                              {useCustomGradeScale && (
                                <div className="space-y-3 pt-2">
                                  <div>
                                    <Label htmlFor="gradeScaleSelect" className="text-xs">Select Grade Scale</Label>
                                    <Select 
                                      value={selectedGradeScaleId} 
                                      onValueChange={handleGradeScaleSelect}
                                    >
                                      <SelectTrigger id="gradeScaleSelect">
                                        <SelectValue placeholder="Select a grade scale" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {savedGradeScales.map(scale => (
                                          <SelectItem key={scale.id} value={scale.id}>
                                            {scale.name}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  
                                  <div className="grid grid-cols-2 gap-2">
                                    <div>
                                      <Label htmlFor="gradeA" className="text-xs">A Grade (≥)</Label>
                                      <Input
                                        id="gradeA"
                                        type="number"
                                        min="0"
                                        max="100"
                                        value={customGradeScale.A}
                                        onChange={(e) => setCustomGradeScale({
                                          ...customGradeScale,
                                          A: e.target.value
                                        })}
                                        className="h-7 text-sm"
                                      />
                                    </div>
                                    <div>
                                      <Label htmlFor="gradeB" className="text-xs">B Grade (≥)</Label>
                                      <Input
                                        id="gradeB"
                                        type="number"
                                        min="0"
                                        max="100"
                                        value={customGradeScale.B}
                                        onChange={(e) => setCustomGradeScale({
                                          ...customGradeScale,
                                          B: e.target.value
                                        })}
                                        className="h-7 text-sm"
                                      />
                                    </div>
                                  </div>
                                  <div className="grid grid-cols-2 gap-2">
                                    <div>
                                      <Label htmlFor="gradeC" className="text-xs">C Grade (≥)</Label>
                                      <Input
                                        id="gradeC"
                                        type="number"
                                        min="0"
                                        max="100"
                                        value={customGradeScale.C}
                                        onChange={(e) => setCustomGradeScale({
                                          ...customGradeScale,
                                          C: e.target.value
                                        })}
                                        className="h-7 text-sm"
                                      />
                                    </div>
                                    <div>
                                      <Label htmlFor="gradeD" className="text-xs">D Grade (≥)</Label>
                                      <Input
                                        id="gradeD"
                                        type="number"
                                        min="0"
                                        max="100"
                                        value={customGradeScale.D}
                                        onChange={(e) => setCustomGradeScale({
                                          ...customGradeScale,
                                          D: e.target.value
                                        })}
                                        className="h-7 text-sm"
                                      />
                                    </div>
                                  </div>
                                  <div className="grid grid-cols-2 gap-2">
                                    <div>
                                      <Label htmlFor="gradeE" className="text-xs">E Grade (≥)</Label>
                                      <Input
                                        id="gradeE"
                                        type="number"
                                        min="0"
                                        max="100"
                                        value={customGradeScale.E}
                                        onChange={(e) => setCustomGradeScale({
                                          ...customGradeScale,
                                          E: e.target.value
                                        })}
                                        className="h-7 text-sm"
                                      />
                                    </div>
                                    <div className="flex items-end">
                                      <div className="text-xs text-gray-500 mb-2">
                                        F Grade: &lt; {customGradeScale.E}
                                      </div>
                                    </div>
                                  </div>
                                  
                                  <div className="mt-2 space-y-2">
                                    <div>
                                      <Label htmlFor="newGradeScaleName" className="text-xs">Save Current Configuration As</Label>
                                      <div className="flex gap-2 mt-1">
                                        <Input
                                          id="newGradeScaleName"
                                          value={newGradeScaleName}
                                          onChange={(e) => setNewGradeScaleName(e.target.value)}
                                          placeholder="New grade scale name"
                                          className="h-7 text-sm"
                                        />
                                        <Button 
                                          onClick={saveNewGradeScale} 
                                          size="sm" 
                                          className="shrink-0 h-7 bg-emerald-600 hover:bg-emerald-700"
                                        >
                                          <Save className="h-3.5 w-3.5 mr-1" /> Save
                                        </Button>
                                      </div>
                                    </div>
                                    
                                    <Button 
                                      size="sm" 
                                      variant="outline" 
                                      className="w-full"
                                      onClick={() => {
                                        const defaultScale: GradeScale = {
                                          id: "default",
                                          name: "Default",
                                          A: "90",
                                          B: "80",
                                          C: "70",
                                          D: "60",
                                          E: "50",
                                          F: "0"
                                        };
                                        setCustomGradeScale(defaultScale);
                                      }}
                                    >
                                      Reset to Default
                                    </Button>
                                  </div>
                                </div>
                              )}
                            </div>
                          </PopoverContent>
                        </Popover>
                      </div>
                    </div>
                    
                    {formData.score && formData.maxScore && parseFloat(formData.maxScore) > 0 ? (
                      <>
                        <Progress 
                          value={percentage} 
                          max={100} 
                          className={`h-2 mb-3 ${getProgressColor(percentage)}`}
                        />
                        
                        <p className="text-sm text-gray-600 mb-2">{getGradeMessage(percentage)}</p>
                        
                        <div className="mt-3 space-y-2">
                          {subjectAverage !== null && (
                            <div className="flex items-center justify-between text-sm">
                              <span>Subject average:</span>
                              <div className="flex items-center gap-1">
                                <Badge variant="outline" className={getGradeColor(subjectAverage)}>
                                  {subjectAverage.toFixed(1)}%
                                </Badge>
                                {getComparisonIcon(percentage, subjectAverage)}
                              </div>
                            </div>
                          )}
                          
                          {testTypeAverage !== null && (
                            <div className="flex items-center justify-between text-sm">
                              <span>{isAddingCustomType ? formData.customTestType : formData.testType} average:</span>
                              <div className="flex items-center gap-1">
                                <Badge variant="outline" className={getGradeColor(testTypeAverage)}>
                                  {testTypeAverage.toFixed(1)}%
                                </Badge>
                                {getComparisonIcon(percentage, testTypeAverage)}
                              </div>
                            </div>
                          )}
                          
                          {useCustomGradeScale ? 
                            (percentage >= parseFloat(customGradeScale.A) && (
                              <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 p-2 rounded-md mt-2">
                                <Trophy className="h-4 w-4" />
                                <span>Excellent! This is one of your highest scores.</span>
                              </div>
                            )) : 
                            (percentage >= 90 && (
                              <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 p-2 rounded-md mt-2">
                                <Trophy className="h-4 w-4" />
                                <span>Excellent! This is one of your highest scores.</span>
                              </div>
                            ))
                          }
                          
                          {useCustomGradeScale ?
                            (percentage < parseFloat(customGradeScale.E) && (
                              <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-2 rounded-md mt-2">
                                <AlertCircle className="h-4 w-4" />
                                <span>This score needs significant improvement. Consider getting help in this subject.</span>
                              </div>
                            )) :
                            (percentage < 50 && (
                              <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-2 rounded-md mt-2">
                                <AlertCircle className="h-4 w-4" />
                                <span>This score needs significant improvement. Consider getting help in this subject.</span>
                              </div>
                            ))
                          }
                        </div>
                      </>
                    ) : (
                      /* Skeleton state when no scores entered */
                      <>
                        <div className="h-2 mb-3 bg-gray-200 animate-pulse rounded-full"></div>
                        
                        <div className="w-3/4 h-5 bg-gray-200 animate-pulse rounded mb-2"></div>
                        
                        <div className="mt-3 space-y-2">
                          {/* Always show subject average if available */}
                          {subjectAverage !== null ? (
                            <div className="flex items-center justify-between text-sm">
                              <span>Subject average:</span>
                              <div className="flex items-center gap-1">
                                <Badge variant="outline" className={getGradeColor(subjectAverage)}>
                                  {subjectAverage.toFixed(1)}%
                                </Badge>
                              </div>
                            </div>
                          ) : (
                            <div className="flex justify-end">
                              <div className="w-16 h-6 bg-gray-200 animate-pulse rounded"></div>
                            </div>
                          )}
                          
                          {/* Always show test type average if available */}
                          {testTypeAverage !== null ? (
                            <div className="flex items-center justify-between text-sm">
                              <span>{isAddingCustomType ? formData.customTestType : formData.testType} average:</span>
                              <div className="flex items-center gap-1">
                                <Badge variant="outline" className={getGradeColor(testTypeAverage)}>
                                  {testTypeAverage.toFixed(1)}%
                                </Badge>
                              </div>
                            </div>
                          ) : (
                            <div className="flex justify-end">
                              <div className="w-16 h-6 bg-gray-200 animate-pulse rounded"></div>
                            </div>
                          )}
                          
                          <div className="flex items-center gap-2 text-sm p-2 rounded-md mt-2 bg-gray-100">
                            <div className="w-4 h-4 bg-gray-200 animate-pulse rounded-full"></div>
                            <div className="w-full h-4 bg-gray-200 animate-pulse rounded"></div>
                          </div>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              </div>
            </form>
          </TabsContent>
          
          <TabsContent value="recent">
            <div className="py-2">
              <h3 className="text-sm font-medium mb-2">Recent Assessments</h3>
              {recentTests.length > 0 ? (
                <div className="grid grid-cols-1 gap-2">
                  {recentTests.map((test, index) => (
                    <div 
                      key={index}
                      className="flex items-center justify-between p-3 border rounded-md hover:bg-gray-50 cursor-pointer"
                      onClick={() => applyRecentTest(test)}
                    >
                      <div className="flex items-center gap-3">
                        {test.subjects?.color && (
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: test.subjects.color }}
                          />
                        )}
                        <div>
                          <div className="font-medium">{test.test_name}</div>
                          <div className="text-xs text-gray-500">
                            {test.subjects?.name} • {test.test_type}
                          </div>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm">
                        Use
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-gray-500">
                  No recent tests found
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
        
        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={isLoading}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            {isLoading ? "Adding..." : "Add Assessment"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}