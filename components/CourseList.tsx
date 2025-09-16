'use client';

import { Plus } from 'lucide-react';
import { Droppable, Draggable } from '@hello-pangea/dnd';
import { Button } from '@/components/ui/button';
import { CourseCard } from './CourseCard';
import type { Course } from '@/lib/types';

interface CourseListProps {
  courses: Course[];
  semesterId: string;
  onAddCourse: () => void;
  accentColor?: string;
}

export function CourseList({ courses, semesterId, onAddCourse, accentColor }: CourseListProps) {
  return (
    <Droppable droppableId={`semester-${semesterId}`} type="course">
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.droppableProps}
          className={`space-y-3 transition-colors ${
            snapshot.isDraggingOver ? 'rounded-lg p-2' : ''
          }`}
          style={{
            borderLeft: accentColor ? `3px solid ${accentColor}` : undefined,
            backgroundColor: snapshot.isDraggingOver && accentColor 
              ? `${accentColor}20` // CSS hex with alpha fallback via string
              : undefined
          }}
        >
          {courses.map((course, index) => (
            <Draggable key={course.id} draggableId={course.id} index={index}>
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.draggableProps}
                  {...provided.dragHandleProps}
                  className={`transition-transform ${
                    snapshot.isDragging ? 'rotate-2 scale-105' : ''
                  }`}
                  style={{ boxShadow: accentColor && snapshot.isDragging ? `0 0 0 2px ${accentColor}` : undefined }}
                >
                  <CourseCard course={course} semesterId={semesterId} />
                </div>
              )}
            </Draggable>
          ))}
          {provided.placeholder}
          
          <Button
            variant="dashed"
            className="w-full h-12 border-dashed border-2 hover:border-primary/50 hover:bg-accent/50 transition-colors"
            onClick={onAddCourse}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Course
          </Button>
        </div>
      )}
    </Droppable>
  );
}