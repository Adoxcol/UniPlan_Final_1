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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useAppStore } from '@/lib/store';
import type { Semester } from '@/lib/types';
import { semesterSchema, type SemesterFormData } from '@/lib/validationSchemas';
import { z } from 'zod';

interface EditSemesterDialogProps {
  semester: Semester;
  open: boolean;
  onClose: () => void;
}

export function EditSemesterDialog({ semester, open, onClose }: EditSemesterDialogProps) {
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [season, setSeason] = useState<'Autumn' | 'Spring' | 'Summer'>('Autumn');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { updateSemester } = useAppStore();

  useEffect(() => {
    if (semester) {
      setYear(semester.year);
      setSeason(semester.season);
      setNotes(semester.notes || '');
    }
  }, [semester]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrors({});

    try {
      const semesterData: SemesterFormData = {
        name: `${season} ${year}`,
        year,
        season,
        notes,
      };

      // Validate with Zod
      const validatedData = semesterSchema.parse(semesterData);
      
      updateSemester(semester.id, validatedData);
      onClose();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path.length > 0) {
            fieldErrors[err.path[0] as string] = err.message;
          }
        });
        setErrors(fieldErrors);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Semester</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="season">Season</Label>
              <Select value={season} onValueChange={(v) => setSeason(v as 'Autumn' | 'Spring' | 'Summer')}>
                <SelectTrigger className={errors.season ? 'border-red-500' : ''}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Autumn">Autumn</SelectItem>
                  <SelectItem value="Spring">Spring</SelectItem>
                  <SelectItem value="Summer">Summer</SelectItem>
                </SelectContent>
              </Select>
              {errors.season && <p className="text-sm text-red-500">{errors.season}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="year">Year</Label>
              <Input
                id="year"
                type="number"
                value={year}
                onChange={(e) => setYear(parseInt(e.target.value) || new Date().getFullYear())}
                min="2020"
                max="2030"
                className={errors.year ? 'border-red-500' : ''}
              />
              {errors.year && <p className="text-sm text-red-500">{errors.year}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              placeholder="Add semester notes..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className={errors.notes ? 'border-red-500' : ''}
            />
            {errors.notes && <p className="text-sm text-red-500">{errors.notes}</p>}
          </div>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}