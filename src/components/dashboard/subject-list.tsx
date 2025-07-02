import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { AddSubjectDialog } from "./add-subject-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  BarChart3,
  ChevronDown,
  ChevronRight,
  PlusCircle,
  Calendar,
  TrendingUp,
  Loader2,
  BookOpen,
  Plus,
  ArrowUpDown,
  CalendarIcon
} from "lucide-react";

interface Subject {
  id: string;
  name: string;
  code: string;
  color?: string;
  averageScore?: number;
  created_at?: string;
  marks?: any[];
}

interface SubjectListProps {
  userId: string;
  onSubjectAdded?: () => void;
  existingSubjects?: Subject[];
}

type SortOption = 'recent' | 'name_asc' | 'name_desc' | 'score_high' | 'score_low';

export function SubjectList({ userId, onSubjectAdded, existingSubjects }: SubjectListProps) {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddSubject, setShowAddSubject] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>('recent');
  const [expandedSubject, setExpandedSubject] = useState<string | null>(null);
  const [newSubject, setNewSubject] = useState({
    name: "",
    code: "",
    color: "#3b82f6"
  });
  const [isAdding, setIsAdding] = useState(false);
  
  useEffect(() => {
    // Always load subjects directly from the database for the most complete list
    loadSubjects();
  }, [userId]);
  
  const loadSubjects = async () => {
    if (!userId) return;
    
    try {
      setLoading(true);
      setError(null);
      
      console.log('SubjectList: Loading subjects for user ID:', userId);
      
      const { data, error } = await supabase
        .from('subjects')
        .select(`
          id,
          name,
          code,
          color,
          created_at,
          marks(score, max_score, test_name, date)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
        
      if (error) {
        console.error("SubjectList: Error loading subjects:", error);
        setError("Failed to load subjects");
        return;
      }
      
      console.log('SubjectList: Subjects loaded:', data?.length || 0, data);
      
      // Calculate average scores
      const subjectsWithScores = data.map(subject => {
        let averageScore = 0;
        
        if (subject.marks && subject.marks.length > 0) {
          const totalPercentage = subject.marks.reduce((sum: number, mark: any) => {
            const percentage = (mark.score / mark.max_score) * 100;
            return sum + percentage;
          }, 0);
          averageScore = totalPercentage / subject.marks.length;
        }
        
        return {
          ...subject,
          averageScore
        };
      });
      
      console.log('SubjectList: Processed subjects:', subjectsWithScores.length);
      setSubjects(subjectsWithScores);
    } catch (err) {
      console.error("SubjectList: Error:", err);
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };
  
  const sortSubjects = (subjects: Subject[]): Subject[] => {
    switch (sortBy) {
      case 'recent':
        return [...subjects].sort((a, b) => 
          new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime()
        );
      case 'name_asc':
        return [...subjects].sort((a, b) => a.name.localeCompare(b.name));
      case 'name_desc':
        return [...subjects].sort((a, b) => b.name.localeCompare(a.name));
      case 'score_high':
        return [...subjects].sort((a, b) => (b.averageScore || 0) - (a.averageScore || 0));
      case 'score_low':
        return [...subjects].sort((a, b) => (a.averageScore || 0) - (b.averageScore || 0));
      default:
        return subjects;
    }
  };
  
  const sortedSubjects = sortSubjects(subjects);
  
  const handleAddSubject = async () => {
    if (newSubject.name.length < 2) {
      toast.error("Subject name must be at least 2 characters");
      return;
    }
    if (newSubject.code.length < 2) {
      toast.error("Subject code must be at least 2 characters");
      return;
    }
    if (!/^#[0-9a-fA-F]{6}$/.test(newSubject.color)) {
      toast.error("Must be a valid hex color code");
      return;
    }

    setIsAdding(true);
    
    try {
      const { error } = await supabase
        .from("subjects")
        .insert([{ ...newSubject, user_id: userId }])
        .select();

      if (error) {
        toast.error("Failed to add subject. Please try again.");
        console.error(error);
        return;
      }
      
      toast.success("Subject added successfully!");
      
      if (existingSubjects) {
        if (onSubjectAdded) {
          onSubjectAdded();
        }
      } else {
        await loadSubjects();
        
        if (onSubjectAdded) {
          onSubjectAdded();
        }
      }
      
      setShowAddSubject(false);
      setNewSubject({
        name: "",
        code: "",
        color: "#3b82f6"
      });
    } catch (error) {
      toast.error("An unexpected error occurred");
      console.error(error);
    } finally {
      setIsAdding(false);
    }
  };

  const toggleExpand = (id: string) => {
    if (expandedSubject === id) {
      setExpandedSubject(null);
    } else {
      setExpandedSubject(id);
    }
  };

  const getGradeLetter = (score: number) => {
    if (score >= 90) return "A";
    if (score >= 80) return "B";
    if (score >= 70) return "C";
    if (score >= 60) return "D";
    return "F";
  };
  
  if (loading && !existingSubjects) {
    return (
      <Card className="h-[400px] shadow-md rounded-xl border-0">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-semibold flex items-center">
            <BookOpen className="mr-2 h-5 w-5" /> 
            Subjects
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3">
          <div className="h-24 flex items-center justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  if (error && !existingSubjects) {
    return (
      <Card className="h-[400px] shadow-md rounded-xl border-0">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-semibold flex items-center">
            <BookOpen className="mr-2 h-5 w-5" /> 
            Subjects
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3">
          <div className="h-24 flex flex-col items-center justify-center text-center">
            <div className="text-red-500 mb-2">⚠️</div>
            <h3 className="text-sm font-medium">Error Loading Subjects</h3>
            <Button 
              onClick={loadSubjects} 
              variant="outline" 
              className="mt-2 h-7 text-xs"
            >
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className="overflow-hidden bg-white shadow-md rounded-xl border-0 hover:shadow-lg transition-all">
      <CardHeader className="pb-3 pt-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold flex items-center">
            <BookOpen className="mr-2 h-5 w-5" /> 
            Subjects
          </CardTitle>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="flex gap-1 items-center h-7 text-xs py-0 px-2">
                <ArrowUpDown className="h-3 w-3 mr-1" />
                Sort
                <ChevronDown className="h-3 w-3 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem 
                className={sortBy === 'recent' ? 'bg-slate-100' : ''}
                onClick={() => setSortBy('recent')}
              >
                <CalendarIcon className="h-3.5 w-3.5 mr-2" /> Recently Added
              </DropdownMenuItem>
              <DropdownMenuItem 
                className={sortBy === 'name_asc' ? 'bg-slate-100' : ''}
                onClick={() => setSortBy('name_asc')}
              >
                <ArrowUpDown className="h-3.5 w-3.5 mr-2" /> Name (A-Z)
              </DropdownMenuItem>
              <DropdownMenuItem 
                className={sortBy === 'name_desc' ? 'bg-slate-100' : ''}
                onClick={() => setSortBy('name_desc')}
              >
                <ArrowUpDown className="h-3.5 w-3.5 mr-2" /> Name (Z-A)
              </DropdownMenuItem>
              <DropdownMenuItem 
                className={sortBy === 'score_high' ? 'bg-slate-100' : ''}
                onClick={() => setSortBy('score_high')}
              >
                <ArrowUpDown className="h-3.5 w-3.5 mr-2" /> Score (Highest)
              </DropdownMenuItem>
              <DropdownMenuItem 
                className={sortBy === 'score_low' ? 'bg-slate-100' : ''}
                onClick={() => setSortBy('score_low')}
              >
                <ArrowUpDown className="h-3.5 w-3.5 mr-2" /> Score (Lowest)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="pt-0 px-4 pb-4">
        <Dialog open={showAddSubject} onOpenChange={setShowAddSubject}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Subject</DialogTitle>
              <DialogDescription>
                Enter the details for your new subject. Click save when you're done.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Subject Name</Label>
                <Input 
                  id="name" 
                  placeholder="e.g., Computer Science" 
                  value={newSubject.name}
                  onChange={(e) => setNewSubject({...newSubject, name: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="code">Subject Code</Label>
                <Input 
                  id="code" 
                  placeholder="e.g., CS101" 
                  value={newSubject.code}
                  onChange={(e) => setNewSubject({...newSubject, code: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="color">Subject Color</Label>
                <div className="flex items-center gap-2">
                  <Input 
                    id="color"
                    type="color" 
                    className="w-12 h-10 p-1" 
                    value={newSubject.color}
                    onChange={(e) => setNewSubject({...newSubject, color: e.target.value})}
                  />
                  <Input
                    type="text"
                    placeholder="#3b82f6"
                    className="flex-1"
                    value={newSubject.color}
                    onChange={(e) => setNewSubject({...newSubject, color: e.target.value})}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button 
                onClick={handleAddSubject}
                disabled={isAdding}
              >
                {isAdding ? "Adding..." : "Save changes"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        
        <div>
          {/* Add Subject Button */}
          <Button
            variant="outline"
            size="sm"
            className="w-full mb-3 text-xs h-8"
            onClick={() => setShowAddSubject(true)}
          >
            <Plus className="h-3.5 w-3.5 mr-1.5" /> Add New Subject
          </Button>
          
          {/* Subject List without scrollbar */}
          <div className="space-y-1.5">
            {sortedSubjects.map((subject) => (
              <div key={subject.id} className="mb-2 rounded-lg overflow-hidden border border-gray-100 hover:border-blue-200 transition-colors">
                <div 
                  onClick={() => toggleExpand(subject.id)}
                  className={`flex items-center justify-between p-2.5 ${expandedSubject === subject.id ? 'bg-blue-50' : 'bg-white'} hover:bg-blue-50 transition-colors cursor-pointer`}
                >
                  <div className="flex items-center gap-2">
                    {expandedSubject === subject.id ? 
                      <ChevronDown className="h-4 w-4 text-blue-500" /> : 
                      <ChevronRight className="h-4 w-4 text-gray-500" />
                    }
                    <div 
                      className="w-4 h-4 rounded-full flex items-center justify-center" 
                      style={{ backgroundColor: subject.color || '#3b82f6' }}
                    >
                      <span className="text-[8px] text-white font-bold">
                        {subject.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <span className="font-medium">{subject.name}</span>
                    <span className="text-xs px-1.5 py-0.5 bg-gray-100 rounded-md">{subject.code}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={`px-2 py-0.5 ${
                      (subject.averageScore || 0) >= 90 ? 'bg-green-100 text-green-800 border border-green-200' :
                      (subject.averageScore || 0) >= 80 ? 'bg-blue-100 text-blue-800 border border-blue-200' :
                      (subject.averageScore || 0) >= 70 ? 'bg-yellow-100 text-yellow-800 border border-yellow-200' :
                      (subject.averageScore || 0) >= 60 ? 'bg-orange-100 text-orange-800 border border-orange-200' :
                      'bg-red-100 text-red-800 border border-red-200'
                    }`}>
                      {getGradeLetter(subject.averageScore || 0)}
                    </Badge>
                    <span className="text-sm font-semibold">
                      {(subject.averageScore || 0).toFixed(1)}%
                    </span>
                  </div>
                </div>
                
                {/* Enhanced Expanded Subject Details */}
                {expandedSubject === subject.id && (
                  <div className="p-3 bg-gray-50 text-sm border-t border-gray-100">
                    <div className="grid grid-cols-2 gap-4 mb-3">
                      <div className="bg-white p-2 rounded-md border border-gray-100">
                        <div className="text-xs text-gray-500 mb-1">Subject Code</div>
                        <div className="font-medium">{subject.code}</div>
                      </div>
                      <div className="bg-white p-2 rounded-md border border-gray-100">
                        <div className="text-xs text-gray-500 mb-1">Added On</div>
                        <div className="font-medium">
                          {new Date(subject.created_at || '').toLocaleDateString()}
                        </div>
                      </div>
                      <div className="bg-white p-2 rounded-md border border-gray-100">
                        <div className="text-xs text-gray-500 mb-1">Average Score</div>
                        <div className="font-medium flex items-center">
                          <div className={`w-2 h-2 rounded-full mr-1.5 ${
                            (subject.averageScore || 0) >= 90 ? 'bg-green-500' :
                            (subject.averageScore || 0) >= 80 ? 'bg-blue-500' :
                            (subject.averageScore || 0) >= 70 ? 'bg-yellow-500' :
                            (subject.averageScore || 0) >= 60 ? 'bg-orange-500' :
                            'bg-red-500'
                          }`}></div>
                          {(subject.averageScore || 0).toFixed(1)}%
                        </div>
                      </div>
                      <div className="bg-white p-2 rounded-md border border-gray-100">
                        <div className="text-xs text-gray-500 mb-1">Grade</div>
                        <div className="font-medium">{getGradeLetter(subject.averageScore || 0)} Grade</div>
                      </div>
                    </div>
                    
                    {subject.marks && subject.marks.length > 0 ? (
                      <>
                        <div className="flex justify-between items-center mb-2">
                          <div className="text-xs font-medium text-gray-700">Assessment History</div>
                          <Badge variant="outline" className="text-[10px] px-1 py-0">
                            {subject.marks.length} total
                          </Badge>
                        </div>
                        <div className="space-y-1.5">
                          {subject.marks.slice(0, 5).map((mark: any, index: number) => (
                            <div key={index} className="flex justify-between items-center bg-white p-2 rounded-md border border-gray-100 hover:border-blue-200 transition-colors">
                              <div className="flex items-center gap-1.5">
                                <div className={`w-1.5 h-1.5 rounded-full ${
                                  ((mark.score/mark.max_score) * 100) >= 90 ? 'bg-green-500' :
                                  ((mark.score/mark.max_score) * 100) >= 80 ? 'bg-blue-500' :
                                  ((mark.score/mark.max_score) * 100) >= 70 ? 'bg-yellow-500' :
                                  ((mark.score/mark.max_score) * 100) >= 60 ? 'bg-orange-500' :
                                  'bg-red-500'
                                }`}></div>
                                <span className="text-sm">{mark.test_name || 'Assessment'}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge variant="secondary" className="text-xs">
                                  {mark.score}/{mark.max_score}
                                </Badge>
                                <span className="text-xs font-medium">
                                  {((mark.score/mark.max_score) * 100).toFixed(1)}%
                                </span>
                                <span className="text-xs text-gray-500">
                                  {new Date(mark.date || '').toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                        {subject.marks.length > 5 && (
                          <div className="text-center mt-2">
                            <Button variant="link" size="sm" className="text-xs h-auto p-0">
                              View all {subject.marks.length} assessments
                            </Button>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="text-center py-6 bg-white rounded-md border border-gray-100">
                        <div className="text-gray-400 mb-2">
                          <BookOpen className="h-8 w-8 mx-auto opacity-50" />
                        </div>
                        <p className="text-sm text-gray-600">No assessments recorded yet</p>
                        <p className="text-xs text-gray-500 mt-1">
                          Add marks to see assessment history
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
            
            {subjects.length === 0 && (
              <div className="py-3 text-center">
                <p className="text-gray-500 text-xs">No subjects added yet</p>
                <Button 
                  onClick={() => setShowAddSubject(true)} 
                  variant="outline" 
                  className="mt-2 h-7 text-xs px-2 py-0"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Add Your First Subject
                </Button>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 