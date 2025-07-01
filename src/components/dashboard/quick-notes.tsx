import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Plus, StickyNote, Pin, X } from "lucide-react";
import { supabase } from '@/lib/supabase';
import { toast } from "sonner";

interface Note {
  id: string;
  title: string;
  content: string;
  note_type: string;
  tags: string[];
  is_pinned: boolean;
  color: string;
  created_at: string;
  subjects?: {
    name: string;
  };
}

interface QuickNotesProps {
  userId: string;
}

export function QuickNotes({ userId }: QuickNotesProps) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [newNote, setNewNote] = useState({ title: "", content: "" });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadNotes();
  }, [userId]);

  const loadNotes = async () => {
    try {
      const { data, error } = await supabase
        .from('notes')
        .select(`
          *,
          subjects (
            name
          )
        `)
        .eq('user_id', userId)
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(6);

      if (error) {
        console.error("Error loading notes:", error);
        return;
      }

      setNotes(data || []);
    } catch (error) {
      console.error("Error loading notes:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const addNote = async () => {
    if (!newNote.title.trim() || !newNote.content.trim()) {
      toast.error("Please fill in both title and content");
      return;
    }

    try {
      const { error } = await supabase
        .from('notes')
        .insert({
          title: newNote.title,
          content: newNote.content,
          note_type: 'general',
          user_id: userId,
          color: '#3B82F6'
        });

      if (error) {
        console.error("Error adding note:", error);
        toast.error("Failed to add note");
        return;
      }

      setNewNote({ title: "", content: "" });
      setIsAdding(false);
      loadNotes();
      toast.success("Note added successfully!");
    } catch (error) {
      console.error("Error adding note:", error);
      toast.error("Failed to add note");
    }
  };

  const togglePin = async (noteId: string, currentPinned: boolean) => {
    try {
      const { error } = await supabase
        .from('notes')
        .update({ is_pinned: !currentPinned })
        .eq('id', noteId);

      if (error) {
        console.error("Error toggling pin:", error);
        toast.error("Failed to update note");
        return;
      }

      loadNotes();
    } catch (error) {
      console.error("Error toggling pin:", error);
      toast.error("Failed to update note");
    }
  };

  const deleteNote = async (noteId: string) => {
    try {
      const { error } = await supabase
        .from('notes')
        .delete()
        .eq('id', noteId);

      if (error) {
        console.error("Error deleting note:", error);
        toast.error("Failed to delete note");
        return;
      }

      loadNotes();
      toast.success("Note deleted");
    } catch (error) {
      console.error("Error deleting note:", error);
      toast.error("Failed to delete note");
    }
  };

  const getNoteTypeColor = (type: string) => {
    switch (type) {
      case 'lesson': return 'bg-blue-100 text-blue-800';
      case 'reminder': return 'bg-yellow-100 text-yellow-800';
      case 'insight': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <StickyNote className="h-5 w-5" />
            <span>Quick Notes</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-20 bg-gray-200 rounded-lg"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center space-x-2">
              <StickyNote className="h-5 w-5" />
              <span>Quick Notes</span>
            </CardTitle>
            <CardDescription>Jot down important thoughts and reminders</CardDescription>
          </div>
          <Button 
            size="sm" 
            variant="outline"
            onClick={() => setIsAdding(!isAdding)}
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Note
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 max-h-[400px] overflow-y-auto pr-1 custom-scrollbar">
        {/* Add Note Form */}
        {isAdding && (
          <div className="border rounded-lg p-3 space-y-3 bg-blue-50">
            <Input
              placeholder="Note title..."
              value={newNote.title}
              onChange={(e) => setNewNote(prev => ({ ...prev, title: e.target.value }))}
            />
            <Textarea
              placeholder="Write your note here..."
              value={newNote.content}
              onChange={(e) => setNewNote(prev => ({ ...prev, content: e.target.value }))}
              rows={3}
            />
            <div className="flex space-x-2">
              <Button size="sm" onClick={addNote}>
                Save Note
              </Button>
              <Button size="sm" variant="outline" onClick={() => setIsAdding(false)}>
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Notes List */}
        {notes.length === 0 ? (
          <div className="text-center py-8 space-y-3">
            <StickyNote className="h-8 w-8 text-gray-400 mx-auto" />
            <p className="text-gray-500">No notes yet</p>
            <p className="text-sm text-gray-400">Add your first note to get started!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {notes.map((note) => (
              <div
                key={note.id}
                className="border rounded-lg p-3 space-y-2 hover:shadow-sm transition-shadow"
                style={{ borderLeftColor: note.color, borderLeftWidth: '4px' }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <h4 className="font-medium text-sm text-gray-900">{note.title}</h4>
                      {note.is_pinned && (
                        <Pin className="h-3 w-3 text-yellow-500" />
                      )}
                      <Badge className={`text-xs ${getNoteTypeColor(note.note_type)}`}>
                        {note.note_type}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 line-clamp-2">{note.content}</p>
                    {note.subjects && (
                      <p className="text-xs text-gray-500 mt-1">{note.subjects.name}</p>
                    )}
                  </div>
                  <div className="flex space-x-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => togglePin(note.id, note.is_pinned)}
                      className="h-6 w-6 p-0"
                    >
                      <Pin className={`h-3 w-3 ${note.is_pinned ? 'text-yellow-500' : 'text-gray-400'}`} />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => deleteNote(note.id)}
                      className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}