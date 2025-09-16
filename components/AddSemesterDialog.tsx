'use client';

import { useState } from 'react';
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
import { useAppStore } from '@/lib/store';

interface AddSemesterDialogProps {
  open: boolean;
  onClose: () => void;
}

export function AddSemesterDialog({ open, onClose }: AddSemesterDialogProps) {
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [season, setSeason] = useState<'Autumn' | 'Spring' | 'Summer'>('Autumn');
  const { addSemester } = useAppStore();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const semesterData = {
      name: `${season} ${year}`,
      year,
      season,
    };

    addSemester(semesterData);
    onClose();
  };

  const handleClose = () => {
    // Reset form when closing
    setYear(new Date().getFullYear());
    setSeason('Autumn');
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Semester</DialogTitle>
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

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit">
              Add Semester
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}