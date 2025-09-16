'use client';

import { useState } from 'react';
import { GraduationCap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAppStore } from '@/lib/store';
import { degreeSchema, type DegreeFormData } from '@/lib/validationSchemas';
import { z } from 'zod';

interface DegreeSetupDialogProps {
  open: boolean;
  onClose: () => void;
}

export function DegreeSetupDialog({ open, onClose }: DegreeSetupDialogProps) {
  const [degreeName, setDegreeName] = useState('');
  const [totalCredits, setTotalCredits] = useState<number>(120);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { setDegree } = useAppStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrors({});

    try {
      const degreeData: DegreeFormData = {
        name: degreeName.trim(),
        totalCreditsRequired: totalCredits,
      };

      // Validate with Zod
      const validatedData = degreeSchema.parse(degreeData);
      
      setDegree(validatedData);
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
          <DialogTitle className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5" />
            Set Up Your Degree
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="degreeName">Degree Name</Label>
            <Input
              id="degreeName"
              placeholder="e.g., Bachelor of Computer Science"
              value={degreeName}
              onChange={(e) => setDegreeName(e.target.value)}
              autoFocus
              className={errors.name ? 'border-red-500' : ''}
            />
            {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="totalCredits">Total Credits Required</Label>
            <Input
              id="totalCredits"
              type="number"
              value={totalCredits}
              onChange={(e) => setTotalCredits(parseInt(e.target.value) || 120)}
              min="60"
              max="200"
              className={errors.totalCreditsRequired ? 'border-red-500' : ''}
            />
            {errors.totalCreditsRequired && <p className="text-sm text-red-500">{errors.totalCreditsRequired}</p>}
          </div>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || !degreeName.trim()}>
              {isSubmitting ? 'Creating...' : 'Create Degree Plan'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}