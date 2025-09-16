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

interface DegreeSetupDialogProps {
  open: boolean;
  onClose: () => void;
}

export function DegreeSetupDialog({ open, onClose }: DegreeSetupDialogProps) {
  const [degreeName, setDegreeName] = useState('');
  const [totalCredits, setTotalCredits] = useState<number>(120);
  const { setDegree } = useAppStore();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!degreeName.trim()) return;

    setDegree({
      name: degreeName.trim(),
      totalCreditsRequired: totalCredits,
    });
    
    onClose();
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
            />
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
            />
          </div>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={!degreeName.trim()}>
              Create Degree Plan
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}