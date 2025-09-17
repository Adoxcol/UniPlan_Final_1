'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { LoadingSpinner, ActionFeedback } from '@/components/ui/loading-states';
import { useAppStore } from '@/lib/store';
import { courseSchema, type CourseFormData } from '@/lib/validationSchemas';
import { useCourseAuditLogger } from '@/hooks/useAuditLogger';
import { z } from 'zod';

interface AddCourseDialogProps {
  semesterId: string;
  open: boolean;
  onClose: () => void;
}

const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export function AddCourseDialog({ semesterId, open, onClose }: AddCourseDialogProps) {
  const [name, setName] = useState('');
  const [credits, setCredits] = useState<number>(3);
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [grade, setGrade] = useState<string>('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const { addCourse } = useAppStore();
  const { logCourseCreate } = useCourseAuditLogger();

  const handleDayToggle = (day: string, checked: boolean) => {
    if (checked) {
      setSelectedDays([...selectedDays, day]);
    } else {
      setSelectedDays(selectedDays.filter(d => d !== day));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrors({});
    setFeedback(null);

    try {
      const courseData: CourseFormData = {
        name: name.trim(),
        credits,
        ...(selectedDays.length > 0 && { daysOfWeek: selectedDays as ('Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday')[] }),
        ...(startTime && { startTime }),
        ...(endTime && { endTime }),
        ...(grade && grade !== '' && { grade: parseFloat(grade) }),
      };

      // Validate with Zod
      const validatedData = courseSchema.parse(courseData);
      
      // Add course to store
      const courseId = addCourse(semesterId, validatedData);
      
      // Log the course creation
      await logCourseCreate(courseId, {
        courseName: validatedData.name,
        credits: validatedData.credits,
        semesterId,
        hasSchedule: selectedDays.length > 0
      });
      
      // Show success feedback
      setFeedback({ type: 'success', message: 'Course added successfully!' });
      
      // Reset form after a brief delay
      setTimeout(() => {
        setName('');
        setCredits(3);
        setSelectedDays([]);
        setStartTime('');
        setEndTime('');
        setGrade('');
        setFeedback(null);
        onClose();
      }, 1500);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path.length > 0) {
            fieldErrors[err.path[0] as string] = err.message;
          }
        });
        setErrors(fieldErrors);
        setFeedback({ type: 'error', message: 'Please fix the validation errors.' });
      } else {
        setFeedback({ type: 'error', message: 'Failed to add course. Please try again.' });
        
        // Log the error
        await logCourseCreate('', {
          courseName: name,
          credits,
          semesterId,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add New Course</DialogTitle>
        </DialogHeader>
        
        <AnimatePresence>
          {feedback && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <ActionFeedback type={feedback.type} message={feedback.message} />
            </motion.div>
          )}
        </AnimatePresence>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="courseName">Course Name</Label>
            <Input
              id="courseName"
              placeholder="e.g., Introduction to Psychology"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
              disabled={isSubmitting}
              className={errors.name ? 'border-red-500' : ''}
            />
            {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="credits">Credit Hours</Label>
            <Input
              id="credits"
              type="number"
              value={credits}
              onChange={(e) => setCredits(parseInt(e.target.value) || 1)}
              min="1"
              max="6"
              disabled={isSubmitting}
              className={errors.credits ? 'border-red-500' : ''}
            />
            {errors.credits && <p className="text-sm text-red-500">{errors.credits}</p>}
          </div>

          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-2">
              <Label>Days of Week (Optional)</Label>
              <div className="grid grid-cols-2 gap-2">
                {daysOfWeek.map((day) => (
                  <div key={day} className="flex items-center space-x-2">
                    <Checkbox
                      id={day}
                      checked={selectedDays.includes(day)}
                      onCheckedChange={(checked) => handleDayToggle(day, checked as boolean)}
                      disabled={isSubmitting}
                    />
                    <Label htmlFor={day} className="text-sm font-normal">
                      {day.slice(0, 3)}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startTime">Start Time (Optional)</Label>
              <Input
                id="startTime"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                disabled={isSubmitting}
                className={errors.startTime ? 'border-red-500' : ''}
              />
              {errors.startTime && <p className="text-sm text-red-500">{errors.startTime}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="endTime">End Time (Optional)</Label>
              <Input
                id="endTime"
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                disabled={isSubmitting}
                className={errors.endTime ? 'border-red-500' : ''}
              />
              {errors.endTime && <p className="text-sm text-red-500">{errors.endTime}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="grade">Final Grade - GPA Scale (Optional)</Label>
            <Select value={grade} onValueChange={setGrade} disabled={isSubmitting}>
              <SelectTrigger className={isSubmitting ? 'opacity-50' : ''}>
                <SelectValue placeholder="Select grade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="4.0">A (4.0)</SelectItem>
                <SelectItem value="3.7">A- (3.7)</SelectItem>
                <SelectItem value="3.3">B+ (3.3)</SelectItem>
                <SelectItem value="3.0">B (3.0)</SelectItem>
                <SelectItem value="2.7">B- (2.7)</SelectItem>
                <SelectItem value="2.3">C+ (2.3)</SelectItem>
                <SelectItem value="2.0">C (2.0)</SelectItem>
                <SelectItem value="1.7">C- (1.7)</SelectItem>
                <SelectItem value="1.0">D (1.0)</SelectItem>
                <SelectItem value="0.0">F (0.0)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !name.trim()}
              className="min-w-[100px]"
            >
              {isSubmitting ? (
                <div className="flex items-center space-x-2">
                  <LoadingSpinner size="sm" />
                  <span>Adding...</span>
                </div>
              ) : (
                'Add Course'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}