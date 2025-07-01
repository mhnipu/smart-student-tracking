import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Plus } from "lucide-react";

interface Subject {
  id: string;
  name: string;
  code: string;
  color?: string;
  averageScore?: number;
  created_at?: string;
}

interface SubjectListProps {
  userId: string;
  onSubjectAdded?: () => void;
  existingSubjects?: Subject[];
}

export function SubjectList({ userId, onSubjectAdded, existingSubjects }: SubjectListProps) {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddSubject, setShowAddSubject] = useState(false);
  const [newSubject, setNewSubject] = useState({
    name: "",
    code: "",
    color: "#3b82f6"
  });
  const [isAdding, setIsAdding] = useState(false);
  
  useEffect(() => {
    if (existingSubjects && existingSubjects.length > 0) {
      console.log('Using existing subjects:', existingSubjects.length);
      
      const processedSubjects = existingSubjects.map(subject => ({
        ...subject,
        averageScore: subject.averageScore || 0
      }));
      
      setSubjects(processedSubjects);
      setLoading(false);
    } else {
      loadSubjects();
    }
  }, [userId, existingSubjects]);
  
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
          marks(score, max_score)
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
  
  if (loading && !existingSubjects) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="h-[400px] flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  if (error && !existingSubjects) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="h-[400px] flex flex-col items-center justify-center text-center">
            <div className="text-red-500 mb-4">⚠️</div>
            <h3 className="text-lg font-medium">Error Loading Subjects</h3>
            <p className="text-sm text-gray-500 mt-2">{error}</p>
            <Button 
              onClick={loadSubjects} 
              variant="outline" 
              className="mt-4"
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
      <CardContent className="p-6">
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
          {/* Add Subject Entry */}
          <div 
            className="flex items-center justify-between p-3 rounded-lg mb-4 cursor-pointer hover:bg-gray-50 transition-colors"
            onClick={() => setShowAddSubject(true)}
          >
            <div className="flex items-center gap-2">
              <div className="text-purple-500 font-medium flex items-center">
                <Plus className="h-4 w-4 mr-1" /> Add Subject
              </div>
            </div>
            <div>
              <Plus className="h-4 w-4 text-gray-400" />
            </div>
          </div>
          
          <p className="text-sm text-gray-500 mb-4">Create a new subject to track</p>
          
          {/* Subject List */}
          <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
            {subjects.map((subject) => (
              <div 
                key={subject.id} 
                className="flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: subject.color || '#3b82f6' }}
                  />
                  <span className="font-medium">{subject.name}</span>
                </div>
                <div className="px-2 py-1 text-xs rounded-full bg-white border border-gray-200">
                  {subject.averageScore !== undefined ? 
                    `${subject.averageScore.toFixed(1)}%` : 
                    '0.0%'
                  }
                </div>
              </div>
            ))}
            
            {subjects.length === 0 && (
              <div className="py-8 text-center">
                <p className="text-gray-500 text-sm">No subjects added yet</p>
                <Button 
                  onClick={() => setShowAddSubject(true)} 
                  variant="outline" 
                  className="mt-3"
                >
                  <Plus className="h-4 w-4 mr-2" />
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