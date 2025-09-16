'use client';

import { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { DragDropContext, Droppable, DropResult } from '@hello-pangea/dnd';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Header } from '@/components/Header';
import { SemesterCard } from '@/components/SemesterCard';
import { ScheduleView } from '@/components/ScheduleView';
import { AddSemesterDialog } from '@/components/AddSemesterDialog';
import { NotesPanel } from '@/components/NotesPanel';
import { EmptyState } from '@/components/EmptyState';
import { ProgressSection } from '@/components/ProgressSection';
import { DegreeSetupDialog } from '@/components/DegreeSetupDialog';
import { useAppStore } from '@/lib/store';

export default function Home() {
  const [showAddSemester, setShowAddSemester] = useState(false);
  const [showDegreeSetup, setShowDegreeSetup] = useState(false);
  const { 
    semesters, 
    degree,
    theme, 
    showScheduleView, 
    reorderSemesters, 
    reorderCourses 
  } = useAppStore();

  useEffect(() => {
    // Apply theme to document
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const { source, destination, type } = result;

    if (type === 'semester') {
      reorderSemesters(source.index, destination.index);
    } else if (type === 'course') {
      const semesterId = source.droppableId.replace('semester-', '');
      reorderCourses(semesterId, source.index, destination.index);
    }
  };
  return (
    <div className="min-h-screen bg-background" id="uniplan-content">
      <Header />
      
      <main className="container mx-auto px-4 py-8 max-w-7xl">
        {!degree ? (
          <EmptyState onSetupDegree={() => setShowDegreeSetup(true)} />
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
                        Visual overview of your active semester's schedule with conflict detection
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
                    </div>
                    
                    <Button onClick={() => setShowAddSemester(true)} size="lg">
                      <Plus className="h-5 w-5 mr-2" />
                      Add Semester
                    </Button>
                  </div>

                  <DragDropContext onDragEnd={handleDragEnd}>
                    <Droppable droppableId="semesters" type="semester" direction="horizontal">
                      {(provided) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.droppableProps}
                          className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6"
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
  );
}