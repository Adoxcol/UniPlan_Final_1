'use client';

import { useState } from 'react';
import { StickyNote, X, BookOpen, GraduationCap, FileText, Lightbulb } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useAppStore } from '@/lib/store';
import { Calendar } from './ui/calendar';

export function NotesPanel() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<'write' | 'preview'>('write');
  const [smartSuggestions, setSmartSuggestions] = useState<string | null>(null);
  const { 
    notes, 
    setNotes, 
    semesters, 
    selectedNoteScope, 
    selectedSemesterForNotes, 
    selectedCourseForNotes,
    setNoteScope 
  } = useAppStore();

  const getCurrentNotes = () => {
    if (selectedNoteScope === 'global') return notes;
    
    if (selectedNoteScope === 'semester' && selectedSemesterForNotes) {
      const semester = semesters.find(s => s.id === selectedSemesterForNotes);
      return semester?.notes || '';
    }
    
    if (selectedNoteScope === 'course' && selectedSemesterForNotes && selectedCourseForNotes) {
      const semester = semesters.find(s => s.id === selectedSemesterForNotes);
      const course = semester?.courses.find(c => c.id === selectedCourseForNotes);
      return course?.notes || '';
    }
    
    return '';
  };
  
  const updateCurrentNotes = (newNotes: string) => {
    if (selectedNoteScope === 'global') {
      setNotes(newNotes);
    } else if (selectedNoteScope === 'semester' && selectedSemesterForNotes) {
      // Update semester notes through the store
      const { updateSemester } = useAppStore.getState();
      updateSemester(selectedSemesterForNotes, { notes: newNotes });
    } else if (selectedNoteScope === 'course' && selectedSemesterForNotes && selectedCourseForNotes) {
      const { updateCourse } = useAppStore.getState();
      updateCourse(selectedSemesterForNotes, selectedCourseForNotes, { notes: newNotes });
    } else {
      setNotes(newNotes);
    }
  };
  
  const currentNotes = getCurrentNotes();
  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 sm:left-auto sm:right-4">
      <Sheet open={isExpanded} onOpenChange={setIsExpanded}>
        <SheetTrigger asChild>
          <Button
            onClick={() => setIsExpanded(true)}
            size="lg"
            className="rounded-full h-14 px-5 shadow-2xl bg-amber-500 hover:bg-amber-600 text-white ring-2 ring-amber-400/60"
            aria-label="Open notes"
          >
            <div className="flex items-center gap-2">
              <StickyNote className="h-6 w-6" />
              <span className="hidden sm:inline font-medium">Notes</span>
              {currentNotes?.length > 0 && (
                <span className="ml-1 inline-flex items-center justify-center text-[10px] font-bold bg-white/20 rounded-full h-5 min-w-[1.25rem] px-1">
                  {currentNotes.length}
                </span>
              )}
            </div>
          </Button>
        </SheetTrigger>
        <SheetContent side="bottom" className="h-[85vh] sm:h-[70vh] p-0">
          <div className="h-full flex flex-col">
            <div className="px-4 py-3 border-b bg-amber-50 dark:bg-amber-900/20 flex items-center justify-between">
              <div className="flex items-center gap-2 text-lg font-semibold">
                <StickyNote className="h-5 w-5" />
                Notes
              </div>
            </div>
            <div className="p-4 flex-1 min-h-0 flex flex-col">
              <div className="space-y-3 mb-3">
                <div className="flex items-center gap-2">
                  <Select 
                    value={selectedNoteScope} 
                    onValueChange={(value: 'global' | 'semester' | 'course') => setNoteScope(value)}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="global">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          Global
                        </div>
                      </SelectItem>
                      <SelectItem value="semester">
                        <div className="flex items-center gap-2">
                          <GraduationCap className="h-4 w-4" />
                          Semester
                        </div>
                      </SelectItem>
                      <SelectItem value="course">
                        <div className="flex items-center gap-2">
                          <BookOpen className="h-4 w-4" />
                          Course
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
  
                  {selectedNoteScope !== 'global' && (
                    <Select 
                      value={selectedSemesterForNotes || ''} 
                      onValueChange={(value) => setNoteScope(selectedNoteScope, value)}
                    >
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Select semester" />
                      </SelectTrigger>
                      <SelectContent>
                        {semesters.map(semester => (
                          <SelectItem key={semester.id} value={semester.id}>
                            <div className="flex items-center gap-2">
                              {semester.isActive && <Calendar className="h-3 w-3 text-green-600" />}
                              {semester.name}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              </div>
              <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="flex-1 flex flex-col min-h-0">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="write">Write</TabsTrigger>
                  <TabsTrigger value="preview">Preview</TabsTrigger>
                </TabsList>
                
                <TabsContent value="write" className="flex-1 mt-3">
                  <Textarea
                    placeholder="Add your notes here... Supports Markdown!"
                    value={currentNotes}
                    onChange={(e) => updateCurrentNotes(e.target.value)}
                    className="h-full min-h-48 resize-none font-mono text-sm"
                    autoFocus
                  />
                  
                  {smartSuggestions && (
                    <div className="mt-3 p-3 bg-accent/50 rounded-md border">
                      <div className="flex items-center gap-2 mb-2">
                        <Lightbulb className="h-4 w-4 text-amber-500" />
                        <span className="text-sm font-medium">Smart Suggestions</span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        <div className="prose prose-xs dark:prose-invert max-w-none">
                          <ReactMarkdown 
                            remarkPlugins={[remarkGfm]}
                          >
                            {smartSuggestions}
                          </ReactMarkdown>
                        </div>
                      </div>
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="preview" className="flex-1 mt-3">
                  <div className="min-h-48 p-3 border rounded-md bg-background overflow-auto h-full">
                    {currentNotes ? (
                      <div className="prose prose-sm dark:prose-invert max-w-none">
                        <ReactMarkdown 
                          remarkPlugins={[remarkGfm]}
                        >
                          {currentNotes}
                        </ReactMarkdown>
                      </div>
                    ) : (
                      <div className="text-muted-foreground text-sm">
                        No notes yet. Switch to Write tab to add some!
                      </div>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
              
              <div className="text-xs text-muted-foreground mt-3 flex items-center justify-between">
                <span>Auto-saved • Markdown supported</span>
                <span>{currentNotes.length} chars</span>
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}