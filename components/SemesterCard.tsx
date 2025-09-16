'use client';

import { useState } from 'react';
import { Draggable } from 'react-beautiful-dnd';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SemesterHeader } from './SemesterHeader';
import { SemesterStats } from './SemesterStats';
import { CourseList } from './CourseList';
import { AddCourseDialog } from './AddCourseDialog';
import { EditSemesterDialog } from './EditSemesterDialog';
import { useAppStore } from '@/lib/store';
import type { Semester } from '@/lib/types';

interface SemesterCardProps {
  semester: Semester;
  index: number;
}

export function SemesterCard({ semester, index }: SemesterCardProps) {
  const [showAddCourse, setShowAddCourse] = useState(false);
  const [showEditSemester, setShowEditSemester] = useState(false);
  const { removeSemester, calculateSemesterGPA } = useAppStore();

  const semesterGPA = calculateSemesterGPA(semester.id);
  const totalCredits = semester.courses.reduce((sum, course) => sum + course.credits, 0);
  const completedCredits = semester.courses
    .filter(course => course.grade !== undefined)
    .reduce((sum, course) => sum + course.credits, 0);

  const handleRemoveSemester = () => {
    if (window.confirm('Are you sure you want to delete this semester and all its courses?')) {
      removeSemester(semester.id);
    }
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
          >
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