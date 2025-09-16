'use client';

import { useState, memo } from 'react';
import { Clock, Star, MoreHorizontal, Edit3, Trash2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { EditCourseDialog } from './EditCourseDialog';
import { useAppStore } from '@/lib/store';
import { toast } from 'sonner';
import type { Course } from '@/lib/types';

interface CourseCardProps {
  course: Course;
  semesterId: string;
}

const gradeToLetter = (grade: number): string => {
  if (grade >= 3.7) return 'A';
  if (grade >= 3.3) return 'A-';
  if (grade >= 3.0) return 'B+';
  if (grade >= 2.7) return 'B';
  if (grade >= 2.3) return 'B-';
  if (grade >= 2.0) return 'C+';
  if (grade >= 1.7) return 'C';
  if (grade >= 1.3) return 'C-';
  if (grade >= 1.0) return 'D';
  return 'F';
};

function CourseCardComponent({ course, semesterId }: CourseCardProps) {
  const [showEditCourse, setShowEditCourse] = useState(false);
  const { removeCourse } = useAppStore();

  const handleRemoveCourse = () => {
    toast("Delete course?", {
      description: "Are you sure you want to remove this course?",
      action: {
        label: "Delete",
        onClick: () => {
          removeCourse(semesterId, course.id);
          toast.success("Course deleted");
        }
      },
      cancel: {
        label: "Cancel",
        onClick: () => {}
      }
    });
  };

  return (
    <>
      <Card className="group hover:shadow-md dark:hover:shadow-lg transition-all duration-200 dark:bg-card/80 dark:border-border/50">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 flex-1">
              <div 
                className="w-1 h-12 rounded-full flex-shrink-0 shadow-sm dark:shadow-none"
                style={{ backgroundColor: course.color }}
              />
              
              <div className="min-w-0 flex-1">
                <h4 className="font-semibold text-sm leading-tight mb-1 dark:text-foreground/95">
                  {course.name}
                </h4>
                
                <div className="flex items-center gap-2 text-xs text-muted-foreground dark:text-muted-foreground/90">
                  <span>{course.credits} credits</span>
                  
                  {course.daysOfWeek && course.daysOfWeek.length > 0 && course.startTime && (
                    <>
                      <span>•</span>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>{course.daysOfWeek.map(d => d.slice(0, 3)).join(', ')} {course.startTime}</span>
                        {course.endTime && <span>-{course.endTime}</span>}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {course.grade !== undefined && course.grade !== null && (
                <Badge 
                  variant="secondary"
                  className="text-xs font-bold dark:bg-secondary/80 dark:text-secondary-foreground/95 dark:border-border/30"
                >
                  <Star className="h-3 w-3 mr-1 text-amber-500 dark:text-amber-400" />
                  {gradeToLetter(course.grade)}
                </Badge>
              )}
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setShowEditCourse(true)}>
                    <Edit3 className="h-4 w-4 mr-2" />
                    Edit Course
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={handleRemoveCourse}
                    className="text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Remove Course
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardContent>
      </Card>

      <EditCourseDialog
        course={course}
        semesterId={semesterId}
        open={showEditCourse}
        onClose={() => setShowEditCourse(false)}
      />
    </>
  );
}

export const CourseCard = memo(CourseCardComponent);