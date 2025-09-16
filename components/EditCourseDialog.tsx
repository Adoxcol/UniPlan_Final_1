'use client';

import { useState, useEffect } from 'react';
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
import { useAppStore } from '@/lib/store';
import type { Course } from '@/lib/types';

interface EditCourseDialogProps {
  course: Course;
  semesterId: string;
  open: boolean;
  onClose: () => void;
}

const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export function EditCourseDialog({ course, semesterId, open, onClose }: EditCourseDialogProps) {
  const [name, setName] = useState('');
  const [credits, setCredits] = useState<number>(3);
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [grade, setGrade] = useState<string>('');
  const { updateCourse } = useAppStore();

  const handleDayToggle = (day: string, checked: boolean) => {
    if (checked) {
      setSelectedDays([...selectedDays, day]);
    } else {
      setSelectedDays(selectedDays.filter(d => d !== day));
    }
  };

  useEffect(() => {
    if (course) {
      setName(course.name);
      setCredits(course.credits);
      setSelectedDays(course.daysOfWeek || []);
      setStartTime(course.startTime || '');
      setEndTime(course.endTime || '');
      setGrade(course.grade?.toString() || '');
    }
  }, [course]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const updates = {
      name,
      credits,
      daysOfWeek: selectedDays.length > 0 ? selectedDays : undefined,
      startTime: startTime || undefined,
      endTime: endTime || undefined,
      grade: grade ? parseFloat(grade) : undefined,
    };

    updateCourse(semesterId, course.id, updates);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Course</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="courseName">Course Name</Label>
            <Input
              id="courseName"
              placeholder="e.g., Introduction to Psychology"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="credits">Credit Hours</Label>
            <Input
              id="credits"
              type="number"
              value={credits}
              onChange={(e) => setCredits(parseInt(e.target.value))}
              min="1"
              max="6"
            />
          </div>

          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-2">
              <Label>Days of Week (Optional)</Label>
              <div className="grid grid-cols-2 gap-2">
                {daysOfWeek.map((day) => (
                  <div key={day} className="flex items-center space-x-2">
                    <Checkbox
                      id={`edit-${day}`}
                      checked={selectedDays.includes(day)}
                      onCheckedChange={(checked) => handleDayToggle(day, checked as boolean)}
                    />
                    <Label htmlFor={`edit-${day}`} className="text-sm font-normal">
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
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="endTime">End Time (Optional)</Label>
              <Input
                id="endTime"
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="grade">Final Grade - GPA Scale (Optional)</Label>
            <Select value={grade} onValueChange={setGrade}>
              <SelectTrigger>
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

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={!name.trim()}>
              Save Changes
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}