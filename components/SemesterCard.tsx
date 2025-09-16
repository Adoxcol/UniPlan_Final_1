'use client';

import { useState, memo, useEffect } from 'react';
import { Draggable } from '@hello-pangea/dnd';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SemesterHeader } from './SemesterHeader';
import { SemesterStats } from './SemesterStats';
import { CourseList } from './CourseList';
import { AddCourseDialog } from './AddCourseDialog';
import { EditSemesterDialog } from './EditSemesterDialog';
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
  const { removeSemester, calculateSemesterGPA } = useAppStore();

  // Derive a stable accent color from the card index
  const hue = (index * 65) % 360;
  const accentColor = `hsl(${hue}, 70%, 45%)`;
  const tintColor = `hsla(${hue}, 90%, 45%, 0.08)`;

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
      {(provided, snapshot) => (
        <>
          <Card 
            ref={provided.innerRef}
            {...provided.draggableProps}
            className={`h-fit group hover:shadow-lg transition-all duration-300 ${
              snapshot.isDragging ? 'rotate-1 scale-105 shadow-2xl' : ''
            }`}
            style={{
              borderColor: accentColor,
              backgroundImage: `linear-gradient(180deg, ${tintColor}, transparent 140px)`
            }}
            tabIndex={0}
            data-draggable-id={semester.id}
            data-semester-id={semester.id}
          >
            <div style={{ height: 4, backgroundColor: accentColor }} />
            <CardHeader className="pb-4" {...provided.dragHandleProps}>
              <SemesterHeader
                semester={semester}
                semesterGPA={semesterGPA}
                completedCredits={completedCredits}
                totalCredits={totalCredits}
                onEdit={() => setShowEditSemester(true)}
                onDelete={handleRemoveSemester}
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
          </Card>

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
        </>
      )}
    </Draggable>
  );
}

export const SemesterCard = memo(SemesterCardComponent);