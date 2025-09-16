'use client';

import { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { DragDropContext, Droppable, DropResult } from '@hello-pangea/dnd';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Header } from '@/components/Header';
import { AuthPanel } from '@/components/AuthPanel';
import { SemesterCard } from '@/components/SemesterCard';
import { ScheduleView } from '@/components/ScheduleView';
import { AddSemesterDialog } from '@/components/AddSemesterDialog';
import { NotesPanel } from '@/components/NotesPanel';
import { EmptyState } from '@/components/EmptyState';
import { ProgressSection } from '@/components/ProgressSection';
import { DegreeSetupDialog } from '@/components/DegreeSetupDialog';
import { SemesterSkeleton, ScheduleSkeleton, ProgressSkeleton } from '@/components/SkeletonLoaders';
import ErrorBoundary from '@/components/ErrorBoundary';
import { useAppStore } from '@/lib/store';
import { useAuth } from '@/hooks/useAuth';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { useAutoSave } from '@/hooks/useAutoSave';
import { useServiceWorker } from '@/hooks/useServiceWorker';

export default function Home() {
  const [showAddSemester, setShowAddSemester] = useState(false);
  const [showDegreeSetup, setShowDegreeSetup] = useState(false);
  const [dndAnnouncement, setDndAnnouncement] = useState('');
  const { 
    semesters, 
    degree,
    showScheduleView, 
    reorderSemesters, 
    reorderCourses,
    isLoading,
    isSyncing 
  } = useAppStore();
  const { userId } = useAuth();
  
  // Enable keyboard shortcuts
  useKeyboardShortcuts();
  
  // Enable auto-save
  useAutoSave();
  
  // Enable service worker
  useServiceWorker();

  // Theme is now handled by next-themes ThemeProvider

  // Load from Supabase on login
  useEffect(() => {
    if (!userId) return;
    useAppStore.getState().syncFromSupabase();
  }, [userId]);

  // Debounced save to Supabase
  useEffect(() => {
    if (!userId) return;
    const id = setTimeout(() => {
      useAppStore.getState().saveAllToSupabase();
    }, 500);
    return () => clearTimeout(id);
  }, [userId, semesters, degree]);

  // Keyboard shortcuts: A to add semester, Shift+A to open degree setup
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target && (e.target as HTMLElement).tagName === 'INPUT') return;
      if (e.target && (e.target as HTMLElement).tagName === 'TEXTAREA') return;
      if (e.key.toLowerCase() === 'a' && !e.shiftKey) {
        e.preventDefault();
        setShowAddSemester(true);
      }
      if (e.key.toLowerCase() === 'a' && e.shiftKey) {
        e.preventDefault();
        setShowDegreeSetup(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const { source, destination, type } = result;

    if (type === 'semester') {
      reorderSemesters(source.index, destination.index);
    } else if (type === 'course') {
      const semesterId = source.droppableId.replace('semester-', '');
      reorderCourses(semesterId, source.index, destination.index);
    }
    // Focus management after DnD
    const movedEl = document.querySelector<HTMLElement>(`[data-draggable-id="${result.draggableId}"]`);
    movedEl?.focus();
  };
  const dndAnnouncements = {
    onDragStart: (start: { type: string; draggableId: string }) => {
      const type = start.type === 'semester' ? 'semester' : 'course';
      setDndAnnouncement(`Started dragging ${type} item.`);
    },
    onDragUpdate: (update: { destination?: { index: number } | null }) => {
      if (!update.destination) return;
      const col = update.destination.index + 1;
      setDndAnnouncement(`Moving to position ${col}.`);
    },
  } as const;
  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-background" id="uniplan-content">
        <Header />
      
      <main className="container mx-auto px-4 py-8 max-w-7xl">
        {!userId ? (
          <AuthPanel />
        ) : !degree ? (
          <EmptyState onSetupDegree={() => setShowDegreeSetup(true)} />
        ) : isLoading || isSyncing ? (
          <>
            <ProgressSkeleton />
            {showScheduleView ? (
              <ScheduleSkeleton />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
                <SemesterSkeleton />
                <SemesterSkeleton />
                <SemesterSkeleton />
              </div>
            )}
          </>
        ) : (
          <>
            <ProgressSection />
            
            <AnimatePresence mode="wait">
              {showScheduleView ? (
                <motion.div
                  key="schedule"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <h2 className="text-3xl font-bold">Weekly Schedule</h2>
                      <p className="text-muted-foreground mt-2">
                        Visual overview of your active semester&rsquo;s schedule with conflict detection
                      </p>
                    </div>
                  </div>
                  <ScheduleView />
                </motion.div>
              ) : (
                <motion.div
                  key="roadmap"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <h2 className="text-3xl font-bold">Academic Roadmap</h2>
                      <p className="text-muted-foreground mt-2">
                        Plan your semesters, manage courses, and track your progress
                      </p>
                      <div className="sr-only" aria-live="polite" aria-atomic="true">{dndAnnouncement}</div>
                    </div>
                    
                    <Button onClick={() => setShowAddSemester(true)} size="lg" aria-label="Add semester">
                      <Plus className="h-5 w-5 mr-2" />
                      Add Semester
                    </Button>
                  </div>

                  <div className="-mx-2 sm:mx-0">
                    <div className="px-2 sm:px-0">
                      <DragDropContext onDragEnd={handleDragEnd} onDragStart={dndAnnouncements.onDragStart} onDragUpdate={dndAnnouncements.onDragUpdate}>
                        <Droppable droppableId="semesters" type="semester" direction="horizontal">
                          {(provided) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.droppableProps}
                              className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6"
                            >
                          {semesters.map((semester, index) => (
                            <SemesterCard 
                              key={semester.id} 
                              semester={semester} 
                              index={index}
                            />
                          ))}
                          {provided.placeholder}
                          
                          {/* Add semester card placeholder */}
                          <motion.div 
                            className="h-fit"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            <Button
                              variant="dashed"
                              className="w-full h-32 border-dashed border-2 hover:border-primary/50 hover:bg-accent/50 transition-colors"
                              onClick={() => setShowAddSemester(true)}
                            >
                              <Plus className="h-8 w-8 mr-3" />
                              <div>
                                <div className="font-semibold">Add Semester</div>
                                <div className="text-sm text-muted-foreground">Plan your next term</div>
                              </div>
                            </Button>
                          </motion.div>
                            </div>
                          )}
                        </Droppable>
                      </DragDropContext>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}
      </main>

      <NotesPanel />
      
      <AddSemesterDialog
        open={showAddSemester}
        onClose={() => setShowAddSemester(false)}
      />
      
      <DegreeSetupDialog
        open={showDegreeSetup}
        onClose={() => setShowDegreeSetup(false)}
      />
      </div>
    </ErrorBoundary>
  );
}