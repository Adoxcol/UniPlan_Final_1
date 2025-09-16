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

interface EditSemesterDialogProps {
  semester: Semester;
  open: boolean;
  onClose: () => void;
}

export function EditSemesterDialog({ semester, open, onClose }: EditSemesterDialogProps) {
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [season, setSeason] = useState<'Autumn' | 'Spring' | 'Summer'>('Autumn');
  const [notes, setNotes] = useState('');
  const { updateSemester } = useAppStore();

  useEffect(() => {
    if (semester) {
      setYear(semester.year);
      setSeason(semester.season);
      setNotes(semester.notes || '');
    }
  }, [semester]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const updates = {
      name: `${season} ${year}`,
      year,
      season,
      notes,
    };

    updateSemester(semester.id, updates);
    onClose();
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
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Autumn">Autumn</SelectItem>
                  <SelectItem value="Spring">Spring</SelectItem>
                  <SelectItem value="Summer">Summer</SelectItem>
                </SelectContent>
              </Select>
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
              />
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
            />
          </div>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">
              Save Changes
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}