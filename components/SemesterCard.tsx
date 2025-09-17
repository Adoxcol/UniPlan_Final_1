'use client';

import { useState, memo, useEffect } from 'react';
import { Draggable } from '@hello-pangea/dnd';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { SemesterHeader } from './SemesterHeader';
import { SemesterStats } from './SemesterStats';
import { CourseList } from './CourseList';
import { AddCourseDialog } from './AddCourseDialog';
import { EditSemesterDialog } from './EditSemesterDialog';
import { ShareSemesterDialog } from './ShareSemesterDialog';
import { useAppStore } from '@/lib/store';
import { toast } from 'sonner';
import type { Semester } from '@/lib/types';

interface SemesterCardProps {
  semester: Semester;
  index: number;
}

function SemesterCardComponent({ semester, index }: SemesterCardProps) {
  const [showAddCourse, setShowAddCourse] = useState(false);
  const [showEditSemester, setShowEditSemester] = useState(false);
  const [showShareSemester, setShowShareSemester] = useState(false);
  const { removeSemester, calculateSemesterGPA } = useAppStore();

  // Derive a stable accent color from the card index with dark mode support
  const hue = (index * 65) % 360;
  const accentColor = `hsl(${hue}, 70%, 45%)`;
  const accentColorDark = `hsl(${hue}, 60%, 55%)`;
  const tintColor = `hsla(${hue}, 90%, 45%, 0.08)`;
  const tintColorDark = `hsla(${hue}, 70%, 55%, 0.12)`;

  const semesterGPA = calculateSemesterGPA(semester.id);
  const totalCredits = semester.courses.reduce((sum, course) => sum + course.credits, 0);
  const completedCredits = semester.courses
    .filter(course => course.grade !== undefined)
    .reduce((sum, course) => sum + course.credits, 0);

  const handleRemoveSemester = () => {
    toast("Delete semester?", {
      description: "This will delete the semester and all its courses.",
      action: {
        label: "Delete",
        onClick: () => {
          removeSemester(semester.id);
          toast.success("Semester deleted");
        }
      },
      cancel: {
        label: "Cancel",
        onClick: () => {}
      }
    });
  };

  return (
    <Draggable draggableId={semester.id} index={index}>
      {(provided, snapshot) => {
        const cardAnimations = {
          initial: { scale: 1, y: 0 },
          whileHover: !snapshot?.isDragging ? { 
            scale: 1.01,
            y: -3,
            transition: { 
              type: "spring" as const, 
              stiffness: 300, 
              damping: 25,
              duration: 0.2
            }
          } : {},
          animate: snapshot?.isDragging ? {
            rotate: 1,
            scale: 1.05,
            transition: { type: "spring" as const, stiffness: 300, damping: 20 }
          } : { rotate: 0, scale: 1 }
        };

        return (
        <>
          <motion.div
            ref={provided.innerRef}
            {...provided.draggableProps}
            className={`h-fit group rounded-lg border-2 bg-card text-card-foreground shadow-sm ${
              snapshot.isDragging ? 'shadow-2xl dark:shadow-2xl' : 'hover:shadow-lg dark:hover:shadow-xl'
            } dark:bg-card/50 dark:backdrop-blur-sm transition-shadow duration-300`}
            style={{
              borderColor: accentColor,
              backgroundImage: `linear-gradient(180deg, ${tintColor}, transparent 140px)`,
              // Dark mode styles applied via CSS custom properties
              '--accent-color': accentColor,
              '--accent-color-dark': accentColorDark,
              '--tint-color': tintColor,
              '--tint-color-dark': tintColorDark,
            } as React.CSSProperties & { [key: string]: string }}
            tabIndex={0}
            data-draggable-id={semester.id}
            data-semester-id={semester.id}
            {...cardAnimations}
          >
            <div 
              className="h-1 dark:opacity-90" 
              style={{ backgroundColor: accentColor }} 
            />
            <CardHeader className="pb-4" {...provided.dragHandleProps}>
              <SemesterHeader
                semester={semester}
                semesterGPA={semesterGPA}
                completedCredits={completedCredits}
                totalCredits={totalCredits}
                onEdit={() => setShowEditSemester(true)}
                onDelete={handleRemoveSemester}
                onShare={() => setShowShareSemester(true)}
              />
              
              <SemesterStats
                completedCredits={completedCredits}
                totalCredits={totalCredits}
              />
            </CardHeader>
            
            <CardContent>
              <CourseList
                courses={semester.courses}
                semesterId={semester.id}
                accentColor={accentColor}
                onAddCourse={() => setShowAddCourse(true)}
              />
            </CardContent>
          </motion.div>

          <AddCourseDialog
            semesterId={semester.id}
            open={showAddCourse}
            onClose={() => setShowAddCourse(false)}
          />
          
          <EditSemesterDialog
            semester={semester}
            open={showEditSemester}
            onClose={() => setShowEditSemester(false)}
          />
          
          <ShareSemesterDialog
            semester={semester}
            open={showShareSemester}
            onClose={() => setShowShareSemester(false)}
          />
        </>
        );
      }}
    </Draggable>
  );
}

export const SemesterCard = memo(SemesterCardComponent);