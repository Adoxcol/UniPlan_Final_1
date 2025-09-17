'use client';

import { useState, memo } from 'react';
import { Clock, Star, MoreHorizontal, Edit3, Trash2, Calendar, Award } from 'lucide-react';
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

const getGradeColor = (grade: number): string => {
  if (grade >= 3.7) return 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800';
  if (grade >= 3.3) return 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800';
  if (grade >= 3.0) return 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800';
  if (grade >= 2.7) return 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800';
  if (grade >= 2.3) return 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800';
  if (grade >= 2.0) return 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-950/30 border-yellow-200 dark:border-yellow-800';
  if (grade >= 1.7) return 'text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/30 border-orange-200 dark:border-orange-800';
  if (grade >= 1.3) return 'text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/30 border-orange-200 dark:border-orange-800';
  if (grade >= 1.0) return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800';
  return 'text-red-700 dark:text-red-400 bg-red-100 dark:bg-red-950/40 border-red-300 dark:border-red-700';
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
      <Card className="group hover:shadow-lg dark:hover:shadow-xl transition-all duration-300 dark:bg-card/90 dark:border-border/60 hover:scale-[1.02] border-l-4 border-l-transparent hover:border-l-primary/30">
        <CardContent className="p-5">
          <div className="space-y-4">
            {/* Header with course name and actions */}
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3 flex-1">
                <div 
                  className="w-3 h-3 rounded-full flex-shrink-0 shadow-sm dark:shadow-none mt-1.5 ring-2 ring-white dark:ring-gray-800"
                  style={{ backgroundColor: course.color }}
                />
                
                <div className="min-w-0 flex-1">
                  <h3 className="font-bold text-base leading-tight mb-2 dark:text-foreground text-gray-900 group-hover:text-primary transition-colors">
                    {course.name}
                  </h3>
                  
                  <div className="flex items-center gap-3 text-sm text-muted-foreground dark:text-muted-foreground/90">
                    <div className="flex items-center gap-1.5 font-medium">
                      <Award className="h-4 w-4 text-blue-500 dark:text-blue-400" />
                      <span className="text-gray-700 dark:text-gray-300">{course.credits} credits</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                {course.grade !== undefined && course.grade !== null && (
                  <Badge 
                    className={`text-sm font-bold px-3 py-1 border ${getGradeColor(course.grade)}`}
                  >
                    <Star className="h-3.5 w-3.5 mr-1.5" />
                    {gradeToLetter(course.grade)}
                  </Badge>
                )}
              
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-gray-100 dark:hover:bg-gray-800"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem onClick={() => setShowEditCourse(true)} className="cursor-pointer">
                      <Edit3 className="h-4 w-4 mr-2" />
                      Edit Course
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={handleRemoveCourse}
                      className="text-destructive cursor-pointer"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Remove Course
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
            
            {/* Schedule Information */}
            {course.daysOfWeek && course.daysOfWeek.length > 0 && course.startTime && (
              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Schedule</span>
                </div>
                <div className="mt-2 flex items-center gap-2 text-sm">
                  <div className="flex items-center gap-1">
                    <span className="font-medium text-gray-900 dark:text-gray-100">
                      {course.daysOfWeek.join(', ')}
                    </span>
                  </div>
                  <span className="text-gray-400">•</span>
                  <div className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5 text-gray-500" />
                    <span className="text-gray-700 dark:text-gray-300">
                      {course.startTime}
                      {course.endTime && ` - ${course.endTime}`}
                    </span>
                  </div>
                </div>
              </div>
            )}
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